// /toolkit — the AI research tools I recommend in talks and workshops, grouped by
// workflow stage. Everything is driven by content/toolkit.yml; this file only
// renders it. Partner (affiliate) links are opt-in per tool, tagged on the card,
// marked rel="sponsored", and trigger the disclosure note automatically.
import type { Metadata } from 'next'
import { s } from '@/lib/style'
import { getToolkit, type ToolkitTool } from '@/lib/content'
import PageBanner from '@/components/PageBanner'

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

const isPartner = (t: ToolkitTool) => Boolean(t.partnerLink && t.partnerLink.trim())

export default function ToolkitPage() {
  const { sessions, sections } = getToolkit()
  const toolCount = sections.reduce((n, sec) => n + sec.tools.length, 0)
  const anyPartner = sections.some((sec) => sec.tools.some(isPartner))

  return (
    <div data-screen-label="Toolkit" style={s('min-height:100vh;overflow-x:hidden')}>
      <PageBanner
        eyebrow="/ toolkit · what I recommend"
        title="The tools from my workshops."
        lede={`The ${toolCount} tools that come up again and again in my talks and workshops, in the order you would use them on a real project. Free and open options are listed first in every group.`}
      >
        {sections.map((sec) => (
          <a key={sec.id} href={`#${sec.id}`} className="banner-jump">↓ {sec.title}</a>
        ))}
      </PageBanner>

      <section style={s('max-width:1120px;margin:0 auto;padding:40px 28px 0')}>
        <div style={s('border:1px solid #e7e3dd;background:#fff;border-radius:10px;padding:16px 18px;max-width:760px')}>
          <p style={s('font-size:13.5px;line-height:1.6;color:#57514b;margin:0')}>
            <strong style={s('color:#1c1917;font-weight:600')}>How this list is made.</strong>{' '}
            Every tool here is one I demonstrate or recommend in a session; nothing is listed because it pays.
            {anyPartner
              ? ' Links tagged “partner link” are affiliate links: if you later buy a paid plan through them, I may earn a commission at no extra cost to you. Free options are always listed first.'
              : ' None of the links on this page are paid or affiliate links.'}
          </p>
        </div>
      </section>

      {sections.map((sec, i) => (
        <section
          key={sec.id}
          id={sec.id}
          style={s(
            `max-width:1120px;margin:0 auto;padding:${i === 0 ? 36 : 44}px 28px ${i === sections.length - 1 ? 70 : 10}px;scroll-margin-top:80px`,
          )}
        >
          <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:6px')}>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(22px,2.8vw,30px);letter-spacing:-.02em;margin:0`)}>
              {sec.title}
            </h2>
            <span style={mono('font-size:12px;color:#a39a8f')}>{sec.tools.length} {sec.tools.length === 1 ? 'tool' : 'tools'}</span>
          </div>
          {sec.lede && (
            <p style={s('font-size:15px;line-height:1.6;color:#57514b;max-width:660px;margin:0 0 20px')}>{sec.lede}</p>
          )}

          <div className="pillar-grid">
            {sec.tools.map((t) => {
              const partner = isPartner(t)
              const external = !t.url.startsWith('/')
              const href = partner ? t.partnerLink! : t.url
              const rel = partner ? 'sponsored noopener noreferrer' : external ? 'noopener noreferrer' : undefined
              const accent = t.own ? '#21409A' : '#d9d3ca'
              return (
                <div key={t.name} className="pillar-card" style={s(`border-top:3px solid ${accent}`)}>
                  <div style={s('display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px;flex-wrap:wrap')}>
                    <span style={mono(`font-size:10.5px;font-weight:500;padding:3px 9px;border-radius:5px;${PRICE_STYLE[t.price]}`)}>
                      {t.price}
                    </span>
                    {t.own && (
                      <span style={mono('font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#21409A')}>
                        Built by me
                      </span>
                    )}
                    {partner && (
                      <span style={mono('font-size:10.5px;color:#8a8279;border:1px solid #e7e3dd;padding:2px 7px;border-radius:5px')}>
                        partner link
                      </span>
                    )}
                  </div>
                  <h3 style={s(`font-family:${stack};font-weight:600;font-size:19px;line-height:1.2;letter-spacing:-.01em;margin:0 0 9px`)}>
                    {t.name}
                  </h3>
                  <p style={s('font-size:13.5px;line-height:1.58;color:#57514b;margin:0 0 14px')}>{t.why}</p>
                  {t.usedIn && t.usedIn.length > 0 && (
                    <p style={s('font-size:12.5px;line-height:1.7;color:#8a8279;margin:0 0 16px')}>
                      <span style={mono('font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#a39a8f')}>Used in </span>
                      {t.usedIn.map((k, j) => (
                        <span key={k}>
                          {j > 0 && ' · '}
                          <a href={sessions[k].href} style={s('color:#57514b;text-decoration:none;border-bottom:1px solid #e0dad1')}>
                            {sessions[k].title}
                          </a>
                        </span>
                      ))}
                    </p>
                  )}
                  <a
                    href={href}
                    target={external || partner ? '_blank' : undefined}
                    rel={rel}
                    style={mono('margin-top:auto;font-size:12.5px;font-weight:600;color:#16142e;text-decoration:none')}
                  >
                    {t.own ? 'Open tool →' : 'Visit site ↗'}
                  </a>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
