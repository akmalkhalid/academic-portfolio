'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Page transition — an "aperture": the next page opens from the point you clicked.
//
// Leaving a page (cover):
//   0. the screen "breaks" at the click point: seventy-two fine glass shards (triangles
//      and four-sided pieces drawn in one SVG) appear as cracks, then fly outwards,
//      tip and fade. See shatter() below;
//   1. underneath, a veil in the page's own background colour grows as a circle from
//      the same point (CSS clip-path), with a thin glowing ring riding its edge;
//   2. the old page sinks back a little (scale + fade), so the veil reads as
//      something in front of it, not a flash;
//   3. the destination's name appears in the middle, then we navigate.
// Arriving (reveal):
//   4. the veil fades out while the new page settles forward into place.
//
// Every piece moves once, on one eased curve, driven by the browser's Web
// Animations API (element.animate). No canvas and no per-pixel work, so it cannot
// stutter into a glitch the way the old pixel dissolve could.
//
// Cost: ~570ms cover (150ms of cracking, then 420ms of veil) + ~520ms reveal; the reveal overlaps the new page's first
// paint. prefers-reduced-motion skips the whole thing. The colours come from the
// theme variables, so it matches dark and light.
// ---------------------------------------------------------------------------

const COVER_MS = 420
const CRACK_MS = 150   // how long the cracks show before the veil starts to open
const SHARDS = 18      // pieces per ring; four rings, so 72 shards
const REVEAL_MS = 520
const EASE = 'cubic-bezier(.62,.02,.18,1)'

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

