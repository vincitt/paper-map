# Paper Map

**Map your own curated set of papers — offline, in plain files you own.**

Paper Map is a free, open-source web app — shipped as a *single HTML file with zero dependencies* — for visualizing and navigating a bounded collection of academic papers (a lab's output, a reading list, a subfield, a syllabus) across three lenses:

- **Methods & modality** — which techniques recur, and where they branch off
- **Timeline / lineage** — how ideas descend over time
- **People & collaboration** — who worked with whom

Your data lives in plain Markdown files you own. Nothing is uploaded; there's no account and no database. You can browse a map locally, or publish it as a static webpage anyone can explore.

> It is **not** a reference manager (Zotero) and **not** an online citation-graph explorer (Connected Papers, ResearchRabbit). You bring your *own* tens-to-low-hundreds of papers; Paper Map shows the **shape** of that set — and you keep the data as files.

---

## Status

✅ v1 ships as a single self-contained, zero-dependency [`index.html`](index.html) — open it in a browser and click **Load demo**, or **Choose folder** (Chrome/Edge) to edit your own papers. The repo also ships:

- a working **demo corpus** in [`papers/`](papers/) — the foundations of modern deep learning, 1998→2020 (LeNet → AlexNet → ViT; seq2seq → attention → Transformer → BERT/GPT-3), also inlined into `index.html` for offline first-run
- the generated [`index.json`](index.json) manifest
- the project config [`papermap.config.json`](papermap.config.json)

Known v1.1 follow-ups: deeper in-panel field editing (author rows, provenance editor, in-app lineage-link autocomplete), a full Settings panel and a persistent in-app help entry point (today the help panels open only from the welcome screen / map switcher), on-focus external-change detection, and hiding the status pill in read-only browse mode.

---

## Browse a published map

Just open the project's GitHub Pages URL. Nothing to install. (Published maps are read-only.)

## Make your own

1. **Use this template / Fork** the repo.
2. Replace the files in `papers/` with your own (see [Adding papers](#adding-papers)).
3. Edit locally, then publish (below).

## Multiple maps

**A map is a folder.** Keep separate maps for separate things (e.g. one per project, lab, or reading list) — each is its own folder with its own `papers/`, `entities/`, and `papermap.config.json`. Click the **corpus title** in the header (or use the welcome screen) to switch between **Recent maps**, open a new folder, or load the demo. Recently-opened folders are remembered between sessions (in your browser, Chrome/Edge); switching back re-asks for folder permission.

The welcome screen and the map switcher both open an in-app **"How the files work"** reference (folder layout, an annotated paper file, the field table, and the config format).

## Edit locally

Editing uses the browser's File System Access API, so it needs a **Chromium browser (Chrome or Edge)**.

1. Open `index.html` (double-click, or serve it).
2. Click **Choose folder** and pick this repo's folder.
3. Edits autosave back to the `.md` files. Use the **Review** board to move papers from *Unverified* → *Verified* (or *Flagged* if something needs work).

## Adding papers

Every paper is one Markdown file with YAML front-matter at `papers/<id>.md`. The **schema is the only contract** — create records however you like, all three ways produce identical files:

- **Import from a reference manager** — export your Zotero / Mendeley / EndNote library as **BibTeX** (`.bib`) or **RIS** (`.ris`) and import it (welcome screen → *Import .bib / .ris*, or the **How papers get in** panel). Each reference comes in as *Unverified* (title, authors, year, venue, DOI) and lands in the **Review** queue, ready to enrich. The fastest way to seed a corpus.
- **By hand** — copy an existing file in `papers/` and edit the fields.
- **With any LLM** — paste a paper's text plus the enrichment prompt (the **How papers get in** panel has a **Copy prompt** button) into Claude or any model; it returns a ready-to-save record. Every AI-suggested tag carries a **source quote** (provenance) so you can verify it in seconds.
- **With a script** — anything that writes the same YAML works.

A minimal record:

```markdown
---
id: smith-2021-sparse-attention
title: "Sparse Attention for Long Documents"
authors:
  - name: "A. Researcher"
year: 2021
venue: "ICLR"
modality: "text"
methods: ["transformer", "self-attention"]
key_finding: "Sparse attention scales transformers to book-length context."
builds_on: [vaswani-2017-transformer]
status: unverified
---

## Abstract
We study attention patterns that let transformers process long documents...
```

Key fields: `id`, `title`, `authors`, `year` are required; `methods`/`modality` drive the Methods lens; `builds_on` (directed) drives the Timeline lineage; `see_also` is undirected; `status` is `unverified | verified | flagged` (the Review workflow; legacy `draft`/`reviewed`/`needs_fixing` are auto-migrated). Map-wide settings (title, controlled vocabularies, focal authors, palette) live in `papermap.config.json`. Full field reference: the in-app **How the files work** panel (open it from the welcome screen or the map switcher).

## Typed facets & entities (datasets, tasks, tools…)

Beyond `methods`, you can say *"this paper used this dataset, addressed this task,"* and so on — **declare a facet type once in config, with zero code change.** In `papermap.config.json`:

```json
"facets": [
  { "key": "methods",  "label": "Methods",  "singular": "method"  },
  { "key": "datasets", "label": "Datasets", "singular": "dataset", "entity": true, "link": true },
  { "key": "tasks",    "label": "Tasks",    "singular": "task",    "entity": true, "link": true }
]
```

Then a paper just lists ids: `datasets: [imagenet, jft300m]`, `tasks: [image-classification]`. Each declared facet automatically becomes a **filter** in the Library, a **chip row** in the detail panel, and a **"Group by"** option on the Map. Add any new type you like — `tools`, `populations`, `atlases` — by adding a line to `facets` and the field to your papers.

A facet value can be a plain tag, or a **full entity record** with metadata and a cross-paper rollup. Drop a file at `entities/<id>.md`:

```markdown
---
id: imagenet
type: dataset
name: "ImageNet (ILSVRC)"
modality: vision
size: "1.2M images / 1000 classes"
access: open
url: https://image-net.org
---
## Description
Large-scale labelled image database…
```

Entities show up under the **Entities** tab (browse by type, sorted by usage) and open a panel listing **every paper that uses them**. Values you reference but haven't described yet appear as lightweight *stubs* — enrich them whenever. On the Map, set **Group by → Datasets** and toggle **Link shared** to draw connections between papers that used the same dataset (spotting reuse and gaps). `link: true` enables that toggle per facet.

## Publish

1. Commit `index.html`, `papers/`, and `index.json`.
2. Enable **GitHub Pages** for the repo (Settings → Pages → deploy from branch).
3. Share the Pages URL.

> ⚠️ **The `file://` caveat.** A published map loads its data with `fetch()`, which only works over **http(s)** — i.e. when *served* (GitHub Pages or any static host). **Double-clicking a published `index.html` locally will not load the data.** To work locally instead, use **Choose folder** (Chromium) which reads the files directly. The bundled demo corpus is inlined into `index.html`, so first-run always works offline.

## Regenerating `index.json`

`index.json` is a build artifact rebuilt from the `papers/*.md` files (the app does this on save, with a "Rebuild index" action). It's the only thing a published/browse-mode visitor loads, since a static host can't list a folder.

---

## Browser support

| | Edit (Choose folder) | Browse |
|---|---|---|
| Chrome / Edge | ✅ | ✅ |
| Firefox / Safari | — (browse only) | ✅ |

## Your data is yours

It's just files — Markdown, YAML, JSON. Diff them, PR them, keep them in any repo, move them anywhere. No lock-in.

## Contributing

The whole app is one dependency-free `index.html` — no build step, no `npm`. Edit it, refresh the browser, open a PR. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for setup and conventions, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the file is organized inside.

## License

[MIT](LICENSE).
