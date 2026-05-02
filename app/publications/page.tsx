import PublicationsFilter from '@/components/PublicationsFilter'
import { getAllPublications, getTags, getSiteConfig } from '@/lib/content'

export const metadata = { title: 'Publications — Academic Portfolio' }

export default function PublicationsPage() {
  const publications = getAllPublications()
  const allTags = getTags()
  const cfg = getSiteConfig()

  // Pass only what the client component needs — keeps server-only imports out of the bundle.
  const clientPubs = publications.map((p) => ({
    title: p.title,
    authors: p.authors,
    year: p.year,
    venue: p.venue,
    category: p.category,
    quartile: p.quartile,
    doi: p.doi,
    pdfUrl: p.pdfUrl,
    citationCount: p.citationCount,
    topicTags: p.topicTags,
    _slug: p._slug,
  }))
  const clientTags = allTags.map((t) => ({ id: t.id, name: t.name, color: t.color }))

  return (
    <div>
      <h1 className="text-3xl font-medium mb-2">Publications</h1>
      <p className="text-stone-600 mb-8 text-sm">
        Filter by year, category, research topic, or quartile.
      </p>
      <PublicationsFilter
        publications={clientPubs}
        allTags={clientTags}
        highlightName={cfg.authorShortName}
      />
    </div>
  )
}
