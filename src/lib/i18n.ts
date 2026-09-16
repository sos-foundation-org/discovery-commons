/**
 * Lightweight i18n — no heavy library, just a dictionary lookup.
 * Supports: en, zh-TW, zh-CN. Default = browser language or "en".
 */

export const SUPPORTED_LOCALES = ["en", "zh-TW", "zh-CN"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
};

/** Detect browser locale, map to supported locale. */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language || (navigator as any).userLanguage || "en";
  if (lang.startsWith("zh")) {
    // zh-TW, zh-Hant → 繁體; zh-CN, zh-Hans, zh → 简体
    if (lang.includes("TW") || lang.includes("Hant")) return "zh-TW";
    if (lang.includes("CN") || lang.includes("Hans")) return "zh-CN";
    // Bare "zh" → default to zh-CN (most common)
    return "zh-CN";
  }
  return "en";
}

// ── Dictionary ──────────────────────────────────────────────
// Key UI strings only — user content stays in its original language.

type Dict = Record<string, string>;

const en: Dict = {
  // Navbar
  "nav.threads": "Threads",
  "nav.about": "About",
  "nav.sealed": "Sealed Ideas",
  "nav.points": "Points",
  "nav.credits": "Credits",
  "nav.settings": "Settings",
  "nav.signIn": "Sign In",
  "nav.signOut": "Sign Out",
  "nav.profile": "Profile",
  "nav.notifications": "Notifications",
  "nav.theme": "Theme",
  // Home
  "home.badge": "Open research platform — all backgrounds welcome",
  "home.title": "The Antilibrary of Science",
  "home.subtitle": "What you don't know matters more than what you do.",
  "home.description": "Whether you're a field naturalist, a theoretical physicist, or a curious citizen — share your observations and ideas, build on others' unknowns, and watch discoveries evolve transparently. Every insight is SHA-256 protected from the moment you type it.",
  "home.getStarted": "Get Started — Free",
  "home.howItWorks": "How It Works",
  "home.browseThreads": "Browse Threads",
  "home.startThread": "Start a Thread",
  "home.threads": "Threads",
  "home.contributions": "Contributions",
  "home.contributors": "Contributors",
  // Why DC section
  "why.title": "Why Discovery Commons?",
  "why.subtitle": "Traditional science rewards only finished papers. We reward every step of the journey.",
  "why.priority.title": "Priority Without Risk",
  "why.priority.desc": "Seal your idea with SHA-256 before anyone sees it. When you're ready, reveal the content — the timestamp proves you had it first.",
  "why.collab.title": "Cross-Boundary Collaboration",
  "why.collab.desc": "A field naturalist's observation can spark a collaboration with a university lab. No PhD required — every background brings something new.",
  "why.credit.title": "Fair Credit, Always",
  "why.credit.desc": "Every contribution is credited across nine dimensions — idea, data, method, analysis, validation — not just \"first author vs. last author.\"",
  // Gated content
  "gated.locked": "Details locked",
  "gated.unlock": "Unlock for",
  "gated.propose": "Propose Collaboration",
  "gated.whyGated": "Why gated",
  "gated.unlocked": "Content unlocked! Refreshing...",
  // Contribution form
  "form.accessTitle": "Access & Pricing",
  "form.freeOpen": "Free & Open",
  "form.priced": "Priced",
  "form.collaboration": "Collaboration",
  "form.both": "Both",
  "form.licenseTitle": "License (Intellectual Property)",
  "form.seal": "Seal this contribution",
  "form.sealDesc": "Others will only see the SHA-256 hash until you choose to reveal the content. Proves you had the idea at this timestamp without sharing it yet.",
  "form.submit": "Submit Contribution",
  "form.sealSubmit": "Seal & Submit",
  // Translate
  "translate.button": "Translate",
  "translate.translating": "Translating...",
  "translate.showOriginal": "Show original",
  // General
  "general.activeThreads": "Active Threads",
  "general.viewAll": "View All Threads",
};

