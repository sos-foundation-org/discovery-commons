# Discovery Commons 改版實作規畫

**日期：** 2026-09-15  
**狀態：** 待 Ping 確認後執行  
**language:** traditional-chinese  
**tiers_used:** High

---

## 確認結果摘要

Ping 確認：

| 決定項目 | 結果 |
|---|---|
| 保留的學科 | Life Sciences, Physical Sciences, Math & CS, Earth & Environment, **Humanities**, Interdisciplinary |
| 隱藏的學科 | Social Sciences, Medicine & Health, Engineering |
| Humanities | ✅ 保留（古玩、古籍、文學見解都有價值） |
| Engineering | ❌ 先移除，未來再評估 |
| 首頁文案方向 | 強調跨領域、跨背景、跨學歷；citizen science 不只收資料，也產 insight；insight 可學術合作或販售 |
| Neuroscience testimonial | 改為 Marine Biology 或 Mathematics（照建議） |
| Earth & Environment | 保留，氣候可以講 |

---

## 改動清單：7 個檔案

### ① `src/lib/types.ts` — 新增 `getVisibleDisciplines()` helper

**改動量：** ~12 行新增，0 行刪除

```typescript
// 在 DISCIPLINE_CONFIG 之後新增：

/**
 * Returns the disciplines visible in the front-end UI.
 * Controlled by NEXT_PUBLIC_VISIBLE_DISCIPLINES (comma-separated codes).
 * Falls back to ALL disciplines when the env var is absent (backward-compat).
 * Note: this only affects UI selection lists — existing threads tagged with
 * hidden disciplines still display their badge normally.
 */
export function getVisibleDisciplines(): readonly Discipline[] {
  const env = process.env.NEXT_PUBLIC_VISIBLE_DISCIPLINES;
  if (!env) return DISCIPLINES;
  const visible = env.split(',').map(s => s.trim()) as Discipline[];
  return DISCIPLINES.filter(d => visible.includes(d));
}
```

**不動的東西：** `DISCIPLINES` 常數、`DISCIPLINE_CONFIG`、所有型別定義完全不改。

---

### ② `src/app/threads/new/page.tsx` — 學科選單改用 `getVisibleDisciplines()`

**改動量：** 2 行

```diff
 import {
   THREAD_VISIBILITY,
   VISIBILITY_LABELS,
-  DISCIPLINES,
+  getVisibleDisciplines,
   DISCIPLINE_CONFIG,
   type VisibilityLevel,
   type Discipline,
 } from "@/lib/types";
```

```diff
-                {DISCIPLINES.map((d) => {
+                {getVisibleDisciplines().map((d) => {
```

**效果：** 建立新 thread 時，下拉選單只顯示 6 個保留的學科。已有的 Social Sciences / Medicine / Engineering thread 不受影響，其 badge 照常顯示。

**DOMAIN_SUGGESTIONS 也要調整：**

```diff
 const DOMAIN_SUGGESTIONS = [
   "ecology",
   "acoustics",
-  "neuroscience",
   "physics",
   "complex systems",
   "information theory",
   "methodology",
-  "education",
   "cosmology",
   "philosophy",
   "biology",
   "mathematics",
+  "geology",
+  "astronomy",
+  "taxonomy",
+  "natural history",
+  "literature",
+  "archaeology",
 ];
```

---

### ③ `src/app/page.tsx` — 首頁文案改版（重點改動）

**改動量：** ~40 行修改

#### Hero 區

| 元素 | 現有 | 改為 |
|---|---|---|
| Badge | `Open-source research platform` | `Open research platform — all backgrounds welcome` |
| 副標題 p1 | `What you don't know matters more than what you do.` | 保留不變 |
| 副標題 p2 | `Share your unanswered questions, build on others' unknowns...` | `Whether you're a field naturalist, a theoretical physicist, or a curious citizen — share your observations and ideas, build on others' unknowns, and watch discoveries evolve transparently. Every insight is SHA-256 protected from the moment you type it.` |
| Stats label | `Researchers` | `Contributors`（更 inclusive） |

#### Anti-Library Concept 區

