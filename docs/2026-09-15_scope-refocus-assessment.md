# Discovery Commons 改版評估報告：聚焦低社會風險角色

**日期：** 2026-09-15  
**撰寫：** CC（chief-coordinator）  
**狀態：** 待 Ping 確認角色清單後再實作  
**language:** traditional-chinese  
**tiers_used:** High（跨域架構決策）

---

## 一、現況摘要

Discovery Commons 目前是**角色無關（role-agnostic）**的開放研究平台。程式碼中不存在「naturalist」「policy maker」等使用者角色定義。最接近角色概念的是 **9 個學科領域（disciplines）**，定義於 `src/lib/types.ts`：

| 代碼 | 顯示名稱 | 說明 |
|---|---|---|
| `life_sciences` | Life Sciences | 生命科學 |
| `physical_sciences` | Physical Sciences | 物理科學 |
| `math_cs` | Math & CS | 數學與資訊科學 |
| `earth_environment` | Earth & Environment | 地球與環境科學 |
| `social_sciences` | Social Sciences | 社會科學 |
| `engineering` | Engineering | 工程 |
| `medicine_health` | Medicine & Health | 醫學與健康 |
| `humanities` | Humanities | 人文學科 |
| `interdisciplinary` | Interdisciplinary | 跨領域 |

首頁、關於頁面、導航列目前呈現的是「泛科學」定位（The Antilibrary of Science），沒有針對特定使用者類型的訊息。

---

## 二、社會風險分析：建議保留 vs. 隱藏

### 分析框架

Ping 的判斷標準：**「若這個領域的研究結論出錯或被誤用，對社會造成的動盪程度」**。

核心區分：
- **低風險**＝錯誤主要在學術社群內自我修正，不會直接改變政策、影響公眾健康或安全
- **高風險**＝錯誤可能直接影響政策制定、公眾健康行為、基礎設施安全、或引發社會爭議

### 🟢 建議保留（前台顯示）— 低社會風險

| 學科 | 對應角色 | 風險評估理由 |
|---|---|---|
| **Life Sciences** | 博物學家、生態學家、分類學家 | 野外觀察、物種分類、生態研究。錯誤由同行修正，不直接影響政策或公眾行為。Ping 明確指定的 naturalist 屬此類。 |
| **Physical Sciences** | 理論物理學家、天文學家、材料科學家 | 基礎物理、天文、理論模型。錯誤在學術體系內修正。Ping 明確指定的 theoretical scientist 屬此類。 |
| **Math & CS** | 數學家、理論計算機科學家 | 純數學、演算法理論。錯誤影響範圍限於學術。 |
| **Earth & Environment** | 地質學家、氣候科學家、海洋學家 | 地質觀測、古氣候重建、野外測量。雖然氣候政策是敏感議題，但**基礎觀測數據**本身屬低風險——觀測就是觀測。 |
| **Interdisciplinary** | 跨域研究者 | 連接上述低風險領域的橋樑。保留以支持跨域合作。 |

### 🔴 建議隱藏（從前台導航/下拉選單移除，程式碼保留）— 較高社會風險

| 學科 | 風險評估理由 |
|---|---|
| **Social Sciences** | 研究結論可直接影響政策（福利、刑事司法、教育政策）、觸發身份政治爭議、被政治力量選擇性引用。心理學再現性危機已證明此領域特別脆弱。 |
| **Medicine & Health** | 醫學研究結論直接影響臨床決策和公眾健康行為。錯誤的醫學「發現」可致人死亡（參考 Andrew Wakefield 疫苗事件）。在缺乏 peer review 基礎設施的原型階段，開放醫學研究尤其危險。 |
| **Engineering** | 工程研究結論若被直接應用（結構計算、安全參數），錯誤可導致基礎設施失敗。但若限於學術層面（理論力學、材料模型），風險較低。**邊界案例——可考慮保留，請 Ping 決定。** |
| **Humanities** | 風險較低但不符合平台當前「科學」定位。人文學科（文學批評、歷史詮釋、哲學）屬詮釋性而非實證性研究，與平台的 Q→H→D→S→I 工作流程不完全契合。**邊界案例——可考慮保留，請 Ping 決定。** |

### ⚠️ 需 Ping 決定的邊界案例

1. **Engineering**：若定位為「理論工程 / 學術研究」則低風險；若包含「應用工程設計」則高風險。建議：暫時隱藏，保守處理。
2. **Humanities**：社會風險低，但與平台的實證科學流程不完全匹配。建議：暫時隱藏，但若 Ping 認為人文學者是目標使用者可保留。
3. **Earth & Environment**：雖然「氣候」一詞政治敏感，但基礎科學觀測本身是低風險的。建議：保留，但可在首頁文案中強調「基礎觀測」而非「政策影響」。

---

## 三、改版方案

### 策略：環境變數 + UI 過濾（不刪碼、不改架構）

最小改動方案：

1. **新增環境變數** `NEXT_PUBLIC_VISIBLE_DISCIPLINES`  
   - 預設值：`life_sciences,physical_sciences,math_cs,earth_environment,interdisciplinary`  
   - 型別：逗號分隔的 discipline 代碼  
   - 作用：控制前台 UI 中顯示哪些學科選項

2. **新增 helper function** `getVisibleDisciplines()`  
   - 位置：`src/lib/types.ts`  
   - 邏輯：讀取環境變數，回傳過濾後的 discipline 清單；若環境變數未設則回傳全部（向後相容）  
   - 已有的 `DISCIPLINES` 常數和 `DISCIPLINE_CONFIG` 完全不動

