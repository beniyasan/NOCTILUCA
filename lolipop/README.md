# NOCTILUCA ロリポップデプロイなう版

現在のChatGPT Site版とは別サービスです。ユーザー、セーブデータ、Supabaseプロジェクトは共有しません。

## 構成

- `dist-lolipop/`: ロリポップへアップロードする静的ファイル
- `supabase/migrations/0001_lolipop_initial.sql`: 専用PostgreSQLスキーマ
- `supabase/migrations/0004_work_journals.sql`: 作業日誌
- `supabase/migrations/0005_journal_ai_runs.sql`: 作業日誌のAI整理の利用回数
- `supabase/migrations/0006_notion_connections.sql`: Notion連携
- `supabase/migrations/0007_notion_sync.sql`: Notionへの作成と完了の控え
- `supabase/functions/api/`: JWT検証、ゲームルール、保存API
- `scripts/sync-lolipop.mjs`: ゲームルールとコンテンツをEdge Functionへ同期
- `scripts/build-lolipop.mjs`: 静的配信用ビルドを作成

## Supabase設定

```sh
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push
supabase secrets set \
  SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  SUPABASE_ANON_KEY="YOUR_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
  LOLIPOP_ORIGIN="https://www.example.jp" \
  BACKUP_SIGNING_KEY="32文字以上のランダムな秘密値"
supabase functions deploy api --no-verify-jwt
```

`SUPABASE_SERVICE_ROLE_KEY`と`BACKUP_SIGNING_KEY`はEdge FunctionのSecretsだけに置き、ロリポップへアップロードしません。

## 向かいの席の乗客の会話(時事ネタ)

車内の乗客の会話を、その日(日本時間)のニュース見出しからLLMで生成する。ロリポップ版のみの機能で、Site版は従来どおりテンプレート生成のみ。

- その日最初のリクエストで、NHKのRSS(暮らし・科学文化・スポーツ)から見出しを取得し、GPT-6 Lunaでこの世界(サイバーパンクな宇宙の九つの星)の出来事に置き換えた会話をまとめて生成して `passenger_talks` に保存する。見出しの取得は1日1回。
- 事件・事故・災害・政治などの見出しは、モデルへ渡す前に除外する。生成結果も文字数・話し手・禁止語を検証してから保存する。
- 各プレイヤーはその日の会話を一周すると次のバッチを要求する。追加生成は同じ見出しから行い、1日の上限(既定3回)を超えない。
- 生成はロックを取った1リクエストだけが行い、レスポンスを返した後にバックグラウンドで実行する。失敗時は10分間再試行しない。
- 会話が無い間・取得に失敗した場合は、クライアントのテンプレート生成で代用する。

設定(Supabase secrets):

```sh
supabase db push   # 0002_passenger_talk.sql を適用
supabase secrets set OPENAI_API_KEY="sk-..."
# 任意
supabase secrets set PASSENGER_TALK_MODEL="gpt-6-luna" PASSENGER_TALK_MAX_BATCHES="3" \
  PASSENGER_TALK_FEEDS="https://news.web.nhk/n-data/conf/na/rss/cat2.xml,https://news.web.nhk/n-data/conf/na/rss/cat7.xml"
```

`OPENAI_API_KEY`はEdge FunctionのSecretsだけに置く。未設定なら生成は行わず、常にテンプレートの会話になる。1日の費用は、見出し取得1回と生成最大3回分(GPT-6 Lunaで数円程度)が上限。

## 作業日誌

ログインしたプレイヤーだけが使える、ロリポップ版のみの機能。Site版とゲストには「ログインすると使えます」という案内だけを表示する。

