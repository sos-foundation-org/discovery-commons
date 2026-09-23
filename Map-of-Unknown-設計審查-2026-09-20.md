# Map of the Unknown（Discovery Commons）設計審查報告

**日期：** 2026-09-20
**審查範圍：** 整個 codebase（src/、docs/、prisma schema、API routes、components、lib）
**審查目的：** 找出架構中的設計缺陷、資料風險、UX 問題、技術債

---

## 嚴重程度定義

| 等級 | 定義 |
|------|------|
| **Critical** | 會導致使用者資料遺失或嚴重安全問題 |
| **Major** | 架構設計缺陷，影響產品可用性或可維護性 |
| **Minor** | 小問題，不緊急但應該修 |

---

## Critical 問題

### C-1：Legacy Seal 流程——使用者內容只存在瀏覽器記憶體中

**現在的機制：**
`src/app/sealed/page.tsx` 的 legacy `/sealed` 頁面讓使用者輸入 idea 內容，在 client 端用 `crypto.subtle.digest("SHA-256")` 計算 hash，然後只把 `{ contentHash, title }` 送到 `/api/sealed`。原始內容 **從未送到 server**，甚至不存在 localStorage——只存在 React 的 `useState` 裡。

**為什麼是問題：**
- 使用者重新整理頁面、關閉分頁、換瀏覽器、換手機、電腦當機 → 內容永遠消失
- `SealedRegistration` 表只有 hash + title + timestamp，沒有 content 欄位
- 使用者要 reveal 時必須完整重新輸入原始內容（`/api/sealed/[sealId]/reveal`），hash 必須完全吻合才能解封
- 如果使用者沒有自行備份原始文字，這個 seal 就永遠無法 reveal——只剩一個無法證明內容的 hash

**諷刺的是：** 系統已經有一個正確版本的 seal 機制（`Contribution.visibility = "sealed"`），content 完整存在 server 端，只是透過 access control 隱藏。兩套機制並存，而壞的那套是使用者最容易直接碰到的（nav 裡有 "Sealed" 連結直接進 legacy 頁面）。

**建議修正：**
1. 移除 legacy `/sealed` 流程，或至少重導到 Contribution 的 sealed 流程
2. 如果要保留獨立 seal 頁面，必須將加密後的內容存到 server（用使用者密鑰加密），或至少警告使用者自行保存
3. `SealedRegistration` schema 加 nullable `encryptedContent` 欄位

**複雜度：** 中等（需要 schema 遷移 + UI 改動 + 資料流重設計）

---

### C-2：42 個 API route 沒有 try/catch 或錯誤處理不完整

**現在的機制：**
58 個 API route 中，46 個手動寫 try/catch → `NextResponse.json({ error })` 的重複樣板碼，而另外 12 個 route **完全沒有 try/catch**。任何未捕捉的 exception 會導致 500 Internal Server Error 回傳給使用者，沒有有用的錯誤訊息。

**為什麼是問題：**
- Prisma 連線失敗、資料庫 timeout、race condition 等情況下，使用者只看到空白或 "Something went wrong"
- 沒有集中錯誤處理 → 修 bug 時要改 58 個檔案
- 沒有結構化 error logging → 生產環境 debug 極困難

**建議修正：**
1. 建立一個 `withErrorHandler(handler)` 高階函數包裝所有 route handler
2. 集中 error response 格式（含 error code、message、request ID）
3. 加入結構化 logging（如 Pino 或 Vercel 的 log drain）

**複雜度：** 簡單（機械式重構，不影響功能）

---

### C-3：登入流程沒有 rate limiting

**現在的機制：**
`src/lib/rate-limit.ts` 是 in-memory rate limiter，但 **唯一使用它的地方是 `/api/auth/register`**。Credentials 登入（`src/lib/auth.ts` 的 `authorize` callback）完全沒有 rate limiting。

