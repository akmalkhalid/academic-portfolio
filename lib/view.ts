// Pure, framework-agnostic view helpers shared by server and client components.
// Maps the content taxonomy (tag ids, categories) onto the redesign's visual codes.

export type Code = 'gen' | 'exp' | 'evo' | 'opt' | 'gam' | 'sim'

export const TAG_TO_CODE: Record<string, Code> = {
  'generative-ai': 'gen',
  'expert-systems': 'exp',
  'evolutionary-computing': 'evo',
  'optimization': 'opt',
  'games-informatics': 'gam',
  'simulation': 'sim',
}

// Signature colours per research area (carried across the whole site).
export const PCOL: Record<Code, string> = {
  gen: '#8b7bf0', exp: '#d99320', evo: '#21b3a0',
  opt: '#4d8df0', gam: '#f2683f', sim: '#84b53a',
}

// Short labels (used in dense chips / graph tooltips).
export const PNAME: Record<Code, string> = {
  gen: 'Generative AI', exp: 'Expert Systems', evo: 'Evolutionary',
  opt: 'Optimization', gam: 'Games', sim: 'Simulation',
}

// Full labels (used in headings / badges).
export const PFULL: Record<Code, string> = {
  gen: 'Generative AI', exp: 'Expert Systems', evo: 'Evolutionary Computing',
  opt: 'Computational Optimization', gam: 'Games Informatics', sim: 'Simulation',
}

// Badge background / foreground per area.
export const PBADGE: Record<Code, { bg: string; fg: string }> = {
  gen: { bg: '#eeedfe', fg: '#3c3489' }, exp: { bg: '#faeeda', fg: '#633806' },
  evo: { bg: '#e1f5ee', fg: '#085041' }, opt: { bg: '#e6f1fb', fg: '#0c447c' },
  gam: { bg: '#faece7', fg: '#712b13' }, sim: { bg: '#eaf3de', fg: '#27500a' },
}

export const QCOL: Record<string, string> = {
  Q1: '#21b3a0', Q2: '#4d8df0', Q3: '#d99320', Q4: '#f2683f', NA: '#6f6a82',
}

export const CATNAME: Record<string, string> = {
  j: 'Journal', c: 'Conference', b: 'Book chapter',
}

// Map a list of tag ids onto research-area codes (unknown tags dropped).
export function codesFromTags(tags?: string[]): Code[] {
  const codes = (tags || []).map((t) => TAG_TO_CODE[t]).filter(Boolean) as Code[]
  return codes.length ? codes : ['sim']
}

// Map a publication category string onto a single-letter code.
export function catCode(category?: string): 'j' | 'c' | 'b' {
  const c = (category || '').toLowerCase()
  if (c.includes('conf')) return 'c'
  if (c.includes('book')) return 'b'
  return 'j'
}

// Normalise the role label ("Principle Investigator" typo included) to PI / Co-I.
export function roleShort(role?: string): string {
  return /^princip/i.test(role || '') ? 'PI' : 'Co-I'
}
export function isPI(role?: string): boolean {
  return /^princip/i.test(role || '')
}
