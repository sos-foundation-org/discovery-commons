# Site images

## hero.png (active)
The landing hero uses **`hero.png`** in this folder, layered under a theme scrim
(the hero `<section>` in `src/app/page.tsx` has `dc-hero dc-hero-image`; the CSS
is `.dc-hero-image` in `src/app/globals.css`).

To swap it: replace `hero.png` here (recommended **~2000×1000 px**, landscape).
Keep it reasonably small — the current file is ~2.2 MB; **500 KB or less** loads
noticeably faster. If you rename it (e.g. to `.jpg`), update the `url(...)` in
`.dc-hero-image`. Tune the scrim opacity in `page.tsx` if text contrast suffers.

## Other images
Reference any file placed here as `/images/<name>` (e.g. `/images/logo.png`).
Keep them optimized; Vercel serves `/public` as static assets.
