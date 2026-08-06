// The Playground: the site's one interactive surface. Merges what used to be two
// separate pages — /tools (browser utilities) and /demos (interactive research
// simulations) — into a single compact gallery. Tools come first because they are
// the thing people return to and share; the demos follow, split into simulations
// rebuilt from published papers and illustrative stand-ins for each research
// pillar. Every card leads with a looping preview that links to the full version.
import type { Metadata } from 'next'
import { getAllPublications } from '@/lib/content'
import PlaygroundClient from './PlaygroundClient'

export const metadata: Metadata = {
  title: 'Playground — Mohd Nor Akmal Khalid',
  description:
    'Free browser-based research tools plus interactive, agent-based demos of the research — simulations and optimizers rebuilt from published papers, and explorable stand-ins for each research pillar.',
}

export default function PlaygroundPage() {
  const counts: Record<string, number> = {}
  for (const p of getAllPublications()) if (p.demo) counts[p.demo] = (counts[p.demo] || 0) + 1
  return <PlaygroundClient counts={counts} />
}
