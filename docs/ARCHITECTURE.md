# Architecture

How Paper Map is built on the inside — the mental model you need before changing
[`index.html`](../index.html).

> **Audience:** code contributors. For *using* the app (loading maps, adding
> papers, the data format) see the [README](../README.md). This document is
> about the implementation.

---

## The 30-second model

Paper Map is **one HTML file** — `index.html` — with everything inlined: CSS,
JavaScript, fonts (base64 woff2), and a demo corpus. There is:

- **no framework** (no React/Vue/Svelte),
- **no build step** (no bundler, no transpile, no `package.json`),
- **no dependencies** (zero `<script src>`, zero network calls),
- **no backend** (data is plain files the user owns).

You edit `index.html` directly and refresh the browser. That's the whole loop.

Four ideas carry the entire app:

1. **One state atom.** A single global object `S` holds *all* application state.
2. **Full re-render.** Almost every interaction calls `render()`, which rebuilds
   `#root.innerHTML` from `S` using template strings. There is no virtual DOM and
   no fine-grained reactivity — state changes, then the whole shell is redrawn.
3. **Event delegation by `data-*`.** The rebuilt DOM has no per-element
   listeners. One delegated `onClick` on `#root` reads `data-act` / `data-tab` /
   `data-row` … attributes and dispatches. This is what makes "blow away the DOM
   and rebuild it" cheap and safe.
4. **Files are the contract.** Papers are Markdown + YAML front-matter on disk.
   The app parses them into in-memory objects, mutates those, and serializes them
   back. The *schema is the only API* — anything that writes the same YAML
   interoperates.

If you internalize those four, the rest is detail.

---

## Repo layout

```
index.html              # THE app — CSS + JS + fonts + demo data, all inlined (~2,070 lines)
index.json              # build artifact: the demo corpus as one manifest (served/browse mode reads this)
entities.json           # build artifact: the demo entities as one manifest
papermap.config.json    # map-wide settings: title, vocabularies, facets, palette, focal authors
papers/<id>.md          # source of truth for each paper (YAML front-matter + ## Abstract / ## Notes)
entities/<id>.md        # source of truth for each entity (dataset / task / tool …)
scripts/sync-demo.mjs   # regenerate the manifests + re-inline the demo consts (zero-dep, run with node)
README.md               # user-facing docs
docs/ARCHITECTURE.md    # this file
CONTRIBUTING.md         # how to set up and contribute
DESIGN_SPEC.md          # local-only design rationale (gitignored, not published)
```

