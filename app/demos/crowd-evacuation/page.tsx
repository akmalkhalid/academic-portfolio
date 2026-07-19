// Dedicated page for the full crowd-evacuation simulation. The compact embeds
// on individual paper pages link here via "Open the full simulation →".
import type { Metadata } from 'next'
import { getAllPublications } from '@/lib/content'
import { s } from '@/lib/style'
import CrowdEvacuationFull from '@/components/paper-demos/CrowdEvacuationFull'
import DemoDisclaimer from '@/components/DemoDisclaimer'

const ACCENT = '#4d8df0'
const stack = "'Space Grotesk', system-ui, sans-serif"
const clean = (sl: string) => sl.replace(/^md_files_/, '')

export const metadata: Metadata = {
  title: 'Crowd evacuation — interactive simulation — Mohd Nor Akmal Khalid',
  description:
    'An interactive, agent-based crowd-evacuation simulation illustrating the emergency route-planning research: a navigation field from every exit, congestion, and the panic “faster-is-slower” effect.',
}

export default function CrowdEvacuationDemoPage() {
  const papers = getAllPublications()
    .filter((p) => p.demo === 'crowd-evacuation')
    .sort((a, b) => (b.year || 0) - (a.year || 0))

  const label = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

  return (
    <div data-screen-label="Demo" style={s('min-height:100vh')}>
      <article style={s('max-width:900px;margin:0 auto;padding:44px 28px 80px')}>
        <a href="/demos" style={label('font-size:12.5px;font-weight:500;text-decoration:none;color:#8a8279;display:inline-block;margin-bottom:22px')}>← All demos</a>

        <p style={label(`font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};margin:0 0 10px`)}>Interactive simulation</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,4.4vw,44px);line-height:1.1;letter-spacing:-.02em;margin:0 0 16px;text-wrap:balance`)}>
          Crowd evacuation &amp; emergency route planning
        </h1>
        <p style={s('font-size:17px;line-height:1.65;color:#3f3a34;margin:0 0 14px;max-width:680px')}>
          A shopping-mall concourse full of shoppers has to clear through a handful of exits. Each occupant follows a
          navigation field flooded outward from every exit, but they also avoid one another — so where routes converge,
          congestion builds. Turn up <b>panic</b> and people move faster yet cooperate less, clogging the doorways: the
          counter-intuitive <b>“faster-is-slower”</b> effect at the heart of this research.
        </p>
        <p style={s('font-size:16px;line-height:1.65;color:#57514b;margin:0 0 24px;max-width:680px')}>
          Adjust the crowd size, panic level, and the number and width of exits. Click the floor to add or remove a wall
          and watch the crowd re-route in real time.
        </p>

        <div style={s('margin-bottom:20px')}>
          <DemoDisclaimer tone="light" />
        </div>

        <div style={s('background:#0f0e14;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px')}>
          <div style={label('font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b8798;margin:0 0 12px')}>
            Crowd evacuation · agent-based · navigation-field + congestion
          </div>
          <CrowdEvacuationFull accent={ACCENT} />
        </div>

        <section style={s('margin-top:44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 14px`)}>How the model works</h2>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            Every exit seeds a breadth-first flood fill across the walkable floor, giving each cell its shortest distance
            to safety — a navigation field the whole crowd can read at once. An agent steps toward the neighbouring cell
            with the lowest cost, where cost combines that distance with the local occupancy, so a shorter route that is
            already jammed can lose out to a slightly longer one that is clear.
          </p>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            Panic scales two things at once: desired speed up, and the tendency to keep clear of neighbours down. At low
            panic the crowd flows in orderly lanes; at high panic it surges and locks up at the exits — evacuating the
            whole floor can take <i>longer</i> even though everyone is trying to move faster. Editing a wall re-runs the
            flood fill instantly, so you can watch a blocked corridor push the flow onto a different route.
          </p>
        </section>

        {papers.length > 0 && (
          <section style={s('margin-top:40px;padding-top:28px;border-top:1px solid #e7e3dd')}>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 6px`)}>The research behind it</h2>
            <p style={s('font-size:14.5px;line-height:1.6;color:#6b6560;margin:0 0 20px;max-width:640px')}>
              This demo is a teaching stand-in for a body of work on optimizing emergency route planning and crowd
              guidance. The full methods, case studies, and results are in these papers.
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
      </article>
    </div>
  )
}
