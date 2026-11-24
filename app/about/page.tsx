// /about — who I am, and how the three research pillars continue into expected impacts.
import { getSiteConfig, getAllPublications } from '@/lib/content'
import { pillarOf, type Pillar } from '@/lib/pillars'
import type { PillarStats } from '@/components/ImpactBridge'
import AboutClient from './AboutClient'

export default function Page() {
  const cfg = getSiteConfig()
  const social = cfg.social || {}
  const profiles = [
    social.scholar && { label: 'Google Scholar', href: social.scholar },
    social.orcid && { label: 'ORCID', href: social.orcid },
    social.linkedin && { label: 'LinkedIn', href: social.linkedin },
    social.researchgate && { label: 'ResearchGate', href: social.researchgate },
  ].filter(Boolean) as { label: string; href: string }[]

  // per pillar: first publication year and number of papers (shown in the pillar cards)
  const stats = { gen: { since: 9999, papers: 0 }, eva: { since: 9999, papers: 0 }, sea: { since: 9999, papers: 0 } } as PillarStats
  for (const p of getAllPublications()) {
    const k: Pillar = pillarOf(p.topicTags)
    stats[k].papers += 1
    stats[k].since = Math.min(stats[k].since, p.year)
  }

  return (
    <AboutClient
      stats={stats}
      name={cfg.authorName}
      jobTitle={cfg.jobTitle}
      profiles={profiles}
    />
  )
}
