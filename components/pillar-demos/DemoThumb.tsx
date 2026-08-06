'use client'

// A compact, click-through preview of a pillar demo — the "GIF capture" tile.
// The canvas underneath is the real engine running in non-interactive compact
// mode (so it stays crisp at any DPR and never goes stale), but the whole tile
// is a single link: clicking anywhere opens the full interactive demo page.
// Hover reveals the call-to-action; the canvas itself takes no pointer events.
import PillarDemo from './PillarDemo'
import { PILLAR_DEMOS, type PillarKey } from '@/lib/demos/registry'
import { s } from '@/lib/style'

const mono = "'JetBrains Mono',monospace"

export default function DemoThumb({
  demoKey,
  href,
  accent,
  eyebrow,
  height = 132,
  bg = 'radial-gradient(120% 120% at 50% 0%,#1a1826 0%,#0e0d15 72%)',
}: {
  demoKey: PillarKey
  href?: string
  accent?: string
  eyebrow?: string
  height?: number
  bg?: string
}) {
  const meta = PILLAR_DEMOS[demoKey]
  if (!meta) return null
  const a = accent || meta.accent
  const label = eyebrow || meta.eyebrow
  // The strip is narrow in a 3-up grid, so show only the leading term of the
  // eyebrow ("Swarm intelligence · fitness landscape" → "Swarm intelligence").
  const short = label.split('·')[0].trim() || label
  const to = href || `/demos/${demoKey}/`

  return (
    <a
      className="demo-tile"
      href={to}
      aria-label={`Open the full interactive demo: ${meta.title}`}
      style={s(
        `position:relative;display:block;text-decoration:none;border-radius:12px;overflow:hidden;background:${bg};border:1px solid rgba(255,255,255,.08)`,
      )}
    >
      {/* the looping preview — pointer-events off so the whole tile stays one link */}
      <div style={s('pointer-events:none;padding:8px 8px 0')}>
        <PillarDemo demoKey={demoKey} height={height} accent={a} />
      </div>

      {/* caption strip */}
      <div
        title={label}
        style={s(
          'display:flex;align-items:center;gap:8px;padding:9px 12px 11px;pointer-events:none;min-width:0',
        )}
      >
        <span
          style={s(
            `font-family:${mono};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:${a};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1`,
          )}
        >
          {short}
        </span>
        <span
          className="demo-tile-cta"
          style={s(
            `font-family:${mono};font-size:10px;font-weight:600;color:#8e8a9c;margin-left:auto;white-space:nowrap`,
          )}
        >
          Open →
        </span>
      </div>

      {/* hover / focus overlay */}
      <span
        className="demo-tile-overlay"
        aria-hidden="true"
        style={s(
          'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,9,16,.55)',
        )}
      >
        <span
          style={s(
            `font-family:${mono};font-size:11.5px;font-weight:600;color:#0a0910;background:${a};padding:8px 14px;border-radius:8px`,
          )}
        >
          ▶ Open the full demo
        </span>
      </span>
    </a>
  )
}
