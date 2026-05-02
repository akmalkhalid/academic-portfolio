import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { getSiteConfig } from '@/lib/content'

const cfg = getSiteConfig()

export const metadata: Metadata = {
  title: `${cfg.authorName} — Academic Portfolio`,
  description: `${cfg.jobTitle} at ${cfg.affiliation}. Research in Generative AI, Evolutionary Computing, Games Informatics, and Computational Optimization.`,
}

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/research', label: 'Research' },
  { href: '/publications', label: 'Publications' },
  { href: '/projects', label: 'Projects' },
  { href: '/teaching', label: 'Teaching' },
  { href: '/contact', label: 'Contact' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-stone-200 bg-white sticky top-0 z-10">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-medium text-base">{cfg.authorShortName}</Link>
            <ul className="flex gap-6 text-sm text-stone-700">
              {NAV.map((n) => (
                <li key={n.href}><Link href={n.href} className="hover:text-indigo-600 transition">{n.label}</Link></li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
        <footer className="border-t border-stone-200 mt-20 py-8 text-sm text-stone-500">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row gap-2 md:gap-6 justify-between">
            <p>© {new Date().getFullYear()} {cfg.authorName}. FTSM, UKM.</p>
            <div className="flex gap-4">
              {cfg.social.scholar && <a href={cfg.social.scholar} target="_blank" rel="noopener noreferrer">Scholar</a>}
              {cfg.social.orcid && <a href={cfg.social.orcid} target="_blank" rel="noopener noreferrer">ORCID</a>}
              {cfg.social.linkedin && <a href={cfg.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {cfg.social.github && <a href={cfg.social.github} target="_blank" rel="noopener noreferrer">GitHub</a>}
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
