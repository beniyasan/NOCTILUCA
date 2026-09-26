# NOCTILUCA ロリポップデプロイなう版

現在のChatGPT Site版とは別サービスです。ユーザー、セーブデータ、Supabaseプロジェクトは共有しません。

## 構成

- `dist-lolipop/`: ロリポップへアップロードする静的ファイル
- `supabase/migrations/0001_lolipop_initial.sql`: 専用PostgreSQLスキーマ
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
