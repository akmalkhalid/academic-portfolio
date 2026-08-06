'use client'

// A compact, click-through preview of a demo — the "GIF capture" tile used across
// the home, research and playground pages. Whatever is passed as children (a
// pillar-demo canvas, a compact paper-demo embed) renders as a looping preview
// with pointer events off, so the entire tile behaves as one link to the full
// interactive version. Hover reveals the call to action; on touch, where there is
// no hover, the persistent "Open →" in the caption strip carries it instead.
import type { ReactNode } from 'react'
import { s } from '@/lib/style'

const mono = "'JetBrains Mono',monospace"

export default function DemoTile({
  href,
  accent,
  eyebrow,
  ariaLabel,
  bg = 'radial-gradient(120% 120% at 50% 0%,#1a1826 0%,#0e0d15 72%)',
  children,
}: {
  href: string
  accent: string
  eyebrow: string
  ariaLabel: string
  bg?: string
  children: ReactNode
}) {
  // The strip is narrow in a 3-up grid, so show only the leading term of the
  // eyebrow ("Swarm intelligence · fitness landscape" → "Swarm intelligence").
  const short = eyebrow.split('·')[0].trim() || eyebrow

  return (
    <a
      className="demo-tile"
      href={href}
      aria-label={ariaLabel}
      style={s(
        `position:relative;display:block;text-decoration:none;border-radius:12px;overflow:hidden;background:${bg};border:1px solid rgba(255,255,255,.08)`,
      )}
    >
      <div style={s('pointer-events:none;padding:8px 8px 0')}>{children}</div>

      <div
        title={eyebrow}
        style={s('display:flex;align-items:center;gap:8px;padding:9px 12px 11px;pointer-events:none;min-width:0')}
      >
        <span
          style={s(
            `font-family:${mono};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:${accent};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1`,
          )}
        >
          {short}
        </span>
        <span
          className="demo-tile-cta"
          style={s(`font-family:${mono};font-size:10px;font-weight:600;color:#8e8a9c;margin-left:auto;white-space:nowrap`)}
        >
          Open →
        </span>
      </div>

      <span
        className="demo-tile-overlay"
        aria-hidden="true"
        style={s('position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,9,16,.55)')}
      >
        <span
          style={s(
            `font-family:${mono};font-size:11.5px;font-weight:600;color:#0a0910;background:${accent};padding:8px 14px;border-radius:8px`,
          )}
        >
          ▶ Open the full demo
        </span>
      </span>
    </a>
  )
}
