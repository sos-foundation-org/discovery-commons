# Using Discovery Commons

A guide for researchers and alpha testers. App: https://discovery-commons.vercel.app

## Sign in
Click **Sign in** → **Google**. We only read your name, email, and photo — nothing
else. You can browse public threads without signing in; you need an account to
create or contribute.

## Threads — lines of inquiry
A **thread** is a research question and everything built on it. Browse them on the
home page or **Threads**. Each thread has a **discipline** (colored badge) and tags.

**Start a thread** (**New Thread**):
1. Title — your question, ideally specific and a little unusual.
2. Description — context: what's known, why it matters.
3. **Discipline** — pick the closest field (colors your thread).
4. Tags + **visibility** (you can widen later, never narrow).

## Contributions — build the thread
Inside a thread, **Add a Contribution** and pick a type:

| Type | Use it for |
|---|---|
| ❓ Question | a sub-question |
| 💡 Hypothesis | a proposed explanation |
| 🗄 Data | observations/measurements (+ a **raw-data link**) |
| 🧪 Method | a standalone method — new stat, R package, instrument, protocol |
| 🖥 Simulation | computational models |
| 📊 Statistics | analysis results |
| 📖 Interpretation | what the results mean |
| ✨ Insight | synthesis / breakthrough |

Everything you post is **SHA-256 hashed and timestamped** the moment you submit.

### Formatting (Markdown + visuals)
The body supports Markdown — headings, **bold**, lists, tables, links, and:

- **Image:** `![caption](https://host/figure.png)` (host it anywhere)
- **Chart** (renders as a figure):
  <pre>```chart
  { "type": "bar", "title": "Reproducibility (%)",
    "data": [ {"label":"Forest","value":62}, {"label":"Wetland","value":55} ] }
  ```</pre>
  Use `"type": "line"` for a line chart. It's static and reproducible — the spec
  is stored as text and re-draws identically.
- **Video** (YouTube/Vimeo):
  <pre>```embed
  https://www.youtube.com/watch?v=XXXXXXXX
  ```</pre>
- **Raw data:** on a **Data** contribution, fill the *Raw data link* field
  (Zenodo/OSF/GitHub/CSV). Files aren't uploaded — you link to where they live.

## Visibility: private → shared → public, and sealed
Set per contribution:
- **Private** — only you.
- **Shared** — thread collaborators (and anyone you share with).
- **Public** — everyone.
- **Sealed** — content hidden, but the **hash + timestamp are public**. This proves
  you had an idea at a point in time *without revealing it*.

**Seal** an idea you're not ready to publish. When ready, **Reveal** it (to
collaborators or the public) — the system re-checks the hash to prove the content
hasn't changed since you sealed it. Sealing and revealing are **one-way**.

## Collaborators
On your thread, add collaborators by email (Settings-style panel on the thread).
They gain access to that thread's **Shared** contributions.

## Credit
Contributions earn credit across five dimensions — **idea, data, method, analysis,
validation**. See your portfolio on **Credits** and your public page at
`/profile/<you>`. Credit is timestamped and permanently attributed.

## Verify a hash
Anyone can confirm a contribution existed at a given time: open **Verify**, paste a
SHA-256 hash (or click any hash in a thread). You'll see the timestamp, author, and
an integrity check.

> **Not a legal claim.** A hash + timestamp is *evidence* of when content existed;
> it is not a patent-priority filing. See the [Terms](https://discovery-commons.vercel.app/legal/terms).

## Reading in another language
Use your browser's built-in **Translate** (Chrome/Edge/Safari) for full-page
translation — the site is structured so it translates cleanly.

## Avatars
**Settings → Avatar**: keep the colored initial or pick an icon.
