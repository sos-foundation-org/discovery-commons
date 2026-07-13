// Deterministic colored-initial avatar (Google-style). If `image` is a chosen
// icon path (/avatars/xx.png) or an OAuth photo URL, it renders that instead.
// Colour is derived from a seed (userId or name) so it's stable per user.

const PALETTE = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-rose-500",
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
