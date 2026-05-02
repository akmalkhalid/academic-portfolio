// Pure client-safe component. Receives the author's name to bold as a prop
// rather than importing it from lib/content.ts (which uses `fs`).

export function AuthorList({
  authors,
  highlightName,
}: {
  authors: string
  highlightName?: string
}) {
  if (!authors) return null
  const needle = (highlightName || '').replace(/[\[\]]/g, '').toLowerCase()
  const parts = authors.split(/,\s*/)
  return (
    <span>
      {parts.map((p, i) => {
        const isMe = needle && p.toLowerCase().includes(needle)
        return (
          <span key={i}>
            {isMe ? <strong className="text-stone-900">{p}</strong> : p}
            {i < parts.length - 1 ? ', ' : ''}
          </span>
        )
      })}
    </span>
  )
}
