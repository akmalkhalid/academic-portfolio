'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Page transition — a single panel that sweeps across the viewport.
//
// One continuous gesture, not two separate effects: the panel enters from the
// left and covers the screen (the click), then keeps travelling in the same
// direction to uncover the new page. Its leading and trailing edges carry the
// pillar-colour ribbon that closes every dark band, so navigation is in the
// same visual language as the rest of the site.
//
// Budget: ~300ms cover + ~340ms reveal, and the reveal overlaps the new page's
// first paint. The previous digital-rain version cost ~950ms of opaque cover
// per click, which is a real tax on someone reading through six pages.
//
// prefers-reduced-motion: no panel at all, navigation is instant.
// ---------------------------------------------------------------------------

const COVER_MS = 300
const REVEAL_MS = 340

// Routes served by the App Router — these navigate client-side. Anything else
// under a leading slash (the /courses/*, /tools/*, /workshops/*, /newsletter/*
// static microsites in /public) needs a full document load.
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
// link text can be a whole card title, which truncates into nonsense
// ("COMPUTATIONAL INTELL"). Unknown routes fall back to their last segment.
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
  const panelRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLSpanElement>(null)
  const ctrl = useRef<{ reveal: () => void } | null>(null)
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ov = ovRef.current!
    const panel = panelRef.current!
    const tag = tagRef.current!
    let leaving = false
    let safety: number | null = null

    const hide = () => {
      ov.style.display = 'none'
      ov.style.pointerEvents = 'none'
      tag.style.opacity = '0'
    }

    // Panel is covering the screen → keep travelling right to uncover it.
    function reveal() {
      if (reduce) { hide(); return }
      if (safety) { clearTimeout(safety); safety = null }
      ov.style.display = 'block'
      ov.style.pointerEvents = 'none'
      panel.style.transition = 'none'
      panel.style.transform = 'translate3d(0,0,0)'
      void panel.offsetWidth // commit the start state before animating
      tag.style.opacity = '0'
      panel.style.transition = `transform ${REVEAL_MS}ms cubic-bezier(.76,0,.24,1)`
      panel.style.transform = 'translate3d(101%,0,0)'
      window.setTimeout(hide, REVEAL_MS + 40)
      leaving = false
    }

    // Enter from the left, cover the screen, then navigate.
    function cover(href: string, label: string, spa: boolean) {
      const go = () => { if (spa) router.push(href); else window.location.href = href }
      if (reduce) { go(); return }
      if (leaving) return
      leaving = true

      ov.style.display = 'block'
      ov.style.pointerEvents = 'auto' // swallow clicks mid-flight
      panel.style.transition = 'none'
      panel.style.transform = 'translate3d(-101%,0,0)'
      void panel.offsetWidth
      tag.textContent = label
      panel.style.transition = `transform ${COVER_MS}ms cubic-bezier(.76,0,.24,1)`
      panel.style.transform = 'translate3d(0,0,0)'
      window.setTimeout(() => { tag.style.opacity = '1' }, COVER_MS * 0.45)
      window.setTimeout(go, COVER_MS + 20)

      // If the navigation never lands (offline, a route that fails to resolve),
      // uncover rather than leaving the visitor staring at a dark panel.
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
      cover(href, labelFor(route), APP_ROUTES.includes(route === '' ? '/' : route))
    }
    document.addEventListener('click', onClick, true)

    ctrl.current = { reveal }
    reveal() // first load gets the uncovering half of the gesture

    return () => {
      document.removeEventListener('click', onClick, true)
      if (safety) clearTimeout(safety)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Uncover whenever the route actually changes.
  useEffect(() => {
    pathnameRef.current = pathname
    ctrl.current?.reveal()
  }, [pathname])

  return (
    <div ref={ovRef} className="pt-root" aria-hidden="true">
      <div ref={panelRef} className="pt-panel">
        <span ref={tagRef} className="pt-label" />
      </div>
    </div>
  )
}
