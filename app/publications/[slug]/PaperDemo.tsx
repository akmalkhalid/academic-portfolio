// Pluggable per-paper interactive demo.
// A publication opts in with a `demo:` key in its markdown frontmatter; this maps
// the key to a registered demo. On the paper page we show a COMPACT, non-interactive
// looping preview plus a link to the full interactive simulation on its own page.
// Add a new demo by building the components and adding one entry to REGISTRY below.
import { s } from '@/lib/style'
import CrowdEvacuation from '@/components/paper-demos/CrowdEvacuation'
import DemoDisclaimer from '@/components/DemoDisclaimer'

type Entry = {
  label: string
  caption: string
  fullHref: string
  render: (accent: string) => JSX.Element
}

const REGISTRY: Record<string, Entry> = {
  'crowd-evacuation': {
    label: 'Crowd evacuation · agent-based',
    caption:
      'A looping preview of the emergency route-planning model: a navigation field routes shoppers to the exits while congestion and panic reshape the flow.',
    fullHref: '/demos/crowd-evacuation/',
    render: (accent) => <CrowdEvacuation accent={accent} />,
  },
}

export default function PaperDemo({ demo, accent = '#4d8df0' }: { demo: string; accent?: string }) {
  const entry = REGISTRY[demo]
  if (!entry) return null
  return (
    <section style={s('margin-top:40px')}>
      <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a39a8f;margin:0 0 12px")}>Interactive demo</p>
      <div style={s('background:#0f0e14;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px 16px 14px')}>
        <div style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b8798;margin:0 0 10px")}>{entry.label}</div>
        {entry.render(accent)}
        <div style={s('margin-top:14px')}>
          <DemoDisclaimer tone="dark" />
        </div>
        <a
          href={entry.fullHref}
          style={s(`display:inline-flex;align-items:center;gap:7px;margin-top:14px;font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;text-decoration:none;color:#0a0910;background:${accent};padding:9px 16px;border-radius:8px`)}
        >
          Open the full simulation →
        </a>
      </div>
      <p style={s('font-size:13.5px;line-height:1.6;color:#6b6560;margin:12px 0 0;max-width:640px')}>{entry.caption}</p>
    </section>
  )
}
