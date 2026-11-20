// Runs after `next build` (npm "postbuild"). Gives the Living Engine assistant a map of the whole site.
//
//   1. walks the finished static site in out/
//   2. keeps PUBLIC pages only: any page carrying <meta name="robots" content="noindex"> is skipped,
//      so the unlisted talks and workshop kits never reach the assistant
//   3. cuts each page into short passages under its headings
//   4. writes the passages into out/engine/index.html at the /*__SITE__*/null marker
//
// Nothing is sent anywhere: the passages travel inside the page and are searched in the visitor's browser.
// Run by hand after a build:  node scripts/index-site.mjs
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'out')
const ENGINE = path.join(OUT, 'engine', 'index.html')
const MARK = '/*__SITE__*/null'
const MAX_PER_PAGE = 14        // passages kept per page
const MAX_CHARS = 520          // characters kept per passage

// Pages the assistant should not index even though they are public.
const SKIP = [
  /^engine\//,                 // the assistant's own page
  /^404/,
  /^publications\/[^/]+\//,    // one page per paper: the assistant already has every paper as data
  /^_next\//,
]

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', rarr: '→', larr: '←', ndash: '–', mdash: '—', times: '×', copy: '©', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' }
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? ' ')
const clean = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

function walk(dir, found = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, found)
    else if (e.name === 'index.html') found.push(p)
  }
  return found
}

function passages(html, url, sharedDesc) {
  let title = clean((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [, ''])[1]).replace(/\s*[|·—–-]\s*(Dr\.? )?(Mohd Nor )?Akmal.*$/i, '') || url
  if (url === '/') title = 'Home page'
  else if (/Academic Portfolio$/i.test(title)) {      // page kept the site-wide default title: name it after its address
    title = url.replace(/^\/|\/$/g, '').split('/').pop().replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())
  }
  const desc = clean((/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html) || [, ''])[1])
  let body = (/<body[^>]*>([\s\S]*)<\/body>/i.exec(html) || [, html])[1]
  body = body
    .replace(/<(script|style|svg|noscript|nav|footer|template|canvas|form|select)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+(hidden|aria-hidden=["']true["'])[^>]*>[\s\S]*?<\/[a-z0-9]+>/gi, ' ')
    .replace(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi, (_, h) => `\u0001${clean(h)}\u0002`)
  const out = []
  if (desc && !sharedDesc.has(desc)) out.push({ u: url, t: title, h: '', x: desc.slice(0, MAX_CHARS) })   // skip the site-wide default description
  const seen = new Set()
  for (const part of body.split('\u0001')) {
    const cut = part.indexOf('\u0002')
    if (cut < 0 && body.includes('\u0001')) continue  // text before the first heading is usually page chrome
    const h = cut >= 0 ? part.slice(0, cut) : ''
    const x = clean(cut >= 0 ? part.slice(cut + 1) : part).slice(0, MAX_CHARS)
    if (x.length < 40 || seen.has(x)) continue
    seen.add(x)
    out.push({ u: url, t: title, h: h.slice(0, 90), x })
    if (out.length >= MAX_PER_PAGE) break
  }
  return out
}

try {
  if (!fs.existsSync(ENGINE)) throw new Error('out/engine/index.html not found (run the build first)')
  const all = []
  let pages = 0, hidden = 0
  const files = walk(OUT).sort()
  // a description used by several pages is the site default, not a summary of any one page
  const count = {}
  const descOf = (html) => clean((/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html) || [, ''])[1])
  for (const f of files) { const d = descOf(fs.readFileSync(f, 'utf8')); if (d) count[d] = (count[d] || 0) + 1 }
  const sharedDesc = new Set(Object.keys(count).filter((d) => count[d] > 1))
  for (const file of files) {
    const rel = path.relative(OUT, file).split(path.sep).join('/')            // e.g. about/index.html
    const url = '/' + rel.replace(/index\.html$/, '')
    if (SKIP.some((r) => r.test(rel))) continue
    const html = fs.readFileSync(file, 'utf8')
    if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) { hidden++; continue }   // unlisted page
    const got = passages(html, url, url === '/' ? new Set() : sharedDesc)
    if (got.length) { pages++; all.push(...got) }
  }
  const page = fs.readFileSync(ENGINE, 'utf8')
  if (!page.includes(MARK)) throw new Error('site marker missing from the engine page')
  const json = JSON.stringify(all).replace(/<\//g, '<\\/')
  fs.writeFileSync(ENGINE, page.replace(MARK, () => json))
  console.log(`[engine] site map: ${pages} public pages, ${all.length} passages, ${Math.round(json.length / 1024)} KB · ${hidden} unlisted pages left out`)
} catch (e) {
  console.warn('[engine] site map skipped:', e.message)       // never break a deploy
}
