#!/usr/bin/env node
/**
 * sync-demo.mjs — keep the demo data in its three homes in sync.
 *
 * Paper Map ships the demo corpus in THREE places that must agree:
 *   1. papers/*.md + entities/*.md   ← authoritative source of truth
 *   2. index.json + entities.json    ← manifests that served ("browse") mode fetches
 *   3. DEMO / ENT_DEMO / CFG_DEMO     ← constants inlined in index.html for offline first-run
 * (papermap.config.json is hand-authored and feeds both CFG_DEMO and the manifest title.)
 *
 * The app rebuilds (2) from (1) when you save in edit mode, but nothing keeps (3)
 * in sync — so editing the demo by hand silently drifts the offline copy. This
 * script regenerates (2) from (1) and re-inlines (3), closing that gap.
 *
 * Usage:
 *   node scripts/sync-demo.mjs          # regenerate + re-inline (writes files)
 *   node scripts/sync-demo.mjs --check  # verify everything is in sync; exit 1 if not
 *
 * Zero dependencies. Run it with plain `node` — there is no package.json by design.
 *
 * NOTE: the YAML front-matter parsing below MIRRORS the targeted parser in
 * index.html (parseFrontMatter / normalizePaper). If you change the front-matter
 * format in the app, mirror the change here. These functions are intentionally
 * NOT a general YAML library — they support only the subset Paper Map emits.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

/* ===== targeted YAML front-matter parser (mirror of index.html) ===== */
function parseScalar(v) {
  v = v.trim();
  if (v === "") return "";
  if ((v[0] === '"' && v.slice(-1) === '"') || (v[0] === "'" && v.slice(-1) === "'"))
    return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d*\.\d+$/.test(v)) return parseFloat(v);
  return v;
}
function parseFlowList(v) {
  v = v.trim();
  if (v === "[]" || v === "") return [];
  if (v[0] === "[" && v.slice(-1) === "]") v = v.slice(1, -1);
  const out = [];
  let cur = "", q = null;
  for (const ch of v) {
    if (q) { if (ch === q) q = null; else cur += ch; }
    else if ((ch === '"' || ch === "'") && cur.trim() === "") q = ch;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  if (cur.trim() !== "") out.push(cur);
  return out.map(parseScalar).filter((x) => x !== "");
}
const indent = (l) => l.length - l.replace(/^ +/, "").length;
function parseFrontMatter(text) {
  let fm = "", body = "";
  const t = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const m = t.match(/^\s*---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) { fm = m[1]; body = m[2] || ""; } else { body = t; }
  const obj = {};
  const lines = fm.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) { i++; continue; }
    const mm = line.match(/^([A-Za-z0-9_]+):(.*)$/);
    if (!mm) { i++; continue; }
    const key = mm[1];
    const rest = mm[2].trim();
    if (rest !== "") {
      obj[key] = rest[0] === "[" ? parseFlowList(rest) : parseScalar(rest);
      i++;
      continue;
    }
    const base = indent(line);
    const items = [];
    let j = i + 1;
    while (j < lines.length) {
      const ln = lines[j];
      if (!ln.trim()) { j++; continue; }
      if (indent(ln) <= base) break;
      const it = ln.trim();
      if (it.startsWith("- ")) {
        const first = it.slice(2);
        const km = first.match(/^([A-Za-z0-9_]+):(.*)$/);
        if (km) {
          const o = {};
          o[km[1]] = parseScalar(km[2]);
          let k = j + 1;
          const itemIndent = indent(ln);
          while (k < lines.length) {
            const sub = lines[k];
            if (!sub.trim()) { k++; continue; }
            if (indent(sub) <= itemIndent) break;
            const sm = sub.trim().match(/^([A-Za-z0-9_]+):(.*)$/);
            if (sm) o[sm[1]] = parseScalar(sm[2]);
            k++;
          }
          items.push(o);
          j = k;
          continue;
        } else { items.push(parseScalar(first)); j++; continue; }
      }
      j++;
    }
    obj[key] = items;
    i = j;
  }
  const sec = {};
  let curh = null;
  const buf = [];
  for (const ln of body.split("\n")) {
    const h = ln.match(/^##\s+(.+)$/);
    if (h) { if (curh) sec[curh] = buf.join("\n").trim(); curh = h[1].trim().toLowerCase(); buf.length = 0; }
    else if (curh) buf.push(ln);
  }
  if (curh) sec[curh] = buf.join("\n").trim();
  return { fm: obj, sec };
}

