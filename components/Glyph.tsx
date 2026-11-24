// Glyph — the site's abstract icon set, drawn in code (no image files).
//
// Each glyph is a small isometric line drawing on a 48 × 48 grid. They are "abstractions"
// of an idea rather than pictures of a thing:
//     mark      the site logo: three nodes on a closed loop (generate → evaluate → search)
//     generate  a cube unfolding into new cubes            design     a pencil-like wedge meeting a grid
//     evaluate  a lens over stacked layers                 explain    a box opened to show its layers
//     search    a path climbing contour rings to a peak    sustain    a closed cycle around a small core
//     sun/moon  for the theme switch
// Colour comes from the `color` prop (default: the text colour around it), so one glyph
// works on any background and in both themes. Parts with class g-spin / g-pulse animate
// (keyframes in app/globals.css) and stop for visitors who prefer reduced motion.

export type GlyphName = 'mark' | 'generate' | 'evaluate' | 'search' | 'design' | 'explain' | 'sustain' | 'sun' | 'moon'

// one isometric cube outline centred on (x, y) with half-width r
const cube = (x: number, y: number, r: number) =>
  `M${x} ${y - r}L${x + r} ${y - r / 2}V${y + r / 2}L${x} ${y + r}L${x - r} ${y + r / 2}V${y - r / 2}Z M${x - r} ${y - r / 2}L${x} ${y}L${x + r} ${y - r / 2} M${x} ${y}V${y + r}`

export default function Glyph({ name, size = 28, color, title }: { name: GlyphName; size?: number; color?: string; title?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  let body: React.ReactNode = null
  switch (name) {
    case 'mark':
      body = (<>
        <g className="g-spin"><ellipse cx="24" cy="24" rx="17" ry="9" {...common} opacity=".55" transform="rotate(-28 24 24)" /></g>
        <path d={cube(24, 24, 8)} {...common} />
        <circle cx="9.5" cy="30" r="2.6" fill="#8b7bf0" /><circle cx="38.5" cy="18" r="2.6" fill="#f2683f" /><circle cx="27" cy="39.5" r="2.6" fill="#21b3a0" />
      </>); break
    case 'generate':
      body = (<>
        <path d={cube(17, 29, 9)} {...common} />
        <path d={cube(33, 16, 5)} {...common} opacity=".8" /><path d={cube(38, 31, 3.5)} {...common} opacity=".55" />
        <path d="M24 23l5-4M26 30l8 1" {...common} strokeDasharray="1.5 3" className="g-pulse" />
      </>); break
    case 'evaluate':
      body = (<>
        <path d="M8 31l16 7 16-7M8 25l16 7 16-7" {...common} opacity=".5" />
        <path d="M8 19l16-7 16 7-16 7z" {...common} />
        <circle cx="24" cy="19" r="4.2" {...common} /><circle cx="24" cy="19" r="1.4" fill="currentColor" className="g-pulse" />
      </>); break
    case 'search':
      body = (<>
        <ellipse cx="24" cy="34" rx="18" ry="7" {...common} opacity=".35" /><ellipse cx="24" cy="29" rx="12.5" ry="5" {...common} opacity=".6" /><ellipse cx="24" cy="24" rx="7" ry="3" {...common} />
        <path d="M7 39c6-1 8-7 12-10s4-9 5-15" {...common} strokeDasharray="1.5 3.2" /><circle cx="24" cy="13" r="2.6" fill="currentColor" className="g-pulse" />
      </>); break
    case 'design':
      body = (<>
        <path d="M8 34l16 7 16-7-16-7z" {...common} opacity=".5" /><path d="M16 34l8 3.5 8-3.5M24 27v14" {...common} opacity=".35" />
        <path d="M30 7l7 4-11 18-7 3 0-7z" {...common} /><path d="M19 25l7 4" {...common} />
      </>); break
    case 'explain':
      body = (<>
        <path d="M8 22l16 7 16-7M8 22v12l16 7 16-7V22" {...common} />
        <path d="M8 22l10-13 12 2 10 11" {...common} opacity=".55" /><path d="M24 29v12" {...common} opacity=".5" />
        <path d="M17 19.500l7 3 7-3M20 15.500l4 1.700 4-1.700" {...common} className="g-pulse" />
      </>); break
    case 'sustain':
      body = (<>
        <g className="g-spin"><path d="M24 7a17 17 0 0 1 16 11M41 26a17 17 0 0 1-13 14.500M19 40.500A17 17 0 0 1 7 27M7.500 19A17 17 0 0 1 17 8.500" {...common} /><path d="M40 13v5.500h-5.500" {...common} /></g>
        <path d={cube(24, 24, 6.5)} {...common} opacity=".85" />
      </>); break
    case 'sun':
      body = (<><circle cx="24" cy="24" r="7" {...common} strokeWidth="2.4" /><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11.300 11.300l3.500 3.500M33.200 33.200l3.500 3.500M11.300 36.700l3.500-3.500M33.200 14.800l3.500-3.500" {...common} strokeWidth="2.4" /></>); break
    case 'moon':
      body = (<path d="M38 28.500A15 15 0 1 1 19.500 10a12 12 0 0 0 18.500 18.500z" {...common} strokeWidth="2.4" />); break
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ color, flexShrink: 0, display: 'block' }} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {body}
    </svg>
  )
}
