'use client'

// "This selection at a glance": the counting half of the Publications page. It sits under the
// constellation and always describes the SAME selection (field, type, quartile, year, search).
// (It first lived on the /engine/ page as the publication dashboard.)
//
//   - heat grid   the three research pillars (rows) by year (columns). Brighter = more papers.
//                 Select a cell to narrow the page to that pillar from that year on;
//                 select it again to clear.
//   - three bars  journal quartile, most frequent venues, authorship.
//
// Everything is counted from the list the page already holds. Nothing is fetched.

import { PCOL, QCOL, type Code } from '@/lib/view'

export type DashPub = { y: number; pills: Code[]; q: string; cat: string; v: string; f: boolean }

// The page files papers under six fields; the research programme groups them into three pillars.
export const PILLARS: { key: string; verb: string; codes: Code[]; colour: string }[] = [
  { key: 'gen', verb: 'Generate', codes: ['gen', 'exp'], colour: PCOL.gen },
  { key: 'eva', verb: 'Evaluate', codes: ['gam'], colour: PCOL.gam },
  { key: 'sea', verb: 'Search', codes: ['evo', 'opt'], colour: PCOL.evo },
]
// One pillar per paper: its first field that is not simulation (simulation is the shared test bench).
export function pillarKey(pills: Code[]): string {
  for (const c of pills) { const p = PILLARS.find((x) => x.codes.includes(c)); if (p) return p.key }
  return 'sea'
}

const mono = "'JetBrains Mono', monospace"

function Bars({ title, rows, colour }: { title: string; rows: [string, number, string?][]; colour: string }) {
  const max = Math.max(...rows.map((r) => r[1]), 1)
  return (
    <div className="pd-panel">
      <div className="pd-label">{title}</div>
      {rows.length ? rows.map(([name, n, c]) => (
        <div key={name} className="pd-bar">
          <span className="pd-bar-name" title={name}>{name}</span>
          <span className="pd-bar-n">{n}</span>
          <span className="pd-bar-track"><i style={{ width: `${(n / max) * 100}%`, background: c || colour }} /></span>
        </div>
      )) : <div className="pd-empty">Nothing in this selection.</div>}
    </div>
  )
}

export default function PubDashboard({
  shown, grid, minYear, years, active, onPick,
}: {
  shown: DashPub[]          // papers matching every filter
  grid: DashPub[]           // papers matching every filter except the year, so the grid stays whole
  minYear: number
  years: [number, number]
  active: string | null     // pillar currently picked in the grid, if any
  onPick: (pillar: string | null, year: number | null) => void
}) {
  const span = Array.from({ length: years[1] - years[0] + 1 }, (_, i) => years[0] + i)
  const count = (k: string, y: number) => grid.filter((p) => p.y === y && pillarKey(p.pills) === k).length
  const peak = Math.max(...PILLARS.flatMap((p) => span.map((y) => count(p.key, y))), 1)

  const journals = shown.filter((p) => p.cat === 'j')
  const quartiles = (['Q1', 'Q2', 'Q3', 'Q4', 'NA'] as const)
    .map((q): [string, number, string] => [q === 'NA' ? 'No quartile recorded' : q, journals.filter((p) => p.q === q).length, QCOL[q] || '#7d7890'])
    .filter((r) => r[1] > 0)
  const byVenue: Record<string, number> = {}
  shown.forEach((p) => { byVenue[p.v] = (byVenue[p.v] || 0) + 1 })
  const venues = Object.entries(byVenue).sort((a, b) => b[1] - a[1]).slice(0, 6) as [string, number][]
  const first = shown.filter((p) => p.f).length

  return (
    <div className="pd">
      <p className="pd-eyebrow">/ the same selection, counted</p>
      <h3 className="pd-title">{shown.length} paper{shown.length === 1 ? '' : 's'} at a glance.</h3>

      <div className="pd-panel pd-heat">
        <div className="pd-label">Papers per year, by research pillar · select a cell to narrow the page</div>
        <div className="pd-heat-scroll">
          <table>
            <thead><tr><th />{span.map((y) => <th key={y}>{String(y).slice(2)}</th>)}</tr></thead>
            <tbody>
              {PILLARS.map((p) => (
                <tr key={p.key}>
                  <th style={{ color: p.colour }}>{p.verb}</th>
                  {span.map((y) => {
                    const n = count(p.key, y), a = n ? 0.2 + 0.8 * (n / peak) : 0
                    const on = active === p.key && minYear === y
                    return (
                      <td key={y}>
                        <button type="button" disabled={!n} aria-pressed={on}
                          aria-label={`${p.verb} ${y}: ${n} paper${n === 1 ? '' : 's'}`}
                          onClick={() => (on ? onPick(null, null) : onPick(p.key, y))}
                          style={{
                            background: n ? `color-mix(in srgb, ${p.colour} ${Math.round(a * 100)}%, #14121c)` : 'rgba(255,255,255,.03)',
                            color: a > 0.55 ? '#0f0e14' : '#ECEAF3', opacity: y < minYear ? 0.35 : 1,
                            outline: on ? '2px solid #fff' : 'none',
                          }}>{n || ''}</button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pd-row">
        <Bars title="Journal quartile" rows={quartiles} colour="#8b7bf0" />
        <Bars title="Most frequent venues" rows={venues} colour="#4d8df0" />
        <Bars title="Authorship" rows={[['First author', first], ['Co-author', shown.length - first]].filter((r) => (r[1] as number) > 0) as [string, number][]} colour="#21b3a0" />
      </div>
      <p className="pd-note" style={{ fontFamily: mono }}>Counted from this site&apos;s publication files. Quartiles are as recorded in each paper&apos;s file.</p>
    </div>
  )
}
