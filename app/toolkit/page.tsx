// /toolkit — the AI research tools I recommend in talks and workshops, grouped by
// workflow stage. Everything is driven by content/toolkit.yml; this file only
// renders it as collapsible groups (native <details>) of full-width tool rows.
// Partner (affiliate) links are opt-in per tool and used as the tool's link,
// marked rel="sponsored" in the markup only (no visible tag).
import type { Metadata } from 'next'
import { s } from '@/lib/style'
import { getToolkit, type ToolkitTool } from '@/lib/content'
import PageBanner from '@/components/PageBanner'
import ToolkitControls from '@/components/ToolkitControls'

export const metadata: Metadata = {
  title: 'Toolkit — Mohd Nor Akmal Khalid',
  description:
    'The AI research tools I recommend in my talks and workshops — literature search, citation mapping, systematic-review screening, reference management, local AI and prototyping — with free options first.',
}

const stack = "'Space Grotesk', system-ui, sans-serif"
const mono = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

const PRICE_STYLE: Record<ToolkitTool['price'], string> = {
  Free: 'color:#0d7a58;background:#e6f6ef',
  'Open source': 'color:#0d7a58;background:#e6f6ef',
  'Free tier': 'color:#0c447c;background:#e6f1fb',
  Institutional: 'color:#633806;background:#faeeda',
  Paid: 'color:#712b13;background:#faece7',
}

const FREE = new Set<ToolkitTool['price']>(['Free', 'Free tier', 'Open source'])
const OPEN_BY_DEFAULT = 2

const isPartner = (t: ToolkitTool) => Boolean(t.partnerLink && t.partnerLink.trim())

export default function ToolkitPage() {
  const { sessions, sections } = getToolkit()
  const toolCount = sections.reduce((n, sec) => n + sec.tools.length, 0)

  return (
    <div data-screen-label="Toolkit" style={s('min-height:100vh;overflow-x:hidden')}>
      <PageBanner
        eyebrow="/ toolkit · what I recommend"
        title="The tools from my workshops."
        lede={`The ${toolCount} tools that come up again and again in my talks and workshops, in the order you would use them on a real project. Tap a group to open or close it.`}
      >
        {sections.map((sec) => (
          <a key={sec.id} href={`#${sec.id}`} className="banner-jump">↓ {sec.title}</a>
        ))}
      </PageBanner>

      <section style={s('max-width:1120px;margin:0 auto;padding:40px 28px 0')}>
        <div style={s('border:1px solid #e7e3dd;background:#fff;border-radius:10px;padding:16px 18px;max-width:760px')}>
          <p style={s('font-size:13.5px;line-height:1.6;color:#57514b;margin:0')}>
            <strong style={s('color:#1c1917;font-weight:600')}>How this list is made.</strong>{' '}
            Every tool here is one I demonstrate or recommend in a session, grouped in the order you would use them on a real project.
          </p>
        </div>
      </section>

      <section style={s('max-width:1120px;margin:0 auto;padding:30px 28px 70px')}>
        <ToolkitControls />

        {sections.map((sec, i) => {
          const freeCount = sec.tools.filter((t) => FREE.has(t.price)).length
          return (
            <details
              key={sec.id}
              id={sec.id}
              className="tk-section"
              // The first two groups (assistants, literature search) start open.
              open={i < OPEN_BY_DEFAULT}
            >
              <summary className="tk-summary">
                <span className="tk-chevron" aria-hidden="true" />
                <span className="tk-summary-text">
                  <span className="tk-title" style={s(`font-family:${stack}`)}>{sec.title}</span>
                  {sec.lede && <span className="tk-lede">{sec.lede}</span>}
                </span>
                <span className="tk-count" style={mono('')}>
                  {sec.tools.length} {sec.tools.length === 1 ? 'tool' : 'tools'}
                  {freeCount > 0 && <span className="tk-count-free"> · {freeCount} free</span>}
                </span>
              </summary>

              <ul className="tk-list">
                {sec.tools.map((t) => {
                  const partner = isPartner(t)
                  const external = !t.url.startsWith('/')
                  const href = partner ? t.partnerLink! : t.url
                  const rel = partner ? 'sponsored noopener noreferrer' : external ? 'noopener noreferrer' : undefined
                  return (
                    <li key={t.name} className={`tk-row${t.own ? ' tk-own' : ''}`}>
                      <div className="tk-name">
                        <h3 style={s(`font-family:${stack}`)}>{t.name}</h3>
                        <div className="tk-badges">
                          <span style={mono(`font-size:10.5px;font-weight:500;padding:3px 9px;border-radius:5px;${PRICE_STYLE[t.price]}`)}>
                            {t.price}
                          </span>
                          {t.own && (
                            <span style={mono('font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#21409A')}>
                              Built by me
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="tk-body">
                        <p className="tk-why">{t.why}</p>
                        {t.usedIn && t.usedIn.length > 0 && (
                          <p className="tk-used">
                            <span style={mono('font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#a39a8f')}>Used in </span>
                            {t.usedIn.map((k, j) => (
                              <span key={k}>
                                {j > 0 && ' · '}
                                <a href={sessions[k].href}>{sessions[k].title}</a>
                              </span>
                            ))}
                          </p>
                        )}
                      </div>

                      <a
                        className="tk-cta"
                        href={href}
                        target={external || partner ? '_blank' : undefined}
                        rel={rel}
                        aria-label={`${t.own ? 'Open' : 'Visit'} ${t.name}${external || partner ? ' (opens in a new tab)' : ''}`}
                        style={mono('')}
                      >
                        {t.own ? 'Open tool →' : 'Visit site ↗'}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </details>
          )
        })}
      </section>
    </div>
  )
}
