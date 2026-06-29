import { getCourses, getStudents } from '@/lib/content'
import { codesFromTags, PCOL } from '@/lib/view'
import TeachingClient from './TeachingClient'

const accentOf = (tags?: string[]) => PCOL[codesFromTags(tags)[0]]
const degShort = (d: string) => (d.indexOf('MSc') >= 0 ? 'MSc' : 'PhD')
const degStyle = (d: string) => { const teal = d.indexOf('MSc') >= 0; const bg = teal ? '#e1f5ee' : '#e6f1fb', fg = teal ? '#085041' : '#0c447c'; return `font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:5px;background:${bg};color:${fg}` }

export default function Page() {
  const courses = getCourses()
  const students = getStudents()

  const mapCourse = (c: typeof courses[number]) => ({
    code: c.courseCode,
    title: c.courseTitle,
    meta: `${c.level}${c.program ? ' · ' + c.program : ''}`,
    accent: accentOf(c.topicTags),
    hasLabs: !!(c.labs && c.labs.length),
    labs: (c.labs || []).map((l) => ({ title: l.title, href: l.href, blurb: l.blurb || '' })),
  })
  const current = courses.filter((c) => c.isCurrentlyTeaching).map(mapCourse)
  const past = courses.filter((c) => !c.isCurrentlyTeaching).map(mapCourse)

  const ongoing = students.filter((s) => s.status === 'Ongoing').map((s) => ({
    name: s.studentName, thesis: s.thesisTitle, startYear: String(s.startYear).slice(-2),
    degShort: degShort(s.degree), degStyle: degStyle(s.degree),
    roleShort: (s.role || '').indexOf('Main') >= 0 ? 'Main' : 'Co',
    dots: codesFromTags(s.researchTags).map((c) => PCOL[c]),
  }))
  const graduated = students.filter((s) => s.status === 'Graduated').map((s) => ({
    name: s.studentName, thesis: s.thesisTitle, degree: degShort(s.degree),
    completion: s.completionYear || '', role: (s.role || '').indexOf('Main') >= 0 ? 'Main' : 'Co',
    now: s.currentPosition || '—',
  }))

  const mainCount = students.filter((s) => (s.role || '').indexOf('Main') >= 0).length
  const supStats = [
    { num: String(ongoing.length), label: 'Ongoing researchers', color: '#4d8df0' },
    { num: String(mainCount), label: 'As main supervisor', color: '#21b3a0' },
    { num: String(graduated.length), label: 'Graduated', color: '#8b7bf0' },
  ]

  return (
    <TeachingClient
      current={current} past={past}
      currentCount={current.length} pastCount={past.length}
      ongoing={ongoing} graduated={graduated} supStats={supStats}
    />
  )
}
