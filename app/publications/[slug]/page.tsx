// Per-paper detail page — one is generated for every file in content/publications/.
// Add a new publication markdown file and its page appears on the next build.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPublications } from '@/lib/content'
import { chicago, bibtex } from '@/lib/cite'
import { codesFromTags, PNAME, PCOL, QCOL, type Code } from '@/lib/view'
import { s } from '@/lib/style'
import PubActions from './PubActions'
import PaperDemo from './PaperDemo'
import abstracts from '@/content/abstracts.auto.json'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllPublications().map((p) => ({ slug: clean(p._slug) }))
}

const clean = (sl: string) => sl.replace(/^md_files_/, '')
const find = (slug: string) => getAllPublications().find((p) => clean(p._slug) === slug)

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = find(params.slug)
  if (!p) return {}
  return {
    title: `${p.title} — Mohd Nor Akmal Khalid`,
    description: `${p.category}${p.venue ? ' · ' + p.venue : ''} (${p.year}). ${p.authors}`.slice(0, 300),
  }
}

const stack = "'Space Grotesk', system-ui, sans-serif"

export default function PublicationPage({ params }: { params: { slug: string } }) {
  const p = find(params.slug)
  if (!p) notFound()

  const codes: Code[] = codesFromTags(p.topicTags)
  const accent = PCOL[codes[0]] || '#16142e'
  const marker = p.isCorrespondingAuthor ? '† corresponding author'
    : (p.authors && !p.authors.includes(' and ') && p.isFirstAuthor) ? '§ sole author'
    : p.isFirstAuthor ? '∗ first author' : ''
  const metaBits = [p.venue, p.volume && `vol. ${p.volume}`, p.issue && `no. ${p.issue}`, p.pages && `pp. ${p.pages.replace(/(\d)\s*--\s*(\d)/g, '$1\u2013$2')}`, String(p.year)].filter(Boolean)
  const abstract = (p._body || '').trim() || ((abstracts as Record<string, string>)[clean(p._slug)] || '')
  const links = [
    p.doi && { label: 'DOI ↗', href: p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`, solid: true },
    p.pdfUrl && { label: 'PDF ↓', href: p.pdfUrl, solid: false },
    p.externalLink && { label: 'Publisher ↗', href: p.externalLink, solid: false },
    { label: 'Google Scholar ↗', href: 'https://scholar.google.com/scholar?q=' + encodeURIComponent(p.title || ''), solid: false },
  ].filter(Boolean) as { label: string; href: string; solid: boolean }[]

  return (
    <div data-screen-label="Publication" style={s('min-height:100vh')}>
      <article style={s('max-width:820px;margin:0 auto;padding:48px 28px 72px')}>
        <a href="/publications" style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:500;text-decoration:none;color:#8a8279;display:inline-block;margin-bottom:26px")}>← All publications</a>

        <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px')}>
          <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;background:${accent}1a;color:${accent}`)}>{p.category}</span>
          {p.quartile && p.quartile !== 'NA' && (
            <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;background:${(QCOL[p.quartile] || '#6f6a82')}1a;color:${QCOL[p.quartile] || '#6f6a82'}`)}>{p.quartile}</span>
          )}
          {codes.map((c) => (
            <span key={c} style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;padding:4px 10px;border-radius:6px;background:${PCOL[c]}14;color:${PCOL[c]}`)}>{PNAME[c]}</span>
          ))}
        </div>

        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,4vw,40px);line-height:1.12;letter-spacing:-.02em;margin:0 0 14px;text-wrap:balance`)}>{(p.title || '').replace(/\.\s*$/, '')}</h1>
        <p style={s('font-size:16px;color:#57514b;line-height:1.55;margin:0 0 6px')}>{p.authors}</p>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:13px;color:#8a8279;margin:0 0 4px")}>{metaBits.join(' · ')}</p>
        {marker && <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;color:#a39a8f;margin:6px 0 0")}>{marker}</p>}

        <div style={s('display:flex;flex-wrap:wrap;gap:10px;margin:26px 0 8px')}>
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
               style={s(l.solid
                 ? `font-size:14px;font-weight:500;text-decoration:none;color:#fff;background:#16142e;padding:10px 18px;border-radius:8px`
                 : `font-size:14px;font-weight:500;text-decoration:none;color:#1c1917;background:#fff;border:1px solid #d9d3ca;padding:10px 18px;border-radius:8px`)}>{l.label}</a>
          ))}
        </div>

        {abstract && (
          <section style={s('margin-top:38px')}>
            <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a39a8f;margin:0 0 12px")}>Abstract</p>
            {abstract.split(/\n{2,}/).map((para, i) => (
              <p key={i} style={s('font-size:16px;line-height:1.7;color:#3f3a34;margin:0 0 14px')}>{para}</p>
            ))}
          </section>
        )}

        {p.demo && <PaperDemo demo={p.demo} accent={accent} />}

        <section style={s('margin-top:40px;padding-top:28px;border-top:1px solid #e7e3dd')}>
          <PubActions chicago={chicago(p)} bibtex={bibtex(p)} />
        </section>
      </article>
    </div>
  )
}
