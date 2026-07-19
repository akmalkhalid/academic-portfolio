// Chicago-style citation builder (notes-bibliography flavour) from a publication.
export type CiteInput = {
  authors?: string; title: string; venue?: string
  volume?: string; issue?: string; pages?: string
  year: number; category?: string; doi?: string
}

export function chicago(p: CiteInput): string {
  const tidy = (x = '') => x.replace(/[{}]/g, '').replace(/(\d)\s*--\s*(\d)/g, '$1\u2013$2')
  const title = tidy((p.title || '').replace(/\.\s*$/, ''))
  const authors = tidy((p.authors || '').trim().replace(/\.\s*$/, ''))
  const a = authors ? authors + '. ' : ''
  const venue = tidy(p.venue || '')
  const isConf = (p.category || '').toLowerCase().includes('conf')
  if (isConf) {
    return `${a}\u201C${title}.\u201D In ${venue}, ${p.year}.`
  }
  const vol = p.volume ? ` ${p.volume}` : ''
  const iss = p.issue ? `, no. ${p.issue}` : ''
  const pg = p.pages ? `: ${tidy(p.pages)}` : ''
  const doi = p.doi ? ` ${p.doi}` : ''
  return `${a}\u201C${title}.\u201D ${venue}${vol}${iss} (${p.year})${pg}.${doi}`
}

// BibTeX entry from a publication (article / inproceedings / incollection).
export function bibtex(p: CiteInput): string {
  const cat = (p.category || '').toLowerCase()
  const type = cat.includes('conf') ? 'inproceedings' : cat.includes('book') ? 'incollection' : 'article'
  const surname = ((p.authors || '').split(',')[0] || 'ref').replace(/[^A-Za-z]/g, '').toLowerCase() || 'ref'
  const firstWord = ((p.title || '').split(/\s+/)[0] || '').replace(/[^A-Za-z]/g, '').toLowerCase()
  const key = `${surname}${p.year}${firstWord}`
  const venueField = type === 'article' ? 'journal' : 'booktitle'
  const doi = (p.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
  const rows: [string, string | undefined][] = [
    ['author', (p.authors || '').trim() || undefined],
    ['title', (p.title || '').replace(/\.\s*$/, '') || undefined],
    [venueField, p.venue || undefined],
    ['volume', p.volume || undefined],
    ['number', p.issue || undefined],
    ['pages', p.pages || undefined],
    ['year', String(p.year)],
    ['doi', doi || undefined],
  ]
  const body = rows.filter(([, v]) => v).map(([k, v]) => `  ${k.padEnd(7)} = {${v}},`).join('\n')
  return `@${type}{${key},\n${body}\n}`
}
