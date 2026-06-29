import { getSiteConfig } from '@/lib/content'
import ContactClient from './ContactClient'

export default function Page() {
  const cfg = getSiteConfig()
  const social = cfg.social || {}
  const details = [
    { label: 'Email', value: cfg.email, href: `mailto:${cfg.email}`, accent: '#8b7bf0' },
    { label: 'Office', value: cfg.office, href: 'https://maps.google.com/?q=' + encodeURIComponent('FTSM UKM Bangi'), accent: '#21b3a0' },
    { label: 'Phone', value: cfg.phone, href: 'tel:' + (cfg.phone || '').replace(/[^+\d]/g, ''), accent: '#4d8df0' },
  ].filter((d) => d.value)
  const profiles = [
    social.scholar && { label: 'Google Scholar', href: social.scholar },
    social.orcid && { label: 'ORCID', href: social.orcid },
    social.linkedin && { label: 'LinkedIn', href: social.linkedin },
    social.researchgate && { label: 'ResearchGate', href: social.researchgate },
  ].filter(Boolean) as { label: string; href: string }[]

  return <ContactClient email={cfg.email} details={details} profiles={profiles} />
}
