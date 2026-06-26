# Contributing to Paper Map

Thanks for helping out. Paper Map is deliberately tiny and dependency-free, so
contributing is mostly: edit one file, refresh the browser, open a PR. This guide
covers the setup, the dev loop, and the conventions that keep the project honest
to its constraints.

> **New to the codebase?** Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
> first — it's the map of how [`index.html`](index.html) is organized inside.
> This guide assumes that mental model.

---

## Quick start (< 2 minutes)

There is **no install, no build, no `npm`**. You need a Chromium browser
(Chrome or Edge) for the edit features.

```bash
git clone <your-fork-url>
cd paper-map
git config core.hooksPath .githooks   # optional: enable the demo-sync pre-commit hook
```

Then pick one of two ways to run it:

**A. Just look at it (any browser).** Open `index.html` directly, then click
**Load demo**. This exercises everything except saving to disk.

```bash
open index.html          # macOS;  or: xdg-open index.html  / start index.html
```

**B. Work on the real save/load loop (Chrome/Edge).** Serve the folder so
`index.json` loads over http, *and* use **Choose folder** to edit the demo
corpus on disk:

```bash
python3 -m http.server 8000
# open http://localhost:8000 → it auto-loads as a read-only "browse" map
# click the corpus title → Choose folder → pick this repo to enter "edit" mode
```

