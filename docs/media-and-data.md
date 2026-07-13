# Media, Data & Visualization — architecture

How Discovery Commons handles images, video, raw data, and visualizations across
every contribution stage (question / hypothesis / data / method / statistics /
interpretation / insight). Design constraint: **$0, Supabase Free** — so we do
**not** upload/host large files in the prototype. We store *references* and
*reproducible specs* as text, which the SHA-256 + versioning model already
protects.

## Principles
1. **Text-based & reproducible.** Anything visual is expressed as plain text
   (a Markdown image URL, a chart JSON spec, an embed URL). Because it lives in
   the contribution body or `metadata`, it is hashed, versioned, and reproduces
   identically — matching DC's verification model and the static-figure norm of
   traditional journals.
2. **Reference, don't host.** Files (images, video, datasets) live on external
   hosts (the user's site, a repo, imgur, YouTube, Zenodo/OSF/Figshare). DC
   stores the URL only. Revisit first-class uploads (Supabase Storage) in
   production.
3. **Safe by default.** Only whitelisted video hosts are embedded as iframes;
   everything else degrades to a plain link.

## What's implemented (prototype)
| Need | Mechanism | Where |
|---|---|---|
| Images (any stage) | Markdown `![alt](url)` | contribution body → `ContributionContent` |
| Result visualization (static, reproducible) | ` ```chart ` JSON → server-rendered SVG (bar/line) | `SimpleChart` |
| Video / concept explainer | ` ```embed ` URL → YouTube/Vimeo iframe (whitelisted) | `EmbedBlock` |
| Tables, code, lists, links | GFM Markdown | `ContributionContent` |
| Raw dataset (Data type) | `metadata.dataUrl` (link, not a file) | form + card "Raw dataset" link |
| Method scope | `metadata.methodAppliesTo` | Method form + chips |

`Contribution.metadata` (JSON) is the extensible home for per-type structured
extras — no schema change needed to add more.

### ` ```chart ` spec
```json
{ "type": "bar" | "line", "title": "…", "unit": "…",
  "data": [ { "label": "A", "value": 12 } ] }
```

### ` ```embed `
A single YouTube or Vimeo URL. Non-whitelisted URLs render as a link.

## Planned / open for expert design
- **Richer statistical figures**: add **Vega-Lite** (` ```vega-lite ` JSON) as a
  lazy-loaded renderer — declarative, text-based, reproducible; covers most
  journal-style plots. **Mermaid** (` ```mermaid `) for flow/infographic diagrams.
  Both are opt-in because they add client bundle weight.
- **Dedicated result figures**: visualization is encouraged in the
  interpretation/insight (result) stage but allowed anywhere. If desired, a
  first-class `visualization` contribution type can be added (like Method) — TBD.
- **Raw data, deeper**: `dataUrl` is the seed. Expert design needed for: dataset
  format/licence metadata, checksum of the referenced file, multiple files, and
  a code→data execution story (e.g. a notebook/URL that ingests `dataUrl`).
- **Uploads (production)**: Supabase Storage or an object store for users who
  can't self-host media, with size/type limits and virus scanning.
