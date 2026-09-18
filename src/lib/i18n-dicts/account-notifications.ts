// Display-time translation for account-area strings that are stored or sent as
// English/enum ids (notifications in the DB, raw status ids). Pure functions.
import { t, type Locale } from "@/lib/i18n";

/** t() that reports a miss as `undefined` instead of echoing the key. */
function lookup(key: string, locale: Locale, vars?: Record<string, string | number>) {
  const s = t(key, locale, vars);
  return s === key ? undefined : s;
}

function typeLabel(type: string, locale: Locale): string {
  return lookup(`type.${type}`, locale) ?? type;
}

function nameLabel(name: string, locale: Locale): string {
  // API fallback when the actor has no display name.
  return name === "Someone" ? t("account.notif.someone", locale) : name;
}

// Fixed notification titles/messages (see prisma.notification.create in src/app/api).
const FIXED: Record<string, string> = {
  "A bounty has been awarded to you for your contribution.": "account.notif.bountyDefault",
  "New collaboration request": "account.notif.collabRequestTitle",
  "Collaboration accepted!": "account.notif.collabAcceptedTitle",
  "Your collaboration request has been accepted. Details are now unlocked.":
    "account.notif.collabAcceptedMsg",
  "Collaboration request declined": "account.notif.collabDeclinedTitle",
  "The author declined your collaboration request. Your deposit has been refunded.":
    "account.notif.collabDeclinedMsg",
  "The author wants to chat first": "account.notif.collabChatTitle",
  "Before accepting, the author would like to discuss details.": "account.notif.collabChatMsg",
  "New message in collaboration chat": "account.notif.collabMessageTitle",
  "You were added as a collaborator": "account.notif.threadCollabTitle",
  "You now have access to a shared thread.": "account.notif.threadCollabMsg",
  "A contribution was shared with you": "account.notif.sharedTitle",
  "You now have access to a shared contribution.": "account.notif.sharedMsg",
};

type Pattern = {
  re: RegExp;
  build: (m: RegExpMatchArray, locale: Locale) => string;
};

// Dynamic templates. Names, titles and quoted text are kept verbatim.
const PATTERNS: Pattern[] = [
  {
    re: /^New (\w+) on your thread$/,
    build: (m, l) => t("account.notif.newContribTitle", l, { type: typeLabel(m[1], l) }),
  },
  {
    re: /^([\s\S]+) added a (\w+) to "([\s\S]*)"$/,
    build: (m, l) =>
      t("account.notif.newContribMsg", l, {
        name: nameLabel(m[1], l),
        type: typeLabel(m[2], l),
        title: m[3],
      }),
  },
  {
    re: /^You received a ([\d.,]+) DP bounty!$/,
    build: (m, l) => t("account.notif.bountyTitle", l, { amount: m[1] }),
  },
  {
    re: /^Bounty: "([\s\S]*)"$/,
    build: (m, l) => t("account.notif.bountyMsg", l, { criteria: m[1] }),
  },
  {
    re: /^([\s\S]+) wants to collaborate on your contribution$/,
    build: (m, l) => t("account.notif.collabRequestMsg", l, { name: nameLabel(m[1], l) }),
  },
];

/**
 * Translate a stored (English) notification title or message for display.
 * Unknown text (e.g. chat previews, custom decline reasons) passes through.
 */
export function translateNotification(text: string, locale: Locale): string {
  if (locale === "en" || !text) return text;
  const key = FIXED[text];
  if (key) return t(key, locale);
  for (const { re, build } of PATTERNS) {
    const m = text.match(re);
    if (m) return build(m, locale);
  }
  return text;
}

/**
 * Label for a raw enum id that English UI shows verbatim (e.g. a status badge
 * reading "sealed"). English keeps the raw id; other locales use `key` when it
 * exists, else the id.
 */
export function rawIdLabel(id: string, key: string, locale: Locale): string {
  if (locale === "en") return id;
  return lookup(key, locale) ?? id;
}

/** Credit (v1) type ids: contribution types, `sealed_<type>`, `origination`. */
export function creditTypeLabel(id: string, locale: Locale): string {
  if (locale === "en") return id;
  if (id.startsWith("sealed_")) {
    const inner = id.slice("sealed_".length);
    return t("account.creditType.sealed", locale, { type: creditTypeLabel(inner, locale) });
  }
  return lookup(`type.${id}`, locale) ?? lookup(`account.creditType.${id}`, locale) ?? id;
}