**為什麼是問題：**
- 暴力破解密碼攻擊沒有任何阻擋
- 即使是 bcrypt，大量登入嘗試仍然可以拖垮 server
- Vercel serverless 環境下 in-memory rate limiter 本身就不可靠（每個 instance 獨立計數）

**建議修正：**
1. 至少在 `/api/auth/[...nextauth]` 的 credentials provider 加 rate limiting
2. 長期：用 Vercel Edge Middleware 或 Upstash Redis 做分散式 rate limiting
3. 加入帳號鎖定機制（N 次失敗後暫停）

**複雜度：** 簡單（加幾行 rate-limit 呼叫）到中等（改用分散式方案）

---

## Major 問題

### M-1：Discovery Points 經濟系統——$0 原型裡的完整虛擬貨幣

**現在的機制：**
系統有完整的 DP（Discovery Points）經濟：
- 9 個 Prisma model（`PointsAccount`, `PointsTransaction`, `ContentPurchase`, `CollaborationRequest`, `ContentAccessRule`, `ContentAccessLog`, `Bounty`, `BountyAward`）
- `src/lib/points.ts`：完整的 earn/spend/transfer 邏輯，含 10% 平台抽成、escrow 凍結/解凍
- `src/lib/types.ts`：6 級聲望系統（Glimmer → Horizon）、獎勵費率表
- `/api/contributions/[id]/purchase`：真的回 HTTP 402（Payment Required）
- 內容可以定價 1-1000 DP，有購買按鈕，有 bounty 懸賞系統

**為什麼是問題：**
- 文件完全沒有提到這個系統（`ARCHITECTURE.md`、`ROADMAP.md`、`CLAUDE.md` 都沒有）
- 對一個 $0 原型來說，這是極度的過度工程——還沒有使用者就在設計貨幣經濟
- DP 在 UI 上看起來像真錢（"Unlock for 50"、"Purchase"），但沒有任何地方解釋這是虛擬點數
- DP 賺取動作（like、comment）沒有 rate limiting → 可以刷點
- 如果未來要改經濟模型，已經有大量 code 要改

**建議修正：**
1. 先決定：DP 是 MVP 核心功能還是未來規劃？
2. 如果是未來規劃 → 像 AI Reviewer 一樣標記為 dormant，移出活躍 UI
3. 如果是 MVP 核心 → 補齊文件，加 rate limiting 防刷，UI 上清楚標示「虛擬點數」
4. 無論如何，reward table 和 platform fee 應該是環境變數或 config，不是 hardcode

**複雜度：** 中等（需要產品決策 + code/UI 調整）

---

### M-2：兩套平行的信用系統同時運作

**現在的機制：**
- `Credit`（v1）：簡單的 weight-based 信用
- `CreditV2`：append-only、9 維度（只用 5 維）、hash 驗證的信用
- 兩套 API 都活著、都可以寫入、都有 UI

**為什麼是問題：**
- 使用者看到兩種「信用」不知道哪個是真的
- 維護兩套系統的 API、UI、access control 是雙倍的工作
- `docs/ROADMAP.md` 早就標注這是技術債，但一直沒解

**建議修正：**
1. 選一個（大概是 CreditV2），停用另一個
2. 寫 migration script 合併現有資料
3. 移除停用版的 UI 入口

**複雜度：** 中等

---

### M-3：手寫 i18n 框架——2,378 行翻譯基礎建設，翻譯覆蓋率不完整

**現在的機制：**
`src/lib/i18n-dicts/` 有約 2,378 行程式碼，實作了完整的 i18n 框架（語言切換、字典載入、fallback），支援中文和英文。

**為什麼是問題：**
- 先前測試報告已經指出翻譯覆蓋率有缺口
- 手寫 i18n 框架重複造輪子（next-intl、react-i18next 都是成熟方案）
- 大量基礎建設投入，但 MVP 階段的核心功能還沒穩定

**建議修正：**
1. 短期：先專注英文，把 i18n 當 Phase-2
2. 長期：如果需要 i18n，換用 next-intl 或 react-i18next
3. 或者：如果雙語是 MVP 核心需求，就把現有框架的翻譯補齊

