// Shared disclaimer shown on every interactive demo. Two variants:
//   · 'research'     — the demo is a faithful, simplified re-design of a specific
//                      body of work (e.g. crowd-evacuation).
//   · 'illustrative' — the demo is an abstract stand-in for a research *area*
//                      (the pillar demos: flow field, maze search, swarm, boids,
//                      procedural generation), not a re-creation of a paper.
import { s } from '@/lib/style'

export const DEMO_DISCLAIMER =
  'This interactive is a faithful re-design of the research, simplified for illustrative and teaching purposes. It conveys the idea and behaviour of the model — it is not the paper’s full method, data, or results.'

export const ILLUSTRATIVE_DISCLAIMER =
  'This interactive is an illustrative stand-in — a simplified model built to convey the idea and behaviour behind this research area for teaching. It is not a specific published method, dataset, or result.'

export default function DemoDisclaimer({
  tone = 'dark',
  variant = 'research',
}: {
  tone?: 'dark' | 'light'
  variant?: 'research' | 'illustrative'
}) {
  const dark = tone === 'dark'
  const wrap = dark
    ? 'background:rgba(242,140,60,.08);border:1px solid rgba(242,140,60,.28)'
    : 'background:#fbf3ea;border:1px solid #f0dcc4'
  const badge = dark ? 'color:#f2a35a' : 'color:#b26a1e'
  const text = dark ? 'color:#b8b2c4' : 'color:#6b5a44'
  const message = variant === 'illustrative' ? ILLUSTRATIVE_DISCLAIMER : DEMO_DISCLAIMER
  return (
    <div style={s(`display:flex;gap:10px;align-items:flex-start;border-radius:10px;padding:11px 14px;${wrap}`)}>
      <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.06em;flex-shrink:0;margin-top:1px;${badge}`)}>
        DEMO
      </span>
      <p style={s(`font-size:12.5px;line-height:1.55;margin:0;${text}`)}>{message}</p>
    </div>
  )
}
