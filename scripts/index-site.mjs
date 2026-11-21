// Runs after `next build` (npm "postbuild"). Two jobs for the site assistant (public/assistant/widget.js):
//
//   A. SITE MAP. Walk the finished static site in out/, keep PUBLIC pages only (any page carrying
//      <meta name="robots" content="noindex"> is skipped, so unlisted talks and workshop kits never reach
//      the assistant), cut each page into short passages under its headings, and store them as `site`
//      in out/assistant/data.json.
//
//   B. WIDGET ON STATIC PAGES. Pages built by Next.js load the widget from app/layout.tsx. The hand-made
//      pages in public/ do not pass through that layout, so the <script> tag is added to them here.
//      Again public pages only: a noindex page gets no assistant.
//
// Nothing is sent anywhere: the passages are fetched and searched in the visitor's browser.
// Run by hand after a build:  node scripts/index-site.mjs
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'out')
const DATA = path.join(OUT, 'assistant', 'data.json')
const TAG = '<script src="/assistant/widget.js" defer></script>'
const MAX_PER_PAGE = 14        // passages kept per page
const MAX_CHARS = 520          // characters kept per passage

// Pages the assistant should not index even though they are public.
const SKIP = [
  /^engine\//,                 // old address, now a redirect to the home page
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

function walk(dir, only, found = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, only, found)
    else if (only ? e.name === only : e.name.endsWith('.html')) found.push(p)
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
  if (!fs.existsSync(DATA)) throw new Error('out/assistant/data.json not found (run the build first)')
  const all = []
  let pages = 0, hidden = 0, tagged = 0
  const hiddenDirs = []          // folders of unlisted pages: nothing inside them gets the assistant either
  const files = walk(OUT, 'index.html').sort()
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
    if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) { hidden++; hiddenDirs.push(path.dirname(file) + path.sep); continue }   // unlisted page
    const got = passages(html, url, url === '/' ? new Set() : sharedDesc)
    if (got.length) { pages++; all.push(...got) }
  }
  // B. hand-made public pages get the widget (Next.js pages already load it from app/layout.tsx)
  for (const file of walk(OUT)) {
    const html = fs.readFileSync(file, 'utf8')
    if (hiddenDirs.some((d) => file.startsWith(d))) continue                    // slides and handouts of an unlisted kit
    if (html.includes('/_next/static/') || html.includes('/assistant/widget.js')) continue
    if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html) || !/<\/body>/i.test(html)) continue
    fs.writeFileSync(file, html.replace(/<\/body>(?![\s\S]*<\/body>)/i, TAG + '\n</body>'))
    tagged++
  }

  // A. store the passages next to the records written by scripts/build-engine.mjs
  const store = JSON.parse(fs.readFileSync(DATA, 'utf8'))
  store.site = all
  const json = JSON.stringify(store)
  fs.writeFileSync(DATA, json)
  console.log(`[assistant] site map: ${pages} public pages, ${all.length} passages, data.json ${Math.round(json.length / 1024)} KB · widget added to ${tagged} static pages · ${hidden} unlisted pages left out`)
} catch (e) {
  console.warn('[assistant] site map skipped:', e.message)       // never break a deploy
}
