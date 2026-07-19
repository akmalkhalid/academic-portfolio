// Client-only map from a pillar-demo key to its engine factory. Kept separate
// from lib/demos/registry.ts (which is server-safe metadata) so server components
// can read demo metadata without pulling in browser canvas code.
import type { DemoFactory } from '@/lib/demos/types'
import type { PillarKey } from '@/lib/demos/registry'
import { createFlowField } from '@/lib/demos/flow-field'
import { createMazeSearch } from '@/lib/demos/maze-search'
import { createSwarmLandscape } from '@/lib/demos/swarm-landscape'
import { createBoids } from '@/lib/demos/boids'
import { createProceduralDungeon } from '@/lib/demos/procedural-dungeon'

export const PILLAR_ENGINES: Record<PillarKey, DemoFactory> = {
  'flow-field': createFlowField,
  'maze-search': createMazeSearch,
  'swarm-landscape': createSwarmLandscape,
  boids: createBoids,
  'procedural-dungeon': createProceduralDungeon,
}
