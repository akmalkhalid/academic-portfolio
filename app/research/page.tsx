import { getAllProjects } from '@/lib/content'
import { codesFromTags, isPI, PCOL, PNAME, PBADGE, type Code } from '@/lib/view'
import ResearchClient from './ResearchClient'

const D0 = 2024, SPAN = 6.5
const left = (f: number) => ((f - D0) / SPAN) * 100
const frac = (ym: string) => { const p = ym.split('-'); return +p[0] + ((+p[1] || 1) - 1) / 12 }
const fmt = (n: number) => 'RM ' + n.toLocaleString()
const tagChip = (c: Code) => ({ label: PNAME[c], style: `font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:500;padding:2px 8px;border-radius:5px;background:${PBADGE[c].bg};color:${PBADGE[c].fg}` })

export default function Page() {
  const projects = getAllProjects()
  const grants = projects.map((p) => ({
    title: p.title,
    agency: p.fundingAgency,
    grantCode: p.grantCode || '',
    amount: p.amountMyr || 0,
    role: isPI(p.role) ? 'Principal Investigator' : 'Co-Investigator',
    start: (p.startDate || '').slice(0, 7),
    end: (p.endDate || '').slice(0, 7),
    status: p.status,
    codes: codesFromTags(p.researchTags),
  }))

  const total = grants.reduce((sum, g) => sum + g.amount, 0)
  const active = grants.filter((g) => g.status === 'Active')
  const completed = grants.filter((g) => g.status === 'Completed')
  const piGrants = grants.filter((g) => g.role === 'Principal Investigator')
  const piTotal = piGrants.reduce((sum, g) => sum + g.amount, 0)

  const stats = [
    { num: piTotal, prefix: 'RM ', display: piTotal.toLocaleString(), label: 'Research funding led as PI', hint: 'RM ' + total.toLocaleString() + ' cumulative · ' + grants.length + ' grants', dot: '#8b7bf0' },
    { num: grants.length, prefix: '', display: String(grants.length), label: 'Funded grants', hint: active.length + ' active · ' + completed.length + ' completed', dot: '#4d8df0' },
    { num: piGrants.length, prefix: '', display: String(piGrants.length), label: 'As Principal Investigator', hint: 'lead-led projects', dot: '#21b3a0' },
    { num: active.length, prefix: '', display: String(active.length), label: 'Active right now', hint: 'running 2024 — 2030', dot: '#f2683f' },
  ]

  const timeline = grants.slice().sort((a, b) => frac(a.start) - frac(b.start) || b.amount - a.amount).map((g) => {
    const l = left(frac(g.start)), w = Math.max(2.4, left(frac(g.end)) - l)
    const done = g.status === 'Completed'
    const col = PCOL[g.codes[0]]
    const barStyle = `position:absolute;top:5px;bottom:5px;left:${l}%;width:${w}%;border-radius:5px;display:flex;align-items:center;padding:0 7px;overflow:hidden;background:${col};${done ? 'opacity:.42;' : 'box-shadow:0 2px 8px -3px ' + col + ';'}transition:transform .15s,filter .15s;cursor:default`
    return { short: g.title, amountFmt: fmt(g.amount), roleShort: g.role === 'Principal Investigator' ? 'PI' : 'Co-I', title: g.title, barStyle, barLabel: w > 16 ? g.agency : '' }
  })
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => ({ label: String(y), left: left(y) }))
  const now = new Date()
  const todayLeft = left(now.getFullYear() + now.getMonth() / 12)

  const decorate = (g: typeof grants[number]) => ({
    title: g.title, agency: g.agency, grantCode: g.grantCode, role: g.role,
    amountFmt: fmt(g.amount), years: g.start.slice(0, 4) + '–' + g.end.slice(0, 4),
    accent: PCOL[g.codes[0]], tags: g.codes.slice(0, 2).map(tagChip),
  })

  return (
    <ResearchClient
      stats={stats}
      timeline={timeline}
      years={years}
      todayLeft={todayLeft}
      active={active.map(decorate)}
      completed={completed.map(decorate)}
      activeCount={active.length}
      completedCount={completed.length}
    />
  )
}
