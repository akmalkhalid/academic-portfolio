import { getAllPublications, getAllProjects, getStudents, getSiteConfig } from '@/lib/content'
import { codesFromTags, catCode, PCOL, isPI } from '@/lib/view'
import { chicago } from '@/lib/cite'
import HomeClient from './HomeClient'

export default function Page() {
  const cfg = getSiteConfig()
  const pubs = getAllPublications()
  const projects = getAllProjects()
  const students = getStudents()

  // Selected articles for the home page — featured pubs grouped by loop stage
  // (generate → evaluate → search), matching the research section above.
  const gsel = [
    { title: 'Generate · Generative & Agentic AI', accent: PCOL.gen, codes: ['gen', 'exp'] },
    { title: 'Evaluate · Games Informatics & Engagement Modelling', accent: PCOL.gam, codes: ['gam', 'sim'] },
    { title: 'Search · Computational Intelligence & Optimization', accent: PCOL.evo, codes: ['evo', 'opt'] },
  ]
  const groupKey = (p: (typeof pubs)[number]) => {
    const c = codesFromTags(p.topicTags)[0]
    if (c === 'gen' || c === 'exp') return 0
    if (c === 'gam' || c === 'sim') return 1
    return 2
  }
  const featuredPubs = pubs.filter((p) => p.featured)
  const selected = gsel.map((g, gi) => ({
    title: g.title, accent: g.accent,
    items: featuredPubs.filter((p) => groupKey(p) === gi).sort((a, b) => b.year - a.year).map((p) => ({
      quartile: p.quartile || '',
      marker: p.isCorrespondingAuthor ? '†' : (p.authors && !p.authors.includes(' and ') && p.isFirstAuthor ? '§' : (p.isFirstAuthor ? '∗' : '')),
      cite: chicago(p),
      slug: p._slug.replace(/^md_files_/, ''),
    })),
  })).filter((g) => g.items.length > 0)

  // Funding is DERIVED from content/projects, the same way the research page
  // derives it — never typed into the hero, so the two pages cannot disagree.
  const fundingTotal = projects.reduce((sum, p) => sum + (p.amountMyr || 0), 0)
  const fundingPI = projects.filter((p) => isPI(p.role)).reduce((sum, p) => sum + (p.amountMyr || 0), 0)
  // The hero's "since <year>" comes from the earliest publication on file.
  const firstYear = pubs.length ? Math.min(...pubs.map((p) => p.year)) : new Date().getFullYear()

  const computedCitations = pubs.reduce((sum, p) => sum + (p.citationCount || 0), 0)
  const stats = {
    pubs: pubs.length,
    citations: cfg.metrics?.citations ?? (computedCitations || 0),
    hIndex: cfg.metrics?.hIndex ?? null,
    i10Index: cfg.metrics?.i10Index ?? null,
    grants: projects.length,
    students: students.length,
    autoCitations: cfg.autoMetrics?.citations ?? null,
    autoSource: cfg.autoMetrics?.source ?? null,
    fundingTotal,
    fundingPI,
    firstYear,
  }

  return (
    <HomeClient
      hero={{ headline: cfg.heroHeadline, sub: cfg.heroSubheadline }}
      stats={stats}
      articles={selected}
    />
  )
}