**複雜度：** 簡單（保留但降低優先級）到困難（換框架）

---

### M-4：Middleware 保護路由必須手動維護——遺漏就是安全洞

**現在的機制：**
`src/middleware.ts` 用一個手動列表定義受保護路由：`["/threads/new", "/sealed", "/profile", "/admin/:path*", "/notifications", "/settings"]`。

**為什麼是問題：**
- 新增頁面忘記加到列表 → 未登入使用者可以直接訪問
- `/points`、`/credits` 等已有的需登入頁面似乎不在列表中（應確認）
- 列表和實際路由之間沒有自動同步或測試

**建議修正：**
1. 反轉邏輯：預設全部需要登入，用白名單列出公開頁面（`/`, `/about`, `/verify/*`, `/share/*`, `/auth/*`, `/legal/*`）
2. 或加 integration test 確認所有受保護路由都在 middleware matcher 裡

**複雜度：** 簡單

---

### M-5：大量 UI 操作靜默失敗——使用者按了沒反應

**現在的機制：**
多個元件的 error handler 會 catch error 但不顯示任何提示：
- `collab-chat-panel.tsx`（發送訊息失敗）
- `collaborator-manager.tsx`（移除協作者失敗）
- `share-link-button.tsx`（撤銷分享連結失敗）
- `visibility-upgrade.tsx`（變更可見度失敗）
- `contribution-form.tsx`（載入 trusted circle 失敗，有明確註解 "silently fail"）

**為什麼是問題：**
- 使用者按下按鈕後什麼都沒發生，不知道是成功還是失敗
- 特別危險的是不可逆操作（可見度變更）靜默失敗——使用者以為已經公開但其實沒有

**建議修正：**
1. 所有使用者操作必須有 loading state + 成功/失敗反饋
2. 不可逆操作失敗必須明確告知

**複雜度：** 簡單（加 toast notification）

---

### M-6：Contribution Form 一次塞進所有欄位——認知超載

**現在的機制：**
`src/components/contribution/contribution-form.tsx` 是一個單一表單，同時包含：
- 類型選擇、方法、內容
- 可見度設定
- Trusted Circle 選擇
- 定價模式（4 種子模式）
- 授權條款選擇
- Seal checkbox

**為什麼是問題：**
- 一個只想問問題的使用者，被迫面對貨幣定價和授權條款
- 沒有任何 progressive disclosure 或步驟引導
- 新使用者第一次看到這個表單會直接離開

**建議修正：**
1. 預設只顯示必要欄位（類型、內容、可見度）
2. 進階選項（定價、授權、seal）收在 "Advanced" 或步驟 2
3. 或改成 wizard 多步驟表單

**複雜度：** 中等

---

### M-7：Landing Page 無法在 10 秒內讓人理解產品

**現在的機制：**
`src/app/page.tsx` 的 Hero 區域堆疊了：badge → 標題 → 副標 → tagline → 描述 → 可收合的詳細說明，五層文案才到達第一個 CTA。核心機制（Seal/Reveal、Credit、Thread 結構）都藏在需要點擊展開的 `<Disclosure>` 元件裡。

**為什麼是問題：**
- 一般訪客不會點開所有 disclosure
- 沒有具體範例展示「一個 thread 長什麼樣」
- 產品的 unique value proposition 被埋在大量抽象描述中

**建議修正：**
1. Hero 只留一句話 + 一個具體範例或動畫
2. "How It Works" 用 3 步 + 實際截圖
3. 核心概念解釋不要藏在可收合區塊

**複雜度：** 簡單（文案 + 排版調整）

---

### M-8：環境變數沒有驗證機制

**現在的機制：**
`.env.example` 列了約 15 個環境變數，但 code 中是直接 `process.env.XXX` 讀取，沒有集中驗證。甚至有文件列出但從未被讀取的變數（`AI_MONTHLY_BUDGET_CEILING`）。

