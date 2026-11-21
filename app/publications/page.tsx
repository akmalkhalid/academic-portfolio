// /publications — retired. The publication list now lives on /research (Papers tab), next to
// the grants and students it belongs with. This address only forwards there.
// Each paper keeps its own page: app/publications/[slug]/page.tsx is unchanged.
import type { Metadata } from 'next'
import MovedTo from '@/components/MovedTo'

export const metadata: Metadata = {
  title: 'Publications — Mohd Nor Akmal Khalid',
  robots: { index: false, follow: true },
  alternates: { canonical: '/research/' },
}

export default function Page() {
  return <MovedTo to="/research/#papers" label="Publications are now part of the Research page." />
}
