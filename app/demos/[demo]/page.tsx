// Full interactive page for a pillar demo. One is generated for each key in the
// pillar-demo registry (crowd-evacuation has its own dedicated page and is not
// handled here). The compact embeds on the home & research pages link here.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { s } from '@/lib/style'
import { PILLAR_DEMOS, PILLAR_ORDER, type PillarKey } from '@/lib/demos/registry'
import PillarDemo from '@/components/pillar-demos/PillarDemo'
import DemoDisclaimer from '@/components/DemoDisclaimer'

const stack = "'Space Grotesk', system-ui, sans-serif"

export const dynamicParams = false

export function generateStaticParams() {
  return PILLAR_ORDER.map((demo) => ({ demo }))
}

export function generateMetadata({ params }: { params: { demo: string } }): Metadata {
  const meta = PILLAR_DEMOS[params.demo as PillarKey]
  if (!meta) return {}
  return {
    title: `${meta.title} — interactive demo — Mohd Nor Akmal Khalid`,
    description: meta.blurb,
  }
}

export default function PillarDemoPage({ params }: { params: { demo: string } }) {
  const meta = PILLAR_DEMOS[params.demo as PillarKey]
  if (!meta) notFound()
  const label = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

  return (
    <div data-screen-label="Demo" style={s('min-height:100vh')}>
      <article style={s('max-width:900px;margin:0 auto;padding:44px 28px 80px')}>
        <a href="/playground/" style={label('font-size:12.5px;font-weight:500;text-decoration:none;color:#8a8279;display:inline-block;margin-bottom:22px')}>← Back to the Playground</a>

        <p style={label(`font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${meta.accent};margin:0 0 10px`)}>{meta.eyebrow}</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,4.4vw,44px);line-height:1.1;letter-spacing:-.02em;margin:0 0 14px;text-wrap:balance`)}>{meta.title}</h1>
        <p style={s('font-size:17px;line-height:1.65;color:#3f3a34;margin:0 0 8px;max-width:680px')}>{meta.blurb}</p>
        <p style={label('font-size:12.5px;color:#8a8279;margin:0 0 24px')}>Research pillar · {meta.pillar}</p>

        <div style={s('margin-bottom:20px')}>
          <DemoDisclaimer tone="light" variant="illustrative" />
        </div>

        <div style={s('background:#0f0e14;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px')}>
          <div style={label('font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b8798;margin:0 0 12px')}>{meta.eyebrow}</div>
          <PillarDemo demoKey={meta.key} interactive />
        </div>

        <section style={s('margin-top:44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 14px`)}>How it works</h2>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0;max-width:680px')}>{meta.how}</p>
        </section>

        <section style={s('margin-top:40px;padding-top:28px;border-top:1px solid #e7e3dd')}>
          <p style={label('font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a39a8f;margin:0 0 14px')}>More demos</p>
          <div style={s('display:flex;flex-wrap:wrap;gap:10px')}>
            {PILLAR_ORDER.filter((k) => k !== meta.key).map((k) => {
              const m = PILLAR_DEMOS[k]
              return (
                <a key={k} href={`/demos/${k}/`} style={s(`text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#3f3a34;background:#fff;border:1px solid #e7e3dd;border-left:3px solid ${m.accent};padding:9px 14px;border-radius:8px`)}>
                  {m.title} →
                </a>
              )
            })}
          </div>
          <p style={s('font-size:13.5px;line-height:1.6;color:#6b6560;margin:22px 0 0')}>
            These illustrate the research areas behind my work — see the <a href="/research" style={s('color:#16142e;font-weight:500')}>research pillars</a> for the full picture, or the <a href="/demos/crowd-evacuation/" style={s('color:#16142e;font-weight:500')}>crowd-evacuation simulation</a> for a demo built directly from published papers.
          </p>
        </section>
      </article>
    </div>
  )
}
