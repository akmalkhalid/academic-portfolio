// Dedicated page for the full production-scheduling optimizer. The compact
// embeds on individual FMS scheduling paper pages link here via "Open the full
// simulation →".
import type { Metadata } from 'next'
import { getAllPublications } from '@/lib/content'
import { s } from '@/lib/style'
import ProductionSchedulingFull from '@/components/paper-demos/ProductionSchedulingFull'
import DemoDisclaimer from '@/components/DemoDisclaimer'

const ACCENT = '#21b3a0'
const stack = "'Space Grotesk', system-ui, sans-serif"
const clean = (sl: string) => sl.replace(/^md_files_/, '')

export const metadata: Metadata = {
  title: 'Production scheduling — interactive optimizer — Mohd Nor Akmal Khalid',
  description:
    'An interactive flexible-manufacturing-system scheduling optimizer: an artificial immune system orders operations across machines around maintenance windows to minimize the makespan, shown as a Gantt chart.',
}

export default function ProductionSchedulingDemoPage() {
  const papers = getAllPublications()
    .filter((p) => p.demo === 'production-scheduling')
    .sort((a, b) => (b.year || 0) - (a.year || 0))

  const label = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

  return (
    <div data-screen-label="Demo" style={s('min-height:100vh')}>
      <article style={s('max-width:900px;margin:0 auto;padding:44px 28px 80px')}>
        <a href="/demos" style={label('font-size:12.5px;font-weight:500;text-decoration:none;color:#8a8279;display:inline-block;margin-bottom:22px')}>← All demos</a>

        <p style={label(`font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};margin:0 0 10px`)}>Interactive optimizer</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,4.4vw,44px);line-height:1.1;letter-spacing:-.02em;margin:0 0 16px;text-wrap:balance`)}>
          Production scheduling
        </h1>
        <p style={s('font-size:17px;line-height:1.65;color:#3f3a34;margin:0 0 14px;max-width:680px')}>
          In a flexible manufacturing system, many <b>jobs</b> compete for a handful of <b>machines</b>. Each job is a
          chain of operations that must run in order and hop from machine to machine along its own route; each machine
          can only do one operation at a time, and every so often a machine goes down for <b>maintenance</b>. The goal
          is to sequence everything so the whole batch finishes as early as possible — the <b>makespan</b>.
        </p>
        <p style={s('font-size:16px;line-height:1.65;color:#57514b;margin:0 0 24px;max-width:680px')}>
          This is NP-hard: the number of possible schedules explodes with the jobs and machines. An <b>artificial
          immune system</b> searches it — cloning and hypermutating the best operation-orderings each generation and
          keeping the ones that pack the Gantt chart tightest. Watch the dashed makespan line pull left as the schedule
          compacts around the maintenance blocks.
        </p>

        <div style={s('margin-bottom:20px')}>
          <DemoDisclaimer tone="light" />
        </div>

        <div style={s('background:#0f0e14;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px')}>
          <div style={label('font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b8798;margin:0 0 12px')}>
            FMS distributed scheduling · artificial immune system
          </div>
          <ProductionSchedulingFull accent={ACCENT} />
        </div>

        <section style={s('margin-top:44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 14px`)}>How the model works</h2>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            Each candidate solution is an operation list — a sequence in which each job appears once per machine, so its
            k-th appearance is that job’s k-th operation. A decoder walks the list and places every operation at the
            earliest time its machine is free and its own previous operation has finished, sliding it past any
            maintenance window that would clash. Because operations are read in job order, job precedence is always
            respected, and no machine ever runs two operations at once. The makespan is simply when the last operation
            ends.
          </p>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            The immune optimizer treats good operation lists as high-affinity antibodies: each generation it clones the
            best ones, hypermutates the clones by swapping operations (more aggressively for weaker solutions),
            evaluates the offspring, and keeps the fittest — with a trickle of fresh random antibodies for diversity.
            Over generations the schedule tightens and the makespan drops. This mirrors the immune, harmony-search, and
            chemical-reaction metaheuristics in the papers below, applied to distributed FMS scheduling subject to
            machine maintenance.
          </p>
        </section>

        {papers.length > 0 && (
          <section style={s('margin-top:40px;padding-top:28px;border-top:1px solid #e7e3dd')}>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 6px`)}>The research behind it</h2>
            <p style={s('font-size:14.5px;line-height:1.6;color:#6b6560;margin:0 0 20px;max-width:640px')}>
              This demo is a teaching stand-in for a body of work on distributed production scheduling in flexible
              manufacturing systems, subject to machine maintenance. The full methods, benchmarks, and results are in
              these papers.
            </p>
            <div style={s('display:flex;flex-direction:column;gap:10px')}>
              {papers.map((p) => (
                <a
                  key={p._slug}
                  href={`/publications/${clean(p._slug)}/`}
                  style={s('display:block;text-decoration:none;background:#fff;border:1px solid #e7e3dd;border-radius:12px;padding:16px 18px;color:#1c1917')}
                >
                  <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:7px')}>
                    <span style={label(`font-size:11px;font-weight:600;padding:3px 9px;border-radius:6px;background:${ACCENT}1a;color:${ACCENT}`)}>{p.category}</span>
                    <span style={label('font-size:12px;color:#8a8279')}>{p.year}{p.venue ? ` · ${p.venue}` : ''}</span>
                  </div>
                  <div style={s(`font-family:${stack};font-weight:600;font-size:16.5px;line-height:1.3;color:#16142e`)}>
                    {(p.title || '').replace(/\.\s*$/, '')} <span style={s(`color:${ACCENT}`)}>→</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <p style={s('font-size:13.5px;line-height:1.6;color:#6b6560;margin:26px 0 0')}>
          See also the <a href="/demos/assembly-line-balancing/" style={s('color:#16142e;font-weight:500')}>assembly-line-balancing optimizer</a> and the <a href="/demos" style={s('color:#16142e;font-weight:500')}>full demo gallery</a>.
        </p>
      </article>
    </div>
  )
}
