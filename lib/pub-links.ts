// Relationships between my publications, computed at build time for the 3D
// constellation on /publications. Three kinds, strongest first:
//
//   cite      one paper cites another (OpenAlex, content/citations.auto.json)
//             → drawn as a particle stream (a = citing, b = cited); weight = citations
//             in either direction
//   coauthor  the papers share a co-author other than me (chained by year)
//   similar   their titles + abstracts are close in TF-IDF space (top-2 each)
//
// Pure and deterministic: same content in, same links out.
import citations from '@/content/citations.auto.json'
import abstracts from '@/content/abstracts.auto.json'
import type { Publication } from '@/lib/content'

export type LinkKind = 'cite' | 'coauthor' | 'similar'
export type PubLink = { a: number; b: number; kind: LinkKind; w: number }

const SELF = 'khalid'
const STOP = new Set(('a an and are as at be based by for from has have in into is it its of on or that the this to using via with we our these those their which can been also than more most such between through study paper approach proposed results problem method methods new use used model models system systems analysis').split(' '))

const slugOf = (p: Publication) => p._slug.replace(/^md_files_/, '')

function surnames(authors: string) {
  return (authors || '').split(/\s+and\s+/i).map((a) => a.split(',')[0].trim().toLowerCase()).filter((s) => s && s !== SELF)
}

function tokens(text: string) {
  return (text.toLowerCase().match(/[a-z][a-z-]{2,}/g) || []).filter((t) => !STOP.has(t))
}

export function buildLinks(pubs: Publication[]): { links: PubLink[]; counts: Record<LinkKind, number>; citeSource: { updated: string | null } } {
  const idx = new Map(pubs.map((p, i) => [slugOf(p), i]))
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)
  const best = new Map<string, PubLink>()
  const put = (l: PubLink) => {
    const k = key(l.a, l.b)
    const rank = { cite: 3, coauthor: 2, similar: 1 }
    const cur = best.get(k)
    if (!cur || rank[l.kind] > rank[cur.kind]) best.set(k, l)
    else if (cur.kind === l.kind) cur.w += l.w
  }

  // cite
  const cit = citations as { updated: string | null; edges: { from: string; to: string }[] }
  for (const e of cit.edges || []) {
    const a = idx.get(e.from), b = idx.get(e.to)
    if (a != null && b != null && a !== b) put({ a, b, kind: 'cite', w: 1 })
  }

  // coauthor — linked as a chronological chain per co-author (each paper to the
  // next one with that person), not a full clique, so a long collaboration
  // reads as a thread instead of a hairball.
  const byName = new Map<string, number[]>()
  pubs.forEach((p, i) => new Set(surnames(p.authors)).forEach((s) => { if (!byName.has(s)) byName.set(s, []); byName.get(s)!.push(i) }))
  byName.forEach((ids) => {
    ids.sort((x, y) => pubs[x].year - pubs[y].year || x - y)
    for (let k = 1; k < ids.length; k++) put({ a: ids[k - 1], b: ids[k], kind: 'coauthor', w: 1 })
  })

  // similar (TF-IDF cosine, top-2 neighbours per paper)
  const abs = abstracts as Record<string, string>
  const docs = pubs.map((p) => tokens(`${p.title} ${p.title} ${abs[slugOf(p)] || ''}`))
  const df = new Map<string, number>()
  docs.forEach((d) => new Set(d).forEach((t) => df.set(t, (df.get(t) || 0) + 1)))
  const N = docs.length
  const vecs = docs.map((d) => {
    const tf = new Map<string, number>()
    d.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1))
    const v = new Map<string, number>()
    let norm = 0
    tf.forEach((c, t) => { const dft = df.get(t)!; if (dft < 2) return; const w = (1 + Math.log(c)) * Math.log(N / dft); v.set(t, w); norm += w * w })
    norm = Math.sqrt(norm) || 1
    v.forEach((w, t) => v.set(t, w / norm))
    return v
  })
  const cos = (a: Map<string, number>, b: Map<string, number>) => { let s = 0; const [x, y] = a.size < b.size ? [a, b] : [b, a]; x.forEach((w, t) => { const u = y.get(t); if (u) s += w * u }); return s }
  for (let i = 0; i < N; i++) {
    const near = [] as { j: number; c: number }[]
    for (let j = 0; j < N; j++) if (j !== i) near.push({ j, c: cos(vecs[i], vecs[j]) })
    near.sort((p, q) => q.c - p.c)
    for (const { j, c } of near.slice(0, 2)) if (c > 0.12 && !best.has(key(i, j))) put({ a: i, b: j, kind: 'similar', w: +c.toFixed(3) })
  }

  const links = [...best.values()]
  const counts = { cite: 0, coauthor: 0, similar: 0 } as Record<LinkKind, number>
  links.forEach((l) => counts[l.kind]++)
  return { links, counts, citeSource: { updated: cit.updated ?? null } }
}
