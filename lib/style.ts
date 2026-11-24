// s() — tiny CSS-string → React style-object helper, so inline styles read like CSS.
// Usage: <div style={s('padding:12px;color:#fff')} />
//
// It is also where the site's THEME is applied. Pages were written with a fixed light
// palette (white cards, warm greys). Instead of editing some 400 colours by hand, s()
// swaps each known palette colour for a CSS variable as it builds the style:
//
//     background:#fff     ->  background:var(--panel)
//     color:#57514b       ->  color:var(--body)
//     border:1px solid #e7e3dd  ->  border:1px solid var(--line)
//
// The variables are defined twice in app/globals.css: once for the dark theme (default)
// and once under [data-theme="light"]. Flipping that one attribute on <html> re-colours
// every page; the switch is the button in components/SiteNav.tsx.
//
// Rules worth knowing:
//   · A colour not listed below is left exactly as written. Hero banners, the research
//     dashboard and the live demos use their own dark colours and look the same in both
//     themes.
//   · The swap depends on the property: #fff as a background is a card (var(--panel)),
//     #fff as text stays white.
//   · A white box with navy text, or a navy box with white text, is a button. Both are
//     left alone so buttons keep their contrast on any background.
//   · To add a colour to the theme, add one line to the right table.
import type { CSSProperties } from 'react'

const BACKGROUND: Record<string, string> = {
  '#fff': 'var(--panel)', '#ffffff': 'var(--panel)',
  '#faf9f7': 'var(--bg)', '#fbfaf8': 'var(--bg)', '#f8fafc': 'var(--bg)',
  '#f4f1ec': 'var(--panel-2)', '#f4f2ee': 'var(--panel-2)', '#f3f0ea': 'var(--panel-2)',
  // soft tinted chips and callouts
  '#eaf3de': 'var(--tag-green-bg)', '#e6f6ef': 'var(--tag-teal-bg)', '#e6f1fb': 'var(--tag-blue-bg)',
  '#faeeda': 'var(--tag-amber-bg)', '#fbf0dd': 'var(--tag-amber-bg)', '#fbf3ea': 'var(--tag-amber-bg)',
  '#faece7': 'var(--tag-coral-bg)',
}
const TEXT: Record<string, string> = {
  '#1c1917': 'var(--ink)', '#16142e': 'var(--ink)', '#0a0910': 'var(--ink)',
  '#3f3a34': 'var(--ink-2)', '#44403c': 'var(--ink-2)',
  '#57514b': 'var(--body)', '#6b6560': 'var(--body)',
  '#8a8279': 'var(--muted)', '#a39a8f': 'var(--faint)', '#b4ab9f': 'var(--faint)',
  '#27500a': 'var(--tag-green-fg)', '#0d7a58': 'var(--tag-teal-fg)', '#0d6b5f': 'var(--tag-teal-fg)',
  '#4b3fb3': 'var(--tag-purple-fg)', '#0c447c': 'var(--tag-blue-fg)', '#21409a': 'var(--tag-blue-fg)',
  '#b26a1e': 'var(--tag-amber-fg)', '#7a5c14': 'var(--tag-amber-fg)', '#7a5210': 'var(--tag-amber-fg)',
  '#633806': 'var(--tag-amber-fg)', '#6b5a44': 'var(--tag-amber-fg)', '#712b13': 'var(--tag-coral-fg)',
}
const BORDER: Record<string, string> = {
  '#e7e3dd': 'var(--line)', '#ece8e1': 'var(--line)', '#f3efe9': 'var(--line)', '#f0ece5': 'var(--line)',
  '#d9d3ca': 'var(--line-2)', '#ddd6cc': 'var(--line-2)', '#d9d3c9': 'var(--line-2)', '#f0dcc4': 'var(--line-2)',
  '#16142e': 'var(--ink)',
}

const HEX = /#[0-9a-fA-F]{3,6}\b/g
const swap = (value: string, table: Record<string, string>) => value.replace(HEX, (hex) => table[hex.toLowerCase()] || hex)
const isButton = (css: string) =>
  /background:\s*#fff\b/i.test(css) && /(^|;)\s*color:\s*#16142e/i.test(css) ||
  /background:\s*#16142e/i.test(css) && /(^|;)\s*color:\s*#fff\b/i.test(css)

export function s(css: string): CSSProperties {
  const out: Record<string, string> = {}
  const themed = !isButton(css)
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const rawKey = decl.slice(0, i).trim()
    let val = decl.slice(i + 1).trim()
    if (!rawKey) continue
    if (themed) {
      if (rawKey === 'color') val = swap(val, TEXT)
      else if (rawKey.startsWith('background')) val = swap(val, BACKGROUND)
      else if (rawKey.startsWith('border') || rawKey === 'outline') val = swap(val, BORDER)
    }
    const key = rawKey.startsWith('--')
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    out[key] = val
  }
  return out as CSSProperties
}
