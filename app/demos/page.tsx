// Index of interactive demos: one research-faithful simulation (crowd-evacuation,
// built from published papers) plus the pillar demos — illustrative stand-ins for
// each research area, shared with the home and research pages.
import type { Metadata } from 'next'
import { getAllPublications } from '@/lib/content'
import { s } from '@/lib/style'
import DemoDisclaimer from '@/components/DemoDisclaimer'
import { PILLAR_DEMOS, PILLAR_ORDER } from '@/lib/demos/registry'

const stack = "'Space Grotesk', system-ui, sans-serif"

export const metadata: Metadata = {
  title: 'Interactive demos — Mohd Nor Akmal Khalid',
  description:
    'Interactive, agent-based demos of the research — a crowd-evacuation simulation built from published papers, plus explorable stand-ins for each research pillar.',
}

const card = (accent: string) =>
  s(`display:block;text-decoration:none;background:#fff;border:1px solid #e7e3dd;border-left:3px solid ${accent};border-radius:16px;padding:24px 26px;color:#1c1917`)
const mono = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

export default function DemosPage() {
  const counts: Record<string, number> = {}
  for (const p of getAllPublications()) if (p.demo) counts[p.demo] = (counts[p.demo] || 0) + 1
  const evacPapers = counts['crowd-evacuation'] || 0
  const albPapers = counts['assembly-line-balancing'] || 0
  const schedPapers = counts['production-scheduling'] || 0
  const grPapers = counts['game-refinement'] || 0

  return (
    <div data-screen-label="Demos" style={s('min-height:100vh')}>
      <article style={s('max-width:900px;margin:0 auto;padding:52px 28px 80px')}>
        <p style={mono('font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8279;margin:0 0 10px')}>Interactive demos</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(30px,4.6vw,46px);line-height:1.08;letter-spacing:-.02em;margin:0 0 16px`)}>
          Explore the research, hands-on
        </h1>
        <p style={s('font-size:17px;line-height:1.65;color:#3f3a34;margin:0 0 26px;max-width:660px')}>
          Live models you can steer. Some are simulations and optimizers re-built directly from my published papers;
          the rest are illustrative stand-ins for each research pillar — the same demos that run on the home and
          research pages, here in full and interactive.
        </p>

        {/* Research-faithful demos */}
        <p style={mono('font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a39a8f;margin:0 0 12px')}>Built from published research</p>
        <div style={s('display:flex;flex-direction:column;gap:16px')}>
          <a href="/demos/crowd-evacuation/" style={card('#4d8df0')}>
            <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px')}>
              <span style={mono('font-size:11px;font-weight:600;letter-spacing:.04em;padding:4px 10px;border-radius:6px;background:#4d8df01a;color:#4d8df0')}>Emergency route planning</span>
              {evacPapers > 0 && <span style={mono('font-size:11.5px;color:#8a8279')}>{evacPapers} linked papers</span>}
            </div>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:24px;letter-spacing:-.01em;margin:0 0 8px;color:#16142e`)}>
              Crowd evacuation <span style={s('color:#4d8df0')}>→</span>
            </h2>
            <p style={s('font-size:15px;line-height:1.6;color:#57514b;margin:0 0 14px;max-width:640px')}>
              A shopping-mall concourse clears through adjustable exits. A navigation field routes the crowd; congestion
              and panic reshape the flow — the “faster-is-slower” effect. Tune the crowd, panic, and exits, and edit walls live.
            </p>
            <div style={s('display:flex;flex-wrap:wrap;gap:7px')}>
              {['Navigation field', 'Congestion + panic', 'Adjustable exits', 'Editable floor plan'].map((c) => (
                <span key={c} style={mono('font-size:11px;color:#6b6560;background:#f4f1ec;border:1px solid #e7e3dd;padding:4px 9px;border-radius:6px')}>{c}</span>
              ))}
            </div>
          </a>
          <a href="/demos/assembly-line-balancing/" style={card('#4d8df0')}>
            <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px')}>
              <span style={mono('font-size:11px;font-weight:600;letter-spacing:.04em;padding:4px 10px;border-radius:6px;background:#4d8df01a;color:#4d8df0')}>Assembly line balancing</span>
              {albPapers > 0 && <span style={mono('font-size:11.5px;color:#8a8279')}>{albPapers} linked papers</span>}
            </div>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:24px;letter-spacing:-.01em;margin:0 0 8px;color:#16142e`)}>
              Assembly line balancing <span style={s('color:#4d8df0')}>→</span>
            </h2>
            <p style={s('font-size:15px;line-height:1.6;color:#57514b;margin:0 0 14px;max-width:640px')}>
              An artificial immune system assigns precedence-constrained tasks to workstations under a cycle-time limit,
              rebalancing the line to raise efficiency and shrink the bottleneck. Tune the cycle time, task count, and
              mutation rate, and watch stations and efficiency trade off.
            </p>
            <div style={s('display:flex;flex-wrap:wrap;gap:7px')}>
              {['Precedence graph', 'Immune optimizer', 'Cycle-time trade-off', 'Bottleneck tracking'].map((c) => (
                <span key={c} style={mono('font-size:11px;color:#6b6560;background:#f4f1ec;border:1px solid #e7e3dd;padding:4px 9px;border-radius:6px')}>{c}</span>
              ))}
            </div>
          </a>
          <a href="/demos/production-scheduling/" style={card('#21b3a0')}>
            <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px')}>
              <span style={mono('font-size:11px;font-weight:600;letter-spacing:.04em;padding:4px 10px;border-radius:6px;background:#21b3a01a;color:#21b3a0')}>Production scheduling</span>
              {schedPapers > 0 && <span style={mono('font-size:11.5px;color:#8a8279')}>{schedPapers} linked papers</span>}
            </div>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:24px;letter-spacing:-.01em;margin:0 0 8px;color:#16142e`)}>
              Production scheduling <span style={s('color:#21b3a0')}>→</span>
            </h2>
            <p style={s('font-size:15px;line-height:1.6;color:#57514b;margin:0 0 14px;max-width:640px')}>
              Jobs flow across machines in a flexible manufacturing system, working around maintenance windows. An
              artificial immune system reorders operations to compact the Gantt chart and minimize the makespan. Tune
              the jobs, machines, maintenance, and mutation rate.
            </p>
            <div style={s('display:flex;flex-wrap:wrap;gap:7px')}>
              {['Gantt schedule', 'Immune optimizer', 'Machine maintenance', 'Makespan minimization'].map((c) => (
                <span key={c} style={mono('font-size:11px;color:#6b6560;background:#f4f1ec;border:1px solid #e7e3dd;padding:4px 9px;border-radius:6px')}>{c}</span>
              ))}
            </div>
          </a>
          <a href="/demos/game-refinement/" style={card('#f2683f')}>
            <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px')}>
              <span style={mono('font-size:11px;font-weight:600;letter-spacing:.04em;padding:4px 10px;border-radius:6px;background:#f2683f1a;color:#f2683f')}>Game refinement &amp; engagement</span>
              {grPapers > 0 && <span style={mono('font-size:11.5px;color:#8a8279')}>{grPapers} linked papers</span>}
            </div>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:24px;letter-spacing:-.01em;margin:0 0 8px;color:#16142e`)}>
              Game refinement &amp; the engagement zone <span style={s('color:#f2683f')}>→</span>
            </h2>
            <p style={s('font-size:15px;line-height:1.6;color:#57514b;margin:0 0 14px;max-width:640px')}>
              An abstract game plays itself; its game-refinement value GR = √B ⁄ D drifts across the “comfortable zone”
              (~0.07–0.08) where engaging games — chess, Go, soccer — cluster, with live thrill and addiction readouts.
              Tune the complexity, pace, and balance.
            </p>
            <div style={s('display:flex;flex-wrap:wrap;gap:7px')}>
              {['Self-play', 'Comfortable zone', 'Motion in mind', 'Engagement + addiction'].map((c) => (
                <span key={c} style={mono('font-size:11px;color:#6b6560;background:#f4f1ec;border:1px solid #e7e3dd;padding:4px 9px;border-radius:6px')}>{c}</span>
              ))}
            </div>
          </a>
        </div>

        {/* Pillar demos */}
        <p style={mono('font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a39a8f;margin:34px 0 12px')}>Research-pillar demos</p>
        <div style={s('margin-bottom:20px')}>
          <DemoDisclaimer tone="light" variant="illustrative" />
        </div>
        <div style={s('display:flex;flex-direction:column;gap:16px')}>
          {PILLAR_ORDER.map((k) => {
            const m = PILLAR_DEMOS[k]
            return (
              <a key={k} href={`/demos/${k}/`} style={card(m.accent)}>
                <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:9px')}>
                  <span style={mono(`font-size:11px;font-weight:600;letter-spacing:.04em;padding:4px 10px;border-radius:6px;background:${m.accent}1a;color:${m.accent}`)}>{m.pillar}</span>
                </div>
                <h2 style={s(`font-family:${stack};font-weight:600;font-size:21px;letter-spacing:-.01em;margin:0 0 7px;color:#16142e`)}>
                  {m.title} <span style={s(`color:${m.accent}`)}>→</span>
                </h2>
                <p style={s('font-size:14.5px;line-height:1.6;color:#57514b;margin:0 0 12px;max-width:640px')}>{m.blurb}</p>
                <div style={s('display:flex;flex-wrap:wrap;gap:7px')}>
                  {m.chips.map((c) => (
                    <span key={c} style={mono('font-size:11px;color:#6b6560;background:#f4f1ec;border:1px solid #e7e3dd;padding:4px 9px;border-radius:6px')}>{c}</span>
                  ))}
                </div>
              </a>
            )
          })}
        </div>
      </article>
    </div>
  )
}
