// Tiny CSS-string → React style-object helper, so inline styles port verbatim
// from the design. Usage: <div style={s('padding:12px;color:#fff')} />
import type { CSSProperties } from 'react'

export function s(css: string): CSSProperties {
  const out: Record<string, string> = {}
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const rawKey = decl.slice(0, i).trim()
    const val = decl.slice(i + 1).trim()
    if (!rawKey) continue
    const key = rawKey.startsWith('--')
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    out[key] = val
  }
  return out as CSSProperties
}