| 元素 | 現有 | 改為 |
|---|---|---|
| 段落 2 | `Discovery Commons is the first platform where a thoughtful question earns the same credit as a published result.` | `Discovery Commons is the first platform where a thoughtful question earns the same credit as a published result — and where a birdwatcher's field note can spark a collaboration with a university lab. Traditional citizen science asks volunteers to collect data. Here, your insights have their own value: they can seed academic partnerships, inspire new research directions, or even be licensed commercially.` |

#### Testimonials 區

| 人物 | 現有 | 改為 |
|---|---|---|
| Dr. A. Researcher | Theoretical Physics, MIT — 保留不變 | ✅ 不改 |
| Dr. B. Scientist | Ecology, Oxford — 保留不變 | ✅ 不改 |
| C. Student | **Neuroscience PhD Candidate** | **Mathematics PhD Candidate** — 改 quote 為：`"As a grad student, my questions used to disappear into lab notebooks. Here they're first-class contributions with my name and timestamp on them — and a retired naturalist added an observation that completely changed my approach."` |

#### How It Works Step 1

| 元素 | 現有 | 改為 |
|---|---|---|
| desc | `Start a thread with an unusual question. The weirder the better — that's where breakthroughs hide.` | `Start a thread with an unusual question — whether it comes from a research lab, a forest trail, or your grandmother's bookshelf. The weirder the better.` |

#### Final CTA

| 元素 | 現有 | 改為 |
|---|---|---|
| 副標題 | `Join a community where curiosity is currency and every idea is protected from the moment you type it.` | `Join a community where curiosity is currency — no PhD required. Every observation, question, and insight is protected from the moment you type it.` |

---

### ④ `src/app/about/page.tsx` — 關於頁面微調

**改動量：** ~15 行修改

#### Hero 段落

在現有描述之後加一段：

```
Discovery Commons welcomes contributors across all backgrounds and education 
levels — from field naturalists and amateur astronomers to theoretical physicists 
and humanities scholars. Unlike traditional citizen science platforms that only 
collect data, here your insights carry independent value and can lead to academic 
collaborations or commercial opportunities.
```

#### CTA 段落

| 現有 | 改為 |
|---|---|
| `Join a community where your questions matter as much as your answers.` | `Join a community where your questions matter as much as your answers — no lab coat required.` |

#### 關於頁面底部 placeholder image

| 現有 | 改為 |
|---|---|
| `Photo: Diverse researchers collaborating around a shared whiteboard` | `Photo: A field naturalist, a theorist, and a curious citizen building an idea together` |

---

### ⑤ `src/components/layout/footer.tsx` — 微調描述

**改動量：** 1 行

```diff
-            The Antilibrary of Science — where great questions are as
-            valuable as great answers.
+            The Antilibrary of Science — where great questions are as
+            valuable as great answers, and every background brings something new.
```

---

### ⑥ `.env.example` — 新增環境變數說明

**改動量：** ~5 行新增

```env
# ── Scope ────────────────────────────────────────────────
# Which discipline badges appear in the "New Thread" form.
# Comma-separated discipline codes from src/lib/types.ts.
# Omit or leave empty to show ALL disciplines (backward-compatible).
NEXT_PUBLIC_VISIBLE_DISCIPLINES=life_sciences,physical_sciences,math_cs,earth_environment,humanities,interdisciplinary
```

---

### ⑦ `.env.local`（本地 + Vercel 環境變數）

在本地 `.env.local` 和 Vercel dashboard 中設定：

```
NEXT_PUBLIC_VISIBLE_DISCIPLINES=life_sciences,physical_sciences,math_cs,earth_environment,humanities,interdisciplinary
```

---

## 不需改的檔案（確認清單）

| 檔案 | 原因 |
|---|---|
| `src/lib/types.ts` 的 DISCIPLINES / DISCIPLINE_CONFIG | 完整保留，不刪任何學科定義 |
| `src/prisma/schema.prisma` | schema 不變 |
| `src/lib/access-control.ts` | 權限邏輯不變 |
| `src/lib/validations.ts` | Zod validation 仍接受所有 discipline（後端不限制） |
| `src/components/navbar.tsx` | 導航結構不變 |
| `src/components/thread/discipline-badge.tsx` | badge 顯示邏輯不變，已有的隱藏學科 thread 照常 render |
| 所有 API routes | 後端完全不改，只是前端不顯示某些選項 |
| `src/app/threads/page.tsx` | 瀏覽頁面沒有 discipline filter，不需改 |
| 所有 Phase-2 dormant code | 不動 |

