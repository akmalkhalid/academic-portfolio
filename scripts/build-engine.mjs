// Builds the standalone "Living Engine" page: public/engine/index.html  ->  https://akmal.app/engine/
//
// What it does, in order:
//   1. reads the site's own records (publications, projects, students, cv.yml, site.yml)
//   2. reduces them to one compact JSON object
//   3. drops that JSON into scripts/engine-template.html at the /*__DATA__*/null marker
//
// The page itself has no server and no API: charts, the CV builder and the assistant all
// read this one JSON object in the visitor's browser. Run by `npm run build` (prebuild).
// Run by hand:  node scripts/build-engine.mjs
//
// QUARTILES: taken from the `journals:` list in content/cv.yml (JCR). The `quartile:` field
// in content/publications/*.md is NOT used here until both files agree.
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import matter from 'gray-matter'

const C = path.join(process.cwd(), 'content')
const read = (f) => fs.readFileSync(f, 'utf8')
const clean = (s) => String(s).replace(/[{}`]/g, '').replace(/''/g, '"').replace(/--/g, '–').trim()
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60)

// One pillar per record, from its first non-simulation topic tag.
//   eva = Games Informatics & Engagement Modelling   (evaluate)
//   sea = Computational Intelligence & Optimization  (search)
//   gen = Generative & Agentic AI                    (generate)
function pillar(tags = []) {
  for (const t of tags) {
    if (t === 'games-informatics') return 'eva'
    if (t === 'evolutionary-computing' || t === 'optimization') return 'sea'
    if (t === 'generative-ai' || t === 'expert-systems') return 'gen'
  }
  return 'sea'
}

function build() {
  const cv = yaml.load(read(path.join(C, 'cv.yml')))
  const site = yaml.load(read(path.join(C, 'site.yml')))

  // JCR quartile per journal paper, keyed by normalised title.
  const jcr = {}
  for (const j of cv.journals) {
    const m = /\(\d{4}\)\.\s*(.+?)\.\s/.exec(j.cite)
    if (m) jcr[norm(m[1])] = j.q || ''
  }

  const mdFiles = (dir) => fs.readdirSync(path.join(C, dir)).filter((f) => f.endsWith('.md')).sort()

  const pubs = mdFiles('publications').map((f) => {
    const d = matter(read(path.join(C, 'publications', f))).data
    const t = clean(d.title)
    const tags = d.topicTags || []
    let q = d.category === 'Journal' ? jcr[norm(t)] ?? '' : ''
    if (q === 'Scopus') q = 'Sc'
    return {
      t, a: clean(d.authors).split(/\s+and\s+/).map((x) => x.trim()), y: d.year, v: clean(d.venue),
      c: d.category[0], q, d: d.doi || '', f: d.isFirstAuthor ? 1 : 0, s: d.featured ? 1 : 0,
      p: pillar(tags), sim: tags.includes('simulation') ? 1 : 0, g: f.replace(/^md_files_/, '').replace(/\.md$/, ''),
    }
  })

  const year = (v) => (v instanceof Date ? v.toISOString() : String(v || '')).slice(0, 4)
  const grants = mdFiles('projects').map((f) => {
    const d = matter(read(path.join(C, 'projects', f))).data
    return { t: d.title, ag: d.fundingAgency || '', amt: d.amountMyr || 0, role: d.role || '', s: year(d.startDate), e: year(d.endDate), st: d.status || '', p: pillar(d.researchTags) }
  })

  const students = yaml.load(read(path.join(C, 'students', 'students.yml')))
    .filter((x) => x.showPublicly !== false)
    .map((x) => ({ n: x.studentName, t: x.thesisTitle, d: x.degree, st: x.status, y: x.startYear, r: x.role, p: pillar(x.researchTags) }))

  const keep = {}
  for (const k of ['profile', 'education', 'employment', 'awards', 'teaching', 'ip', 'membership', 'service', 'skills', 'selectedPapers']) keep[k] = cv[k]
  keep.meta = Object.fromEntries(['name', 'credential', 'title', 'subtitle', 'affiliation'].map((k) => [k, cv.meta[k]]))

  const data = { pubs, grants, students, cv: keep, metrics: site.metrics }
  const json = JSON.stringify(data).replace(/<\//g, '<\\/')
  const tpl = read(path.join(process.cwd(), 'scripts', 'engine-template.html'))
  if (!tpl.includes('/*__DATA__*/null')) throw new Error('data marker missing from scripts/engine-template.html')
  const out = path.join(process.cwd(), 'public', 'engine')
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(path.join(out, 'index.html'), tpl.replace('/*__DATA__*/null', () => json))

  // The site-wide assistant (public/assistant/widget.js) reads the same records from a small JSON file.
  // `site` is filled in after the build by scripts/index-site.mjs, once the finished pages exist.
  const adir = path.join(process.cwd(), 'public', 'assistant')
  fs.mkdirSync(adir, { recursive: true })
  fs.writeFileSync(path.join(adir, 'data.json'), JSON.stringify({ data, site: null }))

  const n = (q) => pubs.filter((p) => p.q === q).length
  console.log(`[engine] ${pubs.length} publications · ${grants.length} grants · ${students.length} students · JCR Q1 ${n('Q1')} / Q2 ${n('Q2')} -> public/engine/index.html`)
}

// Never break a deploy: on any error keep the previously committed page.
try { build() } catch (e) { console.warn('[engine] skipped:', e.message) }