- 1プレイヤー1日(日本時間)1行を `work_journals` に保存する。旅のセーブ(64KB上限)とは別の表なので、旅の記録を初期化しても日誌は残る。
- 集中タイマーの作業が終わると、作業時間と目標を「作業」として自動で記録する。休憩中は車窓のタイマーに「この区間でできたこと」の入力欄を出し、その記録にひとことを付けられる。
- タスクを完了すると、その内容を「完了したタスク」として記録する。
- 「作業日誌」画面では日ごとの記録とメモ(4000文字まで)を見る・書く・削除でき、「これまで」から過去の日を開ける。すべての日をMarkdownで書き出せる。
- 記録は1日80件まで。追記とひとことの更新は `append_work_journal_entry` / `set_work_journal_note` RPCが1文で行う(複数タブから同時に書いても消えない)。
- 日誌の書き込みはベストエフォート。失敗してもタイマーや旅の保存は止めない。

```sh
supabase db push   # 0004_work_journals.sql を適用
supabase functions deploy api --no-verify-jwt
```

### AIで整理

日誌の画面から、その日の日誌をGPT-6 Lunaで整理できる。任せる範囲はプレイヤーが選ぶ。

- 整える:メモの誤字や文のつながりだけを直す(メモだけを送る)。
- 整理する:やったこと／詰まったこと／次にやることに分ける。
- ふりかえる:整理に、気づきと明日へのひとことを添える。

整理する・ふりかえるでは、作業の目標・ひとこと・完了したタスク・メモを送る(8000文字まで)。旅の名前やメールアドレスは送らない。結果は保存せずに編集欄へ出し、プレイヤーが「メモに追記」か「置き換え」を選んだときだけメモとして保存する。

- 1プレイヤー1日(日本時間)3回まで。`journal_ai_runs` で数え、`claim_journal_ai_run` が上限を超えないよう1文で加算する。
- 呼び出しに失敗した回は `release_journal_ai_run` で戻し、理由を `journal_ai_runs.last_error` に残す。
- `OPENAI_API_KEY` が未設定なら整理の欄を表示しない。

```sh
supabase db push   # 0005_journal_ai_runs.sql を適用
supabase functions deploy api --no-verify-jwt
# 任意
supabase secrets set JOURNAL_AI_MODEL="gpt-6-luna" JOURNAL_AI_DAILY_LIMIT="3"
```

## Notion連携

ログインしたプレイヤーが、自分のNotionのタスク用データベースとつなげる(ロリポップ版のみ)。Notionの公開コネクション(OAuth)を使う。

- 「集中する」の画面の「Notionと連携」から、Notionの許可画面へ移る。プレイヤーは使うページやデータベースを選んで許可する。
- Notionは `/api/notion/callback` へ戻す。このリクエストにはログイン情報が無いため、`NOTION_TOKEN_KEY` で署名した10分間有効の `state` でプレイヤーを特定する。
- 受け取ったトークンは `NOTION_TOKEN_KEY` から作った鍵でAES-GCM暗号化して `notion_connections` に保存する。ブラウザには渡さない。期限切れ(401)なら一度だけ更新して保存し直す。
- 連携後、タスクのデータベースと「完了」を表す列(チェックボックス、またはステータスとその完了の選択肢)を選ぶ。保存前に実際の列と照合する。
- 「連携を解除」でNotion側のトークンも取り消し(失敗しても)、保存している連携情報を削除する。
- タスクの同期:
  - 「集中する」の画面の「Notionのタスクから選ぶ」で、未完了のタスク(最近更新した100件)から選んで取り込む。取り込んだタスクはNotionのページIDを持つ。
  - 連携中にNOCTILUCAで追加したタスクは、先に手元へ`notion: "pending"`で保存し、Notionにページを作ってから`focus.task.link`でつなぐ。
  - Notionのタスクを完了にすると、選んだ列(チェックボックス、またはステータスの完了の選択肢)を更新する。
  - Notionへの作成はタスクごとに1回だけ。作ったページは `notion_task_pages` に控え、つなぎ込み(`focus.task.link`)に失敗して送り直しても同じページを使う。
  - Notionが受け付けなかった完了はサーバーの `notion_outbox` に控え、サーバーまで届かなかった完了だけを端末に控える(どちらも上限なし)。
  - 送り直しは、ページを開いて連携状態を読み込んだとき、または「集中する」を開いたときに行う。
  - 連携状態の読み込み前に追加したタスクは、読み込みを最大5秒待ち、それでも分からなければ前回の状態で判断する。
