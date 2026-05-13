# 作業時間トラッカー機能拡張 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vercel → GitHub Pages 移行、Vitest テスト導入、作業内容オートコンプリート改善、総作業時間表示の4項目を1リリースで実装する。

**Architecture:**
- ロジックを `lib/` 配下の純粋関数に抽出し、Vitest + jsdom + Testing Library でカバー。
- オートコンプリートは shadcn/ui の `<Input>` をラップする独自の `WorkContentInput` コンポーネントを新設し、矢印キー＋Enter/Tab でカーソル位置に挿入する。
- Next.js を `output: 'export'` に切り替えて静的サイトとし、GitHub Actions で `out/` を Pages にデプロイ。
- Vercel は `vercel.json` の `git.deploymentEnabled` を `false` にして自動デプロイを止める。

**Tech Stack:** Next.js 15 (Static Export), React 19, TypeScript, Tailwind, shadcn/ui, Vitest, @testing-library/react, jsdom, GitHub Actions, GitHub Pages.

---

## File Structure

| Path | Role |
| --- | --- |
| `lib/work-time.ts` | 総作業時間計算ロジック（純粋関数） |
| `lib/work-content-suggest.ts` | カーソル位置の単語抽出・候補フィルタ |
| `components/work-content-input.tsx` | 矢印キー対応のオートコンプリート入力 |
| `tests/work-time.test.ts` | 作業時間計算の単体テスト |
| `tests/work-content-suggest.test.ts` | 候補抽出のテスト |
| `tests/work-content-input.test.tsx` | コンポーネント結合テスト |
| `vitest.config.ts` | Vitest 設定 |
| `vitest.setup.ts` | jest-dom セットアップ |
| `app/page.tsx` | リファクタ：抽出済みロジック・コンポーネントを参照、総作業時間 UI 追加 |
| `next.config.mjs` | `output: 'export'`, `basePath`, `images.unoptimized` |
| `.github/workflows/deploy.yml` | Pages デプロイワークフロー |
| `vercel.json` | Vercel デプロイ停止 |
| `package.json` | test スクリプト・devDeps 追加 |

---

## Tasks

1. **テスト基盤** — Vitest + jsdom + @testing-library/react + @testing-library/jest-dom + @testing-library/user-event を devDependencies に追加し、`vitest.config.ts` と `vitest.setup.ts` を作成。`package.json` に `"test": "vitest run"` を追加。
2. **総作業時間ロジック (TDD)** — `lib/work-time.ts::calculateTotalWorkMinutes(records)` を実装。START–STOP ペアを時系列で組み合わせ、各ペア区間内の `BREAK(n)` 分数を引いた合計分数を返す。フォーマット用 `formatMinutesAsHHMM(min)` も同ファイル。
3. **候補抽出ロジック (TDD)** — `lib/work-content-suggest.ts::getCurrentToken(text, caret)` と `filterSuggestions(contents, token)` を実装。トークンは `\s` で区切られた現在のカーソル直近の語。
4. **オートコンプリート UI** — `components/work-content-input.tsx` を作成。`Input` に submit/IME ハンドラ、↑↓キーでハイライト切替、Enter で確定時はトークンを置換しカーソル位置に挿入。Enter で候補非選択時は親の `onSubmit` を呼び出して既存 Enter 動作を維持。
5. **page.tsx リファクタ** — `description` 入力部を `WorkContentInput` に差し替え、`workContents` を渡す。
6. **総作業時間 UI** — 作業記録カードヘッダ右端に「総作業時間 hh:mm」を表示。
7. **Next.js static export** — `next.config.mjs` に `output: 'export'`, `basePath: '/work-time-tracker-2'`, `assetPrefix: '/work-time-tracker-2/'`, `trailingSlash: true` を設定。`pnpm build` で `out/` が生成されることを確認。
8. **GitHub Actions** — `.github/workflows/deploy.yml` に `actions/checkout`, `actions/setup-node`, `pnpm/action-setup`, `pnpm install --frozen-lockfile`, `pnpm build`, `actions/upload-pages-artifact`, `actions/deploy-pages` を組み込む。`out` に `.nojekyll` を作るステップも追加。
9. **Vercel 停止** — `vercel.json` に `{ "git": { "deploymentEnabled": { "main": false } } }` を保存。
10. **検証** — `pnpm test` → 全てパス。`git push` 後 `gh run watch` で Actions 緑、`gh api repos/.../pages` で公開 URL を取得、Vercel CLI で deployments がスキップされたことを確認（CLI 認証が無ければ手動確認を案内）。