---

## 圖片評估

### Hero 圖片 (`public/images/hero.png`)

**現有圖片內容：** 多元背景人群——含工程師（安全帽）、分子模型、顯微鏡、望遠鏡、漁夫、畫家、小孩拿放大鏡、老人拿地球儀/礦石、植物學家拿燒瓶、建築模型等。

**評估：**

| 元素 | 與新定位的契合度 |
|---|---|
| 🟢 漁夫拿魚 | 非常契合 — citizen science / naturalist |
| 🟢 小孩拿放大鏡 | 非常契合 — 好奇心、跨學歷 |
| 🟢 望遠鏡 | 契合 — 天文 / physical sciences |
| 🟢 顯微鏡 + 試管 | 契合 — 學術科學家 |
| 🟢 分子模型 | 契合 — 理論科學 |
| 🟢 老人拿礦石 | 契合 — naturalist / earth sciences |
| 🟢 畫家 | 契合 — humanities |
| 🟢 植物學家（燒瓶+苗） | 契合 — life sciences |
| 🟡 背包客 / 學生 | 中性，沒問題 |
| 🔴 安全帽工程師 | 不太契合 — engineering 已隱藏 |
| 🔴 建築模型 | 不太契合 — 偏 engineering |

**建議：**

- **短期（這次改版）：保留現有圖片。** 理由：圖片整體傳達「多元背景」的訊息，與「跨背景、跨學歷」的新定位方向一致。工程師和建築模型只佔畫面的一小部分，不會讓人以為這是工程平台。加上 hero 有 scrim 覆蓋 + 文字疊加，實際上這些細節在首頁瀏覽時不太顯眼。
- **中期（可選）：** 若 Ping 想進一步強化 naturalist / field science 的印象，可以換一張更偏「自然 / 野外 / 好奇心」的圖片——例如田野觀察、潮間帶調查、天文觀測之類的場景。但這不是必要的，現有圖片已經足夠好。

**結論：圖片這次不換。**

---

## 改動量總計

| 檔案 | 新增 | 修改 | 刪除 |
|---|---|---|---|
| `src/lib/types.ts` | ~12 行 | 0 | 0 |
| `src/app/threads/new/page.tsx` | ~6 行 | ~3 行 | ~3 行 |
| `src/app/page.tsx` | ~10 行 | ~8 行 | 0 |
| `src/app/about/page.tsx` | ~6 行 | ~2 行 | 0 |
| `src/components/layout/footer.tsx` | 0 | ~1 行 | 0 |
| `.env.example` | ~5 行 | 0 | 0 |
| `.env.local` | ~1 行 | 0 | 0 |
| **總計** | **~40 行** | **~14 行** | **~3 行** |

視覺風格、佈局、色彩、路由結構完全不變。  
所有改動可在 `NEXT_PUBLIC_VISIBLE_DISCIPLINES` 環境變數清除後完全回復到原始狀態。

---

## 測試方案

### 現況

目前 Discovery Commons **零測試基礎設施**——沒有 test runner、沒有測試檔案、package.json 裡沒有 test script。既然 Ping 準備分享給外部使用者，這是建立測試的好時機。

### 測試工具選擇

| 工具 | 用途 | 選擇理由 |
|---|---|---|
| **Vitest** | 單元測試 + 整合測試 runner | 與 Next.js / TypeScript 原生相容、速度快、零設定 ESM 支援、API 與 Jest 相容但更現代 |
| **React Testing Library** (`@testing-library/react`) | 元件測試 | Next.js 官方推薦、測試使用者行為而非實作細節 |
| **Playwright** | E2E 端對端測試 | Next.js 官方推薦、跨瀏覽器、支援 API route 測試、比 Cypress 更適合 Next.js App Router |

### 安裝指令

```bash
# 單元 + 元件測試
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom

# E2E 測試
npm install -D @playwright/test
npx playwright install --with-deps chromium  # 只裝 Chromium，足夠原型階段
```

