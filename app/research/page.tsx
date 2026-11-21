// /research — the whole research record on one page: papers, grants, students and the idea
// that ties them together. It replaces three older pages (/research, /publications and
// /generative-optimization); the two retired addresses now forward here.
//
// This file runs at build time only. It reads the content folder, gives every record ONE
// pillar (lib/pillars.ts) and hands plain arrays to ResearchClient, which does the drawing
// and filtering in the browser.
//
// To change what the page shows, edit the content, not this file:
//   content/publications/*.md   one file per paper (jcr: is the quartile shown)
//   content/projects/*.md       one file per grant
//   content/students/students.yml
import type { Metadata } from 'next'
import { getAllPublications, getAllProjects, getStudents } from '@/lib/content'
import { codesFromTags, catCode, isPI } from '@/lib/view'
import { pillarOf } from '@/lib/pillars'
import { chicago } from '@/lib/cite'
import { buildLinks } from '@/lib/pub-links'
import ResearchClient from './ResearchClient'

export const metadata: Metadata = {
  title: 'Research and publications — Mohd Nor Akmal Khalid',
  description:
    'Papers, grants, students and the Generative Optimization programme of Dr. Mohd Nor Akmal Khalid (UKM) on one page: generative AI proposes, models of human engagement evaluate, metaheuristic search steers.',
  keywords: [
    'Generative Optimization', 'Generative Optinformatics', 'Optinformatics', 'Evolutionary Computation', 'Metaheuristics',
    'Quality-Diversity', 'Procedural Content Generation', 'Game Refinement Theory', 'Large Language Models', 'Publications',
  ],
}

// "2024-08" -> 2024.58, so a grant can start and end part-way through a year.
const frac = (ym: string) => { const [y, m] = ym.split('-'); return +y + ((+m || 1) - 1) / 12 }

export default function Page() {
  const pubs = getAllPublications()

  const papers = pubs.map((p) => ({
    t: (p.title || '').replace(/\.\s*$/, ''),
    y: p.year,
    pl: pillarOf(p.topicTags),                 // the one pillar this paper counts under
    pills: codesFromTags(p.topicTags),         // all its field tags (shown as small dots)
    q: p.jcr || 'NA',                          // JCR quartile, edition of the paper's own year
    cat: catCode(p.category),
    v: (p.venueShort || p.venue || '—').replace(/[{}]/g, ''),
    au: p.authors || '',
    slug: p._slug.replace(/^md_files_/, ''),
    citation: chicago(p),
    scholar: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.title || ''),
  }))
  const { links, counts, citeSource } = buildLinks(pubs)

  const grants = getAllProjects().map((g) => {
    const s0 = (g.startDate || '').slice(0, 7), s1 = (g.endDate || '').slice(0, 7)
    return {
      t: g.title, agency: g.fundingAgency, code: g.grantCode || '', amt: g.amountMyr || 0,
      pi: isPI(g.role), s0, s1, y0: frac(s0), y1: frac(s1), status: g.status,
      pl: pillarOf(g.researchTags), pills: codesFromTags(g.researchTags),
    }
  }).sort((a, b) => a.y0 - b.y0 || b.amt - a.amt)

  const students = getStudents().map((st) => ({
    name: st.studentName, thesis: st.thesisTitle, degree: st.degree, status: st.status,
    y0: st.startYear, y1: st.completionYear || null, role: st.role, pl: pillarOf(st.researchTags),
  })).sort((a, b) => a.y0 - b.y0)

  // The timeline runs from the first paper to the last grant end.
  const yearMin = Math.min(...papers.map((p) => p.y))
  const yearMax = Math.max(...papers.map((p) => p.y), ...grants.map((g) => Math.floor(g.y1)))

  const now = new Date()   // build date: where the "today" line sits on the timeline

  return (
    <ResearchClient
      papers={papers} grants={grants} students={students}
      links={links} linkCounts={counts} citeUpdated={citeSource.updated}
      years={[yearMin, yearMax]} today={now.getFullYear() + now.getMonth() / 12}
    />
  )
}
