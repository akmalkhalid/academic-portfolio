// Chicago-style citation builder (notes-bibliography flavour) from a publication.
export type CiteInput = {
  authors?: string; title: string; venue?: string
  volume?: string; issue?: string; pages?: string
  year: number; category?: string; doi?: string
}

export function chicago(p: CiteInput): string {
  const title = (p.title || '').replace(/\.\s*$/, '')
  const authors = (p.authors || '').trim().replace(/\.\s*$/, '')
  const a = authors ? authors + '. ' : ''
  const venue = p.venue || ''
  const isConf = (p.category || '').toLowerCase().includes('conf')
  if (isConf) {
    return `${a}\u201C${title}.\u201D In ${venue}, ${p.year}.`
  }
  const vol = p.volume ? ` ${p.volume}` : ''
  const iss = p.issue ? `, no. ${p.issue}` : ''
  const pg = p.pages ? `: ${p.pages}` : ''
  const doi = p.doi ? ` ${p.doi}` : ''
  return `${a}\u201C${title}.\u201D ${venue}${vol}${iss} (${p.year})${pg}.${doi}`
}
