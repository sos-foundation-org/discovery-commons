// Deterministic colored-initial avatar (Google-style). If `image` is a chosen
// icon path (/avatars/xx.png) or an OAuth photo URL, it renders that instead.
// Colour is derived from a seed (userId or name) so it's stable per user.

// Light mode uses a deeper shade of each hue so the white initial stays
// ≥4.5:1; dark mode keeps the original 500 shades.
const PALETTE = [
  "bg-red-600 dark:bg-red-500",
  "bg-orange-700 dark:bg-orange-500",
  "bg-amber-700 dark:bg-amber-500",
  "bg-green-700 dark:bg-green-500",
  "bg-emerald-700 dark:bg-emerald-500",
  "bg-teal-700 dark:bg-teal-500",
  "bg-cyan-700 dark:bg-cyan-500",
  "bg-blue-600 dark:bg-blue-500",
  "bg-indigo-600 dark:bg-indigo-500",
  "bg-violet-600 dark:bg-violet-500",
  "bg-purple-600 dark:bg-purple-500",
  "bg-pink-700 dark:bg-pink-500",
  "bg-rose-600 dark:bg-rose-500",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const SIZES: Record<string, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl",
};

export function AvatarBadge({
  name,
  seed,
  image,
  size = "md",
  className = "",
}: {
  name?: string | null;
  seed?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const display = name?.trim() || "?";
  const initial = display.charAt(0).toUpperCase();
  const color = PALETTE[hashString(seed || display) % PALETTE.length];
  const sizeCls = SIZES[size] ?? SIZES.md;

  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt={display}
        className={`${sizeCls} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${color} ${sizeCls} ${className}`}
      aria-label={display}
    >
      {initial}
    </span>
  );
}