### 新增檔案清單

```
discovery-commons/
├── vitest.config.ts              ← Vitest 設定（~15 行）
├── playwright.config.ts          ← Playwright 設定（~30 行）
├── src/
│   └── __tests__/                ← 測試目錄
│       ├── unit/
│       │   ├── types.test.ts                 ← getVisibleDisciplines() 單元測試
│       │   ├── access-control.test.ts        ← 存取控制邏輯測試
│       │   └── validations.test.ts           ← Zod schema 測試
│       ├── components/
│       │   └── new-thread-form.test.tsx       ← 學科選單元件測試
│       └── e2e/
│           ├── homepage.spec.ts              ← 首頁載入 + 內容驗證
│           ├── thread-lifecycle.spec.ts      ← 建立/瀏覽/貢獻 thread 完整流程
│           ├── auth.spec.ts                  ← 登入/登出/受保護路由
│           ├── discipline-filter.spec.ts     ← 學科選單只顯示可見學科
│           ├── sealed-ideas.spec.ts          ← seal/reveal 流程
│           └── share-link.spec.ts            ← 分享連結存取
├── package.json                  ← 新增 test scripts
```

### package.json 新增 scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "vitest run && playwright test"
  }
}
```

---

### 第一層：單元測試（Vitest）

#### `src/__tests__/unit/types.test.ts` — 核心邏輯

```typescript
// 測試項目：
describe('getVisibleDisciplines', () => {
  it('未設環境變數時回傳所有 9 個學科')
  it('設定環境變數後只回傳指定學科')
  it('保持 DISCIPLINES 陣列中的原始順序')
  it('忽略環境變數中無效的學科代碼')
  it('空字串環境變數回傳所有學科（向後相容）')
})

describe('DISCIPLINE_CONFIG', () => {
  it('每個 DISCIPLINES 都有對應的 config')
  it('每個 config 都有 label、badge、dot')
})

describe('CONTRIBUTION_TYPES', () => {
  it('包含所有 9 個類型')
  it('每個類型都有 label、icon、color、description')
})

describe('CREDIT_WEIGHTS', () => {
  it('每個 contribution type 都有權重')
  it('insight 權重最高')
})
```

#### `src/__tests__/unit/access-control.test.ts` — 存取控制

```typescript
// 測試項目：
describe('canViewThread', () => {
  it('public thread 任何人可見')
  it('private thread 只有 creator 可見')
  it('shared thread 只有 collaborator 可見')
})

describe('canViewContribution', () => {
  it('sealed contribution 只顯示 hash，不顯示內容')
  it('visibility 只能向上（private → shared → public），不能向下')
})
```

#### `src/__tests__/unit/validations.test.ts` — 輸入驗證

```typescript
// 測試項目：
describe('thread creation schema', () => {
  it('接受有效的 title + description')
  it('拒絕空 title')
  it('拒絕超過 200 字的 title')
  it('接受所有合法 discipline 值（包括隱藏的）')
  it('拒絕不存在的 discipline 值')
  it('discipline 是 optional')
})
```

---

### 第二層：元件測試（React Testing Library）

#### `src/__tests__/components/new-thread-form.test.tsx`

```typescript
// 測試項目：
describe('NewThreadPage discipline selector', () => {
  it('設定 VISIBLE_DISCIPLINES 時只渲染指定學科')
  it('未設環境變數時渲染所有 9 個學科')
  it('點擊學科 badge 切換選取狀態')
  it('一次只能選一個學科')
  it('再次點擊取消選取')
})
```

---

### 第三層：E2E 測試（Playwright）

#### `src/__tests__/e2e/homepage.spec.ts`

```typescript
// 測試項目：
test('首頁載入成功 + 含關鍵文案', async ({ page }) => {
  // 檢查 title、hero text、How It Works、Covenant
})

test('首頁統計數字正確顯示', async ({ page }) => {
  // Threads / Contributions / Contributors 都是數字
})

