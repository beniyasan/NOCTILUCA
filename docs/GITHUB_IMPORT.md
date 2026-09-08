# GitHubへの登録と元の変更履歴

このリポジトリには、Sitesで公開中のNOCTILUCAのソースを登録しています。

- 元のコミット: `50fd241cafc817e1a458c850a3943d89c3ea2bbf`
- 元の履歴: 33コミット
- 登録日: 2026-09-08
- ソースは元のコミットと同一です。この説明と履歴ファイルのみ追加しています。
- GitHub連携のAPIで登録したため、GitHubのmainのコミットIDはSites側と異なります。
- 元のコミットID・日時・作成者を含む履歴は `archive/noctiluca-sites-history.bundle` に保存しています。

## 元の履歴から作業用リポジトリを復元する

このGitHubリポジトリをcloneしたディレクトリで実行します。

```sh
git bundle verify archive/noctiluca-sites-history.bundle
git clone archive/noctiluca-sites-history.bundle ../NOCTILUCA-with-history
git -C ../NOCTILUCA-with-history log --oneline
```

## 元の履歴をGitHubの別ブランチにも登録する

ローカルPCでGitHubへのGit認証を設定済みの場合、次で元の履歴を閲覧可能なブランチとして登録できます。mainは変更しません。

```sh
git -C ../NOCTILUCA-with-history remote add github https://github.com/beniyasan/NOCTILUCA.git
git -C ../NOCTILUCA-with-history push github main:sites-history
```

## 保存対象

ソース、会話・シナリオ、D1のスキーマ・マイグレーション、テスト、変更履歴を含みます。実際のD1のユーザー別セーブ、稼働環境の秘密情報、依存パッケージのインストール先は含みません。

GitHubへの登録だけではSitesの公開内容やD1は更新されません。公開方法と開発手順はREADMEを参照してください。
