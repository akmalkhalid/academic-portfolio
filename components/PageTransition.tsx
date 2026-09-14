'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { landscape } from '@/lib/landscape'

// ---------------------------------------------------------------------------
// Page transition — an organic pixel dissolve.
//
// The screen is divided into chunky cells. Each cell gets a threshold made of
// fractal noise (so cells flip in connected, organic clumps rather than as TV
// static), a per-cell random jitter (so the edges speckle), and a bias by
// distance from the click point (so the dissolve GROWS from wherever the visitor
// pressed). A rising cutoff sweeps that threshold field: cells below the cutoff
// are painted, and the last ones to flip glow, which gives the advancing front a
// visible leading edge.
//
// The cells are painted in the LIVE colours of the procedural landscape
// (lib/landscape), so a page change reads as the terrain itself crumbling into
// the next page rather than as a generic overlay.
//
// Cost: ~340ms cover + ~420ms reveal, and the reveal overlaps the incoming
// page's first paint. prefers-reduced-motion skips the whole thing.
// ---------------------------------------------------------------------------

const COVER_MS = 380
const REVEAL_MS = 460
/** Cell edge in CSS pixels — the "pixel" of the pixel dissolve. */
const CELL = 13

const ROUTE_LABEL: Record<string, string> = {
  '': 'Home',
  '/about': 'About',
  '/research': 'Research',
  '/publications': 'Publications',
  '/playground': 'Playground',
  '/teaching': 'Teaching',
  '/cv': 'Curriculum Vitae',
  '/contact': 'Contact',
  '/postgraduate-guide': 'Postgraduate Guide',
}
const APP_ROUTES = Object.keys(ROUTE_LABEL).map((r) => r || '/')

// Label the panel by where you are GOING, not by the text of the link clicked —
// link text can be a whole card title, which truncates into nonsense.
function labelFor(route: string): string {
  const known = ROUTE_LABEL[route === '/' ? '' : route]
  if (known) return known.toUpperCase()
  const seg = route.split('/').filter(Boolean).pop() || 'Loading'
  return seg.replace(/[-_]+/g, ' ').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 24).trim().toUpperCase() || 'LOADING'
}

// ---- a small value-noise, just for the dissolve pattern --------------------
function hash(ix: number, iy: number, seed: number): number {
  let h = ix * 374761393 + iy * 668265263 + seed * 2147483647
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}
function vnoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed)
  const c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

function parseRgb(css: string): [number, number, number] {
  const m = css.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  return m ? [+m[1], +m[2], +m[3]] : [10, 9, 20]
}