**為什麼是問題：**
- 少設一個環境變數 → 執行期才爆，不是啟動時就檢查
- `AI_MONTHLY_BUDGET_CEILING` 暗示有月度預算上限，但實際上完全沒實作——是錯誤的安全感
- 不同 route 對同一個 env var 的 fallback 邏輯不一致

**建議修正：**
1. 用 Zod（已在專案中）建立 `src/lib/env.ts`，在 app 啟動時驗證所有 env
2. 移除沒人讀的 env var，或實作它（如果需要的話）
3. 統一 fallback 邏輯

**複雜度：** 簡單

---

## Minor 問題

### m-1：`docker-compose.yml` 和 `REDIS_URL` 是死碼

**現在的機制：**
`docker-compose.yml` 設定了 Postgres + Redis container，`.env.example` 有 `REDIS_URL`。但 `DEVELOPMENT.md` 說本地用 SQLite，而 `REDIS_URL` 在整個 `src/` 中從未被引用。

**為什麼是問題：** 誤導新開發者以為需要 Docker 和 Redis。

**建議修正：** 移除或標註為 "future/optional"。
**複雜度：** 簡單

---

### m-2：TypeScript 型別不完整——6 處 `as any` 強制轉型

**現在的機制：**
`src/types/next-auth.d.ts` augment 了 `Session.user` 但沒有 augment `JWT`，導致 `src/lib/auth.ts` 中有 6 個 `as any` cast。

**為什麼是問題：** 繞過 TypeScript 的型別安全，潛在的 runtime bug。

**建議修正：** 在 `next-auth.d.ts` 中同時 augment `JWT` interface。
**複雜度：** 簡單

---

### m-3：Accessibility 不完整

**現在的機制：**
- 整個 `src/` 只有約 24 個 `aria-label`
- `avatar-picker.tsx`：36 個圖標選項共用同一個 `alt` 文字
- Toast notification 沒有 `role="status"` 或 `aria-live`
- 進度條沒有 `role="progressbar"` 或 `aria-valuenow`
- 很多狀態依賴顏色區分（color-only），沒有文字替代
- Stage/Discipline badge 的說明只在 hover `title` 上——觸控裝置不可見

**建議修正：**
1. 系統性補上 aria 標籤
2. Toast 加 `aria-live="polite"`
3. 用 axe-core 或 Lighthouse 跑一次 accessibility audit

**複雜度：** 中等（需要逐一元件修改）

---

### m-4：不可逆操作的確認機制不一致

**現在的機制：**
- Seal：兩步點擊（arm → confirm），警告在第一次點擊後才出現
- Publish：只有一個 checkbox，沒有二次確認
- Visibility upgrade：用 `window.confirm()` 原生對話框（與其他 UI 風格不一致）

**建議修正：**
1. 統一使用自訂 Modal 做不可逆操作確認
2. 警告訊息在操作前就可見，不是在操作中才顯示
3. 高風險操作（publish）加 type-to-confirm

**複雜度：** 簡單

---

### m-5：Replication Form 要求使用者手動輸入 Thread ID

**現在的機制：**
`src/components/replication/ReplicationSection.tsx` 要求使用者手動貼上原始 Thread 的 ID 字串。

**為什麼是問題：** 普通使用者不知道 Thread ID 是什麼，也不知道去哪裡找。

**建議修正：** 改成搜尋框或下拉選單。
**複雜度：** 簡單

---

### m-6：AI 模型定價表 hardcode 且會過時

**現在的機制：**
`src/lib/ai/router.ts` hardcode 了模型名稱和 USD/token 費率。

**為什麼是問題：** AI API 定價頻繁變動，硬寫在 code 裡會靜默變成錯誤數字。

**建議修正：** 移到環境變數或外部 config。
**複雜度：** 簡單

---

### m-7：`next-auth` 仍在 v4（maintenance mode）