test('未登入時顯示 Get Started CTA', async ({ page }) => {
  // 檢查按鈕存在且連結正確
})
```

#### `src/__tests__/e2e/thread-lifecycle.spec.ts` — **最重要的 E2E**

```typescript
// 測試項目：
test('完整 thread 生命週期', async ({ page }) => {
  // 1. 登入（dev auth）
  // 2. 建立新 thread（選 Life Sciences）
  // 3. 新增 question contribution
  // 4. 新增 hypothesis contribution
  // 5. 確認 thread 頁面顯示正確
  // 6. 確認 thread 出現在 /threads 列表
})
```

#### `src/__tests__/e2e/discipline-filter.spec.ts` — **改版專屬**

```typescript
// 測試項目：
test('新建 thread 表單只顯示 6 個可見學科', async ({ page }) => {
  // 登入 → /threads/new → 計算學科 badge 數量 = 6
  // 確認 Social Sciences、Medicine、Engineering 不在選項中
})

test('已有隱藏學科的 thread 仍正常顯示 badge', async ({ page }) => {
  // 需要 seed data 中有一個 Social Sciences thread
  // 確認其 badge 正常渲染
})
```

#### `src/__tests__/e2e/auth.spec.ts`

```typescript
// 測試項目：
test('未登入時受保護路由導向登入頁', async ({ page }) => {
  // /threads/new, /sealed, /profile 都應重導
})

test('dev auth 登入流程', async ({ page }) => {
  // 填入帳密 → 登入成功 → 看到 navbar 個人頭像
})
```

#### `src/__tests__/e2e/sealed-ideas.spec.ts`

```typescript
// 測試項目：
test('seal 一個 idea 後只顯示 hash', async ({ page }) => {
  // 建立 contribution → seal → 確認內容隱藏、hash 可見
})
```

#### `src/__tests__/e2e/share-link.spec.ts`

```typescript
// 測試項目：
test('分享連結可存取 shared contribution', async ({ page }) => {
  // 建立 contribution → 產生分享連結 → 未登入狀態存取
})
```

---

### 測試配置檔

#### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/unit/**/*.test.ts', 'src/__tests__/components/**/*.test.tsx'],
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
```

---

### 測試執行計畫

| 階段 | 時機 | 動作 |
|---|---|---|
| **改版前** | 建立測試基礎設施 | 安裝工具 + 配置檔 + 寫核心單元測試 |
| **改版中** | 每個檔案改完後 | 跑 `npm test` 確認沒破壞 |
| **改版後** | 所有改動完成 | 跑 `npm run test:all`（單元 + E2E） |
| **推送前** | commit 前 | `npx tsc --noEmit && npm run build && npm test` |
| **日常** | 每次修改後 | `npm test`（快速單元測試） |

### 未來可加（不在此次範圍）

- **GitHub Actions CI**：每次 push 自動跑測試（目前 Ping 直接 push main，加 CI 可以在部署前攔截錯誤）
- **Visual regression testing**：截圖比對首頁外觀變化
- **API route 整合測試**：用 supertest 測 API 端點
- **Accessibility 測試**：axe-core 掃描 WCAG 合規性

---

## 實作順序（更新）

```
1. 安裝測試工具 + 寫配置檔
2. 寫核心單元測試（types, access-control, validations）
3. 確認現有程式碼通過測試 ← 基線
4. 執行改版（7 個檔案改動）
5. 寫改版專屬測試（discipline-filter）
6. 寫 E2E 測試（homepage, thread-lifecycle, auth, sealed-ideas, share-link）
7. 跑完整測試套件
8. npx tsc --noEmit && npm run build
9. 推送到 main → Vercel 自動部署
```

---

## 驗證步驟（改完後執行）

1. `npx tsc --noEmit` — 型別檢查通過
2. `npm run build` — 建置成功
3. `npm test` — 所有單元 + 元件測試通過
4. `npm run test:e2e` — 所有 E2E 測試通過
5. 手動檢查：
   - `/threads/new` 頁面只顯示 6 個學科
   - 已有的 Social Sciences / Medicine / Engineering thread 的 badge 仍正常顯示
   - 首頁文案正確
   - 關於頁面文案正確
6. Vercel 設定 `NEXT_PUBLIC_VISIBLE_DISCIPLINES` 環境變數
7. 推送到 main，確認 Vercel 自動部署成功

---

*Ping 確認此規畫後，我會依照「實作順序」逐步執行所有改動與測試。*