export default function PageTransition() {
  const pathname = usePathname()
  const router = useRouter()
  const ovRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const tagRef = useRef<HTMLSpanElement>(null)
  const ctrl = useRef<{ reveal: () => void } | null>(null)
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ov = ovRef.current!
    const cv = cvRef.current!
    const tag = tagRef.current!
    const ctx = cv.getContext('2d')!

    let cols = 0, rows = 0
    let thr = new Float32Array(0)
    let tint = new Float32Array(0)
    let img: ImageData | null = null
    let cell: HTMLCanvasElement | null = null
    let cellCtx: CanvasRenderingContext2D | null = null
    let raf = 0
    let leaving = false
    let safety: number | null = null

    function sizeTo(originX: number, originY: number, seed: number) {
      const W = window.innerWidth, H = window.innerHeight
      cv.width = W; cv.height = H
      cv.style.width = W + 'px'; cv.style.height = H + 'px'
      cols = Math.max(2, Math.ceil(W / CELL))
      rows = Math.max(2, Math.ceil(H / CELL))
      thr = new Float32Array(cols * rows)
      tint = new Float32Array(cols * rows)

      if (!cell) { cell = document.createElement('canvas'); cellCtx = cell.getContext('2d') }
      cell.width = cols; cell.height = rows
      img = cellCtx!.createImageData(cols, rows)

      // Origin in cell space; the dissolve grows outward from here.
      const ox = originX * cols, oy = originY * rows
      const maxD = Math.hypot(Math.max(ox, cols - ox), Math.max(oy, rows - oy)) || 1

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i
          // two octaves of noise → connected organic clumps
          const n = 0.65 * vnoise(i * 0.075, j * 0.075, seed) + 0.35 * vnoise(i * 0.19, j * 0.19, seed + 7)
          const jitter = hash(i, j, seed + 31)
          const d = Math.hypot(i - ox, j - oy) / maxD
          thr[k] = d * 0.52 + n * 0.36 + jitter * 0.12
          tint[k] = n
        }
      }
      // Stretch to a full 0..1 so the front sweeps for the whole duration.
      let lo = Infinity, hi = -Infinity
      for (let k = 0; k < thr.length; k++) { if (thr[k] < lo) lo = thr[k]; if (thr[k] > hi) hi = thr[k] }
      const span = Math.max(1e-4, hi - lo)
      for (let k = 0; k < thr.length; k++) thr[k] = (thr[k] - lo) / span
    }

    function paint(cut: number, inverted: boolean) {
      if (!img || !cell || !cellCtx) return
      const lo = parseRgb(landscape.low)
      const hi = parseRgb(landscape.high)
      const d = img.data
      for (let k = 0; k < thr.length; k++) {
        const t = thr[k]
        const on = inverted ? t > cut : t <= cut
        const o = k * 4
        if (!on) { d[o + 3] = 0; continue }
        // cells that flipped most recently glow — this is the advancing front
        const age = Math.max(0, Math.min(1, Math.abs(cut - t) * 3.4))
        const edge = 1 - age
        const mix = Math.min(1.3, 0.05 + tint[k] * 0.1 + edge * edge * 1.2)
        d[o] = Math.min(255, lo[0] + (hi[0] - lo[0]) * mix)
        d[o + 1] = Math.min(255, lo[1] + (hi[1] - lo[1]) * mix)
        d[o + 2] = Math.min(255, lo[2] + (hi[2] - lo[2]) * mix)
        d[o + 3] = 255
      }
      cellCtx.putImageData(img, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(cell, 0, 0, cv.width, cv.height)
    }

    const hide = () => {
      ov.style.display = 'none'
      ov.style.pointerEvents = 'none'
      tag.style.opacity = '0'
      if (raf) { cancelAnimationFrame(raf); raf = 0 }
    }

    function animate(ms: number, inverted: boolean, done?: () => void) {
      const t0 = performance.now()
      const stepFn = (now: number) => {
        const p = Math.min(1, (now - t0) / ms)
        // ease so the front accelerates then settles
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        paint(e, inverted)
        if (p < 1) raf = requestAnimationFrame(stepFn)
        else { raf = 0; done?.() }
      }
      raf = requestAnimationFrame(stepFn)
    }

    // Dissolve the cover AWAY, revealing whatever page is underneath.
    function reveal() {
      if (reduce) { hide(); return }
      if (safety) { clearTimeout(safety); safety = null }
      ov.style.display = 'block'
      ov.style.pointerEvents = 'none'
      sizeTo(Math.random() * 0.6 + 0.2, Math.random() * 0.6 + 0.2, Math.floor(Math.random() * 9999))
      tag.style.opacity = '0'
      paint(0, true)
      animate(REVEAL_MS, true, hide)
      leaving = false
    }

    // Dissolve a cover IN from the click point, then navigate.
    function cover(href: string, label: string, spa: boolean, ox: number, oy: number) {
      const go = () => { if (spa) router.push(href); else window.location.href = href }
      if (reduce) { go(); return }
      if (leaving) return
      leaving = true

      ov.style.display = 'block'
      ov.style.pointerEvents = 'auto' // swallow clicks mid-flight
      sizeTo(ox, oy, Math.floor(Math.random() * 9999))
      tag.textContent = label
      animate(COVER_MS, false)
      window.setTimeout(() => { tag.style.opacity = '1' }, COVER_MS * 0.55)
      window.setTimeout(go, COVER_MS + 30)

      // If the navigation never lands, uncover rather than stranding the visitor.
      safety = window.setTimeout(() => { if (leaving) reveal() }, 2600)
    }

    const routeOf = (raw: string) => {
      let p = raw.split('#')[0].split('?')[0]
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
      return p
    }

    function internalHref(a: HTMLAnchorElement | null): string | null {
      if (!a) return null
      if (a.target === '_blank' || a.hasAttribute('download')) return null
      const raw = a.getAttribute('href') || ''
      if (!raw || raw.charAt(0) === '#') return null
      if (/^(https?:|mailto:|tel:)/i.test(raw)) return null
      if (raw.charAt(0) !== '/') return null // same-origin absolute paths only
      if (routeOf(raw) === routeOf(pathnameRef.current)) return null
      return raw
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement)?.closest?.('a') as HTMLAnchorElement | null
      const href = internalHref(a)
      if (!href) return
      e.preventDefault()
      const route = routeOf(href)
      const ox = e.clientX / Math.max(1, window.innerWidth)
      const oy = e.clientY / Math.max(1, window.innerHeight)
      cover(href, labelFor(route), APP_ROUTES.includes(route === '' ? '/' : route), ox, oy)
    }
    document.addEventListener('click', onClick, true)

    ctrl.current = { reveal }
    reveal() // first load dissolves in

    return () => {
      document.removeEventListener('click', onClick, true)
      if (safety) clearTimeout(safety)
      if (raf) cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dissolve away whenever the route actually changes.
  useEffect(() => {
    pathnameRef.current = pathname
    ctrl.current?.reveal()
  }, [pathname])

  return (
    <div ref={ovRef} className="pt-root" aria-hidden="true">
      <canvas ref={cvRef} className="pt-canvas" />
      <span ref={tagRef} className="pt-label" />
    </div>
  )
}
