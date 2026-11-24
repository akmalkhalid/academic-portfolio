// ImpactBridge — how each research pillar continues into an expected impact.
//
//     Generate  ──▶  Design thinking     ideas people can shape      (desirable)
//     Evaluate  ──▶  Explainability      reasons people can check    (trustworthy)
//     Search    ──▶  Sustainability      solutions that cost less    (sustainable)
//
// Each row is: the pillar card, a flowing connector, the impact card. The wording is kept
// to EXPECTED impact: what the work is aimed at, with the existing projects it grows from
// listed as "grounded in". Edit the ROWS table to change any text. The optional `stats`
// prop adds "since 2012 · 28 papers" under each pillar, computed from the publication
// record by the page that uses this component (About and Research both do).
//
// No hooks and no browser code, so it renders on the server and works without JavaScript.

import { s } from '@/lib/style'
import Glyph, { type GlyphName } from '@/components/Glyph'
import type { Pillar } from '@/lib/pillars'

export type PillarStats = Record<Pillar, { since: number; papers: number }>

const ROWS: {
  key: Pillar; col: string; verb: string; glyph: GlyphName; field: string; does: string
  impact: string; impactGlyph: GlyphName; value: string; promise: string; expected: string; grounded: string[]
}[] = [
  {
    key: 'gen', col: '#8b7bf0', verb: 'Generate', glyph: 'generate', field: 'Generative & Agentic AI',
    does: 'Models and agent teams propose many candidate designs, quickly.',
    impact: 'Design thinking', impactGlyph: 'design', value: 'Desirable',
    promise: 'A design partner for the early, messy part of a project: wide ideation first, so people spend their time choosing and refining instead of starting from a blank page.',
    expected: 'Faster and broader ideation in game, learning and product design, with the human still deciding.',
    grounded: ['AI–human co-design of Sudoku puzzles', 'Agentic quest generation', 'GAN + MAP-Elites creativity framework (FRGS)'],
  },
  {
    key: 'eva', col: '#f2683f', verb: 'Evaluate', glyph: 'evaluate', field: 'Games Informatics & Engagement Modelling',
    does: 'Models of human experience score each candidate, and say why.',
    impact: 'Explainability', impactGlyph: 'explain', value: 'Trustworthy',
    promise: 'A score with a reason attached. Game refinement and motion-in-mind measures say whether a design is too hard, too easy or compelling in terms a designer can read and argue with.',
    expected: 'AI-assisted decisions that people can inspect, question and trust, rather than accept on faith.',
    grounded: ['Game refinement theory', 'Motion-in-mind model', 'Explainable AI in supervised theses'],
  },
  {
    key: 'sea', col: '#21b3a0', verb: 'Search', glyph: 'search', field: 'Computational Intelligence & Optimization',
    does: 'Metaheuristics steer what is tried next and keep the best trade-offs.',
    impact: 'Sustainability', impactGlyph: 'sustain', value: 'Sustainable',
    promise: 'Optimization is the discipline of doing more with less. The same search that balances an assembly line or a schedule cuts idle machines, waiting time, waste and energy.',
    expected: 'Resource-efficient operations in manufacturing, healthcare scheduling and city services.',
    grounded: ['Assembly-line balancing', 'Production and job-shop scheduling', 'Emergency evacuation planning'],
  },
]

const MONO = "font-family:'JetBrains Mono',monospace;"
const HEAD = "font-family:'Space Grotesk',system-ui,sans-serif;"

export default function ImpactBridge({ stats, compact = false }: { stats?: PillarStats; compact?: boolean }) {
  return (
    <div>
      <div style={s('display:flex;flex-direction:column;gap:14px')}>
        {ROWS.map((r) => (
          <div key={r.key} className="ib-row" style={{ ['--c' as string]: r.col }}>
            {/* the pillar */}
            <div className="fx-panel" style={s(`background:#fff;border:1px solid #e7e3dd;border-left:3px solid ${r.col};border-radius:14px;padding:18px 20px;display:flex;gap:14px;align-items:flex-start`)}>
              <Glyph name={r.glyph} size={40} color={r.col} />
              <div style={s('min-width:0')}>
                <div style={s(`${MONO}font-size:10.5px;font-weight:600;letter-spacing:.12em;color:${r.col}`)}>PILLAR · {r.verb.toUpperCase()}</div>
                <div style={s(`${HEAD}font-weight:600;font-size:16.5px;line-height:1.25;color:#1c1917;margin:6px 0 6px`)}>{r.field}</div>
                <p style={s('font-size:13.5px;line-height:1.55;color:#57514b;margin:0')}>{r.does}</p>
                {stats ? <div style={s(`${MONO}font-size:10.5px;color:#a39a8f;margin-top:8px`)}>since {stats[r.key].since} · {stats[r.key].papers} papers</div> : null}
              </div>
            </div>
            {/* the connector: a dot flowing from pillar to impact */}
            <div className="ib-link" aria-hidden="true"><i /></div>
            {/* the impact */}
            <div className="fx-panel" style={s(`background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:18px 20px;display:flex;gap:14px;align-items:flex-start`)}>
              <Glyph name={r.impactGlyph} size={40} color={r.col} />
              <div style={s('min-width:0')}>
                <div style={s(`${MONO}font-size:10.5px;font-weight:600;letter-spacing:.12em;color:${r.col}`)}>EXPECTED IMPACT · {r.value.toUpperCase()}</div>
                <div style={s(`${HEAD}font-weight:600;font-size:16.5px;line-height:1.25;color:#1c1917;margin:6px 0 6px`)}>{r.impact}</div>
                <p style={s('font-size:13.5px;line-height:1.55;color:#57514b;margin:0')}>{compact ? r.expected : r.promise}</p>
                {compact ? null : (<>
                  <p style={s('font-size:13px;line-height:1.5;color:#3f3a34;margin:8px 0 0')}><strong style={s('font-weight:600')}>Aim:</strong> {r.expected}</p>
                  <div style={s('display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;align-items:center')}>
                    <span style={s(`${MONO}font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#a39a8f;margin-right:2px`)}>grounded in</span>
                    {r.grounded.map((g) => (<span key={g} style={s(`${MONO}font-size:10.5px;padding:3px 8px;border-radius:5px;background:${r.col}1f;color:${r.col}`)}>{g}</span>))}
                  </div>
                </>)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* the continuity: the three impacts are one requirement seen from three sides */}
      <p style={s('font-size:14.5px;line-height:1.65;color:#57514b;margin:18px 0 0;max-width:860px')}>
        The three are one loop, so the impacts arrive together: a design worth adopting has to be <strong style={s('font-weight:600;color:#8b7bf0')}>desirable</strong> to the people who shape it, <strong style={s('font-weight:600;color:#f2683f')}>trustworthy</strong> because its reasons can be checked, and <strong style={s('font-weight:600;color:#21b3a0')}>sustainable</strong> in what it costs to run. Each pass of generate, evaluate and search moves a design along all three.
      </p>
    </div>
  )
}