`papers/*.md` and `entities/*.md` are **authoritative**. `index.json` /
`entities.json` are **generated** — see [Data in / data out](#data-in--data-out).

---

## Anatomy of `index.html`

The file is short in *lines* (~2,070) but large in *bytes* (~900 KB) because two
things are inlined as giant single-line literals: the **base64 fonts** (in
`<style>`) and the **demo corpus** (`DEMO`, `CFG_DEMO`, `ENT_DEMO` consts).

Top-level structure:

| Lines (approx) | Region | What lives there |
|---|---|---|
| `1–12` | `<head>` meta | charset, viewport, title |
| `13–513` | `<style>` | fonts, design tokens, theme, every component's CSS |
| `515–516` | `<body>` | a single `<div id="root">` — the entire UI mounts here |
| `518–2066` | `<script>` | the whole application |

The script is organized into clearly-bannered sections. **Navigate by the
banners, not by line number** — search for `/* ===== ` or `/* ====`. Line numbers
below are approximate anchors that will drift as the file changes; the banner
text is stable.

| Banner | ~Line | Responsibility |
|---|---|---|
| Inlined demo corpus | 520 | `DEMO`, `CFG_DEMO` — offline first-run paper + config data (a hand-synced copy of the `*.json` manifests; `ENT_DEMO` sits with the `S` atom under **State**) |
| Utilities | 524 | `$`, `esc`, `safeUrl`, `darken`, colour scales, `ICON`/`LOGO` SVGs |
| YAML front-matter parser | 566 | `parseFrontMatter`, `parseScalar`, `parseFlowList`, `normalizePaper`, `KNOWN_FM`/`STMAP` — **data in** |
| serialize back to markdown | 674 | `serializePaper`, `buildIndex` — **data out** |
| State | 725 | `ENT_DEMO` + the `S` atom |
| Derive | 736 | `deriveCorpus` — recompute everything cached from `S.corpus`; a `/* ---- facet helpers ---- */` sub-banner (`facetDefs`, `entityFacets`, `facetVals`, …) follows |
| Mode badge / Filtering | 812 / 827 | `modeChip`, `saveRead`, `filteredCorpus`, `sortPapers` |
| Render: shell | 854 | `render`, `manageDialogFocus`, `subheader`, `tab`, `viewHTML` — the top-level redraw |
| Library / Detail panel / Review | 1016 / 1080 / 1160 | `libraryHTML`, `rowHTML`, `panelHTML`, `reviewHTML`, kanban |
| Map | 1190 | `renderMap` + the three lenses: `renderFacet`, `renderTimeline`, `renderPeople` |
| Welcome | 1452 | the LLM enrichment `PROMPT` and `helpHTML` (the **"How papers get in"** panel) |
| BibTeX / RIS import | 1504 | `parseBibtex`, `parseRis`, `parseRefs`, `importHTML`, `importCommit`, `modalHTML` |
| Recent maps | 1612 | IndexedDB helpers `idbGet`/`idbSet`, `saveRecent`, `openRecent` |
| File-format reference | 1643 | `formatHTML` (the in-app **"How the files work"** docs) and `welcomeHTML` (the welcome screen) |
| Runtime: load modes | 1759 | `loadDemo`, `loadFromManifest`, `pickFolder`, `loadFromDir`, then the **save loop** — `scheduleSave`/`doSave` for papers and a `/* ---- entity editing ---- */` sub-banner (`serializeEntity`, `scheduleSaveEntity`/`doSaveEntity`) |
| Mutations | 1861 | `mutate`, `cycleStatus`, `setStatus` |
| Events | 1866 | `onClick` (delegated dispatch) + all document-level listeners + keyboard |
| Boot | 2055 | the IIFE that detects mode, restores theme, and does first render |

---

## State: the `S` atom

Everything is in one object near the `/* ===== State ===== */` banner:

```js
const S = {
  mode: "welcome",        // welcome | demo | browse | edit | memory  (see Modes)
  corpus: [],             // array of in-memory paper objects (the source of truth at runtime)
  entities: {},           // id -> entity object
  config: {},             // papermap.config.json contents
  view: "library",        // library | review | map | entities  (which tab)
  lens: "methods",        // methods | timeline | people  (which Map lens)
  facetKey: "methods",    // active "group by" facet on the Map
  selectedId: null,       // open paper detail panel (paper id)
  selectedEntity: null,   // open entity panel (entity id)
  filters: { methods:Set, modalities:Set, statuses:Set, projects:Set, fx:{}, search:"" },
  sort, density, theme, showRings, showExternal, zoom, …  // view prefs
  dirHandle, fileHandles, fileMeta, papersDirHandle,      // File System Access handles (edit mode)
  entHandles, entDirHandle,                               // … for entities
  saveState: "saved",     // saved | saving | error | conflict
  modal: null,            // help | import | format  (which modal is open)
  derived: {},            // CACHE — rebuilt by deriveCorpus(), never hand-edited
};
```

Two rules about `S`:

- **`S.corpus` / `S.entities` / `S.config` are inputs; `S.derived` is output.**
  Never write to `S.derived` directly. After any change to the corpus, call
  `deriveCorpus()` to recompute it.
- **`S` is module-global and mutated in place.** There is no immutability
  discipline; handlers mutate `S` then call `render()`.

### `deriveCorpus()` — the recompute step

`deriveCorpus()` reads `S.corpus` (+ `config`, `entities`) and fills
`S.derived` with everything the views need but shouldn't recompute on every
render:

- `indeg` — in-degree from `builds_on` (lineage roots vs. descendants)
- `mv` — per-modality visual map (`{color, stroke, shape}`), theme-aware
- `val` — per-paper validation (`errs`/`warns`: missing fields, broken links, off-vocab tags, duplicate ids)
- `authors` / `edges` — author records and co-authorship edges (drives the People lens)
- `entityUsage` — for each entity, which papers reference it; **also auto-stubs**
  any facet value that's referenced but has no `entities/<id>.md` yet

Call it after loading, after any mutation, and on theme change (colours depend
on theme).

---

## The render pipeline

```
user interaction
      │
      ├─ handler mutates S  (e.g. S.view = "map")
      │
      └─ render()                         ← full redraw of #root
            ├─ welcome? → welcomeHTML()
            └─ otherwise:
                 #root.innerHTML = header + subheader() + <main>viewHTML()…</main> + modal
                 wireShell()              ← (re)attach the ONE delegated onClick + search oninput
                 manageDialogFocus()      ← move focus into a newly-opened panel/modal (a11y)
                 if view==="map":
                     requestAnimationFrame(renderMap)   ← SVG is rendered + wired separately
```

Key points:

- **`render()` rebuilds the whole shell** by assigning `innerHTML`. All previous
  DOM (and its inline handlers) is discarded. This is why there are no
  `addEventListener` calls scattered through the HTML-building functions.
- **`viewHTML()` is the view router** — a tiny switch on `S.view` returning the
  right `…HTML()` string.
- **`wireShell()` re-attaches `#root.onclick = onClick`** plus the search box's
  `oninput`. The search input updates the list in place (without a full re-render)
  for responsiveness; everything else goes through `render()`.
- **The Map is special.** SVG is heavy and needs measured dimensions, so it's
  rendered *after* the shell, inside `requestAnimationFrame`, by `renderMap()`,
  and its interactions (hover tooltips, pan, zoom) are wired by `wireMap()` with
  real `addEventListener`s on the SVG — not via the delegated `onClick`.

### Event delegation

`onClick(e)` (under `/* ===== Events ===== */`) is the heart of interaction. It
walks up from `e.target` to the nearest element carrying a known `data-*` hook,
then dispatches:

- Structural attributes set state and re-render directly: `data-tab` (switch
  view), `data-lens`, `data-row`/`data-card`/`data-node` (open a paper),
  `data-opt` (toggle a filter), `data-facet` (collapse a group), …
- `data-act="…"` routes through the big `switch(act)` for everything else
  (`pickfolder`, `loaddemo`, `cyclestatus`, `zoomin`, `theme`, `help`, …).

To **add an interactive control**: emit an element with the right `data-*`
attribute in the HTML-building string, then add a case for it. For keyboard
accessibility, non-native controls (`div`/`span`/`g`) are made operable by a
second `keydown` listener that mirrors Enter/Space to `onClick` — so give such
controls `tabindex="0"` and a `role`.

---

## Data in / data out

The on-disk format *is* the data model. Conversions live at two banners.

### In: file → memory

```
papers/<id>.md ──parseFrontMatter()──▶ {fm, sec} ──normalizePaper()──▶ paper object
index.json / DEMO record ─────────────────────────fromRecord()────────▶ paper object
```

- `parseFrontMatter(text)` is a **targeted** YAML reader (not a general YAML
  library): it handles `key: scalar`, flow lists `[a, b]`, block lists (`- item`
  and `- key: val` mappings), and splits the Markdown body into `## Section`
  buckets (`sec.abstract`, `sec.notes`). It intentionally supports only the
  subset Paper Map emits.
- `normalizePaper(fm, sec)` maps raw front-matter to the canonical in-memory
  shape: coerces `authors` to `{name}` objects, pulls unknown array fields into
  `paper.facets` (this is how config-declared facets like `datasets`/`tasks` flow
  through with zero code change), migrates legacy `status` values
  (`draft→unverified`, `reviewed→verified`, `needs_fixing→flagged`), and defaults
  `abstract`/`notes` from the body sections.

### Out: memory → file

```
paper object ──serializePaper()──▶ papers/<id>.md   (written via File System Access)
S.corpus     ──buildIndex()──────▶ index.json        (the manifest browse mode reads)
entity       ──serializeEntity()─▶ entities/<id>.md
```

`serializePaper` is the inverse of the parser and **defines the canonical field
order and quoting**. It always stamps `updated:` to today and writes
`schema_version: "1.0"`. If you add a field to the data model, you generally
touch three places: `KNOWN_FM` (so it isn't misfiled as a facet), `normalizePaper`
(read it), and `serializePaper` (write it) — plus `buildIndex` if it should land
in the manifest.

---

## Modes and load paths

`S.mode` decides what the app can do. It's set by *how the data was loaded*:

| Mode | How you get there | Persistence |
|---|---|---|
| `welcome` | no data yet (first paint, `file://` with no folder chosen) | — |
| `demo` | **Load demo** → `loadDemo()` reads the inlined `DEMO`/`CFG_DEMO`/`ENT_DEMO` | none ("nothing is saved") |
| `browse` | served over http(s) → `loadFromManifest()` `fetch`es `index.json` (+ config + entities) | read-only |
| `edit` | **Choose folder** → `pickFolder()`/`loadFromDir()` via File System Access API | autosaves to `.md` |
| `memory` | imported `.bib`/`.ris` not yet saved to a folder | unsaved |

Boot logic (the IIFE at `/* ===== Boot ===== */`):

- restores theme from `localStorage`,
- loads recent-folder list from IndexedDB,
- if `location.protocol` is `http(s)`, attempts `loadFromManifest()` (this is how
  a **published GitHub Pages** map auto-loads),
- otherwise stays on the welcome screen, and on `file://` shows a toast
  explaining that a published map's data only loads when *served*.

This is the crux of the **`file://` caveat**: `fetch("index.json")` only works
over http(s). Local editing uses the File System Access API instead (Chromium
only — `welcomeHTML`/`pickFolder` guard on `window.showDirectoryPicker`), which
reads the files directly and needs no server.

---

## The save loop (edit mode)

Edits never write synchronously. The flow:

```
handler ─▶ mutate(p, fn)           // applies fn(p), stamps p.updated, calls scheduleSave(p)
              └▶ scheduleSave(p)    // sets saveState="saving", deriveCorpus(), debounce 500ms
                    └▶ doSave(p)    // after the debounce settles
                          ├─ read the file's current lastModified
                          ├─ if it's newer than what we loaded ⇒ saveState="conflict", abort
                          ├─ else write serializePaper(p) via a FileSystemWritableFileStream
                          └─ saveState="saved"; renderStatus()
```

- **Debounced** (`_saveTimer`, 500 ms) so rapid edits coalesce into one write.
- **Conflict-aware**: `S.fileMeta[id]` stores the `lastModified` at load/last-save;
  if the on-disk file changed underneath us (>1 s newer), we refuse to clobber and
  surface a conflict instead.
- `renderStatus()` patches just the status pill (`.statusread`) rather than doing
  a full `render()`, to avoid flashing the UI on every save.
- Entities have a parallel pair (`scheduleSaveEntity`/`doSaveEntity`) that
  lazily creates `entities/` and the file handle on first save.

Outside `edit` mode, `scheduleSave` just re-derives and returns (nothing to write).

---

## The Map and its three lenses

`renderMap()` (under the Map banner) measures the container, sets up the SVG, and
delegates to one of three lens renderers based on `S.lens`:

- **`renderFacet(key, W, H)`** — the "Methods & modality" lens. Groups nodes into
  lanes by the active facet (`S.facetKey`), colours by modality, optionally draws
  edges between papers that share a linked facet value (`Link shared`, enabled per
  facet via `link: true`).
- **`renderTimeline(W, H)`** — lays nodes out along a year axis and draws
  `builds_on` arrows (lineage).
- **`renderPeople(W, H)`** — a co-authorship graph from `S.derived.authors` /
  `edges`; clicking an author "springs out" their papers (`S.expandedAuthor`).

Pan/zoom live in `S.zoom = {k, tx, ty}` and are applied through `mapTransform()`
on the SVG's root `<g>`; `wireMap()` attaches wheel-zoom and drag-pan. Because the
map is re-rendered on its own, remember `hideTip()` at the top of `render()` —
a full re-render destroys the hovered node before its `mouseleave` fires, which
would otherwise orphan the tooltip.

---

## Facets and entities (config-driven)

This is the one genuinely extensible subsystem, and it's worth understanding
because it's how the app gains new dimensions **without code changes**.

A *facet* is declared once in `papermap.config.json`:

```json
{ "key": "datasets", "label": "Datasets", "singular": "dataset", "entity": true, "link": true }
```

From that single line, the helpers under `/* ---- facet helpers ---- */`
(`facetDefs`, `entityFacets`, `facetVals`, `facetOf`) make the facet show up as a
Library filter, a chip row in the detail panel, a "Group by" option on the Map,
and (with `link: true`) a "Link shared" toggle. A paper just lists ids:
`datasets: [imagenet]`. `normalizePaper` routes any unknown array field into
`paper.facets`, so no parser change is needed either.

A facet value can be a bare tag or a full **entity** (`entities/<id>.md`). Values
that are referenced but undescribed are **auto-stubbed** in `deriveCorpus()` so
they still appear (as stubs) under the Entities tab.

---

## Cross-cutting conventions

- **Escaping.** All interpolated user/data text must go through `esc()` when
  built into an HTML string, and any URL through `safeUrl()` / `isHttp()` before
  becoming an `href`/`window.open`. This is the app's only XSS defense — there's
  no framework auto-escaping. When you write a new `…HTML()` builder, wrap every
  dynamic value.
- **Theming.** Colours are CSS custom properties under `:root` /
  `[data-theme=dark]`. `applyTheme()` flips the attribute and persists to
  `localStorage`. Data-visualization colours are theme-aware in JS (`MODALITY_DARK`
  / `SCALE_DARK`), so `deriveCorpus()` must rerun on theme change.
- **Accessibility.** Non-native controls carry `role`/`tabindex` and are activated
  via the Enter/Space→`onClick` mirror; opening a panel/modal moves focus
  (`manageDialogFocus`); there's a skip link and `aria-*` on tabs. Preserve these
  when editing markup.
- **Offline / zero-network.** No CDN, no analytics, no fonts-from-Google. Fonts
  are inlined base64. Do not introduce a network dependency — it breaks the core
  promise (and the `file://` and air-gapped use cases).

---

## Gotchas and invariants

- **The inlined demo is a *copy*.** `DEMO` / `CFG_DEMO` / `ENT_DEMO` in
  `index.html` duplicate `index.json` / `papermap.config.json` / `entities.json`,
  which in turn derive from `papers/*.md` and `entities/*.md`. The app rebuilds
  `index.json` from `.md` on save in edit mode, but it **never rewrites the
  inlined constants** — so editing the demo silently drifts the offline copy.
  After any change to the demo corpus, run **`node scripts/sync-demo.mjs`** to
  regenerate the manifests and re-inline the constants (and
  `node scripts/sync-demo.mjs --check` in CI to fail on drift). The script ports
  this file's `parseFrontMatter`/`normalizePaper`/`buildIndex` logic, so keep it
  in step if you change the front-matter format.
- **`render()` discards the DOM.** Don't stash state in DOM nodes or attach
  long-lived listeners inside HTML-builder functions; they won't survive the next
  redraw. State belongs in `S`; listeners belong in `wireShell`/`wireMap` or as
  document-level delegates.
- **Always `deriveCorpus()` after mutating the corpus** (and on theme change), or
  the views read stale `S.derived`.
- **`DESIGN_SPEC.md` is gitignored.** It's a rich local-only design rationale, not
  part of the published repo — link to it for context if you have it, but don't
  make published docs depend on it.

---

## "I want to change X" → where to look

| Goal | Start at |
|---|---|
| Add/rename a paper field | `KNOWN_FM`, `normalizePaper`, `serializePaper`, (`buildIndex`) |
| Add a new facet/dimension | `papermap.config.json` `facets[]` — usually *no code* |
| Add a toolbar button / action | emit `data-act` in the relevant `…HTML()`, add a `case` in `onClick` |
| Change a Map lens | `renderFacet` / `renderTimeline` / `renderPeople` |
| Tweak the detail panel | `panelHTML` (+ `relItem`, tag-evidence popover) |
| Change save behavior | `scheduleSave` / `doSave` |
| Add a new load source | follow `loadFromManifest` / `loadFromDir`, set `S.mode` |
| Restyle / theme | `<style>` tokens at the top; `MODALITY_DARK`/`SCALE` for data colours |
| Edit the in-app docs | `helpHTML` / `formatHTML` |

When in doubt: `grep` for the banner (`/* ====`) nearest the feature, and read
that section top-to-bottom — each is self-contained.
