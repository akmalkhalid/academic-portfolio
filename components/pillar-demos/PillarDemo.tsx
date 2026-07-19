'use client'

// Client entry point for a pillar demo. Looks up the engine + metadata by key and
// renders the generic DemoCanvas runtime. Compact mode (default) is a non-interactive
// looping embed for the home & research cards; interactive mode powers the full page.
import DemoCanvas from './DemoCanvas'
import { PILLAR_ENGINES } from './engines'
import { PILLAR_DEMOS, type PillarKey } from '@/lib/demos/registry'

export default function PillarDemo({
  demoKey,
  interactive = false,
  height,
  accent,
}: {
  demoKey: PillarKey
  interactive?: boolean
  height?: number
  accent?: string
}) {
  const meta = PILLAR_DEMOS[demoKey]
  const create = PILLAR_ENGINES[demoKey]
  if (!meta || !create) return null
  return (
    <DemoCanvas
      create={create}
      accent={accent || meta.accent}
      height={height ?? (interactive ? meta.fullHeight : meta.height)}
      interactive={interactive}
    />
  )
}
