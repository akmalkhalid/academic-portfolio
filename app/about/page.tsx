import { getSiteConfig } from '@/lib/content'
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

  return (
    <AboutClient
      name={cfg.authorName}
      jobTitle={cfg.jobTitle}
      profiles={profiles}
    />
  )
}
