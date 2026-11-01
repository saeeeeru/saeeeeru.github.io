# さえない / Yamamuro Saeru

Astro と Tailwind CSS で作ったポートフォリオです。公開先は [https://saeeeeru.github.io/](https://saeeeeru.github.io/) です。

## 開発

```sh
npm ci
npm run dev
```

本番と同じ静的ファイルは `npm run build` で `dist/` に出ます。フィードや GitHub API に届かないときは、コミットしてある `src/data/snapshots/` を使います。ビルドは失敗しません。

```sh
FEEDS_OFFLINE=1 npm run build
```

## Now / 経歴の更新

編集するのは `src/data/profile.yaml` だけです。

- `now.items` … Now に出す項目。`label` と、必要なら `detail`
- `now.lead` / `now.asOf` … Now のリードと時点
- `career` … 職歴。並びがそのまま表示順
- `education` … 学歴
- `skills` … スキル
- `social` … ソーシャルリンク
- `pinned` / `themes` … Projects で手前に出すリポジトリと、サッカー × データのまとまり

プロジェクトの文章は `src/content/projects/` の Markdown です。ファイル名が URL になります（例: `dtc-tensorflow.md` → `/dtc-tensorflow/`）。

## 自動で取ってくるもの

ビルドのたびに取得します。GitHub Actions は `main` への push と、毎週月曜 0:00 JST の cron で再ビルドします。

| 内容 | 取得元 | 失敗したとき |
| --- | --- | --- |
| note の新しい記事 | https://note.com/deepfoot/rss | `src/data/snapshots/note.json`。それも無ければその欄は出さない |
| sizu の新しい記事 | https://sizu.me/saeeeeru/rss | `src/data/snapshots/sizu.json`。同様 |
| 公開リポジトリ | GitHub API `users/saeeeeru/repos` | `src/data/snapshots/repos.json` |

fork は一覧に入れていません。`saeeeeru.github.io` 自体も除いています。Actions ではレート制限対策に `GITHUB_TOKEN` を付けます。手元のビルドはトークンなしで動きます。

スナップショットを取り直すときは、ネットワークがある状態で次を実行します。

```sh
UPDATE_SNAPSHOTS=1 npm run build
```

## デプロイ

本番は GitHub Actions（`withastro/action`）でビルドし、`gh-pages` ブランチのルートへ出します。PR プレビューは `gh-pages` の `pr-preview/<番号>/` です。

このリポジトリの GitHub Pages は、移行時点では **main ブランチを Jekyll で公開** しています。Astro の成果物を出すには、Settings → Pages → Build and deployment で次に切り替えます。

- Source: Deploy from a branch
- Branch: `gh-pages` / `/ (root)`

切り替えるタイミングは、`main` へマージしたあとの Deploy site ワークフローが成功してからです。それより前に切り替えると、サイトのルートが空になります。マージしたあとも公開元が `main` のままだと、Jekyll が Astro のソースをビルドしようとして本番が壊れます。

公開元がまだ `main` のあいだ、PR プレビュー用ワークフローは同じファイルを `main` の `pr-preview/<番号>/` にも置きます。いまの公開設定のまま `https://saeeeeru.github.io/pr-preview/<番号>/` が開きます。PR を閉じると消します。

## 旧 URL

投稿はそのままのパスです。

- `/dtc-tensorflow/`
- `/soccer-open-data-analysis/`
- `/scraping-from-jleague-data/`
- `/zenkoku-ugoki-toukei/`
- `/statsbomb-to-bigquery/`

ページはリダイレクトです。

- `/about/` → `/#career`
- `/projects/` → `/#projects`
- `/blog/` → `/#writing`
- `/tags/` → `/#projects`
- `/CONTRIBUTION/` → `/`

`/feed.xml` はプロジェクト記事の RSS として残しています。