export default function PageTransition() {
  const pathname = usePathname()
  const router = useRouter()
  const ovRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const glassRef = useRef<SVGSVGElement>(null)
  const tagRef = useRef<HTMLSpanElement>(null)
  const ctrl = useRef<{ reveal: () => void } | null>(null)
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ov = ovRef.current!, veil = veilRef.current!, ring = ringRef.current!, tag = tagRef.current!, glass = glassRef.current!
    const page = () => document.querySelector('main') as HTMLElement | null
    let leaving = false
    let covered = false          // is the veil currently up?
    let safety: number | null = null

    const hide = () => { ov.style.display = 'none'; ov.style.pointerEvents = 'none'; tag.style.opacity = '0'; glass.replaceChildren(); covered = false }

    // The break. Four rings of points are scattered around the click (x, y); joining
    // neighbours gives triangles next to the click and four-sided shards further out,
    // which is roughly how real glass cracks. Each shard then flies away from the click.
    function shatter(x: number, y: number, W: number, H: number, R: number) {
      glass.replaceChildren()
      glass.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const small = Math.min(W, H)
      const radii = [0, small * 0.1, small * 0.24, small * 0.46, R]        // centre, three rings, off-screen
      const last = radii.length - 1
      const jitter = () => 0.72 + Math.random() * 0.56
      // pts[ring][i] = a point on that ring; ring 0 is the click itself
      const pts = radii.map((r, ring) => Array.from({ length: SHARDS }, (_, i) => {
        const a = ((i + (ring % 2 ? 0.5 : 0)) / SHARDS) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
        const rr = ring === 0 ? 0 : ring === last ? r : r * jitter()
        return [x + Math.cos(a) * rr, y + Math.sin(a) * rr] as [number, number]
      }))
      for (let ring = 0; ring < last; ring++) for (let i = 0; i < SHARDS; i++) {
        const j = (i + 1) % SHARDS
        const corners = ring === 0 ? [pts[0][i], pts[1][i], pts[1][j]] : [pts[ring][i], pts[ring + 1][i], pts[ring + 1][j], pts[ring][j]]
        const cx = corners.reduce((a, p) => a + p[0], 0) / corners.length, cy = corners.reduce((a, p) => a + p[1], 0) / corners.length
        const d = Math.hypot(cx - x, cy - y) || 1
        // kept small on purpose: the pieces part and drift, they do not explode
        const push = 18 + ring * 22 + Math.random() * 18                      // outer shards travel a little further
        const dx = ((cx - x) / d) * push, dy = ((cy - y) / d) * push + 20      // + a little gravity
        const spin = (Math.random() - 0.5) * 22
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        el.setAttribute('points', corners.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '))
        glass.appendChild(el)
        el.animate(
          [
            { opacity: 0, transform: 'none' },
            { opacity: 1, transform: 'none', offset: 0.12 },                  // the crack appears
            { opacity: 1, transform: 'none', offset: 0.26 },                  // and holds for a beat
            { opacity: 0, transform: `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) rotate(${spin.toFixed(0)}deg) scale(.9)` },
          ],
          { duration: CRACK_MS + COVER_MS, delay: ring * 28, easing: 'cubic-bezier(.3,.1,.5,.7)', fill: 'both' },
        )
      }
    }

    // Arriving: fade the veil (if it is up) and let the page settle forward.
    function reveal() {
      if (safety) { clearTimeout(safety); safety = null }
      leaving = false
      if (reduce) { hide(); return }
      // drop the "sunk back" state left by cover(), or the page would stay dim after arriving
      page()?.getAnimations().forEach((an) => an.cancel())
      page()?.animate(
        [{ opacity: 0, transform: 'translateY(14px) scale(1.012)' }, { opacity: 1, transform: 'none' }],
        { duration: REVEAL_MS, easing: 'cubic-bezier(.2,.7,.2,1)' },
      )
      if (!covered) { hide(); return }
      tag.style.opacity = '0'
      ring.style.opacity = '0'
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: REVEAL_MS * 0.8, easing: 'ease-out', fill: 'forwards' }).onfinish = hide
    }

    // Leaving: open the veil from the click point, then navigate.
    function cover(href: string, label: string, spa: boolean, x: number, y: number) {
      const go = () => { if (spa) router.push(href); else window.location.href = href }
      if (reduce) { go(); return }
      if (leaving) return
      leaving = true; covered = true

      const W = window.innerWidth, H = window.innerHeight
      // radius that reaches the farthest corner from the click point
      const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 40
      ov.style.display = 'block'
      ov.style.pointerEvents = 'auto' // swallow clicks mid-flight
      veil.getAnimations().forEach((a) => a.cancel())
      veil.style.setProperty('--px', x + 'px'); veil.style.setProperty('--py', y + 'px')
      shatter(x, y, W, H, R)
      veil.animate(
        [{ clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 1 }, { clipPath: `circle(${R}px at ${x}px ${y}px)`, opacity: 1 }],
        { duration: COVER_MS, delay: CRACK_MS, easing: EASE, fill: 'both' },
      )
      // the ring is a circle of diameter 2R centred on the click, scaled up from nothing
      ring.style.cssText = `left:${x - R}px;top:${y - R}px;width:${2 * R}px;height:${2 * R}px;opacity:1`
      ring.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 0.2 }], { duration: COVER_MS, delay: CRACK_MS, easing: EASE, fill: 'both' })
      page()?.animate([{ opacity: 1, transform: 'none' }, { opacity: 0.35, transform: 'scale(.985)' }], { duration: COVER_MS, delay: CRACK_MS, easing: 'ease-out', fill: 'both' })

      tag.textContent = label
      window.setTimeout(() => { tag.style.opacity = '1' }, CRACK_MS + COVER_MS * 0.5)
      window.setTimeout(go, CRACK_MS + COVER_MS + 20)

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
      // keyboard "clicks" report 0,0: open from the centre of the link instead
      let x = e.clientX, y = e.clientY
      if (!x && !y && a) { const b = a.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top + b.height / 2 }
      cover(href, labelFor(route), APP_ROUTES.includes(route === '' ? '/' : route), x, y)
    }
    document.addEventListener('click', onClick, true)
    // Coming back with the browser's Back button can restore a page with the veil still up.
    const onShow = () => { if (covered) { hide(); leaving = false } }
    window.addEventListener('pageshow', onShow)

    ctrl.current = { reveal }
    reveal() // first load: the page just settles in

    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('pageshow', onShow)
      if (safety) clearTimeout(safety)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reveal whenever the route actually changes.
  useEffect(() => {
    pathnameRef.current = pathname
    ctrl.current?.reveal()
  }, [pathname])

  return (
    <div ref={ovRef} className="pt-root" aria-hidden="true">
      <div ref={veilRef} className="pt-veil" />
      <div ref={ringRef} className="pt-ring" />
      <svg ref={glassRef} className="pt-glass" preserveAspectRatio="none" />
      <span ref={tagRef} className="pt-label" />
    </div>
  )
}
