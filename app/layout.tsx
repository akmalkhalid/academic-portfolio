import type { Metadata } from 'next'
import './globals.css'
import SiteNav from '@/components/SiteNav'
import PageTransition from '@/components/PageTransition'
import VisitCounter from '@/components/VisitCounter'
import { getSiteConfig } from '@/lib/content'
import { s } from '@/lib/style'

const cfg = getSiteConfig()

export const metadata: Metadata = {
  title: `${cfg.authorName} — Academic Portfolio`,
  description: `${cfg.jobTitle} at ${cfg.affiliation}. Computational intelligence for games and engagement modelling — search- and optimization-driven design of adaptive, generative and player-centred systems.`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const social = cfg.social || ({} as typeof cfg.social)
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <VisitCounter />
        <PageTransition />
        <SiteNav shortName={cfg.authorShortName} />
        <main>{children}</main>
        <footer style={s('border-top:1px solid #e7e3dd;background:#fff')}>
          <div style={s('max-width:1120px;margin:0 auto;padding:30px 28px;display:flex;flex-wrap:wrap;gap:14px 28px;align-items:center;justify-content:space-between')}>
            <p style={s('font-size:13px;color:#8a8279;margin:0')}>© {new Date().getFullYear()} {cfg.authorName} · FTSM, UKM</p>
            <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f;margin:0")}>Cookie-free analytics · honours Do-Not-Track · no personal data stored</p>
            <div style={s('display:flex;gap:18px;font-size:13px')}>
              {social.scholar && <a href={social.scholar} target="_blank" rel="noopener noreferrer" style={s('color:#57514b;text-decoration:none')}>Scholar</a>}
              {social.orcid && <a href={social.orcid} target="_blank" rel="noopener noreferrer" style={s('color:#57514b;text-decoration:none')}>ORCID</a>}
              {social.linkedin && <a href={social.linkedin} target="_blank" rel="noopener noreferrer" style={s('color:#57514b;text-decoration:none')}>LinkedIn</a>}
              {social.researchgate && <a href={social.researchgate} target="_blank" rel="noopener noreferrer" style={s('color:#57514b;text-decoration:none')}>ResearchGate</a>}
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}