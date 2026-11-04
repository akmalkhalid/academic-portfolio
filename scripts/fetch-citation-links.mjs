// ============================================================================
//  Build-time citation-link fetcher — OpenAlex (free, no API key).
//
//  Finds which of my papers cite which of my OTHER papers, and writes
//  content/citations.auto.json = { source, updated, edges: [{ from, to }] }
//  (slugs without the md_files_ prefix; `from` cites `to`).
//
//  The 3D publication constellation draws each edge as a stream of particles.
//
//  Runs automatically before every `npm run build` (package.json "prebuild"),
//  so the GitHub Pages deploy refreshes it. Degrades gracefully: offline,
//  blocked or rate-limited → keeps the existing file and exits 0, so a build
//  never fails because of this script. Sends no personal data.
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const PUB_DIR = path.join(ROOT, 'content', 'publications')
const OUT = path.join(ROOT, 'content', 'citations.auto.json')
const BATCH = 40
const TIMEOUT_MS = 15000

const normDoi = (d) =>
  String(d || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:/, '')

function readPapers() {
  return fs.readdirSync(PUB_DIR).filter((f) => f.endsWith('.md')).map((f) => {
    const { data } = matter(fs.readFileSync(path.join(PUB_DIR, f), 'utf8'))
    return { slug: f.replace(/\.md$/, '').replace(/^md_files_/, ''), doi: normDoi(data.doi) }
  }).filter((p) => p.doi)
}

async function getJson(url) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'akmal.app-build (citation links)' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } finally { clearTimeout(t) }
}

async function main() {
  const papers = readPapers()
  const bySlugDoi = new Map(papers.map((p) => [p.doi, p.slug]))
  const works = [] // { id, slug, refs }
  for (let i = 0; i < papers.length; i += BATCH) {
    const batch = papers.slice(i, i + BATCH)
    const filter = 'doi:' + batch.map((p) => encodeURIComponent(p.doi)).join('|')
    const url = `https://api.openalex.org/works?filter=${filter}&per-page=${BATCH + 10}&select=id,doi,referenced_works`
    const data = await getJson(url)
    for (const w of data.results || []) {
      const slug = bySlugDoi.get(normDoi(w.doi))
      if (slug) works.push({ id: w.id, slug, refs: w.referenced_works || [] })
    }
  }
  const idToSlug = new Map(works.map((w) => [w.id, w.slug]))
  const seen = new Set()
  const edges = []
  for (const w of works) {
    for (const ref of w.refs) {
      const to = idToSlug.get(ref)
      if (!to || to === w.slug) continue
      const k = w.slug + '>' + to
      if (seen.has(k)) continue
      seen.add(k); edges.push({ from: w.slug, to })
    }
  }
  const out = { source: 'OpenAlex', updated: new Date().toISOString().slice(0, 10), matched: works.length, edges }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`[citation-links] ${works.length}/${papers.length} papers matched on OpenAlex · ${edges.length} self-citation links`)
}

main().catch((e) => {
  console.warn(`[citation-links] skipped (${e.message || e}); keeping existing ${path.relative(ROOT, OUT)}`)
  process.exit(0)
})
