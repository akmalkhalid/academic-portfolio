// ============================================================================
//  Fetch real published abstracts by DOI → content/abstracts.auto.json
//
//  For every publication with a DOI, pulls the ACTUAL abstract from OpenAlex
//  (reconstructed from its inverted index), falling back to Crossref. Writes a
//  cache keyed by the clean slug; the per-paper pages read it. A manual abstract
//  written into a paper's markdown body always takes precedence over the cache.
//
//  Run it locally (needs Node + internet), then commit the updated JSON:
//      node scripts/fetch-abstracts.mjs
//  Re-run whenever you add papers — already-cached abstracts are skipped, so it
//  only fetches the new/missing ones. Papers with no machine-readable abstract
//  are simply left out (their page omits the section). Nothing here runs in CI.
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const DIR = path.join(process.cwd(), 'content', 'publications')
const OUT = path.join(process.cwd(), 'content', 'abstracts.auto.json')
const MAILTO = process.env.OPENALEX_MAILTO || 'akmal@ukm.edu.my'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const cleanSlug = (f) => f.replace(/\.md$/, '').replace(/^md_files_/, '')
const bareDoi = (d) => (d || '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')

function fromInverted(inv) {
  if (!inv || typeof inv !== 'object') return ''
  const words = []
  for (const [w, positions] of Object.entries(inv)) for (const pos of positions) words[pos] = w
  return words.join(' ').replace(/\s+/g, ' ').trim()
}
const stripJats = (s) => (s ? s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '')

async function openalex(doi) {
  try {
    const r = await fetch(`https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?mailto=${encodeURIComponent(MAILTO)}`, { headers: { Accept: 'application/json' } })
    if (!r.ok) return ''
    const d = await r.json()
    return fromInverted(d.abstract_inverted_index)
  } catch { return '' }
}
async function crossref(doi) {
  try {
    const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { headers: { Accept: 'application/json', 'User-Agent': `akmal.app abstract fetcher (mailto:${MAILTO})` } })
    if (!r.ok) return ''
    const d = await r.json()
    return stripJats(d?.message?.abstract || '')
  } catch { return '' }
}

const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))
let found = 0, skipped = 0, missing = 0

for (const f of files) {
  const slug = cleanSlug(f)
  if (cache[slug]) { skipped++; continue }              // already have it
  const fm = matter(fs.readFileSync(path.join(DIR, f), 'utf8')).data
  const doi = bareDoi(fm.doi)
  if (!doi) { missing++; continue }
  let abs = await openalex(doi)
  if (!abs) abs = await crossref(doi)
  if (abs && abs.length > 40) { cache[slug] = abs; found++; console.log(`  ✓ ${slug}`) }
  else { missing++; console.log(`  · no abstract for ${slug}`) }
  await sleep(150)                                       // be polite to the APIs
}

fs.writeFileSync(OUT, JSON.stringify(cache, null, 2) + '\n')
console.log(`\n[abstracts] +${found} fetched · ${skipped} already cached · ${missing} unavailable → content/abstracts.auto.json`)