3. **UI 層替換**：所有顯示 discipline 下拉選單/篩選器的地方，改用 `getVisibleDisciplines()` 而非 `DISCIPLINES`

4. **首頁文案調整**：更新 hero 區和 testimonials 以反映「基礎科學 / 博物學 / 理論科學」定位

5. **導航結構**：不改。所有路由保留，所有頁面可直接存取。隱藏的學科只是從下拉選單消失，不是從系統移除。

### 為什麼不用其他方案

| 方案 | 不採用原因 |
|---|---|
| 刪除 discipline 代碼 | 違反 P-2（不刪檔） |
| 加 `/archive/` 路由 | 過度工程，discipline 不是路由 |
| Feature flag 庫 | 原型階段不需要，一個環境變數足夠 |
| 資料庫 migration | 不需要改 schema，discipline 存在 Thread model 的 `disciplines` JSON 欄位中 |

---

## 四、具體要改的檔案

### 4.1 `src/lib/types.ts` — 新增 helper（~10 行）

```typescript
// 新增：
export function getVisibleDisciplines(): readonly Discipline[] {
  const env = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_VISIBLE_DISCIPLINES
    : process.env.NEXT_PUBLIC_VISIBLE_DISCIPLINES;
  if (!env) return DISCIPLINES; // 向後相容：未設則全部顯示
  const visible = env.split(',').map(s => s.trim()) as Discipline[];
  return DISCIPLINES.filter(d => visible.includes(d));
}
```

### 4.2 Discipline 下拉選單 / 篩選器

需 grep 找出所有 import `DISCIPLINES` 的檔案，將顯示用途改為 `getVisibleDisciplines()`。預期涉及：

| 檔案 | 用途 | 改法 |
|---|---|---|
| `src/app/threads/new/page.tsx` 或對應 form component | 建立新 thread 時的學科選單 | 選項來源改用 `getVisibleDisciplines()` |
| `src/app/threads/page.tsx` | 瀏覽 threads 時的學科篩選 | 篩選器選項改用 `getVisibleDisciplines()` |
| `src/components/thread/thread-form.tsx`（若存在） | Thread 編輯表單 | 同上 |

**注意：** 顯示已建立 thread 的學科 badge 不應過濾——只過濾「可選」清單。已有的 `medicine_health` thread 仍正常顯示其 badge。

### 4.3 `src/app/page.tsx` — 首頁文案調整

| 區塊 | 現有內容 | 建議修改 |
|---|---|---|
| Hero badge | "Open-source research platform" | "Open research platform for the natural and theoretical sciences"（或類似） |
| Hero 標題 | "The Antilibrary of Science" | 保留不變（已很適合） |
| Hero 副標題 | 泛科學描述 | 加入「for naturalists, theorists, and academic scientists」的定位語 |
| Testimonials | Dr. A (Theoretical Physics), Dr. B (Ecology), C. Student (Neuroscience) | Neuroscience 改為更符合定位的領域（如 Marine Biology PhD Candidate 或 Mathematics PhD Candidate） |
| Stats label | "Researchers" | 可改為 "Scientists"（可選） |

### 4.4 `src/app/about/page.tsx` — 關於頁面

| 區塊 | 改法 |
|---|---|
| Hero 段落 | 加入平台聚焦基礎科學的說明，但不刪除原有的泛科學描述 |
| Seven Stages 範例 | 已使用鳥類歌聲 + 生態的範例，與 naturalist 定位高度吻合，**不需改** |

### 4.5 `.env.example` 和 `.env.local`

```
# Scope: which disciplines are shown in the UI (comma-separated).
# Omit or leave empty to show all.
NEXT_PUBLIC_VISIBLE_DISCIPLINES=life_sciences,physical_sciences,math_cs,earth_environment,interdisciplinary
```

### 4.6 不需要改的檔案（確認清單）

- `src/lib/types.ts` 的 `DISCIPLINES` / `DISCIPLINE_CONFIG` — **不改**
- `src/prisma/schema.prisma` — **不改**
- `src/lib/access-control.ts` — **不改**
- `src/components/navbar.tsx` — **不改**（導航結構不變）
- 所有 API routes — **不改**（後端不過濾學科）
- 所有 Phase-2 dormant code — **不改**

---

## 五、改動量估計

| 項目 | 估計行數 |
|---|---|
| `types.ts` 新增 helper | ~10 行 |
| Discipline 下拉替換（2-3 個檔案） | 每檔 ~2 行 |
| 首頁文案 | ~15 行 |
| 關於頁文案 | ~5 行 |
| `.env.example` | ~3 行 |
| **總計** | **~40 行改動** |

風格、佈局、色彩完全不變。

---

## 六、待 Ping 決定

1. **保留清單確認**：Life Sciences, Physical Sciences, Math & CS, Earth & Environment, Interdisciplinary — 同意？
2. **Engineering**：隱藏還是保留？
3. **Humanities**：隱藏還是保留？
4. **首頁文案方向**：「for naturalists, theorists, and academic scientists」這個定位語方向可以嗎？或有其他偏好？
5. **Neuroscience testimonial**：改成什麼領域？建議 Marine Biology 或 Mathematics。
6. **Earth & Environment** 是否需要在文案中刻意避開「氣候」？

確認後即可執行，預計 1 小時內完成所有改動 + 驗證 build。

---

*本報告由 research-director 初步分析、polymath 提供風險框架、CC 彙整。*  
*審查狀態：初稿，待 review-board-chair 審查。*
