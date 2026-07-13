# Avatar icons

Drop **36 icon images** here for the Settings → Avatar picker.

## Naming (required, exact)
```
01.png  02.png  03.png  …  35.png  36.png
```
Two digits, zero-padded, `.png`. The picker loads `/avatars/01.png` … `/avatars/36.png`.

## Specs
- **Square**, recommended **256×256 px** (they render at 40×40, but larger keeps them crisp on retina).
- PNG with transparent or solid background; they're masked into a circle, so keep the subject centered.
- Keep each file small (< ~50 KB) — 36 of them load on the Settings page.

## Notes
- Until these files exist, the icon grid shows blank circles — that's expected. The **colored-initial** avatar always works without any images.
- `.svg` also works if you prefer vectors: name them `01.svg`…`36.svg` and change the extension in `src/components/profile/avatar-picker.tsx` (`ICONS` array).
