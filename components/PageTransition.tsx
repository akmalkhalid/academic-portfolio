'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// Futuristic matrix-style page transition adapted for Next's client-side routing.
// - Reveals the page on first load and after every route change (rain → dissolve).
// - Intercepts internal link clicks: covers the screen, then router.push()es.
// - Honours prefers-reduced-motion (no animation, instant navigation).
export default function PageTransition() {
  const pathname = usePathname()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ovRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)
  const ctrl = useRef<any>(null)

  // Build the rain controller once.
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ov = ovRef.current!, cv = canvasRef.current!, tag = tagRef.current!
    const ctx = cv.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const fontSize = 16
    const GLYPHS = 'アイウエオカキクケコサシスセソタチツテ0123456789ABCDEF<>/\\{}[]#$%*+=:.'
    const ACCENTS = ['#21b3a0', '#4d8df0', '#8b7bf0', '#f2683f', '#84b53a']
    let W = 0, H = 0, cols = 0, drops: number[] = [], raf: number | null = null

    function resize() {
      W = window.innerWidth; H = window.innerHeight
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(W / fontSize)
      drops = new Array(cols)
      for (let i = 0; i < cols; i++) drops[i] = Math.random() * -40
    }
    resize()
    window.addEventListener('resize', resize)
    const gl = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]

    function draw() {
      ctx.fillStyle = 'rgba(7,7,11,0.10)'; ctx.fillRect(0, 0, W, H)
      ctx.font = '600 ' + fontSize + "px 'JetBrains Mono',ui-monospace,monospace"
      ctx.textBaseline = 'top'
      for (let i = 0; i < cols; i++) {
        const x = i * fontSize, y = drops[i] * fontSize
        ctx.fillStyle = i % 9 === 0 ? ACCENTS[i % ACCENTS.length] : 'rgba(31,174,156,0.9)'
        ctx.fillText(gl(), x, y - fontSize)
        ctx.fillStyle = '#e9fff9'; ctx.fillText(gl(), x, y)
        drops[i]++
        if (y > H && Math.random() > 0.975) drops[i] = Math.random() * -20
      }
    }
    function loop() { draw(); raf = requestAnimationFrame(loop) }
    function startRain() { if (!raf) { ctx.clearRect(0, 0, W, H); loop() } }
    function stopRain() { if (raf) { cancelAnimationFrame(raf); raf = null } }

    function reveal() {
      tag.style.opacity = '0'
      ov.style.transition = 'opacity .55s ease'
      ov.style.opacity = '0'
      setTimeout(() => { stopRain(); ov.style.pointerEvents = 'none'; ov.style.display = 'none' }, 600)
    }
    function intro() {
      if (reduce) { ov.style.opacity = '0'; ov.style.pointerEvents = 'none'; ov.style.display = 'none'; return }
      ov.style.display = 'block'
      ov.style.transition = 'none'
      ov.style.opacity = '1'
      ov.style.pointerEvents = 'auto'
      startRain()
      tag.textContent = 'DECRYPTING'
      tag.style.opacity = '1'
      void ov.offsetWidth
      setTimeout(reveal, 430)
    }
    // App routes use Next's client router; everything else under a leading slash
    // (the /courses/* and /tools/* static microsites in /public) gets a full load.
    const APP_ROUTES = ['/', '/about', '/research', '/publications', '/playground', '/teaching', '/contact', '/postgraduate-guide']
    const routeOf = (raw: string) => { let p = raw.split('#')[0].split('?')[0]; if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1); return p }
    let leaving = false
    function outro(href: string, label: string, spa: boolean) {
      const go = () => { if (spa) router.push(href); else window.location.href = href }
      if (reduce) { go(); return }
      if (leaving) return
      leaving = true
      ov.style.display = 'block'
      startRain()
      tag.textContent = label || 'LOADING'
      ov.style.transition = 'opacity .32s ease'
      ov.style.opacity = '1'
      ov.style.pointerEvents = 'auto'
      tag.style.opacity = '1'
      setTimeout(go, 520)
      // reset the guard shortly after navigation begins
      setTimeout(() => { leaving = false }, 900)
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
      const label = (a!.textContent || '').trim().replace(/[^A-Za-z0-9 ]/g, '').slice(0, 18) || 'LOADING'
      outro(href, label.toUpperCase(), APP_ROUTES.includes(routeOf(href)))
    }
    document.addEventListener('click', onClick, true)

    ctrl.current = { intro, reveal, startRain, stopRain }
    intro()

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('click', onClick, true)
      stopRain()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep a live ref of the current pathname for the click handler.
  const pathnameRef = useRef(pathname)
  useEffect(() => {
    pathnameRef.current = pathname
    // Replay the reveal whenever the route changes.
    if (ctrl.current) ctrl.current.intro()
  }, [pathname])

  return (
    <div
      ref={ovRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#07070b', opacity: 0, pointerEvents: 'none', display: 'none' }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div
        ref={tagRef}
        style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: "'JetBrains Mono',ui-monospace,monospace", fontSize: 12, letterSpacing: '.34em',
          textTransform: 'uppercase', color: 'rgba(127,240,221,.85)', textShadow: '0 0 12px rgba(33,179,160,.6)',
          opacity: 0, transition: 'opacity .25s ease', whiteSpace: 'nowrap',
        }}
      />
    </div>
  )
}