const zhTW: Dict = {
  "nav.threads": "討論串",
  "nav.about": "關於",
  "nav.sealed": "封存的想法",
  "nav.points": "積分",
  "nav.credits": "貢獻紀錄",
  "nav.settings": "設定",
  "nav.signIn": "登入",
  "nav.signOut": "登出",
  "nav.profile": "個人檔案",
  "nav.notifications": "通知",
  "nav.theme": "主題",
  "home.badge": "開放研究平台 — 歡迎所有背景的人",
  "home.title": "科學的反圖書館",
  "home.subtitle": "你不知道的，比你知道的更重要。",
  "home.description": "無論你是田野自然觀察者、理論物理學家，還是一位好奇的公民——分享你的觀察與想法，在他人的未知上建構，透明地見證發現的演進。每一個洞見從你打字的那一刻起就受到 SHA-256 保護。",
  "home.getStarted": "免費開始",
  "home.howItWorks": "如何運作",
  "home.browseThreads": "瀏覽討論串",
  "home.startThread": "發起討論串",
  "home.threads": "討論串",
  "home.contributions": "貢獻",
  "home.contributors": "貢獻者",
  "why.title": "為什麼選擇 Discovery Commons？",
  "why.subtitle": "傳統科學只獎勵完成的論文。我們獎勵旅程中的每一步。",
  "why.priority.title": "無風險的優先權",
  "why.priority.desc": "在任何人看到之前用 SHA-256 封存你的想法。準備好了再揭示內容——時間戳證明你最先擁有它。",
  "why.collab.title": "跨界合作",
  "why.collab.desc": "田野自然觀察者的觀察可以點燃與大學實驗室的合作。不需要博士學位——每一種背景都帶來新的東西。",
  "why.credit.title": "永遠公平的歸因",
  "why.credit.desc": "每一個貢獻在九個維度上被記錄——想法、資料、方法、分析、驗證——而不僅僅是「第一作者 vs. 最後作者」。",
  "gated.locked": "詳細內容已鎖定",
  "gated.unlock": "解鎖，需要",
  "gated.propose": "提議合作",
  "gated.whyGated": "為何需要付費",
  "gated.unlocked": "內容已解鎖！重新載入中...",
  "form.accessTitle": "存取與定價",
  "form.freeOpen": "免費公開",
  "form.priced": "定價",
  "form.collaboration": "尋求合作",
  "form.both": "兩者皆可",
  "form.licenseTitle": "授權（智慧財產權）",
  "form.seal": "封存此貢獻",
  "form.sealDesc": "其他人只能看到 SHA-256 雜湊值，直到你選擇揭示內容。證明你在此時間擁有這個想法。",
  "form.submit": "提交貢獻",
  "form.sealSubmit": "封存並提交",
  "translate.button": "翻譯",
  "translate.translating": "翻譯中...",
  "translate.showOriginal": "顯示原文",
  "general.activeThreads": "活躍討論串",
  "general.viewAll": "查看所有討論串",
};

const zhCN: Dict = {
  "nav.threads": "讨论串",
  "nav.about": "关于",
  "nav.sealed": "封存的想法",
  "nav.points": "积分",
  "nav.credits": "贡献记录",
  "nav.settings": "设置",
  "nav.signIn": "登录",
  "nav.signOut": "退出",
  "nav.profile": "个人档案",
  "nav.notifications": "通知",
  "nav.theme": "主题",
  "home.badge": "开放研究平台 — 欢迎所有背景的人",
  "home.title": "科学的反图书馆",
  "home.subtitle": "你不知道的，比你知道的更重要。",
  "home.description": "无论你是田野自然观察者、理论物理学家，还是一位好奇的市民——分享你的观察与想法，在他人的未知上构建，透明地见证发现的演进。每一个洞见从你打字的那一刻起就受到 SHA-256 保护。",
  "home.getStarted": "免费开始",
  "home.howItWorks": "如何运作",
  "home.browseThreads": "浏览讨论串",
  "home.startThread": "发起讨论串",
  "home.threads": "讨论串",
  "home.contributions": "贡献",
  "home.contributors": "贡献者",
  "why.title": "为什么选择 Discovery Commons？",
  "why.subtitle": "传统科学只奖励完成的论文。我们奖励旅程中的每一步。",
  "why.priority.title": "无风险的优先权",
  "why.priority.desc": "在任何人看到之前用 SHA-256 封存你的想法。准备好了再揭示内容——时间戳证明你最先拥有它。",
  "why.collab.title": "跨界合作",
  "why.collab.desc": "田野自然观察者的观察可以点燃与大学实验室的合作。不需要博士学位——每一种背景都带来新的东西。",
  "why.credit.title": "永远公平的归因",
  "why.credit.desc": "每一个贡献在九个维度上被记录——想法、数据、方法、分析、验证——而不仅仅是「第一作者 vs. 最后作者」。",
  "gated.locked": "详细内容已锁定",
  "gated.unlock": "解锁，需要",
  "gated.propose": "提议合作",
  "gated.whyGated": "为何需要付费",
  "gated.unlocked": "内容已解锁！重新加载中...",
  "form.accessTitle": "访问与定价",
  "form.freeOpen": "免费公开",
  "form.priced": "定价",
  "form.collaboration": "寻求合作",
  "form.both": "两者皆可",
  "form.licenseTitle": "授权（知识产权）",
  "form.seal": "封存此贡献",
  "form.sealDesc": "其他人只能看到 SHA-256 哈希值，直到你选择揭示内容。证明你在此时间拥有这个想法。",
  "form.submit": "提交贡献",
  "form.sealSubmit": "封存并提交",
  "translate.button": "翻译",
  "translate.translating": "翻译中...",
  "translate.showOriginal": "显示原文",
  "general.activeThreads": "活跃讨论串",
  "general.viewAll": "查看所有讨论串",
};

const DICTIONARIES: Record<Locale, Dict> = {
  en,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
};

/** Look up a translated string. Falls back to English, then to the key. */
export function t(key: string, locale: Locale): string {
  return DICTIONARIES[locale]?.[key] ?? DICTIONARIES.en[key] ?? key;
}
