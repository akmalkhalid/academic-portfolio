// Index of interactive research demos. Each demo is a faithful, simplified
// re-design of a piece of the research, for illustration and teaching.
import type { Metadata } from 'next'
import { getAllPublications } from '@/lib/content'
import { s } from '@/lib/style'
import DemoDisclaimer from '@/components/DemoDisclaimer'

const stack = "'Space Grotesk', system-ui, sans-serif"

export const metadata: Metadata = {
  title: 'Interactive demos — Mohd Nor Akmal Khalid',
  description:
    'Interactive, agent-based re-designs of the research — explorable simulations built for illustration and teaching.',
}

const DEMOS = [
  {
    href: '/demos/crowd-evacuation/',
    accent: '#4d8df0',
    kicker: 'Emergency route planning',
    title: 'Crowd evacuation',
    blurb:
      'A shopping-mall concourse clears through adjustable exits. A navigation field routes the crowd; congestion and panic reshape the flow — the “faster-is-slower” effect. Tune the crowd, panic, and exits, and edit walls live.',
    chips: ['Navigation field', 'Congestion + panic', 'Adjustable exits', 'Editable floor plan'],
    linksTag: 'crowd-evacuation',
  },
]

export default function DemosPage() {
  const counts: Record<string, number> = {}
  for (const p of getAllPublications()) if (p.demo) counts[p.demo] = (counts[p.demo] || 0) + 1

  return (
    <div data-screen-label="Demos" style={s('min-height:100vh')}>
      <article style={s('max-width:900px;margin:0 auto;padding:52px 28px 80px')}>
        <p style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a8279;margin:0 0 10px`)}>Interactive demos</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(30px,4.6vw,46px);line-height:1.08;letter-spacing:-.02em;margin:0 0 16px`)}>
          Explore the research, hands-on
        </h1>
        <p style={s('font-size:17px;line-height:1.65;color:#3f3a34;margin:0 0 24px;max-width:660px')}>
          Each demo is an interactive re-design of a piece of my research — a live model you can steer to build
          intuition for what the underlying work optimizes.
        </p>

        <div style={s('margin-bottom:30px')}>
          <DemoDisclaimer tone="light" />
        </div>

        <div style={s('display:flex;flex-direction:column;gap:18px')}>
          {DEMOS.map((d) => (
            <a
              key={d.href}
              href={d.href}
              style={s('display:block;text-decoration:none;background:#fff;border:1px solid #e7e3dd;border-radius:16px;padding:24px 26px;color:#1c1917')}
            >
              <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px')}>
                <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.04em;padding:4px 10px;border-radius:6px;background:${d.accent}1a;color:${d.accent}`)}>{d.kicker}</span>
                {counts[d.linksTag] > 0 && (
                  <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#8a8279`)}>{counts[d.linksTag]} linked papers</span>
                )}
              </div>
              <h2 style={s(`font-family:${stack};font-weight:600;font-size:24px;letter-spacing:-.01em;margin:0 0 8px;color:#16142e`)}>
                {d.title} <span style={s(`color:${d.accent}`)}>→</span>
              </h2>
              <p style={s('font-size:15px;line-height:1.6;color:#57514b;margin:0 0 14px;max-width:640px')}>{d.blurb}</p>
              <div style={s('display:flex;flex-wrap:wrap;gap:7px')}>
                {d.chips.map((c) => (
                  <span key={c} style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;color:#6b6560;background:#f4f1ec;border:1px solid #e7e3dd;padding:4px 9px;border-radius:6px`)}>{c}</span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </article>
    </div>
  )
}
