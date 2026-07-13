# Site images

## hero.jpg (optional)
The landing hero currently shows a CSS gradient. To use a real photo:

1. Drop a wide image here named **`hero.jpg`** (recommended **2000×1000 px**, landscape, < ~400 KB).
2. In `src/app/page.tsx`, add the class `dc-hero-image` to the hero `<section>`
   (it already has `dc-hero`):
   ```tsx
   <section className="py-24 px-4 relative overflow-hidden dc-hero dc-hero-image">
   ```
   The photo layers over the gradient. Consider a dark overlay if text contrast suffers.

## Other images
Reference any file placed here as `/images/<name>` (e.g. `/images/logo.png`).
Keep them optimized; Vercel serves `/public` as static assets.
