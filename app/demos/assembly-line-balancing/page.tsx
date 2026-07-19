// Dedicated page for the full assembly-line-balancing optimizer. The compact
// embeds on individual ALB paper pages link here via "Open the full simulation →".
import type { Metadata } from 'next'
import { getAllPublications } from '@/lib/content'
import { s } from '@/lib/style'
import AssemblyLineBalancingFull from '@/components/paper-demos/AssemblyLineBalancingFull'
import DemoDisclaimer from '@/components/DemoDisclaimer'

const ACCENT = '#4d8df0'
const stack = "'Space Grotesk', system-ui, sans-serif"
const clean = (sl: string) => sl.replace(/^md_files_/, '')

export const metadata: Metadata = {
  title: 'Assembly line balancing — interactive optimizer — Mohd Nor Akmal Khalid',
  description:
    'An interactive assembly-line-balancing optimizer: an artificial immune system assigns precedence-constrained tasks to workstations under a cycle-time limit, maximizing line efficiency and tracking the bottleneck.',
}

export default function AssemblyLineBalancingDemoPage() {
  const papers = getAllPublications()
    .filter((p) => p.demo === 'assembly-line-balancing')
    .sort((a, b) => (b.year || 0) - (a.year || 0))

  const label = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

  return (
    <div data-screen-label="Demo" style={s('min-height:100vh')}>
      <article style={s('max-width:900px;margin:0 auto;padding:44px 28px 80px')}>
        <a href="/demos" style={label('font-size:12.5px;font-weight:500;text-decoration:none;color:#8a8279;display:inline-block;margin-bottom:22px')}>← All demos</a>

        <p style={label(`font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};margin:0 0 10px`)}>Interactive optimizer</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,4.4vw,44px);line-height:1.1;letter-spacing:-.02em;margin:0 0 16px;text-wrap:balance`)}>
          Assembly line balancing
        </h1>
        <p style={s('font-size:17px;line-height:1.65;color:#3f3a34;margin:0 0 14px;max-width:680px')}>
          A product is built from many small tasks, each taking some time and each with <b>precedence</b> constraints —
          some tasks can’t start until others finish. Those tasks have to be shared across an ordered line of
          workstations so that no station’s work exceeds the <b>cycle time</b> (the beat of the line). Pack them badly
          and you need extra stations and workers standing idle; pack them well and the line runs lean.
        </p>
        <p style={s('font-size:16px;line-height:1.65;color:#57514b;margin:0 0 24px;max-width:680px')}>
          Here an <b>artificial immune system</b> searches for a good assignment: it clones and hypermutates the best
          candidate task-orderings each generation, keeping the ones that use fewer stations and spread the load more
          evenly. Raise or lower the cycle time and watch the number of stations and the line efficiency trade off; the
          outlined column is always the current <b>bottleneck</b>.
        </p>

        <div style={s('margin-bottom:20px')}>
          <DemoDisclaimer tone="light" />
        </div>

        <div style={s('background:#0f0e14;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px')}>
          <div style={label('font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b8798;margin:0 0 12px')}>
            Type-E assembly line balancing · artificial immune system
          </div>
          <AssemblyLineBalancingFull accent={ACCENT} />
        </div>

        <section style={s('margin-top:44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 14px`)}>How the model works</h2>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            Each candidate solution is a priority ordering of the tasks. A decoder walks that order, dropping each
            ready task (one whose predecessors are already placed) into the current workstation if it fits under the
            cycle time, and opening a new station the moment it doesn’t. Line efficiency is the total work divided by
            the number of stations times the cycle time — so fewer, fuller stations means a leaner line.
          </p>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            The immune optimizer treats good orderings as high-affinity antibodies: each generation it clones the best
            ones and hypermutates the clones (more mutation for weaker solutions), evaluates the offspring, and keeps the
            fittest — with a trickle of fresh random antibodies for diversity. Over generations the line balances itself,
            evening out station loads and shrinking the bottleneck. This mirrors the artificial-immune and bio-inspired
            methods in the papers below, applied to the type-E variant where both the cycle time and the number of
            stations are in play.
          </p>
        </section>

        {papers.length > 0 && (
          <section style={s('margin-top:40px;padding-top:28px;border-top:1px solid #e7e3dd')}>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 6px`)}>The research behind it</h2>
            <p style={s('font-size:14.5px;line-height:1.6;color:#6b6560;margin:0 0 20px;max-width:640px')}>
              This demo is a teaching stand-in for a body of work on assembly-line balancing and bio-inspired
              optimization for manufacturing. The full methods, benchmarks, and results are in these papers.
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
          See also the <a href="/demos/crowd-evacuation/" style={s('color:#16142e;font-weight:500')}>crowd-evacuation simulation</a> and the <a href="/demos" style={s('color:#16142e;font-weight:500')}>full demo gallery</a>.
        </p>
      </article>
    </div>
  )
}
