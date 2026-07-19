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
    />
  )
}