const KNOWN_FM = new Set(["id", "title", "label", "authors", "year", "venue", "doi", "url", "pdf", "modality", "methods", "key_finding", "abstract", "related", "builds_on", "see_also", "projects", "status", "tag_evidence", "notes", "added", "updated", "schema_version"]);
const STMAP = { draft: "unverified", reviewed: "verified", needs_fixing: "flagged" };

function normalizePaper(fm, sec) {
  const authors = (fm.authors || []).map((a) => (typeof a === "string" ? { name: a } : a));
  const facets = {};
  for (const k in fm) if (!KNOWN_FM.has(k) && Array.isArray(fm[k])) facets[k] = fm[k].map(String);
  return {
    id: fm.id, title: fm.title || "(untitled)", label: fm.label || "", authors, facets,
    year: fm.year, venue: fm.venue || "", doi: fm.doi || "", url: fm.url || "", pdf: fm.pdf || "",
    modality: fm.modality || "", methods: fm.methods || [],
    key_finding: fm.key_finding || "", abstract: (sec && sec.abstract) || fm.abstract || "",
    builds_on: fm.builds_on || fm.related || [], see_also: fm.see_also || [],
    projects: fm.projects || [], status: STMAP[fm.status] || fm.status || "unverified",
    tag_evidence: Array.isArray(fm.tag_evidence) ? fm.tag_evidence : [],
    notes: (sec && sec.notes) || fm.notes || "",
    added: fm.added || "", updated: fm.updated || "",
  };
}

/* buildIndex() record shape from index.html — undefined keys are dropped by JSON.stringify */
function indexRecord(p) {
  return {
    id: p.id, title: p.title, label: p.label || undefined, authors: p.authors, year: p.year,
    venue: p.venue, doi: p.doi || undefined, url: p.url || undefined, pdf: p.pdf || undefined,
    modality: p.modality, methods: p.methods, key_finding: p.key_finding, abstract: p.abstract,
    builds_on: p.builds_on, see_also: p.see_also, projects: p.projects, status: p.status,
    tag_evidence: p.tag_evidence, notes: p.notes || undefined,
    added: p.added || undefined, updated: p.updated || undefined,
    ...(p.facets || {}),
  };
}

/* entity record (flat) — mirror of fromEntityFm + entities.json shape */
function entityRecord(fm, sec, fallbackId) {
  const rec = {
    id: fm.id || fallbackId,
    type: fm.type || "entity",
    name: fm.name || fm.id || fallbackId,
    description: (sec && sec.description) || "",
  };
  for (const k in fm) if (!["id", "type", "name", "schema_version"].includes(k)) rec[k] = fm[k];
  return rec;
}

/* ===== helpers ===== */
function readJSON(path) { return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null; }
function mdFiles(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).sort() : [];
}
/** preserve a file's existing trailing-newline convention so diffs stay minimal */
function withTrailing(text, prevText) {
  const had = prevText != null && prevText.endsWith("\n");
  return had ? text + "\n" : text;
}
/** order ids by their position in a previous manifest; unknown ids fall to the end */
function orderBy(prevIds) {
  return (a, b) => {
    const ia = prevIds.indexOf(a), ib = prevIds.indexOf(b);
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  };
}