Why serve it? A published map loads its data with `fetch("index.json")`, which
only works over **http(s)** — double-clicking the file (`file://`) won't load the
served manifest. Local *editing* uses the File System Access API instead and
needs no server, but it's Chromium-only. See the
[README's `file://` caveat](README.md#publish) and
[Modes and load paths](docs/ARCHITECTURE.md#modes-and-load-paths).

---

## The dev loop

1. Edit `index.html` in your editor.
2. Refresh the browser tab.
3. Repeat.

That's it — no watch process, no hot reload, no compile. The whole app is plain
ES in one `<script>` with `"use strict"`.

To find the code for a feature, **search for its section banner**
(`/* ====`) rather than scrolling — the script is divided into self-contained,
clearly-labelled sections. The
[anatomy table](docs/ARCHITECTURE.md#anatomy-of-indexhtml) maps banners to
responsibilities.

---

## Conventions (please follow these)

These aren't style nits — they protect the project's core promises.

- **Stay zero-dependency and offline.** No CDN links, no `<script src>`, no web
  fonts from a network, no analytics, no telemetry, no API calls. If a feature
  needs the internet, it doesn't belong in the app. Fonts are inlined as base64.
- **Escape everything you interpolate.** The app builds HTML with template
  strings and `innerHTML`; there is no framework auto-escaping. Wrap every dynamic
  value in `esc()`, and pass every URL through `safeUrl()`/`isHttp()` before it
  becomes an `href` or `window.open` target. This is the only XSS defense.
- **State lives in `S`, not the DOM.** `render()` rebuilds `#root` wholesale, so
  anything stashed in DOM nodes or attached as an inline listener is lost on the
  next redraw. Put state in the `S` atom; wire interactions through the delegated
  `onClick` (via `data-*` attributes) or in `wireShell`/`wireMap`. See
  [the render pipeline](docs/ARCHITECTURE.md#the-render-pipeline).
- **Re-derive after mutating the corpus.** Any change to `S.corpus` (or a theme
  change) must be followed by `deriveCorpus()` before the views read
  `S.derived`. `mutate()` already does this for you — prefer it.
- **Keep accessibility intact.** Custom controls need `role` + `tabindex="0"`
  (Enter/Space activation is mirrored to click for you); panels/modals move focus;
  tabs carry `aria-selected`. Don't regress these when editing markup.
- **Match the surrounding style.** The code is terse and compact on purpose
  (dense one-liners, short helper names). Write new code that reads like its
  neighbours rather than reformatting a whole section.

---

## Changing the data model or the demo corpus

**A new paper field** touches the in/out boundary, not the views: update
`KNOWN_FM` (so it isn't misfiled as a facet), read it in `normalizePaper`, write
it in `serializePaper`, and add it to `buildIndex` if it belongs in the manifest.
See [Data in / data out](docs/ARCHITECTURE.md#data-in--data-out).

**A new dimension** (datasets, tools, populations…) usually needs **no code** —
add a line to `facets[]` in `papermap.config.json`. See
[Facets and entities](docs/ARCHITECTURE.md#facets-and-entities-config-driven).

> ⚠️ **The inlined demo is a generated copy — run the sync script.** `DEMO`,
> `CFG_DEMO`, and `ENT_DEMO` at the top of `index.html` duplicate `index.json`,
> `papermap.config.json`, and `entities.json` so the app works offline on first
> run, and those manifests derive from `papers/*.md` + `entities/*.md`. After any
> change to the demo corpus (a `.md` file or the config), regenerate everything:
>
> ```bash
> node scripts/sync-demo.mjs          # regenerate manifests + re-inline the consts
> node scripts/sync-demo.mjs --check  # verify in sync (use in CI / pre-commit); exits 1 on drift
> ```
>
> The `.md` files are the source of truth — edit those, not the manifests or the
> inlined constants. Zero dependencies; it runs with plain `node`.

This is enforced in two places so drift can't reach `main`:

- **CI gate** — [`.github/workflows/sync-check.yml`](.github/workflows/sync-check.yml)
  runs `node scripts/sync-demo.mjs --check` on every PR and on pushes to `main`,
  and fails the build if anything is out of sync. Authoritative; nothing to install.
- **Local pre-commit hook** — [`.githooks/pre-commit`](.githooks/pre-commit) runs
  the same check before each commit (only when demo-related files are staged) and
  blocks the commit on drift. It's committed to the repo but **opt-in per clone** —
  enable it once:

  ```bash
  git config core.hooksPath .githooks
  ```

  It's best-effort: if `node` isn't installed it skips (CI still enforces), and you
  can bypass a single commit with `git commit --no-verify`.

---

## Testing your change

There is no automated test suite. Verify by hand across the paths your change
touches:

- **Demo mode** — open `index.html`, **Load demo**. Smoke-test Library, Review,
  Map (all three lenses), and Entities.
- **Browse mode** — serve the folder (`python3 -m http.server`) and confirm it
  auto-loads `index.json` read-only.
- **Edit mode** (Chrome/Edge) — **Choose folder**, make an edit, confirm it
  autosaves to the `.md` file (check the file on disk) and that the save pill
  shows ✓ Saved.
- **Light and dark themes** — toggle the theme; data-viz colours are theme-aware
  and re-derived, so check the Map in both.
- **Keyboard & a11y** — Tab through controls, activate with Enter/Space, `/` to
  focus search, `Esc` to close panels.
- **Console must be clean** — no errors or unhandled rejections.

If you changed parsing or serialization, round-trip a file: load a folder, save a
paper, and confirm the `.md` diff is only what you intended (field order and
quoting come from `serializePaper`).

If you touched the demo corpus, run `node scripts/sync-demo.mjs --check` and
confirm it exits 0.

---

## Submitting a PR

1. Branch from `main` (`feat/…`, `fix/…`, `polish/…` — matching the existing
   history).
2. Keep the change focused; one concern per PR.
3. In the description, say **what** changed, **why**, and **how you verified it**
   (which modes/browsers you tested).
4. If you touched the demo corpus, confirm you synced the inlined constants (see
   the warning above).
5. Don't commit `DESIGN_SPEC.md`, `.DS_Store`, or editor cruft — they're
   gitignored for a reason.

---

## Scope: what belongs here

Paper Map has a sharp, intentional scope. It **points at** papers (by DOI/URL)
and visualizes a bounded set you own — it is **not** a reference manager and
**not** an online citation-graph explorer. Before proposing a feature, check it
against the constraints: local-first, offline, no account, no backend, no PDF
storage, no cloud sync. Features that violate those are out of scope by design.
When in doubt, open an issue to discuss before building.

---

## Questions

Open an issue. For the design rationale behind a decision, `DESIGN_SPEC.md` (if
you have it locally — it's gitignored) is the canonical "why".
