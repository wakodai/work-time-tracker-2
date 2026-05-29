# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

作業時間記録システム (work-time-tracker-2)。START / STOP / BREAK の3アクションで作業ログを取り、TSV ダンプおよび HTML テーブルとしてコピー（Confluence への貼り付け用途）できる、ローカル完結のシングルページツール。データは `localStorage`（`workRecords` / `workContents`）のみに保持され、バックエンドは存在しない。Next.js の静的エクスポート（`output: "export"`）で書き出され、GitHub Pages に自動デプロイされる。

## Common commands

パッケージマネージャは **pnpm**（`pnpm-lock.yaml` あり）。

```bash
pnpm install
pnpm dev               # 開発サーバ (next dev)
pnpm build             # 静的エクスポート → out/  (NODE_ENV=production で basePath が付く)
pnpm lint              # next lint
pnpm test              # Vitest 一括実行 (CIと同じ)
pnpm test:watch        # Watch モード
pnpm vitest run tests/work-time.test.ts                              # 単一ファイル
pnpm vitest run -t "BREAKの分数を引く"                                # 単一テスト（名前部分一致）
```

`pnpm build` は `NODE_ENV=production` でないと `basePath` / `assetPrefix` が空になる点に注意（`next.config.mjs` 参照）。Pages 配信時は `/work-time-tracker-2` プレフィクスが付く。

## Architecture notes

- **クライアント完結のSPA**: `app/page.tsx` が唯一の画面で、`"use client"` でレンダリング。サーバーAPI・DBは無く、永続化は `localStorage` のみ。`app/layout.tsx` は最小限。
- **時間計算は `lib/work-time.ts` に集約**: `calculateTotalWorkMinutes` は records を日時順にソートし、START で session 開始 → BREAK の description から `parseBreakMinutes` で分数を抽出して加算 → STOP で `(stop - start) - sessionBreakMinutes` を total に積む。STARTのみ・STOPのみは無視。**この合算ロジックを変更する際は `tests/work-time.test.ts` のケース（休憩控除、複数セッション、ペア未成立など）を必ず通すこと。**
- **オートコンプリート分離**: 入力UI（`components/work-content-input.tsx`）と純粋ロジック（`lib/work-content-suggest.ts` の `getCurrentToken` / `filterSuggestions` / `replaceTokenAt`）が分離されている。テストはロジック層に対して書き、UIテストはトークン位置・前方一致挙動の代表ケースに留める方針。
- **ドロップダウンは Portal で `document.body` に描画**: 親テーブルの `overflow` でクリップされる事故が過去にあったため（コミット `1ba4220` 参照）、`createPortal` + `position: fixed` + scroll/resize リスナで再配置している。Dialog やテーブル内に新たに置く場合はこの構造を壊さないこと。
- **IME 対応**: `WorkContentInput` は `isComposing` を管理し、変換中の Enter で誤って `onSubmit` を呼ばないようガードしている（コミット `365033e` の修正）。新しいキーハンドリングを追加する際は `isComposing` ガードを忘れない。
- **ドラッグ並べ替えは datetime のスワップで実現**: `app/page.tsx` の `handleDrop` は配列順ではなく、対象2件の `datetime` を入れ替えることで表示順を変える。順序の真実はあくまで日時。
- **shadcn/ui (new-york)**: `components.json` の通り。エイリアスは `@/*` ＝ ルート。UI コンポーネントは `components/ui/` 配下。
- **Tailwind v4 + PostCSS**: 設定は `app/globals.css` 側に寄せる方針（`components.json` の `tailwind.config: ""`）。

## Tests

- Vitest + jsdom + Testing Library。設定は `vitest.config.ts`（`include: tests/**/*.test.{ts,tsx}`、`@` エイリアス解決済み）。
- セットアップ `vitest.setup.ts` で `@testing-library/jest-dom/vitest` を読み込む。
- CI（`.github/workflows/deploy.yml`）は `pnpm test` → `pnpm build` の順で動き、テスト失敗 = デプロイ失敗。

## Deploy

- `main` への push で `.github/workflows/deploy.yml` が走り、GitHub Pages に静的サイトを公開する。`out/.nojekyll` を生成して Jekyll 処理を抑止している。
- `vercel.json` で Vercel の自動デプロイは無効化済み（`git.deploymentEnabled: false`）。新たに Vercel デプロイを復活させる意図がない限り戻さないこと。

## TypeScript / Lint

- `tsconfig.json` は `strict: true` だが、`next.config.mjs` で `eslint.ignoreDuringBuilds: true` / `typescript.ignoreBuildErrors: true` になっている。**ビルドは型エラーで止まらない**ため、型・lint は手元で確認する責務がある。