- APIのバージョンは `2026-03-11`。直近のNotionのエラーは `notion_connections.last_error` に残る。

Notionの開発者ポータル(https://app.notion.com/developers/connections)でPublic connectionを作り、リダイレクトURIに `https://<project>.supabase.co/functions/v1/api/notion/callback`、インストール範囲に「Any workspace」、権限に読み取り・更新・挿入を設定する。

```sh
supabase db push   # 0006_notion_connections.sql と 0007_notion_sync.sql を適用
supabase secrets set NOTION_CLIENT_ID="..." NOTION_CLIENT_SECRET="..." NOTION_TOKEN_KEY="$(openssl rand -base64 32)"
supabase functions deploy api --no-verify-jwt
```

`NOTION_TOKEN_KEY` を変えると保存済みの連携が開けなくなるため、変えた場合は各プレイヤーに連携しなおしてもらう。

## 静的ビルド

```sh
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_ANON_KEY=YOUR_ANON_KEY \
SUPABASE_API_URL=https://YOUR_PROJECT.supabase.co/functions/v1/api \
npm run build:lolipop
```

生成された`dist-lolipop/`の中身を、ロリポップの公開ディレクトリへアップロードします。公開ドメインはHTTPSにし、Supabase AuthのRedirect URLsへ同じドメインを登録してください。

メールリンク認証とGoogle OAuthに対応しています。Google OAuthを使う場合はSupabase DashboardでGoogle Providerと本番Redirect URLを設定します。

## ロリポップ!デプロイなう(GitHub連携)

GitHub連携を設定すると、ブランチへのpushで自動デプロイされます。フレームワークは「静的サイト(static)」を選び、`dist-lolipop/`をそのまま配信します。

ダッシュボード側の設定:

1. プロジェクト作成時にGitHub連携で本リポジトリとブランチ(`feat/lolipop-supabase-timer`など)を選択
2. build-configを次の値にする(rootはリポジトリルートのまま)
   - install: `npm install`(build-lolipopはNode標準ライブラリのみ使用するため、省略できる場合は省略可)
   - build: `npm run build:lolipop`
   - output_dir: `dist-lolipop`
3. 環境変数に`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_API_URL`を登録

CLIから変更する場合:

```sh
lolipop build-config update \
  --build "npm run build:lolipop" \
  --output "dist-lolipop"
```

`LOLIPOP_ORIGIN`(Supabase secrets側)はデプロイなうの公開ドメインに合わせてください。

### 別解: Next.jsとして配信する(`deploy-now/`)

`deploy-now/`は、同じ静的版をNext.js standaloneサーバーで配信するラッパーです。フレームワークを`next`で作り直す場合に使います(build-config `--root deploy-now`、output `.next/standalone`は既定)。静的サイト構成では不要です。

```sh
cd deploy-now
npm install
SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
SUPABASE_ANON_KEY=YOUR_ANON_KEY \
SUPABASE_API_URL=https://YOUR_PROJECT.supabase.co/functions/v1/api \
npm run build
node .next/standalone/server.js
```

## APIの動作

ブラウザは匿名キーでAuthへ接続し、取得したBearer JWTをEdge Functionへ送ります。ゲーム状態の更新は`commit_journey_command` RPCだけが行います。RPCは行ロック、revision検証、操作IDの再送を1トランザクションで処理します。RLSによりブラウザからのテーブル直接更新は拒否されます。

## 検証

```sh
npm run sync:lolipop
npm run build:lolipop
npm run lint
```

Supabaseへデプロイした後は、ゲスト、メールリンク、Googleログイン、複数タブ競合、同一操作の再送、バックアップ復元を確認してください。
