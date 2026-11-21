// The three research pillars, one per stage of the Generative Optimization loop.
// A record (paper, grant, student) belongs to ONE pillar: its first topic tag that is not
// "simulation", because simulation is the test bench all three share.
// scripts/build-engine.mjs applies the same rule for the site assistant's records.

export type Pillar = 'gen' | 'eva' | 'sea'
export const PILLAR_ORDER: Pillar[] = ['gen', 'eva', 'sea']

export function pillarOf(tags: string[] = []): Pillar {
  for (const t of tags) {
    if (t === 'games-informatics') return 'eva'                              // Evaluate
    if (t === 'evolutionary-computing' || t === 'optimization') return 'sea'  // Search
    if (t === 'generative-ai' || t === 'expert-systems') return 'gen'         // Generate
  }
  return 'sea'
}
