// ---------------------------------------------------------------------------
// Shared model for the procedural landscape.
//
// Three consumers read from here and must agree:
//   • ProcLandscape  — renders the terrain on the GPU (GLSL mirrors terrainAt)
//   • HeroSim        — the swarm climbs the terrain, so it samples terrainAt()
//   • PageTransition — the dissolve is painted in the live theme's colours
//
// The GLSL in ProcLandscape and `terrainAt` below are two implementations of the
// same field. They are NOT bit-identical — the shader runs 5 octaves, this runs 3
// — and they don't need to be. What must agree is the LARGE-SCALE STRUCTURE: the
// ridges and basins a viewer can see. If you change warp/ridge/frequency in one,
// change it in the other, or the swarm will visibly cluster on empty ground.
// ---------------------------------------------------------------------------

export type Theme = {
  name: string
  /** Four elevation stops, low → high, as 0-255 RGB. Kept dark: white body text sits on top. */
  palette: [number, number, number][]
  /** Domain-warp amplitude — how folded and turbulent the terrain looks. */
  warp: number
  /** 0 = rolling dunes, 1 = sharp ridged crests. */
  ridge: number
  /** Contour bands per unit elevation. */
  contour: number
  /** Light direction in radians. */
  light: number
}

// Every theme stays inside the site's palette family and inside a luminance
// budget that keeps hero text at AA contrast. Peaks glow; basins stay near-black.
export const THEMES: Theme[] = [
  {
    name: 'abyss',
    palette: [[7, 6, 15], [18, 24, 52], [16, 64, 78], [54, 150, 138]],
    warp: 0.55, ridge: 0.35, contour: 17, light: 2.3,
  },
  {
    name: 'ember',
    palette: [[10, 6, 10], [42, 18, 26], [96, 40, 30], [196, 96, 58]],
    warp: 0.8, ridge: 0.62, contour: 13, light: 1.1,
  },
  {
    name: 'violet',
    palette: [[8, 6, 16], [26, 20, 56], [58, 40, 118], [140, 118, 226]],
    warp: 0.42, ridge: 0.2, contour: 21, light: 3.1,
  },
  {
    name: 'moss',
    palette: [[6, 10, 10], [16, 38, 30], [38, 82, 42], [122, 168, 74]],
    warp: 0.68, ridge: 0.5, contour: 15, light: 0.6,
  },
  {
    name: 'steel',
    palette: [[6, 8, 14], [18, 30, 52], [34, 72, 116], [96, 150, 214]],
    warp: 0.5, ridge: 0.44, contour: 19, light: 2.7,
  },
  {
    name: 'amber',
    palette: [[10, 8, 8], [44, 30, 14], [104, 72, 20], [212, 156, 52]],
    warp: 0.62, ridge: 0.55, contour: 15, light: 1.8,
  },
]

// ---- live state, written once per frame by ProcLandscape -------------------
// A plain mutable singleton on purpose: this is read inside animation loops at
// 60fps by two other components. React state would re-render the tree every frame.
export const landscape = {
  /** Index into THEMES that the terrain is currently settling towards. */
  themeIndex: 0,
  /** Increments on every theme change — HeroSim watches this to re-search. */
  epoch: 0,
  /** Current interpolated shape parameters (what terrainAt should use). */
  seed: 0,
  warp: THEMES[0].warp,
  ridge: THEMES[0].ridge,
  /** Extra turbulence from pointer speed, 0..1. */
  turbulence: 0,
  /** Current palette stops as CSS rgb() strings, mid-transition aware. */
  low: 'rgb(7,6,15)',
  mid: 'rgb(16,64,78)',
  high: 'rgb(54,150,138)',
  /** True while a theme transition is sweeping across the screen. */
  transitioning: false,
}

export function lerpRGB(a: number[], b: number[], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}
export function rgbCss(c: number[]): string {
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
}

// ---- the field ------------------------------------------------------------
// Value noise with a smootherstep fade — same construction as the shader's.

function hash(ix: number, iy: number): number {
  let h = ix * 374761393 + iy * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
  const a = hash(ix, iy), b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

function fbm(x: number, y: number, octaves: number): number {
  let v = 0, amp = 0.5, fx = x, fy = y, norm = 0
  for (let i = 0; i < octaves; i++) {
    v += amp * noise(fx, fy)
    norm += amp
    // rotate between octaves so the lattice never lines up into visible grid artefacts
    const nx = fx * 1.94 - fy * 0.62, ny = fx * 0.62 + fy * 1.94
    fx = nx; fy = ny
    amp *= 0.5
  }
  return v / norm
}

/**
 * Elevation at a normalised point, 0..1. `nx`/`ny` are 0..1 across the band.
 * Mirrors the shader's terrain(): domain warp, then fbm, then a ridge transform.
 */
export function terrainAt(nx: number, ny: number): number {
  const s = landscape.seed
  // Feature size: low frequency on purpose. Small blobs read as mist; a viewer
  // only sees "landscape" when a handful of landforms span the whole band.
  let x = nx * 2.6 + s * 13.0
  let y = ny * 1.8 + s * 7.0

  const w = landscape.warp * (1 + landscape.turbulence * 1.2)
  const wx = fbm(x + 5.2, y + 1.3, 3)
  const wy = fbm(x + 1.7, y + 9.2, 3)
  x += (wx - 0.5) * 2 * w
  y += (wy - 0.5) * 2 * w

  let h = fbm(x, y, 4)
  const r = landscape.ridge
  if (r > 0.001) {
    const hr = 1 - Math.abs(h * 2 - 1)
    h = h + (hr - h) * r
  }
  // Contrast curve. Raw fbm clusters hard around 0.5, which shades into a flat
  // haze; this pushes basins down and crests up so there is something to light.
  h = Math.max(0, Math.min(1, (h - 0.5) * 1.85 + 0.5))
  h = h * h * (3 - 2 * h)
  // Gamma lift. Without it the field is badly skewed low (median ~0.2), so most
  // of the band sits in flat black basins, the palette's peak stops are never
  // reached and the contour lines only appear on a few ridges. Measured across
  // all themes and several seeds, ^0.62 spreads the median to ~0.45.
  return Math.pow(h, 0.62)
}