/* ===== build ===== */
function build() {
  const config = readJSON(join(ROOT, "papermap.config.json")) || {};

  // papers -> index.json manifest
  const prevIndex = readJSON(join(ROOT, "index.json"));
  const papers = mdFiles(join(ROOT, "papers")).map((f) => {
    const { fm, sec } = parseFrontMatter(readFileSync(join(ROOT, "papers", f), "utf8"));
    if (!fm.id) fm.id = basename(f, ".md");
    return indexRecord(normalizePaper(fm, sec));
  });
  const prevPaperIds = (prevIndex?.papers || []).map((p) => p.id);
  papers.sort((a, b) => orderBy(prevPaperIds)(a.id, b.id) || (a.year || 0) - (b.year || 0) || a.id.localeCompare(b.id));
  const manifest = {
    schema_version: "1.0",
    generated: prevIndex?.generated || new Date().toISOString(),
    title: config.title || prevIndex?.title || "",
    papers,
  };

  // entities -> entities.json manifest
  const prevEnt = readJSON(join(ROOT, "entities.json"));
  const entities = mdFiles(join(ROOT, "entities")).map((f) => {
    const { fm, sec } = parseFrontMatter(readFileSync(join(ROOT, "entities", f), "utf8"));
    return entityRecord(fm, sec, basename(f, ".md"));
  });
  const prevEntIds = (prevEnt?.entities || []).map((e) => e.id);
  entities.sort((a, b) => orderBy(prevEntIds)(a.id, b.id) || a.id.localeCompare(b.id));
  const entManifest = {
    schema_version: "1.0",
    generated: prevEnt?.generated || new Date().toISOString(),
    entities,
  };

  // re-inline the three consts into index.html
  const htmlPath = join(ROOT, "index.html");
  const prevHtml = readFileSync(htmlPath, "utf8");
  let html = prevHtml;
  html = inlineConst(html, "DEMO", manifest);
  html = inlineConst(html, "CFG_DEMO", config);
  html = inlineConst(html, "ENT_DEMO", entManifest);

  return {
    files: [
      { path: join(ROOT, "index.json"), text: withTrailing(JSON.stringify(manifest, null, 2), prevIndex && readFileSync(join(ROOT, "index.json"), "utf8")) },
      { path: join(ROOT, "entities.json"), text: withTrailing(JSON.stringify(entManifest, null, 2), prevEnt && readFileSync(join(ROOT, "entities.json"), "utf8")) },
      { path: htmlPath, text: html },
    ],
    counts: { papers: papers.length, entities: entities.length },
  };
}

function inlineConst(html, name, obj) {
  const re = new RegExp(`^const ${name} = .*$`, "m");
  if (!re.test(html)) throw new Error(`sync-demo: could not find 'const ${name} = …;' in index.html`);
  return html.replace(re, `const ${name} = ${JSON.stringify(obj)};`);
}

/* ===== main ===== */
const { files, counts } = build();

if (CHECK) {
  const stale = files.filter((f) => !existsSync(f.path) || readFileSync(f.path, "utf8") !== f.text);
  if (stale.length) {
    console.error("✗ Demo data is OUT OF SYNC. Run: node scripts/sync-demo.mjs");
    for (const f of stale) console.error("  - " + f.path.replace(ROOT + "/", ""));
    process.exit(1);
  }
  console.log(`✓ Demo data in sync (${counts.papers} papers, ${counts.entities} entities).`);
} else {
  let changed = 0;
  for (const f of files) {
    const prev = existsSync(f.path) ? readFileSync(f.path, "utf8") : null;
    if (prev !== f.text) { writeFileSync(f.path, f.text); changed++; console.log("  updated " + f.path.replace(ROOT + "/", "")); }
  }
  console.log(changed
    ? `✓ Synced ${counts.papers} papers, ${counts.entities} entities — ${changed} file(s) updated.`
    : `✓ Already in sync (${counts.papers} papers, ${counts.entities} entities) — nothing to write.`);
}
