# 作業時間記録システム (work-time-tracker-2)

Next.js 製の作業時間トラッカー。START / STOP / BREAK の3アクションで作業記録を取り、TSV ダンプや HTML テーブルのコピー機能、wage ページ起動、そして総作業時間の自動計算機能を提供します。

## 機能

- 作業記録の追加・編集・削除・ドラッグ並べ替え
- 作業内容のマスター管理（追加/編集/削除）
- 作業内容入力時のオートコンプリート（矢印キーで候補選択、Enter / Tab で確定挿入）
- 総作業時間の自動計算と表示
- TSV ダンプおよび HTML テーブルでのコピー（Confluence 等への貼り付け用）

## 開発

```bash
pnpm install
pnpm dev      # 開発サーバ
pnpm test     # ユニットテスト（Vitest）
pnpm build    # 静的エクスポート（out/）
```

## デプロイ

`main` ブランチに push すると、GitHub Actions が静的サイトを生成し GitHub Pages に自動デプロイします。`vercel.json` の `git.deploymentEnabled: false` により Vercel の自動デプロイは停止しています。
