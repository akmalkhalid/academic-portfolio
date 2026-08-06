'use client'

// Preview tile for a pillar demo: looks up the engine + metadata by key and drops
// the non-interactive compact canvas into the generic DemoTile, which supplies the
// framing, caption strip and click-through to the full demo page.
import DemoTile from '@/components/DemoTile'
import PillarDemo from './PillarDemo'
import { PILLAR_DEMOS, type PillarKey } from '@/lib/demos/registry'

export default function DemoThumb({
  demoKey,
  href,
  accent,
  eyebrow,
  height = 132,
  bg,
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

  return (
    <DemoTile
      href={href || `/demos/${demoKey}/`}
      accent={a}
      eyebrow={eyebrow || meta.eyebrow}
      ariaLabel={`Open the full interactive demo: ${meta.title}`}
      bg={bg}
    >
      <PillarDemo demoKey={demoKey} height={height} accent={a} />
    </DemoTile>
  )
}
