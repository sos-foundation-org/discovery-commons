# Discovery Commons 全面測試報告

**日期：** 2026-09-18  
**測試方法：** 程式碼審查 + 瀏覽器實測 (https://discovery-commons.vercel.app)  
**測試範圍：** 9 個模擬使用者角色、10 個核心功能流程  

---

## 測試角色總覽

| # | 角色 | 關注重點 |
|---|------|---------|
| 1 | 新手使用者 | 首次進站體驗、導航清晰度、引導流程 |
| 2 | 惡意使用者 | XSS、SQL injection、輸入邊界、API 濫用 |
| 3 | 手機使用者 | 響應式設計、觸控操作、小螢幕排版 |
| 4 | 非英語使用者 | i18n 翻譯完整度、語言切換、錯誤訊息 |
| 5 | 高頻使用者 | 併發操作、Rate limiting、競態條件 |
| 6 | 無障礙使用者 | 鍵盤導航、螢幕閱讀器、ARIA 標籤 |
| 7 | 分享連結使用者 | Deep linking、分享 token 安全、404 處理 |
| 8 | 老舊瀏覽器使用者 | JS 相容性、polyfill、graceful degradation |
| 9 | 付費/上鎖內容竊取者 | Sealed 內容洩漏、API 繞過、前端資料外洩 |

---

## 問題總表（按嚴重程度排列）

### 🔴 Critical（嚴重）

| # | 問題 | 發現角色 | 檔案位置 | 說明 |
|---|------|---------|---------|------|
| C-1 | 未授權使用者可列出私人/共享 threads | 惡意使用者 | `src/app/api/threads/route.ts:50` | `?visibility=private` 參數覆蓋 line 27 的 `where.visibility = "public"`，未登入者可查詢所有私人 threads 的標題、描述、建立者 |
| C-2 | 搜尋查詢覆蓋可見度過濾 | 惡意使用者 | `src/app/api/threads/route.ts:62-67` | `?q=keyword` 參數覆蓋 lines 32-47 的 `where.OR`（可見度 OR），已登入者搜尋時可看到所有人的私人 threads |
| C-3 | 翻譯端點洩漏 sealed/付費內容 | 竊取者 | `src/app/api/translate/route.ts:45-51` | 任何登入使用者可呼叫 `POST /api/translate`，傳入任意 `contributionId`，取得 sealed 或付費內容的完整翻譯，完全繞過存取控制 |
| C-4 | AI 審查端點暴露 sealed/付費內容 | 竊取者 | `src/app/api/v2/threads/[threadId]/ai/review/route.ts:38-58` | 端點將所有 contributions 的原始 content（含 sealed 和付費）送進 AI prompt，AI 回覆可能引用或改述受保護內容 |

### 🟠 Major（重大）

| # | 問題 | 發現角色 | 檔案位置 | 說明 |
|---|------|---------|---------|------|
| M-1 | Thread PATCH 無 Zod 驗證 | 惡意使用者 | `src/app/api/threads/[threadId]/route.ts:128-133` | 更新 thread 時無長度限制、類型檢查、欄位白名單，可提交超長標題或任意 JSON 作為 domainTags |
| M-2 | 排序欄位注入 | 惡意使用者 | `src/app/api/threads/route.ts:78` | `sort` 參數直接插入 `orderBy: { [sort]: order }`，可傳任意欄位名，造成 500 錯誤（已實測確認） |
| M-3 | 註冊端點無速率限制 | 惡意使用者 | `src/app/api/auth/register/route.ts` | 無 rate limiting、CAPTCHA 或 email 驗證，可批量建帳號 |
| M-4 | v2 credits 端點無權限檢查 | 竊取者 | `src/app/api/v2/threads/[threadId]/credits/route.ts` | 無 `getSession()` 呼叫，任何人可查看私人 threads 的貢獻者和 credit 分配 |
| M-5 | Seal + PATCH 競態條件 | 高頻使用者 | `seal/route.ts` + `[contributionId]/route.ts` | 併發的 seal 和 edit 請求可導致 sealed 內容與 hash 不一致（無行鎖或交易） |
| M-6 | AI 翻譯輸出未過濾 | 惡意使用者 | `src/app/api/translate/route.ts:93-108` | AI 回覆原封不動回傳並快取，若來源含 prompt injection payload，AI 可能回傳惡意 Markdown |
| M-7 | Contribution PATCH 無最大長度驗證 | 惡意使用者 | `src/app/api/contributions/[contributionId]/route.ts:120-121` | 只檢查 `content.length < 10`，無上限（create 有 10,000 字限制，edit 沒有） |
| M-8 | 無全域 error boundary | 新手使用者 | `src/app/` 目錄 | 無 `error.tsx` 或 `global-error.tsx`，未預期錯誤會顯示 Next.js 預設錯誤頁 |

### 🟡 Minor（輕微）

| # | 問題 | 發現角色 | 檔案位置 | 說明 |
|---|------|---------|---------|------|
| m-1 | 空白可繞過最低字數限制 | 惡意使用者 | `src/lib/validations.ts:33` | `z.string().min(10)` 計入空白字元，10 個空格可通過驗證 |
| m-2 | domainTags 個別字串無長度限制 | 惡意使用者 | `src/lib/validations.ts:26` | `z.array(z.string())` 每個標籤可無限長 |
| m-3 | Embed block 不驗證 URL scheme | 惡意使用者 | `src/components/contribution/embed-block.tsx:36-44` | 非 YouTube/Vimeo URL 直接作為 `<a href>`，`javascript:` scheme 可能被點擊 |
| m-4 | 404 頁面未翻譯 | 非英語使用者 | `src/app/not-found.tsx` | "Page not found" 等文字硬編碼英文 |
| m-5 | 大量 UI 字串未國際化 | 非英語使用者 | 多個 component 檔案 | "Hide comments"、"Loading..."、"Post Comment"、"Post anonymously" 等未在 i18n 字典中 |
| m-6 | 錯誤訊息全為英文 | 非英語使用者 | 所有 API routes | "Unauthorized"、"Validation failed" 等永遠是英文 |
| m-7 | contribution type 名稱未翻譯 | 非英語使用者 | threads 列表頁 | 切換繁中後 "Question"、"Hypothesis" 仍顯示英文 |
| m-8 | 表單 `<label>` 未綁定 `<input>` | 無障礙使用者 | `threads/new/page.tsx:115-138`、`contribution-form.tsx:537`、`thread-filters.tsx:83-124` | `<label>` 無 `htmlFor`，`<input>` 無 `id`，螢幕閱讀器無法關聯 |
| m-9 | 可點擊 Badge 非 button 元素 | 無障礙使用者 | `threads/new/page.tsx:180-188`、`contribution-form.tsx:258-330` | `<Badge onClick>` 渲染為 `<div>`，無 `role="button"`、`tabIndex`、`onKeyDown` |
| m-10 | 通知鈴鐺無 accessible name | 無障礙使用者 | `src/components/navbar.tsx:135-154` | `<Link>` 只含 SVG 圖示，無 `aria-label` |
| m-11 | 搜尋框和留言框無 label | 無障礙使用者 | `thread-filters.tsx:52`、`comment-section.tsx:182` | 只有 `placeholder`，無 `<label>` 或 `aria-label` |
| m-12 | Publish 對話框無 focus trap | 無障礙使用者 | `src/components/contribution/publish-button.tsx:79-150` | 開啟後焦點未移入、Tab 可逃出、Esc 無法關閉 |
| m-13 | 手機選單無外部點擊/Esc 關閉 | 手機使用者 | `src/components/navbar.tsx` | 手機選單只能透過漢堡按鈕或連結點擊關閉 |
| m-14 | 手機選單無動畫過渡 | 手機使用者 | `src/components/navbar.tsx` | 選單瞬間出現/消失，體驗不佳 |
| m-15 | 極小文字（10-11px） | 手機使用者 | `seal-button.tsx:45,79`、`reveal-button.tsx:83` | 低於建議最小 12px |
| m-16 | Pricing GET 端點無權限 | 竊取者 | `src/app/api/contributions/[contributionId]/pricing/route.ts:27-47` | 任何人可查詢 pricing metadata 和 outlineBreak 位置（洩漏元資料但非內容） |
| m-17 | Replications GET 端點無權限 | 竊取者 | `src/app/api/v2/threads/[threadId]/replications/route.ts:8-29` | 洩漏私人 threads 的 replication 紀錄 |
| m-18 | 非阻塞 Prisma 寫入靜默失敗 | 高頻使用者 | 多個 API routes | `.catch(() => {})` 模式吞掉通知、獎勵、快取寫入的錯誤，完全無日誌 |
| m-19 | 無 Cache-Control headers | 竊取者 | 所有 API routes | 無顯式 `Cache-Control: private, no-store`，CDN 配置錯誤時可能快取含使用者特定資料的回應 |
| m-20 | Access-rule upsert 空字串 vs null 不一致 | 高頻使用者 | `src/app/api/access-rules/route.ts:89` | `where` 用空字串、`create` 用 null，可能永遠不 match，造成重複規則 |
| m-21 | ReactMarkdown 未加 rehype-sanitize | 惡意使用者 | `src/components/contribution/contribution-content.tsx:61-63` | 目前安全（react-markdown v6+ 不渲染 raw HTML），但缺乏縱深防禦 |
| m-22 | 手機首頁英雄區下方有大片空白 | 手機使用者 | 首頁（瀏覽器實測） | 手機視圖從 hero 到下一區塊之間有不正常的大面積空白 |

---

## 各角色測試詳情

### 角色 1：新手使用者 👤

**測試流程：** 首頁 → 導航 → 建立 thread → 了解 seal/reveal

| 項目 | 結果 | 備註 |
|------|------|------|
| 首頁載入 | ✅ 正常 | 3 秒內完全載入 |
| 「How It Works」區塊 | ✅ 清楚 | 四步驟流程說明足夠 |
| 未登入點「New Thread」 | ✅ 重導至登入頁 | middleware 正確攔截 |
| 瀏覽公開 threads | ✅ 正常 | 3 個 threads 正確顯示 |
| 404 頁面 | ⚠️ 可改善 | 有正確的 404 頁，但未翻譯 (m-4) |
| 無 error boundary | ❌ 缺失 | 未預期錯誤會顯示 Next.js 預設畫面 (M-8) |

### 角色 2：惡意使用者 🏴‍☠️

**測試流程：** 嘗試各種注入和邊界輸入

| 攻擊向量 | 結果 | 備註 |
|----------|------|------|
| `?visibility=private` API 呼叫 | ⚠️ 程式碼漏洞存在 | 實測返回 0 筆（無私人 threads），但邏輯錯誤確認 (C-1) |
| `?sort=passwordHash` API 呼叫 | ❌ 500 錯誤 | Prisma 擋住但回 500，無友善處理 (M-2) |
| XSS via Markdown | ✅ 安全 | react-markdown 不渲染 raw HTML |
| 空白繞過最低字數 | ⚠️ 可繞過 | 10 個空格通過 min(10) 驗證 (m-1) |
| 超長 domainTags | ⚠️ 無限制 | 個別 tag 無長度限制 (m-2) |
| `javascript:` URL in embed | ⚠️ 潛在風險 | 不驗證 URL scheme (m-3) |
| Thread PATCH 無驗證 | ❌ 可利用 | 可提交超長標題或任意 JSON (M-1) |
| 批量註冊 | ❌ 可利用 | 無 rate limit 或 CAPTCHA (M-3) |

### 角色 3：手機使用者 📱

**測試流程：** 375x812 視口，測試所有主要頁面

| 項目 | 結果 | 備註 |
|------|------|------|
| 首頁載入 | ⚠️ 有問題 | Hero 區下方有大片不正常空白 (m-22) |
| 漢堡選單 | ⚠️ 可改善 | 無外部點擊關閉、無動畫 (m-13, m-14) |
| Threads 列表 | ✅ 正常 | 單欄佈局，卡片正確堆疊 |
| 文字可讀性 | ⚠️ 部分太小 | seal/reveal 按鈕文字 10-11px (m-15) |
| 搜尋和篩選 | ✅ 正常 | 表單元素適配手機寬度 |
| Stage 進度條 | ⚠️ 可改善 | 可橫向滑動但無視覺提示 |

### 角色 4：非英語使用者 🌏

**測試流程：** 切換至繁體中文，測試所有頁面

| 項目 | 結果 | 備註 |
|------|------|------|
| 語言切換 | ✅ 正常 | localStorage 持久化，重新整理後保留 |
| 主要 UI 翻譯 | ⚠️ 不完整 | 頁面標題翻譯正確，但大量元件字串未翻譯 (m-5) |
| Contribution types | ❌ 未翻譯 | "Question"、"Hypothesis" 等仍顯示英文 (m-7) |
| 錯誤訊息 | ❌ 全英文 | 所有 API 錯誤訊息硬編碼英文 (m-6) |
| 404 頁面 | ❌ 未翻譯 | (m-4) |
| zh-CN 字典遺漏 | ⚠️ 部分 | `general.seeThread` 在簡中字典缺失 |

### 角色 5：高頻使用者 ⚡

**測試流程：** 快速連續操作，測試併發和一致性

| 項目 | 結果 | 備註 |
|------|------|------|
| 無 rate limiting | ❌ 危險 | 所有 API 端點完全無速率限制 |
| Seal + Edit 競態 | ❌ 可利用 | 併發請求可造成 sealed 內容與 hash 不一致 (M-5) |
| Purchase 端點 | ✅ 安全 | 使用 `$transaction` 防止 TOCTOU |
| Double-reveal | ✅ 安全 | 冪等操作，不會造成問題 |
| 靜默失敗的寫入 | ⚠️ 隱患 | 通知、獎勵等非阻塞操作失敗完全無日誌 (m-18) |

### 角色 6：無障礙使用者 ♿

**測試流程：** 鍵盤導航、螢幕閱讀器相容性

| 項目 | 結果 | 備註 |
|------|------|------|
| 表單 label 關聯 | ❌ 大量缺失 | `<label>` 未綁定 `<input>` (m-8) |
| 可點擊 Badge | ❌ 不可及 | 非 button 元素，鍵盤無法觸及 (m-9) |
| 通知鈴鐺 | ❌ 無名稱 | (m-10) |
| Seal/Reveal 按鈕 | ✅ 可達 | 使用 `<Button>` 元件 |
| Publish 對話框 | ❌ 無 focus trap | (m-12) |
| 搜尋框 | ❌ 無 label | (m-11) |
| Focus 樣式 | ⚠️ 不一致 | UI 元件有，自訂 button 無 |
| 顏色對比 | ✅ 大致通過 | WCAG AA 7.3:1 |

### 角色 7：分享連結使用者 🔗

**測試流程：** 收到分享連結，測試 deep linking

| 項目 | 結果 | 備註 |
|------|------|------|
| 有效分享連結 | ✅ 正常 | 正確顯示 contribution 內容 |
| 無效分享 token | ✅ 404 | 正確處理（已實測） |
| Sealed 內容分享 | ✅ 安全 | 分享頁正確只顯示 hash |
| 付費內容分享 | ✅ 安全 | 分享頁只顯示 outline |
| Token 安全性 | ✅ 安全 | `crypto.randomBytes(16)` 128-bit 隨機 |
| Hash 驗證連結 | ✅ 正常 | 無效 hash 有友善錯誤提示（已實測） |

### 角色 8：老舊瀏覽器使用者 🖥️

**測試流程：** 程式碼審查 JS 相容性

| 項目 | 結果 | 備註 |
|------|------|------|
| Next.js SSR | ✅ 基本安全 | 伺服器端渲染提供基本內容 |
| Client components | ⚠️ 依賴現代 API | `localStorage`、`crypto.subtle` 等需現代瀏覽器 |
| Polyfills | ⚠️ 無配置 | 無 `browserslist` 或 polyfill 配置 |
| CSS 變數 | ⚠️ 需 IE 以上 | Dark mode 依賴 CSS 自訂屬性 |
| Tailwind CSS | ✅ 編譯後安全 | 產出標準 CSS |

### 角色 9：付費/上鎖內容竊取者 🔓

**測試流程：** 嘗試各種方式偷看 sealed 和付費內容

| 攻擊向量 | 結果 | 備註 |
|----------|------|------|
| 前端 DOM 檢查 | ✅ **安全** | 伺服器端截斷內容，前端 DOM 不含完整 sealed 內容 |
| API 直接呼叫 GET | ✅ **安全** | `checkContributionAccess()` 正確 mask 內容 |
| **翻譯端點繞過** | 🔴 **漏洞！** | `POST /api/translate` 無權限檢查，可取得任何 contribution 完整翻譯 (C-3) |
| **AI 審查端點洩漏** | 🔴 **漏洞！** | AI review 將所有 content 送入 prompt，回覆可能包含 sealed 內容 (C-4) |
| URL 直接存取 | ✅ **安全** | 伺服器元件對每個 contribution 逐一檢查權限 |
| Network tab 檢查 | ✅ **安全** | 回應 payload 只含截斷後的內容 |
| Supabase RLS | ⚠️ **設計如此** | 無 RLS（Prisma 繞過），靠應用層控制——目前有效但缺乏縱深 |
| 分享連結 | ✅ **安全** | 分享頁正確隱藏 sealed 內容、限制 gated 內容 |
| CDN/瀏覽器快取 | ⚠️ **潛在風險** | 無明確 `Cache-Control` headers (m-19) |
| Seal-Reveal 時序 | ✅ **安全** | 原子操作，無過渡窗口 |
| `maskContributionForViewer()` | ✅ **安全** | 真正設 `content: null`，非僅設旗標 |

---

## 邊界案例清單

### 輸入邊界

1. 10 個空格作為 thread title/contribution content → 通過驗證但無實質內容
2. 超長字串（>10,000 字元）作為 thread PATCH 的 title → 無限制
3. 超長 domainTag（每個 tag 百萬字元）→ 無限制
4. 特殊字元 `<script>alert(1)</script>` 作為 Markdown 內容 → 安全（不渲染 HTML）
5. `javascript:alert(1)` 作為 embed URL → 可能被渲染為可點擊連結
6. 非法 discipline 值作為 thread 建立參數 → 需測試是否被 Prisma 或驗證擋住
7. 空物件 `{}` 作為 PATCH body → 空更新，應無副作用但未驗證
8. 極大 `page` 值（如 999999999）→ SQL OFFSET 可能很慢

### 並發邊界

9. 同時 seal 和 edit 同一 contribution → 競態條件，hash 可能不一致
10. 同一毫秒建立兩個相同內容的 contribution → 相同 hash，不同 ID
11. 同時 reveal 兩次 → 冪等，安全
12. 同時 purchase 兩次 → $transaction 保護，安全

### 權限邊界

13. `GET /api/threads?visibility=private` 未登入 → 可列出私人 threads
14. `GET /api/threads?q=keyword` 已登入 → 搜尋可繞過可見度過濾
15. `POST /api/translate` 對 sealed contribution → 可取得翻譯
16. `GET /api/v2/threads/[id]/credits` 無登入 → 可查看 credit 分配
17. `GET /api/contributions/[id]/pricing` 無登入 → 可查看定價元資料

### i18n 邊界

18. 切換語言後重新整理 → 保留選擇（✅ 正常）
19. 右到左語言（如阿拉伯文）→ 未支援
20. 含 emoji 或特殊 Unicode 的內容 → 應正常（React/Prisma 支援 UTF-8）

---

## 修復建議（按優先順序）

### P0：立即修復（安全漏洞）

#### 1. 修復 Thread API 可見度過濾繞過 (C-1, C-2)

**檔案：** `src/app/api/threads/route.ts`

**問題：** Line 50 的 `if (visibility) where.visibility = visibility` 覆蓋了 line 27 的安全預設值；line 62 的 `where.OR = [...]` 覆蓋了 lines 32-47 的可見度 OR。

**修復：**
```typescript
// Line 50: 改為只允許白名單內的可見度過濾，且不能用於擴大未授權者的存取
if (visibility) {
  const allowed = ['public', 'private', 'shared'];
  if (!allowed.includes(visibility)) {
    return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
  }
  // 對未登入者，只允許 public
  if (!session && visibility !== 'public') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // 對已登入者，加入可見度限制但不覆蓋 OR
  if (where.OR) {
    where.AND = [{ OR: where.OR }, { visibility }];
    delete where.OR;
  } else {
    where.visibility = visibility;
  }
}

// Lines 62-67: 搜尋也不能覆蓋 OR
if (q) {
  const searchOR = [
    { title: { contains: q } },
    { description: { contains: q } },
  ];
  if (where.OR) {
    // 把搜尋條件加入現有 OR 而非覆蓋
    where.AND = [...(where.AND || []), { OR: searchOR }];
  } else if (where.AND) {
    where.AND.push({ OR: searchOR });
  } else {
    where.OR = searchOR;
  }
}
```

#### 2. 翻譯端點加入存取控制 (C-3)

**檔案：** `src/app/api/translate/route.ts`

**修復：** 在取得 contribution 後加入：
```typescript
import { checkContributionAccess } from "@/lib/access-control";

// 在 fetch contribution 之後：
const access = await checkContributionAccess(contributionId, session.user.id, prisma);
if (!access.canViewContent) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

#### 3. AI 審查端點過濾受保護內容 (C-4)

**檔案：** `src/app/api/v2/threads/[threadId]/ai/review/route.ts`

**修復：** 過濾 contributions，排除 sealed 和付費且未購買的：
```typescript
// 替換 lines 38-45 的 contributions query
contributions: {
  where: {
    visibility: { not: "sealed" },
    // 也過濾付費內容，除非請求者已購買
  },
  orderBy: { createdAt: "asc" },
  select: { type: true, content: true, visibility: true, accessMode: true },
},
```

#### 4. 排序欄位加白名單 (M-2)

**檔案：** `src/app/api/threads/route.ts`

**修復：**
```typescript
const allowedSorts = ['updatedAt', 'createdAt', 'title'];
const allowedOrders = ['asc', 'desc'];
const safeSort = allowedSorts.includes(sort) ? sort : 'updatedAt';
const safeOrder = allowedOrders.includes(order) ? order : 'desc';
// 使用 safeSort, safeOrder
```

### P1：儘快修復（功能缺陷）

#### 5. Thread PATCH 加 Zod 驗證 (M-1)

**檔案：** `src/app/api/threads/[threadId]/route.ts`

建立 `updateThreadSchema` 並在 PATCH handler 中使用 `.safeParse(body)`。

#### 6. Contribution PATCH 加最大長度 (M-7)

**檔案：** `src/app/api/contributions/[contributionId]/route.ts`

```typescript
if (!content || content.length < 10 || content.length > 10000) {
  return NextResponse.json({ error: "Content must be 10-10,000 chars" }, { status: 400 });
}
```

#### 7. 加入全域 error boundary (M-8)

建立 `src/app/error.tsx` 和 `src/app/global-error.tsx`。

#### 8. v2 credits 端點加權限檢查 (M-4)

**檔案：** `src/app/api/v2/threads/[threadId]/credits/route.ts`

加入 thread 可見度檢查，private/shared threads 需要驗證請求者身分。

### P2：中期改善（體驗與 a11y）

#### 9. 表單 label 綁定 (m-8)
所有 `<label>` 加 `htmlFor`，所有 `<input>`/`<select>` 加 `id`。

#### 10. 可點擊 Badge 改用 button (m-9)
```tsx
<button
  role="button"
  className={badgeClasses}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  {label}
</button>
```

#### 11. 通知鈴鐺加 aria-label (m-10)
```tsx
<Link href="/notifications" aria-label="Notifications">
```

#### 12. 完善 i18n 覆蓋率 (m-5, m-6, m-7)
將所有硬編碼英文字串加入 `src/lib/i18n.ts` 的三個字典。

#### 13. 手機選單加 Esc 關閉和外部點擊 (m-13)
使用 `useEffect` 監聽 Escape 鍵和 document 點擊事件。

#### 14. 加入 rehype-sanitize (m-21)
```typescript
import rehypeSanitize from 'rehype-sanitize';
<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
```

### P3：長期改善

#### 15. 實作 rate limiting (M-3)
考慮 Vercel Edge Middleware + `@upstash/ratelimit`。

#### 16. 加入 Cache-Control headers (m-19)
所有回傳使用者特定資料的 API 端點加 `Cache-Control: private, no-store`。

#### 17. 驗證空白輸入 (m-1)
```typescript
z.string().trim().min(10)
```

#### 18. 限制 domainTag 長度 (m-2)
```typescript
z.array(z.string().max(100)).min(1).max(5)
```

#### 19. Embed URL scheme 白名單 (m-3)
```typescript
if (!/^https?:\/\//.test(url)) return <span>Invalid URL</span>;
```

---

## 測試覆蓋率總結

| 測試流程 | 覆蓋狀態 | 發現問題數 |
|---------|---------|-----------|
| 首頁載入和導航 | ✅ 完整 | 2 |
| 語言切換 | ✅ 完整 | 5 |
| 建立新 thread | ✅ 程式碼審查 | 4 |
| 貢獻/回覆 | ✅ 程式碼審查 | 3 |
| 搜尋和篩選 | ✅ 程式碼+實測 | 2 |
| Seal/Reveal 機制 | ✅ 完整 | 3 |
| 分享功能 | ✅ 完整 | 0 |
| 登入/登出 | ✅ 程式碼審查 | 1 |
| 404 和錯誤頁面 | ✅ 實測 | 2 |
| 隱藏學科路由 | ✅ 程式碼審查 | 0 |
| **付費/上鎖內容保護** | ✅ **完整** | **4** |

**總計：** 4 Critical + 8 Major + 22 Minor = **34 個問題**

---

*報告產出：Claude Opus 4.6 — 程式碼審查 + 瀏覽器實測*
