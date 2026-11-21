// /generative-optimization — retired. The programme's definition, its neighbouring fields,
// the horizon (Generative Optinformatics) and the key references now sit in the Ideas tab
// of /research. This address only forwards there.
import type { Metadata } from 'next'
import MovedTo from '@/components/MovedTo'

export const metadata: Metadata = {
  title: 'Generative Optimization — Mohd Nor Akmal Khalid',
  robots: { index: false, follow: true },
  alternates: { canonical: '/research/' },
}

export default function Page() {
  return <MovedTo to="/research/#ideas" label="Generative Optimization is now part of the Research page." />
}
