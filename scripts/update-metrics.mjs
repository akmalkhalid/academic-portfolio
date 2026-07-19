// ============================================================================
//  Build-time citation-metrics updater — OpenAlex (free, no API key).
//
//  Writes content/metrics.auto.json, which the site reads to show a live
//  citation figure ALONGSIDE the manual Google Scholar headline number.
//  Keyed off your ORCID, so it is stable and works from CI with no secrets.
//
//  Runs BEFORE `next build` in the deploy workflow (and on a weekly cron).
//  DEGRADES GRACEFULLY: any network/parse error leaves the existing
//  metrics.auto.json untouched and exits 0 — it can never break the deploy.
//
//  Optional env overrides: ORCID, OPENALEX_MAILTO (OpenAlex "polite pool").
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'content', 'metrics.auto.json')
const ORCID = process.env.ORCID || '0000-0002-7909-8869'
const MAILTO = process.env.OPENALEX_MAILTO || 'akmal@ukm.edu.my'
const url = `https://api.openalex.org/authors/orcid:${ORCID}?mailto=${encodeURIComponent(MAILTO)}`

function keep(msg) {
  console.warn(`[metrics] ${msg} — keeping existing metrics.auto.json`)
  process.exit(0)
}

try {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) keep(`OpenAlex returned HTTP ${res.status}`)
  const data = await res.json()
  // /authors/orcid:… returns the entity directly; the filter form nests under results[]
  const rec = data && data.cited_by_count != null ? data : (data && data.results && data.results[0]) || {}
  const citations = Number(rec.cited_by_count)
  const stats = rec.summary_stats || {}
  const hIndex = stats.h_index != null && Number.isFinite(Number(stats.h_index)) ? Number(stats.h_index) : null
  const i10 = stats.i10_index != null && Number.isFinite(Number(stats.i10_index)) ? Number(stats.i10_index) : null
  if (!Number.isFinite(citations)) keep('could not parse cited_by_count from the OpenAlex response')

  const out = {
    citations,
    hIndex,
    i10Index: i10,
    source: 'OpenAlex',
    updated: new Date().toISOString().slice(0, 10),
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`[metrics] OpenAlex citations=${citations} h-index=${hIndex} i10=${i10} → metrics.auto.json`)
} catch (e) {
  keep(`fetch failed: ${e && e.message ? e.message : e}`)
}
