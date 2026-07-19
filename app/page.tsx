import { getAllPublications, getAllProjects, getActiveProjects, getStudents, getSiteConfig } from '@/lib/content'
import { codesFromTags, catCode, PCOL, isPI } from '@/lib/view'
import { chicago } from '@/lib/cite'
import HomeClient from './HomeClient'

export default function Page() {
  const cfg = getSiteConfig()
  const pubs = getAllPublications()
  const projects = getAllProjects()
  const active = getActiveProjects()
  const students = getStudents()

  // Publication nodes for the constellation + list (content-driven).
  const pubNodes = pubs.map((p) => ({
    t: (p.title || '').replace(/\.\s*$/, ''),
    y: p.year,
    pills: codesFromTags(p.topicTags),
    q: p.quartile || 'NA',
    cat: catCode(p.category),
    citation: chicago(p),
    scholar: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.title || ''),
  }))

  // Up to three active grants for the "Research in flight" cards.
  const funded = active.slice(0, 3).map((g) => {
    const codes = codesFromTags(g.researchTags)
    return {
      role: isPI(g.role) ? 'Principal Investigator' : 'Co-Investigator',
      title: g.title,
      agency: g.fundingAgency,
      years: `${g.startDate.slice(0, 4)} — ${g.endDate.slice(0, 4)}`,
      dots: codes.map((c) => PCOL[c]),
    }
  })

  // Selected articles for the home page — featured pubs grouped by pillar (CV-style).
  const gsel = [
    { title: 'Computational Intelligence & Optimization', accent: PCOL.evo, codes: ['evo', 'opt'] },
    { title: 'Games Informatics & Engagement Modelling', accent: PCOL.gam, codes: ['gam', 'sim'] },
    { title: 'Generative & Agentic AI', accent: PCOL.gen, codes: ['gen', 'exp'] },
  ]
  const groupKey = (p: (typeof pubs)[number]) => {
    const c = codesFromTags(p.topicTags)[0]
    if (c === 'gam' || c === 'sim') return 1
    if (c === 'gen' || c === 'exp') return 2
    return 0
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
  }

  return (
    <HomeClient
      hero={{ headline: cfg.heroHeadline, sub: cfg.heroSubheadline }}
      pubs={pubNodes}
      funded={funded}
      stats={stats}
      articles={selected}
    />
  )
}
