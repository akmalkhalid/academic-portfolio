import { getAllPublications } from '@/lib/content'
import { codesFromTags, catCode, type Code } from '@/lib/view'
import { chicago } from '@/lib/cite'
import { buildLinks } from '@/lib/pub-links'
import PublicationsClient from './PublicationsClient'

export default function Page() {
  const pubs = getAllPublications()

  const nodes = pubs.map((p) => ({
    t: (p.title || '').replace(/\.\s*$/, ''),
    y: p.year,
    pills: codesFromTags(p.topicTags),
    q: p.jcr || 'NA',   // JCR quartile, edition of the paper's year
    cat: catCode(p.category),
    v: (p.venueShort || p.venue || '—').replace(/[{}]/g, ''),   // drop BibTeX braces so "{IEEE} Access" and "IEEE Access" count as one venue
    slug: p._slug.replace(/^md_files_/, ''),
    citation: chicago(p),
    scholar: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.title || ''),
    f: !!p.isFirstAuthor,   // for the authorship bar in the dashboard
  }))

  const { links, counts, citeSource } = buildLinks(pubs)

  const qCount = (q: string) => pubs.filter((p) => (p.jcr || 'NA') === q).length
  const pillarsUsed = new Set<Code>()
  nodes.forEach((n) => n.pills.forEach((p) => pillarsUsed.add(p)))
  const quartileStats = [
    { num: String(pubs.length), label: 'Total papers', color: '#16142e' },
    { num: String(qCount('Q1')), label: 'Q1 journals (JCR)', color: '#21b3a0' },
    { num: String(qCount('Q2')), label: 'Q2 journals (JCR)', color: '#4d8df0' },
    { num: String(qCount('Q3')), label: 'Q3 journals (JCR)', color: '#d99320' },
    { num: String(qCount('Q4')), label: 'Q4 journals (JCR)', color: '#f2683f' },
    { num: String(pillarsUsed.size), label: 'Research pillars', color: '#8b7bf0' },
  ]

  const yearsAll = nodes.map((n) => n.y)
  const minYearBound = Math.min(...yearsAll)
  const maxYearBound = Math.max(...yearsAll)

  return (
    <PublicationsClient
      pubs={nodes}
      links={links}
      linkCounts={counts}
      citeUpdated={citeSource.updated}
      quartileStats={quartileStats}
      minYearBound={minYearBound}
      maxYearBound={maxYearBound}
    />
  )
}
