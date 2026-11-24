import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import SiteNav from '@/components/SiteNav'
import PageTransition from '@/components/PageTransition'
import VisitCounter from '@/components/VisitCounter'
import PanelFX from '@/components/PanelFX'
import { getSiteConfig } from '@/lib/content'
import { s } from '@/lib/style'

const cfg = getSiteConfig()

export const metadata: Metadata = {
  title: `${cfg.authorName} — Academic Portfolio`,
  description: `${cfg.jobTitle} at ${cfg.affiliation}. Generative Optimization — generative AI that proposes designs, models of human engagement that evaluate them, and metaheuristic search that steers what comes next. Computational intelligence for games, engagement modelling and adaptive systems.`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const social = cfg.social || ({} as typeof cfg.social)
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Theme, before first paint: use the visitor's saved choice, otherwise dark.
            Runs inline so a light-theme visitor never sees a dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('akmal-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Impact.com universal tracking tag (link transform + impression tracking) */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A8028313-2c75-43eb-ac1b-aca2802d30301.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`,
          }}
        />
      </head>
      <body>
        <VisitCounter />
        <PageTransition />
        <PanelFX />
        <SiteNav shortName={cfg.authorShortName} />
        <main>{children}</main>
        <footer style={s('border-top:1px solid #e7e3dd;background:var(--bg)')}>
          <div style={s('max-width:1120px;margin:0 auto;padding:30px 28px;display:flex;flex-wrap:wrap;gap:14px 28px;align-items:center;justify-content:space-between')}>
            <p style={s('font-size:13px;color:#8a8279;margin:0')}>© {new Date().getFullYear()} {cfg.authorName} · FTSM, UKM</p>
            <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f;margin:0")}>Cookie-free analytics · honours Do-Not-Track · no personal data stored</p>
            <div style={s('display:flex;flex-wrap:wrap;gap:10px 18px;font-size:13px')}>
              <a href="/toolkit/" style={s('color:#57514b;text-decoration:none')}>Toolkit</a>
              <a href="/cookbook/" style={s('color:#57514b;text-decoration:none')}>Prompt Cookbook <span style={s("font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#0d6b5f;background:rgba(33,179,160,.16);padding:2px 5px;border-radius:4px;vertical-align:1px")}>FREE</span></a>
              <a href="/autowriter/" style={s('color:#57514b;text-decoration:none')}>AutoWriterAI <span style={s("font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#4b3fb3;background:rgba(139,123,240,.14);padding:2px 5px;border-radius:4px;vertical-align:1px")}>SOON</span></a>
              <a href="/masterclass/" style={s('color:#57514b;text-decoration:none')}>Masterclass <span style={s("font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#7a5c14;background:rgba(201,162,74,.18);padding:2px 5px;border-radius:4px;vertical-align:1px")}>SOON</span></a>
              {social.scholar && <a href={social.scholar} target="_blank" rel="noopener noreferrer" style={s('color:#57514b;text-decoration:none')}>Scholar</a>}
              {social.orcid && <a href={social.orcid} target="_blank" rel="noopener noreferrer" style={s('color:#57514b;text-decoration:none')}>ORCID</a>}
              {social.linkedin && <a href={social.linkedin} target="_blank" rel="noopener noreferrer" style={s('color:#57514b;text-decoration:none')}>LinkedIn</a>}
              {social.researchgate && <a href={social.researchgate} target="_blank" rel="noopener noreferrer" style={s('color:#57514b;text-decoration:none')}>ResearchGate</a>}
            </div>
          </div>
        </footer>
        {/* Site assistant: floating orb + chat, runs in the visitor's browser (public/assistant/widget.js) */}
        <Script src="/assistant/widget.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}