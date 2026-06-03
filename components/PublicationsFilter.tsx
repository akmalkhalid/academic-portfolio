'use client'

import { useMemo, useState } from 'react'
import { TopicTag } from './TopicTag'
import { AuthorList } from './AuthorList'

// Client-safe types — no server-only imports here.
type ClientTag = { id: string; name: string; color: string }

type Pub = {
  title: string; authors: string; year: number
  venue: string; category: string; quartile?: string
  volume?: string; issue?: string; pages?: string
  doi?: string; pdfUrl?: string; citationCount?: number
  topicTags?: string[]; _slug: string
}

const CATEGORIES = ['Journal', 'Conference', 'Book Chapter', 'Book', 'Preprint']
const QUARTILES = ['Q1', 'Q2', 'Q3', 'Q4']

export default function PublicationsFilter({
  publications,
  allTags,
  highlightName,
}: {
  publications: Pub[]
  allTags: ClientTag[]
  highlightName?: string
}) {
  const [search, setSearch] = useState('')
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedQuartiles, setSelectedQuartiles] = useState<string[]>([])
  const [sort, setSort] = useState<'newest' | 'oldest' | 'titleAsc' | 'titleDesc'>('newest')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const allYears = useMemo(
    () => Array.from(new Set(publications.map((p) => p.year))).sort((a, b) => b - a),
    [publications]
  )
  const tagById = (id: string) => allTags.find((t) => t.id === id)

  const toggle = <T,>(arr: T[], val: T, setter: (a: T[]) => void) =>
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])

  const filtered = useMemo(() => {
    let out = publications.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        const hay = `${p.title} ${p.authors} ${p.venue}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (selectedYears.length && !selectedYears.includes(p.year)) return false
      if (selectedCategories.length && !selectedCategories.includes(p.category)) return false
      if (selectedQuartiles.length && (!p.quartile || !selectedQuartiles.includes(p.quartile))) return false
      if (selectedTopics.length) {
        const tags = p.topicTags || []
        if (!selectedTopics.some((t) => tags.includes(t))) return false
      }
      return true
    })
    if (sort === 'newest') out = [...out].sort((a, b) => b.year - a.year)
    else if (sort === 'oldest') out = [...out].sort((a, b) => a.year - b.year)
    else if (sort === 'titleAsc') out = [...out].sort((a, b) => a.title.localeCompare(b.title))
    else out = [...out].sort((a, b) => b.title.localeCompare(a.title))
    return out
  }, [publications, search, selectedYears, selectedCategories, selectedTopics, selectedQuartiles, sort])

  // --- Chicago Author-Date citation formatter ---
  // First author stays "Last, First"; subsequent authors are reordered to "First Last".
  // BibTeX-style "Last, First and Last, First and ..." → Chicago author list.
  // Defensive against malformed inputs (trailing commas, mixed comma+and separators).
  const formatAuthorsChicago = (raw: string): string => {
    // Normalise common malformed patterns:
    //  - "X, and Y" → "X and Y" (avoid the Oxford-comma-before-and producing double commas)
    //  - Trim trailing commas/whitespace from each split part
    const normalised = raw.replace(/,\s+and\s+/g, ' and ')
    const parts = normalised
      .split(/\s+and\s+/)
      .map((s) => s.trim().replace(/,+$/, '')) // strip trailing comma(s)
      .filter(Boolean)
    if (parts.length === 0) return ''
    const transformed = parts.map((p, i) => {
      if (i === 0) return p // keep "Last, First" as-is for the first author
      const m = p.match(/^([^,]+),\s*(.+)$/)
      return m ? `${m[2].trim()} ${m[1].trim()}` : p // swap "Last, First" → "First Last"
    })
    if (transformed.length === 1) return transformed[0]
    if (transformed.length === 2) return `${transformed[0]}, and ${transformed[1]}`
    return transformed.slice(0, -1).join(', ') + ', and ' + transformed[transformed.length - 1]
  }

  const formatChicago = (p: Pub): string => {
    const authors = formatAuthorsChicago(p.authors)
    const title = p.title.trim()
    // In US/Chicago style, the closing period goes inside the quotation marks.
    // If the title already ends in ? or !, keep it without adding a period.
    const titleClose = /[.!?]$/.test(title) ? '' : '.'
    let venueLine = p.venue
    if (p.volume) {
      venueLine += ` ${p.volume}`
      if (p.issue) venueLine += ` (${p.issue})`
    } else if (p.issue) {
      venueLine += ` (${p.issue})`
    }
    if (p.pages) {
      // "263--274" → "263–274" (en-dash); also catch single-hyphen page ranges
      const pages = p.pages.replace(/--/g, '\u2013').replace(/(?<=\d)-(?=\d)/g, '\u2013')
      venueLine += `: ${pages}`
    }
    const segments = [`${authors}.`, `${p.year}.`, `"${title}${titleClose}"`, `${venueLine}.`]
    if (p.doi) {
      const doiUrl = p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`
      segments.push(`${doiUrl}.`)
    }
    return segments.join(' ')
  }

  const copy = (text: string, slug: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopiedSlug(slug)
        setTimeout(() => setCopiedSlug((s) => (s === slug ? null : s)), 1500)
      },
      () => {
        // Clipboard write failed (e.g., insecure context). Surface a hint via the same UI.
        setCopiedSlug(`__err__${slug}`)
        setTimeout(() => setCopiedSlug((s) => (s === `__err__${slug}` ? null : s)), 1500)
      }
    )
  }

  return (
    <div>
      <div className="bg-white rounded-lg border border-stone-200 p-4 mb-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <input
          type="text"
          placeholder="Search title, author, venue…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="pub-sort" className="text-xs text-stone-500 font-medium">Sort by</label>
          <select
            id="pub-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-md bg-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="titleAsc">Title A–Z</option>
            <option value="titleDesc">Title Z–A</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
        <aside className="bg-white rounded-lg border border-stone-200 p-3 self-start">
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-2">Filters</p>

          <FilterGroup label="Year">
            {allYears.map((y) => (
              <CheckRow key={y} label={String(y)} checked={selectedYears.includes(y)}
                count={publications.filter((p) => p.year === y).length}
                onChange={() => toggle(selectedYears, y, setSelectedYears)} />
            ))}
          </FilterGroup>

          <FilterGroup label="Category">
            {CATEGORIES.map((c) => (
              <CheckRow key={c} label={c} checked={selectedCategories.includes(c)}
                count={publications.filter((p) => p.category === c).length}
                onChange={() => toggle(selectedCategories, c, setSelectedCategories)} />
            ))}
          </FilterGroup>

          <FilterGroup label="Topic">
            {allTags.map((t) => {
              const count = publications.filter((p) => p.topicTags?.includes(t.id)).length
              if (count === 0) return null
              return (
                <CheckRow key={t.id} label={t.name} checked={selectedTopics.includes(t.id)}
                  count={count} onChange={() => toggle(selectedTopics, t.id, setSelectedTopics)} />
              )
            })}
          </FilterGroup>

          <div>
            <p className="text-xs font-medium mb-1.5 flex items-center justify-between">
              <span>Quartile</span>
              {selectedQuartiles.length > 0 && (
                <button
                  onClick={() => setSelectedQuartiles([])}
                  className="text-[10px] text-stone-400 hover:text-stone-700 transition"
                >
                  clear
                </button>
              )}
            </p>
            <div className="flex gap-1">
              {QUARTILES.map((q) => {
                const active = selectedQuartiles.includes(q)
                return (
                  <button
                    key={q}
                    onClick={() => toggle(selectedQuartiles, q, setSelectedQuartiles)}
                    aria-pressed={active}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition border ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm hover:bg-emerald-700'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    {q}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-600">
              Showing <span className="font-medium text-stone-900">{filtered.length}</span> of {publications.length} publications
            </span>
          </div>

          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-stone-500">No publications match the current filters.</p>
          ) : (
            filtered.map((p) => (
              <article key={p._slug} className="p-4 border-b border-stone-200 last:border-b-0">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {p.quartile && <span className="tag-green text-[10px] px-1.5 py-0.5 rounded-md font-medium">{p.quartile}</span>}
                  <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-md">{p.category}</span>
                  {p.topicTags?.map((id) => {
                    const t = tagById(id)
                    return t ? <TopicTag key={id} tag={t} size="xs" /> : null
                  })}
                </div>
                <h3 className="text-sm font-medium leading-snug mb-1">{p.title}</h3>
                <p className="text-xs text-stone-600 mb-1">
                  <AuthorList authors={p.authors} highlightName={highlightName} />
                </p>
                <p className="text-xs text-stone-600 mb-2">
                  <em>{p.venue}</em> · {p.year}
                  {p.citationCount ? ` · ${p.citationCount} citations` : ''}
                </p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {p.doi && <a href={p.doi} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] px-2.5 py-1 border border-stone-200 rounded-md hover:bg-stone-50">DOI</a>}
                  {p.pdfUrl && <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] px-2.5 py-1 border border-stone-200 rounded-md hover:bg-stone-50">PDF</a>}
                  {(() => {
                    const isCopied = copiedSlug === p._slug
                    const isErr = copiedSlug === `__err__${p._slug}`
                    return (
                      <button
                        onClick={() => copy(formatChicago(p), p._slug)}
                        aria-live="polite"
                        className={`text-[11px] px-2.5 py-1 border rounded-md transition ${
                          isCopied
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : isErr
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                        title={isCopied ? 'Citation copied to clipboard' : isErr ? 'Copy failed — your browser may be blocking clipboard access' : 'Copy Chicago Author-Date citation'}
                      >
                        {isCopied ? '✓ Copied!' : isErr ? '✗ Copy failed' : 'Cite (Chicago)'}
                      </button>
                    )
                  })()}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3.5"><p className="text-xs font-medium mb-1.5">{label}</p>{children}</div>
}

function CheckRow({ label, checked, count, onChange }: {
  label: string; checked: boolean; count: number; onChange: () => void
}) {
  return (
    <label className="flex items-center justify-between text-xs text-stone-600 py-0.5 cursor-pointer">
      <span className="flex items-center gap-1.5">
        <input type="checkbox" checked={checked} onChange={onChange} className="cursor-pointer" />
        {label}
      </span>
      <span className="text-stone-400">{count}</span>
    </label>
  )
}
