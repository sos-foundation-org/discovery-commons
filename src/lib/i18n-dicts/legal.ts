// Legal pages: /legal/terms, /legal/privacy, /legal/cla.
// Owned by one area — add keys here (all three locales), namespaced `legal.*`.
// `{name}` placeholders are replaced by links / <strong> / <code> in the page
// components (see src/app/legal/rich.tsx). The English text is authoritative.
import type { DictSet } from "./types";

export const legal: DictSet = {
  en: {
    // ── Shared ──
    "legal.effectiveDate": "Effective date: July 2, 2026",
    "legal.zhNotice": "",
    "legal.link.terms": "Terms of Service",
    "legal.link.privacy": "Privacy Policy",
    "legal.link.cla": "Contributor License",
    "legal.link.about": "About",

    // ── Terms of Service ──
    "legal.terms.title": "Terms of Service",
    "legal.terms.intro":
      "Discovery Commons is a non-commercial research prototype operated by the Sustainability of Sustainability Foundation, a 501(c)(3) public charity. By using it you agree to these terms.",
    "legal.terms.alpha.h": "Alpha status",
    "legal.terms.alpha.p":
      "This is an early prototype provided {asIs}, without warranties of any kind. Features may change or break, and data may be reset during the alpha period. Do not rely on it as your only record of important work.",
    "legal.terms.alpha.asIs": "as-is",
    "legal.terms.content.h": "Your content",
    "legal.terms.content.p":
      "You retain ownership of the content you post. By posting, you grant the Foundation a non-exclusive license to store, display, and index that content in accordance with the visibility and license settings you choose. Each contribution carries a license you select (CC BY 4.0 by default for public content, or All Rights Reserved for gated content). The Foundation exercises only the rights your chosen license grants — nothing more. See the {link} for full details, including irrevocability of Creative Commons licenses.",
    "legal.terms.hash.h": "Priority hashes are evidence, not legal claims",
    "legal.terms.hash.p":
      "Each contribution receives a SHA-256 hash and server timestamp. This provides {evidence} that specific content existed at a recorded time. It is {not} a legal patent-priority claim, a notarization, or a trusted third-party timestamp. For formal intellectual-property protection, consult a qualified attorney.",
    "legal.terms.hash.evidence": "evidence",
    "legal.terms.hash.not": "not",
    "legal.terms.use.h": "Acceptable use",
    "legal.terms.use.p":
      "You agree to follow the Community Covenant described on the {link} page: contribute in good faith, credit others, and do not post unlawful, harmful, or infringing material. We may remove content or suspend accounts that violate these terms.",
    "legal.terms.liability.h": "Limitation of liability",
    "legal.terms.liability.p":
      "To the maximum extent permitted by law, the Foundation is not liable for any indirect or consequential damages arising from use of this prototype, including loss of data or loss of priority.",
    "legal.terms.law.h": "Governing law & changes",
    "legal.terms.law.p":
      "These terms are governed by the laws of the Commonwealth of Massachusetts, USA. We may update them; material changes will be noted on this page.",
    "legal.terms.seeAlso": "See also our {link}.",

    // ── Privacy Policy ──
    "legal.privacy.title": "Privacy Policy",
    "legal.privacy.intro":
      "Discovery Commons is a non-commercial research prototype operated by the Sustainability of Sustainability Foundation, a 501(c)(3) public charity. This policy describes what we collect and why. It will be reviewed before any general-availability launch.",
    "legal.privacy.collect.h": "What we collect",
    "legal.privacy.collect.account.label": "Account data",
    "legal.privacy.collect.account":
      "{label} — when you sign in with Google we receive your name, email address, and profile picture (basic OAuth scopes: {openid}, {email}, {profile}). We do not access your Google Drive, contacts, or any other data.",
    "legal.privacy.collect.content.label": "Content you create",
    "legal.privacy.collect.content":
      "{label} — threads, contributions, comments, and the visibility/sharing settings you choose for each.",
    "legal.privacy.collect.integrity.label": "Integrity metadata",
    "legal.privacy.collect.integrity":
      "{label} — a SHA-256 hash and server timestamp are recorded for every contribution (this is the core anti-scooping feature).",
    "legal.privacy.use.h": "How we use it",
    "legal.privacy.use.operate": "To operate the platform and attribute your contributions to you.",
    "legal.privacy.use.visibility":
      "To enforce the visibility you choose (private, shared, public, or sealed) — see the {link}.",
    "legal.privacy.use.visibilityLink": "visibility model",
    "legal.privacy.use.noSell":
      "We do {not} sell your data, show ads, or run third-party advertising/analytics trackers.",
    "legal.privacy.use.not": "not",
    "legal.privacy.where.h": "Where it lives",
    "legal.privacy.where.p":
      "Data is stored in Supabase (PostgreSQL), encrypted at rest and in transit. Authentication uses a session cookie only; we do not use tracking cookies.",
    "legal.privacy.choices.h": "Your choices",
    "legal.privacy.choices.visibility":
      "You control the visibility of everything you post. Note that once content is made public it may have been seen or copied, so visibility changes are not fully reversible.",
    "legal.privacy.choices.deletion":
      "You may request access to, or deletion of, your account data by contacting us. Some contribution hashes/timestamps may be retained in anonymized form to preserve the integrity of the public record.",
    "legal.privacy.contact.h": "Contact",
    "legal.privacy.contact.p":
      "Sustainability of Sustainability Foundation (EIN 41-3097632, Massachusetts). Questions: reach out via the project’s GitHub repository.",
    "legal.privacy.footer": "This prototype is provided as-is for a limited alpha. See the {link}.",

    // ── Contributor License ──
    "legal.cla.title": "Contributor License",
    "legal.cla.intro":
      "Discovery Commons is an open research commons. This page explains the licensing of both the research contributions posted on the platform and the platform’s source code.",
    "legal.cla.not": "not",
    "legal.cla.arr": "All Rights Reserved",
    "legal.cla.dcLicense": "DC Collaboration License",
    "legal.cla.ip.h": "Your intellectual property",
    "legal.cla.ownership.h": "Ownership",
    "legal.cla.ownership.p":
      "Discovery Commons and the Sustainability of Sustainability Foundation do {not} claim ownership of your contributions. Your work remains yours.",
    "legal.cla.does.h": "What the platform does with your content",
    "legal.cla.does.p":
      "By posting on Discovery Commons, you grant the Foundation a limited, non-exclusive right to:",
    "legal.cla.does.store.label": "Store, display, and index",
    "legal.cla.does.store":
      "{label} your content according to the visibility and license settings you choose — this is necessary for the platform to function (search, feeds, thread pages).",
    "legal.cla.does.generate.label": "Generate technical representations",
    "legal.cla.does.generate":
      "{label} of your content (such as summaries, keywords, embeddings, and structured metadata) for the sole purpose of enabling platform features: search, discovery, recommendation, and classification. These representations are internal to the platform infrastructure and are not published or distributed as standalone works.",
    "legal.cla.does.exercise.label": "Exercise the rights granted by the license you selected.",
    "legal.cla.does.exercise":
      "{label} For example, if you choose CC BY 4.0, the platform — like any member of the public — may use that content in ways the CC BY license permits (with attribution). If you choose All Rights Reserved, the platform does not gain any additional usage rights beyond storing, displaying, and generating the technical representations described above.",
    "legal.cla.noSell":
      "The Foundation does {not} separately sell, sublicense, or commercially exploit your All Rights Reserved or NonCommercial content. Any future integration with affiliated infrastructure (such as research databases or API services) that goes beyond what your chosen license already permits will require your explicit, separate opt-in consent at that time.",
    "legal.cla.research.h": "Research contributions & licensing",
    "legal.cla.research.keep.label": "You keep ownership",
    "legal.cla.research.keep": "{label} of and authorship credit for everything you post.",
    "legal.cla.research.license":
      "Each contribution carries a {license} you choose at the time of posting. The default depends on your access mode:",
    "legal.cla.research.licenseWord": "license",
    "legal.cla.defaults.h": "License defaults by access mode",
    "legal.cla.table.mode": "Access mode",
    "legal.cla.table.default": "Default license",
    "legal.cla.table.change": "Can change?",
    "legal.cla.row.open.mode": "Free & Open (public)",
    "legal.cla.row.open.change": "You may choose any CC license at posting time",
    "legal.cla.row.priced.mode": "Priced",
    "legal.cla.row.priced.change": "You may change to any CC license (opening up) at any time",
    "legal.cla.row.collab.mode": "Collaboration",
    "legal.cla.row.collab.change": "Relicensed when collaboration completes",
    "legal.cla.row.private.mode": "Private / Shared / Sealed",
    "legal.cla.row.private.default": "No license granted",
    "legal.cla.row.private.change": "License applies only when content is visible to others",
    "legal.cla.irrev.h": "Irrevocability of Creative Commons licenses",
    "legal.cla.irrev.p1":
      "All Creative Commons licenses are {irrevocable} per the CC legal code. Once you publish a contribution under CC BY 4.0, you cannot later change it to “All Rights Reserved” or add NonCommercial / NoDerivatives restrictions. You can, however, stop distributing the work — but anyone who already received it under the CC license retains their rights. The platform shows a confirmation dialog whenever you select an irrevocable license.",
    "legal.cla.irrev.irrevocable": "irrevocable",
    "legal.cla.irrev.p2":
      "You {can} always open up: All Rights Reserved → any CC license. You just cannot restrict after opening.",
    "legal.cla.irrev.can": "can",
    "legal.cla.types.h": "Available license types",
    "legal.cla.types.ccBy": "Attribution. Anyone may use, even commercially.",
    "legal.cla.types.ccBySa": "Attribution-ShareAlike. Derivatives must use the same license.",
    "legal.cla.types.ccByNc": "Attribution-NonCommercial. No commercial use.",
    "legal.cla.types.ccByNcSa": "NonCommercial + ShareAlike.",
    "legal.cla.types.ccByNd": "Attribution-NoDerivatives. No modifications.",
    "legal.cla.types.ccByNcNd": "Most restrictive. Non-commercial, no modifications.",
    "legal.cla.types.arr": "Traditional copyright. Others need your explicit permission.",
    "legal.cla.types.dc":
      "Shared with accepted collaborators under the DC Collaboration Covenant.",
    "legal.cla.attr.h": "Attribution & credit",
    "legal.cla.attr.p":
      "The platform records credit across multiple dimensions (idea, data, method, analysis, validation, and more). This attribution travels with your work; reuse under any CC license must preserve it.",
    "legal.cla.code.h": "Source code",
    "legal.cla.code.p":
      "The Discovery Commons codebase is licensed under {agpl}. Code contributions are accepted under the same license.",
    "legal.cla.footer":
      "This is a prototype policy and may be refined before general availability. See the {terms} and {privacy}.",
  },

  "zh-TW": {
    // ── Shared ──
    "legal.effectiveDate": "生效日期：2026 年 7 月 2 日",
    "legal.zhNotice": "本中文譯本僅供參考；如與英文版有任何歧異，以英文版為準。",
    "legal.link.terms": "服務條款",
    "legal.link.privacy": "隱私政策",
    "legal.link.cla": "貢獻者授權",
    "legal.link.about": "關於",

    // ── Terms of Service ──
    "legal.terms.title": "服務條款",
    "legal.terms.intro":
      "Discovery Commons 是由 Sustainability of Sustainability Foundation（一家 501(c)(3) 公共慈善機構，以下稱「本基金會」）營運的非商業性研究原型。您使用本服務，即表示您同意本條款。",
    "legal.terms.alpha.h": "Alpha 測試階段",
    "legal.terms.alpha.p":
      "本服務為早期原型，係按{asIs}提供，不附帶任何形式之保證。功能可能變更或失效，且資料可能於 Alpha 測試期間遭重設。請勿將本服務作為重要工作的唯一紀錄。",
    "legal.terms.alpha.asIs": "「現狀」（as-is）",
    "legal.terms.content.h": "您的內容",
    "legal.terms.content.p":
      "您保有您所發布內容的所有權。您一經發布，即授予本基金會一項非專屬授權，得依您所選擇的可見度及授權設定，儲存、展示及索引該內容。每項貢獻均附有您所選擇的授權（公開內容預設為 CC BY 4.0，受限存取內容則為「保留所有權利」（All Rights Reserved））。本基金會僅行使您所選授權所賦予的權利，此外別無其他。完整詳情（包括創用 CC（Creative Commons）授權之不可撤回性）請參閱{link}。",
    "legal.terms.hash.h": "優先權雜湊值為證據，而非法律主張",
    "legal.terms.hash.p":
      "每項貢獻均會取得一組 SHA-256 雜湊值及伺服器時間戳記，藉以提供特定內容於所記錄時間已存在之{evidence}。此{not}構成法律上的專利優先權主張、公證，亦非受信任第三方所核發之時間戳記。如需正式的智慧財產權保護，請諮詢合格律師。",
    "legal.terms.hash.evidence": "證據",
    "legal.terms.hash.not": "並不",
    "legal.terms.use.h": "可接受之使用",
    "legal.terms.use.p":
      "您同意遵守{link}頁面所述之社群公約（Community Covenant）：秉持善意進行貢獻、為他人的貢獻正確歸因，且不得發布違法、有害或侵權之內容。對於違反本條款者，我們得移除其內容或停用其帳號。",
    "legal.terms.liability.h": "責任限制",
    "legal.terms.liability.p":
      "在法律允許之最大範圍內，本基金會對於因使用本原型所生之任何間接或衍生性損害（包括資料遺失或優先權喪失），概不負責。",
    "legal.terms.law.h": "準據法與條款變更",
    "legal.terms.law.p":
      "本條款以美國麻薩諸塞州（Commonwealth of Massachusetts）法律為準據法。我們得更新本條款；如有重大變更，將於本頁面載明。",
    "legal.terms.seeAlso": "另請參閱我們的{link}。",

    // ── Privacy Policy ──
    "legal.privacy.title": "隱私政策",
    "legal.privacy.intro":
      "Discovery Commons 是由 Sustainability of Sustainability Foundation（一家 501(c)(3) 公共慈善機構）營運的非商業性研究原型。本政策說明我們蒐集哪些資料及其原因。本政策將於任何正式上線（general availability）之前重新審閱。",
    "legal.privacy.collect.h": "我們蒐集的資料",
    "legal.privacy.collect.account.label": "帳號資料",
    "legal.privacy.collect.account":
      "{label} — 當您以 Google 登入時，我們會取得您的姓名、電子郵件地址及個人頭像（基本 OAuth 範圍：{openid}、{email}、{profile}）。我們不會存取您的 Google 雲端硬碟、聯絡人或任何其他資料。",
    "legal.privacy.collect.content.label": "您建立的內容",
    "legal.privacy.collect.content":
      "{label} — 討論串、貢獻、留言，以及您為每一項內容所選擇的可見度／分享設定。",
    "legal.privacy.collect.integrity.label": "完整性中繼資料",
    "legal.privacy.collect.integrity":
      "{label} — 每項貢獻均會記錄一組 SHA-256 雜湊值及伺服器時間戳記（此為本平台核心的防搶先發表（anti-scooping）功能）。",
    "legal.privacy.use.h": "我們如何使用這些資料",
    "legal.privacy.use.operate": "用於營運本平台，並將您的貢獻歸屬於您。",
    "legal.privacy.use.visibility":
      "用於落實您所選擇的可見度（私人、共享、公開或封存）— 請參閱{link}。",
    "legal.privacy.use.visibilityLink": "可見度模型",
    "legal.privacy.use.noSell":
      "我們{not}出售您的資料、顯示廣告，或執行第三方廣告／分析追蹤器。",
    "legal.privacy.use.not": "不會",
    "legal.privacy.where.h": "資料存放位置",
    "legal.privacy.where.p":
      "資料儲存於 Supabase（PostgreSQL），於靜態儲存及傳輸過程中均經加密。身分驗證僅使用工作階段 Cookie；我們不使用追蹤型 Cookie。",
    "legal.privacy.choices.h": "您的選擇",
    "legal.privacy.choices.visibility":
      "您可控制您所發布之一切內容的可見度。請注意，內容一經公開，即可能已被他人檢視或複製，因此可見度的變更並非完全可逆。",
    "legal.privacy.choices.deletion":
      "您可與我們聯絡，請求存取或刪除您的帳號資料。部分貢獻的雜湊值／時間戳記可能以匿名化形式保留，以維護公開紀錄的完整性。",
    "legal.privacy.contact.h": "聯絡方式",
    "legal.privacy.contact.p":
      "Sustainability of Sustainability Foundation（EIN 41-3097632，麻薩諸塞州）。如有疑問，請透過本專案的 GitHub 儲存庫與我們聯絡。",
    "legal.privacy.footer": "本原型係按現狀（as-is）提供，僅供有限範圍的 Alpha 測試使用。請參閱{link}。",

    // ── Contributor License ──
    "legal.cla.title": "貢獻者授權",
    "legal.cla.intro":
      "Discovery Commons 是一個開放的研究共享空間（research commons）。本頁說明平台上所發布之研究貢獻，以及平台原始碼兩者的授權方式。",
    "legal.cla.not": "並不",
    "legal.cla.arr": "保留所有權利",
    "legal.cla.dcLicense": "DC 合作授權",
    "legal.cla.ip.h": "您的智慧財產權",
    "legal.cla.ownership.h": "所有權",
    "legal.cla.ownership.p":
      "Discovery Commons 及 Sustainability of Sustainability Foundation（以下稱「本基金會」）{not}主張您貢獻內容的所有權。您的作品仍歸您所有。",
    "legal.cla.does.h": "平台如何處理您的內容",
    "legal.cla.does.p": "您於 Discovery Commons 發布內容，即授予本基金會有限且非專屬的權利，得：",
    "legal.cla.does.store.label": "儲存、展示及索引",
    "legal.cla.does.store":
      "依您所選擇的可見度及授權設定，{label}您的內容 — 此為平台運作（搜尋、動態、討論串頁面）所必需。",
    "legal.cla.does.generate.label": "產生技術表示形式",
    "legal.cla.does.generate":
      "就您的內容{label}（例如摘要、關鍵字、嵌入向量（embeddings）及結構化中繼資料），其唯一目的在於實現平台功能：搜尋、探索、推薦及分類。這些表示形式僅存在於平台基礎架構內部，不會作為獨立作品發布或散布。",
    "legal.cla.does.exercise.label": "行使您所選授權所賦予的權利。",
    "legal.cla.does.exercise":
      "{label}例如，若您選擇 CC BY 4.0，平台即如同任何社會大眾，得以 CC BY 授權所允許之方式（附姓名標示）使用該內容。若您選擇「保留所有權利」，除儲存、展示及產生上述技術表示形式外，平台不會取得任何額外的使用權利。",
    "legal.cla.noSell":
      "本基金會{not}另行出售、再授權或商業利用您以「保留所有權利」或「非商業性」（NonCommercial）授權發布的內容。未來如與關係機構之基礎設施（例如研究資料庫或 API 服務）進行任何整合，而超出您所選授權已允許之範圍者，屆時將須另行取得您明確且個別的選擇加入（opt-in）同意。",
    "legal.cla.research.h": "研究貢獻與授權",
    "legal.cla.research.keep.label": "您保有所有權",
    "legal.cla.research.keep": "對於您所發布的一切內容，{label}及作者歸因。",
    "legal.cla.research.license":
      "每項貢獻均附有您於發布時所選擇的{license}。預設授權取決於您的存取模式：",
    "legal.cla.research.licenseWord": "授權",
    "legal.cla.defaults.h": "各存取模式的預設授權",
    "legal.cla.table.mode": "存取模式",
    "legal.cla.table.default": "預設授權",
    "legal.cla.table.change": "可否變更？",
    "legal.cla.row.open.mode": "免費公開（公開）",
    "legal.cla.row.open.change": "您可於發布時選擇任何 CC 授權",
    "legal.cla.row.priced.mode": "付費",
    "legal.cla.row.priced.change": "您可隨時變更為任何 CC 授權（開放授權）",
    "legal.cla.row.collab.mode": "合作",
    "legal.cla.row.collab.change": "於合作完成時重新授權",
    "legal.cla.row.private.mode": "私人／共享／封存",
    "legal.cla.row.private.default": "不授予任何授權",
    "legal.cla.row.private.change": "授權僅於內容對他人可見時適用",
    "legal.cla.irrev.h": "創用 CC 授權之不可撤回性",
    "legal.cla.irrev.p1":
      "依 CC 法律條款（legal code），所有創用 CC 授權均為{irrevocable}。一旦您以 CC BY 4.0 發布貢獻，即不得於事後將其變更為「保留所有權利」，或增加「非商業性」／「禁止改作」（NonCommercial / NoDerivatives）限制。然而，您可以停止散布該作品 — 但任何已依該 CC 授權取得作品者，仍保有其權利。每當您選擇不可撤回的授權時，平台均會顯示確認對話框。",
    "legal.cla.irrev.irrevocable": "不可撤回",
    "legal.cla.irrev.p2":
      "您{can}開放授權：保留所有權利 → 任何 CC 授權。您只是不能在開放之後再加以限制。",
    "legal.cla.irrev.can": "隨時可以",
    "legal.cla.types.h": "可用的授權類型",
    "legal.cla.types.ccBy": "姓名標示。任何人皆可使用，包括商業用途。",
    "legal.cla.types.ccBySa": "姓名標示－相同方式分享。衍生作品須採用相同授權。",
    "legal.cla.types.ccByNc": "姓名標示－非商業性。不得作商業用途。",
    "legal.cla.types.ccByNcSa": "非商業性＋相同方式分享。",
    "legal.cla.types.ccByNd": "姓名標示－禁止改作。不得修改。",
    "legal.cla.types.ccByNcNd": "限制最嚴格。非商業性，且不得修改。",
    "legal.cla.types.arr": "傳統著作權。他人須取得您的明確許可。",
    "legal.cla.types.dc": "依 DC 合作公約（DC Collaboration Covenant），與經您接受的協作者共享。",
    "legal.cla.attr.h": "姓名標示與歸因",
    "legal.cla.attr.p":
      "平台會就多個面向（構想、資料、方法、分析、驗證等）記錄歸因。此歸因資訊隨您的作品流通；依任何 CC 授權進行之再利用，均須予以保留。",
    "legal.cla.code.h": "原始碼",
    "legal.cla.code.p": "Discovery Commons 程式碼庫採用 {agpl} 授權。程式碼貢獻亦依相同授權接受。",
    "legal.cla.footer":
      "本政策為原型階段政策，於正式上線前可能進一步修訂。請參閱{terms}及{privacy}。",
  },

  "zh-CN": {
    // ── Shared ──
    "legal.effectiveDate": "生效日期：2026 年 7 月 2 日",
    "legal.zhNotice": "本中文译本仅供参考；如与英文版有任何歧义，以英文版为准。",
    "legal.link.terms": "服务条款",
    "legal.link.privacy": "隐私政策",
    "legal.link.cla": "贡献者授权",
    "legal.link.about": "关于",

    // ── Terms of Service ──
    "legal.terms.title": "服务条款",
    "legal.terms.intro":
      "Discovery Commons 是由 Sustainability of Sustainability Foundation（一家 501(c)(3) 公共慈善机构，以下简称“本基金会”）运营的非商业性研究原型。您使用本服务，即表示您同意本条款。",
    "legal.terms.alpha.h": "Alpha 测试阶段",
    "legal.terms.alpha.p":
      "本服务为早期原型，按{asIs}提供，不附带任何形式的保证。功能可能变更或失效，且数据可能在 Alpha 测试期间被重置。请勿将本服务作为重要工作的唯一记录。",
    "legal.terms.alpha.asIs": "“现状”（as-is）",
    "legal.terms.content.h": "您的内容",
    "legal.terms.content.p":
      "您保留您所发布内容的所有权。您一经发布，即授予本基金会一项非独占许可，可依据您所选择的可见度及授权设置，存储、展示及索引该内容。每项贡献均附有您所选择的授权（公开内容默认为 CC BY 4.0，受限访问内容则为“保留所有权利”（All Rights Reserved））。本基金会仅行使您所选授权所赋予的权利，除此之外别无其他。完整详情（包括知识共享（Creative Commons）授权的不可撤销性）请参阅{link}。",
    "legal.terms.hash.h": "优先权哈希值是证据，而非法律主张",
    "legal.terms.hash.p":
      "每项贡献均会获得一个 SHA-256 哈希值及服务器时间戳，借以提供特定内容在所记录时间已存在的{evidence}。这{not}构成法律上的专利优先权主张、公证，也不是由可信第三方出具的时间戳。如需正式的知识产权保护，请咨询合格律师。",
    "legal.terms.hash.evidence": "证据",
    "legal.terms.hash.not": "并不",
    "legal.terms.use.h": "可接受的使用",
    "legal.terms.use.p":
      "您同意遵守{link}页面所述的社区公约（Community Covenant）：秉持善意进行贡献、为他人的贡献正确归因，且不得发布违法、有害或侵权的内容。对于违反本条款者，我们可以删除其内容或停用其账号。",
    "legal.terms.liability.h": "责任限制",
    "legal.terms.liability.p":
      "在法律允许的最大范围内，本基金会对因使用本原型而产生的任何间接或后果性损害（包括数据丢失或优先权丧失）概不负责。",
    "legal.terms.law.h": "适用法律与条款变更",
    "legal.terms.law.p":
      "本条款受美国马萨诸塞州（Commonwealth of Massachusetts）法律管辖。我们可能更新本条款；如有重大变更，将在本页面注明。",
    "legal.terms.seeAlso": "另请参阅我们的{link}。",

    // ── Privacy Policy ──
    "legal.privacy.title": "隐私政策",
    "legal.privacy.intro":
      "Discovery Commons 是由 Sustainability of Sustainability Foundation（一家 501(c)(3) 公共慈善机构）运营的非商业性研究原型。本政策说明我们收集哪些数据及其原因。本政策将在任何正式上线（general availability）之前重新审阅。",
    "legal.privacy.collect.h": "我们收集的数据",
    "legal.privacy.collect.account.label": "账号数据",
    "legal.privacy.collect.account":
      "{label} — 当您使用 Google 登录时，我们会获取您的姓名、电子邮件地址及头像（基本 OAuth 范围：{openid}、{email}、{profile}）。我们不会访问您的 Google 云端硬盘、联系人或任何其他数据。",
    "legal.privacy.collect.content.label": "您创建的内容",
    "legal.privacy.collect.content":
      "{label} — 讨论串、贡献、评论，以及您为每一项内容所选择的可见度／共享设置。",
    "legal.privacy.collect.integrity.label": "完整性元数据",
    "legal.privacy.collect.integrity":
      "{label} — 每项贡献均会记录一个 SHA-256 哈希值及服务器时间戳（这是本平台核心的防抢先发表（anti-scooping）功能）。",
    "legal.privacy.use.h": "我们如何使用这些数据",
    "legal.privacy.use.operate": "用于运营本平台，并将您的贡献归属于您。",
    "legal.privacy.use.visibility":
      "用于落实您所选择的可见度（私人、共享、公开或封存）— 请参阅{link}。",
    "legal.privacy.use.visibilityLink": "可见度模型",
    "legal.privacy.use.noSell":
      "我们{not}出售您的数据、展示广告，或运行第三方广告／分析跟踪器。",
    "legal.privacy.use.not": "不会",
    "legal.privacy.where.h": "数据存放位置",
    "legal.privacy.where.p":
      "数据存储于 Supabase（PostgreSQL），在静态存储和传输过程中均经过加密。身份验证仅使用会话 Cookie；我们不使用跟踪 Cookie。",
    "legal.privacy.choices.h": "您的选择",
    "legal.privacy.choices.visibility":
      "您可以控制您所发布的一切内容的可见度。请注意，内容一经公开，即可能已被他人查看或复制，因此可见度的变更并非完全可逆。",
    "legal.privacy.choices.deletion":
      "您可以联系我们，请求访问或删除您的账号数据。部分贡献的哈希值／时间戳可能以匿名化形式保留，以维护公开记录的完整性。",
    "legal.privacy.contact.h": "联系方式",
    "legal.privacy.contact.p":
      "Sustainability of Sustainability Foundation（EIN 41-3097632，马萨诸塞州）。如有疑问，请通过本项目的 GitHub 仓库与我们联系。",
    "legal.privacy.footer": "本原型按现状（as-is）提供，仅供有限范围的 Alpha 测试使用。请参阅{link}。",

    // ── Contributor License ──
    "legal.cla.title": "贡献者授权",
    "legal.cla.intro":
      "Discovery Commons 是一个开放的研究共享空间（research commons）。本页说明平台上所发布的研究贡献，以及平台源代码两者的授权方式。",
    "legal.cla.not": "并不",
    "legal.cla.arr": "保留所有权利",
    "legal.cla.dcLicense": "DC 合作授权",
    "legal.cla.ip.h": "您的知识产权",
    "legal.cla.ownership.h": "所有权",
    "legal.cla.ownership.p":
      "Discovery Commons 及 Sustainability of Sustainability Foundation（以下简称“本基金会”）{not}主张您贡献内容的所有权。您的作品仍归您所有。",
    "legal.cla.does.h": "平台如何处理您的内容",
    "legal.cla.does.p": "您在 Discovery Commons 上发布内容，即授予本基金会有限且非独占的权利，以：",
    "legal.cla.does.store.label": "存储、展示及索引",
    "legal.cla.does.store":
      "依据您所选择的可见度及授权设置，{label}您的内容 — 这是平台运作（搜索、信息流、讨论串页面）所必需的。",
    "legal.cla.does.generate.label": "生成技术表示形式",
    "legal.cla.does.generate":
      "针对您的内容{label}（例如摘要、关键词、嵌入向量（embeddings）及结构化元数据），其唯一目的在于实现平台功能：搜索、发现、推荐及分类。这些表示形式仅存在于平台基础设施内部，不会作为独立作品发布或传播。",
    "legal.cla.does.exercise.label": "行使您所选授权所赋予的权利。",
    "legal.cla.does.exercise":
      "{label}例如，若您选择 CC BY 4.0，平台即如同任何社会公众一样，可以按 CC BY 授权所允许的方式（注明署名）使用该内容。若您选择“保留所有权利”，除存储、展示及生成上述技术表示形式外，平台不会获得任何额外的使用权利。",
    "legal.cla.noSell":
      "本基金会{not}另行出售、再许可或商业利用您以“保留所有权利”或“非商业性使用”（NonCommercial）授权发布的内容。未来如与关联机构的基础设施（例如研究数据库或 API 服务）进行任何整合，且超出您所选授权已允许的范围，届时将须另行取得您明确且单独的主动选择加入（opt-in）同意。",
    "legal.cla.research.h": "研究贡献与授权",
    "legal.cla.research.keep.label": "您保留所有权",
    "legal.cla.research.keep": "对于您所发布的一切内容，{label}及作者归因。",
    "legal.cla.research.license":
      "每项贡献均附有您在发布时所选择的{license}。默认授权取决于您的访问模式：",
    "legal.cla.research.licenseWord": "授权",
    "legal.cla.defaults.h": "各访问模式的默认授权",
    "legal.cla.table.mode": "访问模式",
    "legal.cla.table.default": "默认授权",
    "legal.cla.table.change": "能否变更？",
    "legal.cla.row.open.mode": "免费公开（公开）",
    "legal.cla.row.open.change": "您可在发布时选择任何 CC 授权",
    "legal.cla.row.priced.mode": "付费",
    "legal.cla.row.priced.change": "您可随时变更为任何 CC 授权（开放授权）",
    "legal.cla.row.collab.mode": "合作",
    "legal.cla.row.collab.change": "在合作完成时重新授权",
    "legal.cla.row.private.mode": "私人／共享／封存",
    "legal.cla.row.private.default": "不授予任何授权",
    "legal.cla.row.private.change": "授权仅在内容对他人可见时适用",
    "legal.cla.irrev.h": "知识共享授权的不可撤销性",
    "legal.cla.irrev.p1":
      "根据 CC 法律文本（legal code），所有知识共享授权均为{irrevocable}。一旦您以 CC BY 4.0 发布贡献，便不能在事后将其变更为“保留所有权利”，或增加“非商业性使用”／“禁止演绎”（NonCommercial / NoDerivatives）限制。不过，您可以停止传播该作品 — 但任何已依据该 CC 授权获得作品的人，仍保有其权利。每当您选择不可撤销的授权时，平台都会显示确认对话框。",
    "legal.cla.irrev.irrevocable": "不可撤销",
    "legal.cla.irrev.p2":
      "您{can}开放授权：保留所有权利 → 任何 CC 授权。您只是不能在开放之后再加以限制。",
    "legal.cla.irrev.can": "随时可以",
    "legal.cla.types.h": "可用的授权类型",
    "legal.cla.types.ccBy": "署名。任何人均可使用，包括商业用途。",
    "legal.cla.types.ccBySa": "署名－相同方式共享。演绎作品须采用相同授权。",
    "legal.cla.types.ccByNc": "署名－非商业性使用。不得用于商业用途。",
    "legal.cla.types.ccByNcSa": "非商业性使用＋相同方式共享。",
    "legal.cla.types.ccByNd": "署名－禁止演绎。不得修改。",
    "legal.cla.types.ccByNcNd": "限制最严格。非商业性使用，且不得修改。",
    "legal.cla.types.arr": "传统版权。他人须取得您的明确许可。",
    "legal.cla.types.dc": "依据 DC 合作公约（DC Collaboration Covenant），与经您接受的协作者共享。",
    "legal.cla.attr.h": "署名与归因",
    "legal.cla.attr.p":
      "平台会从多个维度（想法、数据、方法、分析、验证等）记录归因。该归因信息随您的作品流转；依据任何 CC 授权进行的再利用，均须予以保留。",
    "legal.cla.code.h": "源代码",
    "legal.cla.code.p": "Discovery Commons 代码库采用 {agpl} 授权。代码贡献亦按相同授权接受。",
    "legal.cla.footer":
      "本政策为原型阶段政策，在正式上线前可能进一步修订。请参阅{terms}和{privacy}。",
  },
};