**現在的機制：**
`package.json` 使用 `next-auth ^4.24.0`。NextAuth v4 已進入 maintenance mode，v5（Auth.js）是活躍開發版本。

**為什麼是問題：** 不會再有新功能和主要 bug fix。

**建議修正：** 評估遷移到 Auth.js v5 的成本（API 有 breaking change）。
**複雜度：** 困難

---

### m-8：Nav 裡三個讓人分不清的連結——Sealed、Points、Credits

**現在的機制：**
`src/components/navbar.tsx` 頂層有三個獨立 nav item：Sealed、Points、Credits。

**為什麼是問題：** 三個概念相關但命名抽象，使用者不知道點哪個。

**建議修正：** 合併成一個 "My Account" 或 "Dashboard" 下拉，或加上 icon + 短說明。
**複雜度：** 簡單

---

## 商業模式合理性評估

### 付費功能（DP 經濟）的問題

1. **價值主張不清楚：** 使用者為什麼要花 DP 解鎖別人的內容？平台上還沒有足夠高品質的內容來讓付費有意義。
2. **DP 從哪來：** 使用者透過 like、comment、post 等動作賺取 DP，但沒有 rate limiting → 可以刷點，整個經濟系統形同虛設。
3. **免費 vs 付費界線：** 目前是作者自行決定內容是免費還是付費，但沒有任何品質篩選——任何人都可以把低品質內容標高價。
4. **10% 平台抽成：** 平台對虛擬點數的轉移抽 10%，但平台本身不提供任何增值服務來justify 這個抽成。
5. **沒有退款機制：** 購買後如果內容品質低，使用者沒有追索權。

### Seal/Reveal 的商業價值

1. **核心價值清楚：** 「證明你在某個時間點有某個想法」——這是學術界真正需要的
2. **但 legacy 流程會摧毀信任：** 使用者因為 C-1 的問題丟失內容後，不會再信任這個平台
3. **和專利/智財權的關係不清楚：** Seal 的法律效力沒有任何說明

---

## 總結與優先級建議

### 必須立即修的（Critical）
| # | 問題 | 預估工時 |
|---|------|----------|
| C-1 | Legacy Seal 不存內容 | 2-3 天 |
| C-2 | API 錯誤處理缺失 | 1-2 天 |
| C-3 | 登入無 rate limiting | 0.5 天 |

### 應該在下一個 sprint 修的（Major）
| # | 問題 | 預估工時 |
|---|------|----------|
| M-1 | DP 經濟系統決策 | 1 天（決策）+ 2-5 天（實作） |
| M-2 | 雙信用系統合併 | 2-3 天 |
| M-4 | Middleware 保護邏輯 | 0.5 天 |
| M-5 | 靜默失敗修復 | 1 天 |
| M-6 | Form 認知超載 | 2-3 天 |
| M-8 | 環境變數驗證 | 0.5 天 |

### 可以排到後面的（Minor）
| # | 問題 | 預估工時 |
|---|------|----------|
| M-3 | i18n 框架決策 | 視決策而定 |
| M-7 | Landing page 改善 | 1-2 天 |
| m-1 ~ m-8 | 各項小修 | 各 0.5-1 天 |

---

## 附錄：正面發現

審查過程中也發現一些做得好的地方：

1. **Prisma triggers 的不可變性保護** 設計嚴謹——`contentHash`、`sealed_at`、`credit` 相關欄位有 SQL trigger 防止竄改
2. **Access control 集中管理**（`src/lib/access-control.ts`）——沒有散落各處的權限檢查
3. **Schema 的 SQLite/Postgres 雙重相容性** 設計務實——Json 取代 native array/enum
4. **Zod 輸入驗證** 覆蓋完整
5. **Contribution 的 sealed 流程**（非 legacy 版）設計正確——content 存 server，hash 防竄改，trigger 防降級
6. **先前安全報告（2026-09-18）的 4 個 Critical** 已確認在現有 code 中修復

---

*此報告由 AI 輔助審查產出，建議搭配人工驗證後再做修改決策。*
