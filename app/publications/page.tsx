import { getAllPublications } from '@/lib/content'
import { codesFromTags, catCode, type Code } from '@/lib/view'
import { chicago } from '@/lib/cite'
import PublicationsClient from './PublicationsClient'

export default function Page() {
  const pubs = getAllPublications()

  const nodes = pubs.map((p) => ({
    t: (p.title || '').replace(/\.\s*$/, ''),
    y: p.year,
    pills: codesFromTags(p.topicTags),
    q: p.quartile || 'NA',
    cat: catCode(p.category),
    v: p.venueShort || p.venue || '—',
    slug: p._slug.replace(/^md_files_/, ''),
    citation: chicago(p),
    scholar: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.title || ''),
  }))

  const qCount = (q: string) => pubs.filter((p) => (p.quartile || 'NA') === q).length
  const pillarsUsed = new Set<Code>()
  nodes.forEach((n) => n.pills.forEach((p) => pillarsUsed.add(p)))
  const quartileStats = [
    { num: String(pubs.length), label: 'Total papers', color: '#16142e' },
    { num: String(qCount('Q1')), label: 'Q1 journals', color: '#21b3a0' },
    { num: String(qCount('Q2')), label: 'Q2 journals', color: '#4d8df0' },
    { num: String(qCount('Q3')), label: 'Q3 journals', color: '#d99320' },
    { num: String(qCount('Q4')), label: 'Q4 journals', color: '#f2683f' },
    { num: String(pillarsUsed.size), label: 'Research pillars', color: '#8b7bf0' },
  ]

  const yearsAll = nodes.map((n) => n.y)
  const minYearBound = Math.min(...yearsAll)
  const maxYearBound = Math.max(...yearsAll)

  return (
    <PublicationsClient
      pubs={nodes}
      quartileStats={quartileStats}
      minYearBound={minYearBound}
      maxYearBound={maxYearBound}
    />
  )
}
