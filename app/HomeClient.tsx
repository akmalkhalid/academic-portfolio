'use client'

import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import { PCOL, PNAME, PBADGE, QCOL, CATNAME, type Code } from '@/lib/view'
import ResearchShowreel from '@/components/paper-demos/ResearchShowreel'
import DemoThumb from '@/components/pillar-demos/DemoThumb'
import type { PillarKey } from '@/lib/demos/registry'

type PubNode = { t: string; y: number; pills: Code[]; q: string; cat: string; citation: string; scholar: string }
type Funded = { role: string; title: string; agency: string; years: string; dots: string[] }
type Stats = { pubs: number; citations: number; hIndex: number | null; i10Index: number | null; grants: number; students: number; autoCitations?: number | null; autoSource?: string | null }

type SelectedGroup = { title: string; accent: string; items: { quartile: string; marker: string; cite: string; slug: string }[] }

export default function HomeClient({
  hero, pubs, funded, stats, articles,
}: { hero: { headline: string; sub: string }; pubs: PubNode[]; funded: Funded[]; stats: Stats; articles: SelectedGroup[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLCanvasElement>(null)
  const graphRef = useRef<HTMLCanvasElement>(null)

  const [pillarFilter, setPillarFilter] = useState<string[]>([])
  const [catFilter, setCatFilter] = useState<string[]>([])
  const [quartileFilter, setQuartileFilter] = useState<string[]>([])
  const [mode, setMode] = useState<'graph' | 'list'>('graph')
  const [selected, setSelected] = useState<PubNode | null>(null)
  const [copied, setCopied] = useState(false)

  // Live refs the canvas loops read without re-binding.
  const filtersRef = useRef({ pillarFilter, catFilter, quartileFilter })
  filtersRef.current = { pillarFilter, catFilter, quartileFilter }
  const modeRef = useRef(mode); modeRef.current = mode
  const selectRef = useRef(setSelected)

  // ---- all canvas + scroll logic, ported from the design (runs once) ----
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rafs: number[] = []
    const ios: IntersectionObserver[] = []
    const fits: (() => void)[] = []
    const root = () => wrapRef.current || document

    function fit(cv: HTMLCanvasElement, fallbackH?: number) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = cv.getBoundingClientRect()
      const w = r.width || cv.clientWidth, h = r.height || fallbackH || 320
      cv.width = w * dpr; cv.height = h * dpr
      const ctx = cv.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { w, h, ctx }
    }

    // ---- scroll-triggered fade-up ----
    let trPoll: any = null, onTrScroll: any = null
    function setupTextReveal(tries = 0) {
      const r = wrapRef.current
      if (!r) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      let els = ([...r.querySelectorAll('section h1, section h2, section h3, section p')] as HTMLElement[])
        .filter((el) => !el.closest('header,footer,nav') && el.textContent!.trim().length)
      if (!els.length || !els[0].offsetHeight) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      if (reduce) return
      els = els.filter((el) => el.offsetHeight > 0)
      els.forEach((el, i) => { (el as any).__order = i; el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; (el as any).__shown = false })
      const reveal = (el: HTMLElement, delayMs: number) => { (el as any).__shown = true; el.style.animation = 'dc-fade-up .6s cubic-bezier(.22,.61,.36,1) ' + delayMs + 'ms both'; setTimeout(() => { el.style.animation = ''; el.style.opacity = '1'; el.style.transform = 'none' }, delayMs + 720) }
      let sched = false
      const check = () => { sched = false; const vh = window.innerHeight; const pend = els.filter((el) => !(el as any).__shown).sort((a, b) => (a as any).__order - (b as any).__order); let i = 0; for (const el of pend) { if (el.getBoundingClientRect().top < vh * 0.92) reveal(el, Math.min(i++, 7) * 80) } if (els.every((el) => (el as any).__shown) && trPoll) { clearInterval(trPoll); trPoll = null } }
      onTrScroll = () => { if (sched) return; sched = true; requestAnimationFrame(check) }
      window.addEventListener('scroll', onTrScroll, { passive: true })
      window.addEventListener('resize', onTrScroll)
      trPoll = setInterval(check, 220)
      check()
    }

    // ---- hero particle field ----
    function setupHero() {
      const cv = heroRef.current; if (!cv) return
      if (!cv.getBoundingClientRect().width) { requestAnimationFrame(setupHero); return }
      let g = fit(cv)
      const cols = Object.values(PCOL)
      const mk = () => { const a: any[] = []; const N = g.w < 640 ? 78 : 150; for (let i = 0; i < N; i++) a.push({ x: Math.random() * g.w, y: Math.random() * g.h, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, c: cols[i % cols.length], r: Math.random() * 1.5 + 1 }); return a }
      let ps = mk()
      const mouse = { x: -999, y: -999 }
      cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top })
      cv.addEventListener('pointerleave', () => { mouse.x = -999; mouse.y = -999 })
      fits.push(() => { g = fit(cv); ps = mk() })
      const draw = () => {
        const ctx = g.ctx; ctx.clearRect(0, 0, g.w, g.h)
        for (const p of ps) {
          const a = Math.sin(p.y * 0.01 + p.x * 0.008) * 0.6
          p.vx += Math.cos(a) * 0.01; p.vy += Math.sin(a) * 0.01
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy
          if (d2 < 13000) { const d = Math.sqrt(d2) || 1; p.vx += dx / d * 0.5; p.vy += dy / d * 0.5 }
          p.vx *= 0.95; p.vy *= 0.95; p.x += p.vx; p.y += p.vy
          if (p.x < 0) p.x += g.w; if (p.x > g.w) p.x -= g.w; if (p.y < 0) p.y += g.h; if (p.y > g.h) p.y -= g.h
        }
        for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { const a = ps[i], b = ps[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 120) { ctx.strokeStyle = 'rgba(28,25,23,' + (0.06 * (1 - d / 120)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke() } }
        ctx.globalAlpha = .5
        for (const p of ps) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill() }
        ctx.globalAlpha = 1
      }
      if (reduce) { draw(); return }
      const loop = () => { draw(); rafs.push(requestAnimationFrame(loop)) }
      loop()
    }

    // ---- stat counters ----
    function setupCounters() {
      const els = ([...root().querySelectorAll('[data-count]')] as HTMLElement[]).filter((el) => !el.hasAttribute('data-live'))
      if (!els.length) return
      const run = () => els.forEach((el) => { const tgt = +el.getAttribute('data-count')!; const t0 = performance.now(); const dur = 1500; const step = (t: number) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(tgt * e).toLocaleString(); if (k < 1) requestAnimationFrame(step) }; requestAnimationFrame(step) })
      if (reduce) { els.forEach((el) => (el.textContent = (+el.getAttribute('data-count')!).toLocaleString())); return }
      const io = new IntersectionObserver((en) => { en.forEach((x) => { if (x.isIntersecting) { run(); io.disconnect() } }) }, { threshold: .4 })
      io.observe(els[0].closest('[data-stats]') || els[0]); ios.push(io)
    }

    // ---- live (cookie-free) visitor counter ----
    async function setupVisitorCounter(tries = 0) {
      const el = root().querySelector('[data-live]') as HTMLElement | null
      if (!el) { if (tries < 150) requestAnimationFrame(() => setupVisitorCounter(tries + 1)); return }
      const COUNTER_ENDPOINT = '' // deploy /analytics-worker then put its URL here
      const dnt = (navigator as any).doNotTrack === '1' || (window as any).doNotTrack === '1' || (navigator as any).globalPrivacyControl === true
      let count: number | null = null
      if (COUNTER_ENDPOINT) {
        try {
          const r = await fetch(COUNTER_ENDPOINT, dnt ? { method: 'GET' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: location.pathname, referrer: document.referrer }) })
          const d = await r.json(); count = d.totalViews ?? d.count ?? d.value ?? d.total ?? null; if (count != null) count = +count
        } catch { count = null }
      }
      if (count == null) {
        try { const k = 'akmal_visits', dk = 'akmal_visit_day'; let n = parseInt(localStorage.getItem(k) || '0', 10) || 0; const today = new Date().toISOString().slice(0, 10); if (!dnt && localStorage.getItem(dk) !== today) { n += 1; localStorage.setItem(k, String(n)); localStorage.setItem(dk, today) } count = n > 0 ? n : 1 } catch { count = 1 }
      }
      if (reduce) { el.textContent = Number(count).toLocaleString(); return }
      const t0 = performance.now(), dur = 1500
      const step = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(count! * e).toLocaleString(); if (k < 1) rafs.push(requestAnimationFrame(step)) }
      rafs.push(requestAnimationFrame(step))
    }

    // ---- publication constellation ----
    function setupGraph() {
      const cv = graphRef.current; if (!cv) return
      if (!cv.getBoundingClientRect().width) { requestAnimationFrame(setupGraph); return }
      let g = fit(cv, 440)
      const pillars: Code[] = ['gen', 'exp', 'evo', 'opt', 'gam', 'sim']
      let anchors: Record<string, { x: number; y: number }> = {}
      const setAnchors = () => { anchors = {}; const R = Math.min(g.w, g.h) * 0.32; pillars.forEach((p, i) => { const a = (i / pillars.length) * Math.PI * 2 - Math.PI / 2; anchors[p] = { x: g.w / 2 + Math.cos(a) * R, y: g.h / 2 + Math.sin(a) * R } }) }
      setAnchors()
      const nodes = pubs.map((d, i) => ({ ...d, p: d.pills[0], x: g.w / 2 + (Math.random() - .5) * g.w * 0.5, cy: g.h / 2 + (Math.random() - .5) * g.h * 0.5, vx: 0, vy: 0, r: 4 + ((i * 53) % 6) + (d.pills.length > 1 ? 1 : 0) }))
      const links: [number, number, string][] = []; const byP: Record<string, number[]> = {}
      nodes.forEach((n, i) => { n.pills.forEach((p) => { (byP[p] = byP[p] || []).push(i) }) })
      Object.keys(byP).forEach((p) => { const arr = byP[p]; for (let k = 0; k < arr.length; k++) links.push([arr[k], arr[(k + 1) % arr.length], p]) })
      let hover: any = null; const mouse = { x: -999, y: -999 }
      cv.addEventListener('pointermove', (e) => {
        const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top
        let h: any = null, hd = 16; for (const n of nodes) { const d = Math.hypot(n.x - mouse.x, n.cy - mouse.y); if (d < Math.max(hd, n.r + 8)) { hd = d; h = n } }
        hover = h; cv.style.cursor = h ? 'pointer' : 'default'
        const tip = root().querySelector('[data-graph-tip]') as HTMLElement | null
        if (tip) { if (h) { tip.style.opacity = '1'; tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 300) + 'px'; tip.style.top = (e.clientY + 16) + 'px'; const tt = tip.querySelector('[data-tip-title]') as HTMLElement, tm = tip.querySelector('[data-tip-meta]') as HTMLElement; if (tt) tt.textContent = h.t; if (tm) tm.textContent = h.pills.map((p: Code) => PNAME[p]).join(' + ') + ' · ' + h.y } else tip.style.opacity = '0' }
      })
      cv.addEventListener('pointerleave', () => { hover = null; const tip = root().querySelector('[data-graph-tip]') as HTMLElement | null; if (tip) tip.style.opacity = '0' })
      cv.addEventListener('click', () => { if (hover) { setCopied(false); selectRef.current(hover) } })
      fits.push(() => { g = fit(cv, 440); setAnchors() })
      const sim = () => {
        for (const n of nodes) { let ax = 0, ay = 0; for (const p of n.pills) { ax += anchors[p].x; ay += anchors[p].y } ax /= n.pills.length; ay /= n.pills.length; n.vx += (ax - n.x) * 0.008; n.vy += (ay - n.cy) * 0.008; n.vx += (g.w / 2 - n.x) * 0.0005; n.vy += (g.h / 2 - n.cy) * 0.0005 }
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j]; let dx = a.x - b.x, dy = a.cy - b.cy, d2 = dx * dx + dy * dy; if (d2 < 1) d2 = 1; if (d2 < 6500) { const d = Math.sqrt(d2), f = 140 / d2; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f } }
        for (const [i, j] of links) { const a = nodes[i], b = nodes[j], dx = b.x - a.x, dy = b.cy - a.cy, d = Math.hypot(dx, dy) || 1, f = (d - 46) * 0.01; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f }
        for (const n of nodes) { n.vx *= 0.84; n.vy *= 0.84; n.x += n.vx; n.cy += n.vy; n.x = Math.max(10, Math.min(g.w - 10, n.x)); n.cy = Math.max(10, Math.min(g.h - 10, n.cy)) }
      }
      const draw = () => {
        const ctx = g.ctx; const { pillarFilter: flt, catFilter: cf, quartileFilter: qf } = filtersRef.current; ctx.clearRect(0, 0, g.w, g.h); ctx.lineWidth = 1
        for (const [i, j, lp] of links) { const a = nodes[i], b = nodes[j]; const on = flt.length === 0 || flt.includes(lp); const bridge = a.pills.length > 1 || b.pills.length > 1; ctx.lineWidth = on && bridge ? 1.5 : 1; ctx.strokeStyle = on ? (bridge ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.09)') : 'rgba(255,255,255,.025)'; ctx.beginPath(); ctx.moveTo(a.x, a.cy); ctx.lineTo(b.x, b.cy); ctx.stroke() }
        for (const n of nodes) {
          const on = (flt.length === 0 || n.pills.some((p) => flt.includes(p))) && (cf.length === 0 || cf.includes(n.cat)) && (qf.length === 0 || qf.includes(n.q)); ctx.globalAlpha = on ? 1 : 0.16
          if (n.pills.length === 1) { ctx.fillStyle = PCOL[n.pills[0]]; ctx.beginPath(); ctx.arc(n.x, n.cy, n.r, 0, 7); ctx.fill() }
          else { const seg = Math.PI * 2 / n.pills.length; n.pills.forEach((p, k) => { ctx.fillStyle = PCOL[p]; ctx.beginPath(); ctx.moveTo(n.x, n.cy); ctx.arc(n.x, n.cy, n.r, -Math.PI / 2 + k * seg, -Math.PI / 2 + (k + 1) * seg); ctx.closePath(); ctx.fill() }); ctx.strokeStyle = 'rgba(255,255,255,' + (on ? 0.6 : 0.16) + ')'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(n.x, n.cy, n.r, 0, 7); ctx.stroke() }
          if (hover === n) { ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x, n.cy, n.r + 1.5, 0, 7); ctx.stroke() }
        }
        ctx.globalAlpha = 1
      }
      if (reduce) { for (let st = 0; st < 280; st++) sim(); draw(); return }
      let vis = true
      const io = new IntersectionObserver((en) => { en.forEach((x) => (vis = x.isIntersecting)) }, { threshold: .1 }); io.observe(cv); ios.push(io)
      const loop = () => { if (vis && modeRef.current === 'graph') { sim(); draw() } rafs.push(requestAnimationFrame(loop)) }
      loop()
    }

    const onResize = () => fits.forEach((f) => f && f())
    window.addEventListener('resize', onResize)

    setupTextReveal(); setupHero(); setupCounters(); setupVisitorCounter(); setupGraph()

    return () => {
      rafs.forEach((r) => cancelAnimationFrame(r))
      ios.forEach((o) => o.disconnect())
      if (trPoll) clearInterval(trPoll)
      if (onTrScroll) { window.removeEventListener('scroll', onTrScroll); window.removeEventListener('resize', onTrScroll) }
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- derived view data ----
  const toggle = (arr: string[], key: string) => (arr.includes(key) ? arr.filter((x) => x !== key) : arr.concat(key))
  const chipStyle = (active: boolean) =>
    "font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;cursor:pointer;padding:7px 13px;border-radius:8px;" +
    (active ? 'background:rgba(255,255,255,.14);color:#ECEAF3;border:1px solid rgba(255,255,255,.22)' : 'background:transparent;color:#9b96aa;border:1px solid rgba(255,255,255,.1)')

  const pillarDefs = [{ key: 'all', label: 'All', dot: '#cfcad9' } as any].concat(
    (['gen', 'opt', 'evo', 'gam', 'sim', 'exp'] as Code[]).map((k) => ({ key: k, label: PNAME[k], dot: PCOL[k] }))
  )
  const pillarChips = pillarDefs.map((c) => {
    const active = c.key === 'all' ? pillarFilter.length === 0 : pillarFilter.includes(c.key)
    return { label: c.label, dot: c.dot, active, onClick: () => (c.key === 'all' ? setPillarFilter([]) : setPillarFilter((f) => toggle(f, c.key))) }
  })
  const catKeys = ['j', 'c', 'b'].filter((k) => pubs.some((d) => d.cat === k))
  const catChips = [{ key: 'all', label: 'All', dot: '#cfcad9' } as any].concat(
    catKeys.map((k) => ({ key: k, label: CATNAME[k], dot: k === 'j' ? '#7d8fb3' : k === 'c' ? '#b39a7d' : '#9a7db3' }))
  ).map((c) => { const active = c.key === 'all' ? catFilter.length === 0 : catFilter.includes(c.key); return { label: c.label, dot: c.dot, active, onClick: () => (c.key === 'all' ? setCatFilter([]) : setCatFilter((f) => toggle(f, c.key))) } })
  const qKeys = ['Q1', 'Q2', 'Q3', 'Q4', 'NA'].filter((k) => pubs.some((d) => d.q === k))
  const quartileChips = [{ key: 'all', label: 'All', dot: '#cfcad9' } as any].concat(
    qKeys.map((k) => ({ key: k, label: k === 'NA' ? 'Non-indexed' : k, dot: QCOL[k] }))
  ).map((c) => { const active = c.key === 'all' ? quartileFilter.length === 0 : quartileFilter.includes(c.key); return { label: c.label, dot: c.dot, active, onClick: () => (c.key === 'all' ? setQuartileFilter([]) : setQuartileFilter((f) => toggle(f, c.key))) } })

  const filteredPubs = pubs
    .filter((d) => (pillarFilter.length === 0 || d.pills.some((p) => pillarFilter.includes(p))) && (catFilter.length === 0 || catFilter.includes(d.cat)) && (quartileFilter.length === 0 || quartileFilter.includes(d.q)))
    .slice().sort((a, b) => b.y - a.y)

  const sp = selected
  const spills = sp ? sp.pills : []
  const pc = sp ? PCOL[spills[0]] : '#6f6a82'

  const copyCite = () => {
    if (!sp) return
    try { navigator.clipboard.writeText(sp.citation) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  const statList = [
    { num: stats.pubs, display: String(stats.pubs), label: 'Peer-reviewed publications', hint: '2012 — 2026', dot: '#8b7bf0', live: false },
    { num: stats.citations, display: stats.citations.toLocaleString(), label: 'Citations', hint: `${stats.hIndex ? `Scholar · h-index ${stats.hIndex} · i10 ${stats.i10Index}` : 'Google Scholar'}${stats.autoCitations ? ` · ${stats.autoSource || 'OpenAlex'} ${stats.autoCitations.toLocaleString()}` : ''}`, dot: '#4d8df0', live: false },
    { num: stats.grants, display: String(stats.grants), label: 'Funded grants', hint: 'FRGS · GGPM · TR-UKM', dot: '#21b3a0', live: false },
    { num: stats.students, display: String(stats.students), label: 'Postgraduates supervised', hint: "PhD & Master's", dot: '#f2683f', live: false },
    { num: 0, display: '—', label: 'Site visitors', hint: 'cookie-free · live count', dot: '#84b53a', live: true },
  ]

  const tabOn = "font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;cursor:pointer;padding:7px 15px;border-radius:6px;border:none;background:#ECEAF3;color:#0f0e14"
  const tabOff = "font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:500;cursor:pointer;padding:7px 15px;border-radius:6px;border:none;background:transparent;color:#9b96aa"
  const stack = "'Space Grotesk', system-ui, sans-serif"
  const panelOpen = !!sp

  return (
    <div ref={wrapRef} data-screen-label="Home" style={s('min-height:100vh;overflow-x:hidden')}>
      {/* HERO */}
      <section id="top" style={s('position:relative;overflow:hidden;border-bottom:1px solid #e7e3dd')}>
        <canvas ref={heroRef} style={s('position:absolute;inset:0;width:100%;height:100%;display:block')} />
        <div style={s('position:relative;max-width:1120px;margin:0 auto;padding:78px 28px 70px;display:grid;grid-template-columns:1fr auto;gap:48px;align-items:center')}>
          <div style={s('max-width:760px')}>
            <p style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#8a8279;margin:0 0 22px")}>Dr. Mohd Nor Akmal Khalid · FTSM, UKM</p>
            <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(40px,6.4vw,76px);line-height:1.02;letter-spacing:-0.02em;margin:0 0 22px;text-wrap:balance`)}>{hero.headline}</h1>
            <p style={s('font-size:18px;line-height:1.6;color:#57514b;max-width:600px;margin:0 0 30px')}>{hero.sub}</p>
            <div style={s('display:flex;flex-wrap:wrap;gap:12px;margin-bottom:30px')}>
              <a href="#research" style={s('font-size:14.5px;font-weight:500;text-decoration:none;color:#fff;background:#16142e;padding:12px 20px;border-radius:8px')}>Explore my research →</a>
              <a href="#pubs" style={s('font-size:14.5px;font-weight:500;text-decoration:none;color:#1c1917;background:#fff;border:1px solid #d9d3ca;padding:12px 20px;border-radius:8px')}>View publications</a>
              <a href="/cv/Akmal_CV_2026.pdf" download style={s('font-size:14.5px;font-weight:500;text-decoration:none;color:#1c1917;background:#fff;border:1px solid #d9d3ca;padding:12px 20px;border-radius:8px')}>Download CV ↓</a>
            </div>
          </div>
          <div style={s('position:relative;width:230px;height:230px;flex-shrink:0;justify-self:end')}>
            <img src="/profile.jpg" alt="" aria-hidden="true" style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;filter:blur(34px);opacity:.45;transform:scale(1.12)')} />
            <img src="/profile.jpg" alt="Dr. Mohd Nor Akmal Khalid" style={s('position:relative;width:100%;height:100%;object-fit:cover;border-radius:50%;box-shadow:0 18px 50px -18px rgba(28,25,23,.5);border:5px solid #fff')} />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section data-stats="1" style={s('max-width:1120px;margin:0 auto;padding:46px 28px;display:grid;grid-template-columns:repeat(5,1fr);gap:18px')}>
        {statList.map((st, i) => (
          <div key={i} style={s('position:relative;padding-left:16px')}>
            <span style={s(`position:absolute;left:0;top:8px;width:7px;height:7px;border-radius:50%;background:${st.dot};animation:computePulse 2.6s ease-in-out infinite`)} />
            <div style={s(`font-family:${stack};font-weight:600;font-size:clamp(30px,3.4vw,42px);line-height:1;letter-spacing:-.02em`)}>
              <span {...(st.live ? { 'data-count': 0, 'data-live': '1' } : { 'data-count': st.num })}>{st.display}</span>
            </div>
            <div style={s('font-size:13px;color:#57514b;margin-top:8px;line-height:1.35')}>{st.label}</div>
            <div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.06em;color:#a39a8f;margin-top:3px;text-transform:uppercase")}>{st.hint}</div>
          </div>
        ))}
      </section>

      {/* RESEARCH PILLARS */}
      <section id="research" style={s('max-width:1120px;margin:0 auto;padding:30px 28px 64px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px")}>/ research program</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,3.6vw,40px);letter-spacing:-.02em;margin:0 0 32px`)}>Three pillars, one connected agenda.</h2>
        <div className="pillar-grid">
          {[
            { n: '01', accent: PCOL.evo, demoKey: 'swarm-landscape' as PillarKey, labBg: 'radial-gradient(120% 120% at 50% 0%,#142420 0%,#0c1614 72%)', title: 'Computational Intelligence & Optimization', blurb: 'Evolutionary and immune algorithms, swarm intelligence and metaheuristics — the search and optimization methods at the core of my work, applied to scheduling, assembly-line balancing and large-scale combinatorial problems.', tags: ['evo', 'opt'] as Code[] },
            { n: '02', accent: PCOL.gam, demoKey: 'procedural-dungeon' as PillarKey, labBg: 'radial-gradient(120% 120% at 50% 0%,#241410 0%,#160c0a 72%)', title: 'Games Informatics & Engagement Modelling', blurb: 'Game refinement theory and the “motion in mind” model, agent-based simulation and procedural content — measuring and optimizing what makes play engaging.', tags: ['gam', 'sim'] as Code[] },
            { n: '03', accent: PCOL.gen, demoKey: 'flow-field' as PillarKey, labBg: 'radial-gradient(120% 120% at 50% 0%,#1b1830 0%,#100e1a 72%)', title: 'Generative & Agentic AI', blurb: 'The emerging frontier — generative models, LLM foundation models and agentic content generation, extending the optimization-of-engagement programme into new domains.', tags: ['gen', 'exp'] as Code[] },
          ].map((p) => (
            <div key={p.n} className="pillar-card" style={s(`border-top:3px solid ${p.accent}`)}>
              <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:14px')}>
                <span style={s(`font-family:'JetBrains Mono',monospace;font-size:12px;color:${p.accent};font-weight:600`)}>PILLAR {p.n}</span>
                <span style={s(`width:9px;height:9px;border-radius:50%;background:${p.accent}`)} />
              </div>
              <DemoThumb demoKey={p.demoKey} accent={p.accent} height={126} bg={p.labBg} />
              <a href="/research" style={s('display:block;text-decoration:none;color:#1c1917;margin-top:16px')}>
                <h3 style={s(`font-family:${stack};font-weight:600;font-size:19px;line-height:1.18;letter-spacing:-.01em;margin:0 0 10px`)}>{p.title}</h3>
                <p style={s('font-size:13.5px;line-height:1.6;color:#57514b;margin:0 0 16px')}>{p.blurb}</p>
              </a>
              <div style={s('display:flex;flex-wrap:wrap;gap:7px;margin-top:auto')}>
                {p.tags.map((t) => (
                  <span key={t} style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;padding:3px 9px;border-radius:6px;background:${PBADGE[t].bg};color:${PBADGE[t].fg}`)}>{PNAME[t]}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE DEMOS (dark) */}
      <section style={s('background:#0f0e14;padding:62px 0;border-top:1px solid rgba(255,255,255,.05)')}>
        <div style={s('max-width:1120px;margin:0 auto;padding:0 28px')}>
          <div style={s('margin-bottom:26px')}>
            <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6f6a82;margin:0 0 10px")}>/ see the research run · live</p>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.4vw,38px);letter-spacing:-.02em;margin:0;color:#ECEAF3`)}>Three pillars, running live.</h2>
            <p style={s('font-size:14.5px;line-height:1.6;color:#9b96aa;max-width:620px;margin:12px 0 0')}>Each pillar demonstrated, not described — a showreel of the simulations rebuilt from the published work, playing one at a time. Open any one for the full, interactive version.</p>
          </div>
          <ResearchShowreel />
        </div>
      </section>

      {/* SELECTED ARTICLES (dark) */}
      <section id="pubs" style={s('background:#0f0e14;padding:70px 0;border-top:1px solid rgba(255,255,255,.05)')}>
        <div style={s('max-width:1120px;margin:0 auto;padding:0 28px')}>
          <div style={s('margin-bottom:30px')}>
            <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6f6a82;margin:0 0 10px")}>/ selected work</p>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.4vw,38px);letter-spacing:-.02em;margin:0;color:#ECEAF3`)}>Selected articles.</h2>
            <p style={s('font-size:14.5px;line-height:1.6;color:#9b96aa;max-width:600px;margin:12px 0 0')}>A curated slice of the record, grouped by research pillar. The full body of work — {stats.pubs} papers, filterable and mapped — lives on the publications page.</p>
          </div>
          {articles.map((group) => (
            <div key={group.title} style={s('margin-bottom:24px')}>
              <div style={s(`display:inline-block;font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:700;color:#0f0e14;background:${group.accent};border-radius:6px;padding:3px 10px;margin-bottom:6px`)}>{group.title}</div>
              <div style={s('display:flex;flex-direction:column')}>
                {group.items.map((it) => (
                  <a key={it.slug} href={`/publications/${it.slug}`} style={s('display:flex;gap:11px;align-items:baseline;padding:11px 4px;border-bottom:1px solid rgba(255,255,255,.06);text-decoration:none')}>
                    <span style={s(`color:${group.accent};font-weight:700;flex-shrink:0;width:12px;text-align:center`)}>{it.marker}</span>
                    {it.quartile && it.quartile !== 'NA' && (<span style={s(`font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;flex-shrink:0;padding:2px 6px;border-radius:4px;background:${QCOL[it.quartile] || '#6f6a82'}26;color:${QCOL[it.quartile] || '#9b96aa'};align-self:center`)}>{it.quartile}</span>)}
                    <span style={s('flex:1;min-width:0;font-size:13.8px;line-height:1.5;color:#c9c4d6')}>{it.cite}</span>
                    <span style={s('color:#56516a;flex-shrink:0;align-self:center;font-size:15px')}>→</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
          <a href="/publications" style={s(`display:inline-block;margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;text-decoration:none;color:#0f0e14;background:#ECEAF3;padding:11px 18px;border-radius:8px`)}>View all {stats.pubs} publications →</a>
        </div>
      </section>

      {/* FUNDED RESEARCH */}
      <section style={s('max-width:1120px;margin:0 auto;padding:64px 28px 30px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px")}>/ currently funded</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,3.6vw,40px);letter-spacing:-.02em;margin:0 0 32px`)}>Research in flight.</h2>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:18px')}>
          {funded.map((g, i) => (
            <div key={i} style={s('background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:22px')}>
              <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:14px')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.06em;color:#27500a;background:#eaf3de;padding:3px 8px;border-radius:5px")}>ACTIVE</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279")}>{g.role}</span>
              </div>
              <h3 style={s('font-size:16px;font-weight:600;line-height:1.32;margin:0 0 10px')}>{g.title}</h3>
              <p style={s('font-size:13px;color:#57514b;margin:0 0 14px;line-height:1.5')}>{g.agency}</p>
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#a39a8f")}>{g.years}</span>
                <div style={s('display:flex;gap:5px')}>{g.dots.map((d, k) => (<span key={k} style={s(`width:8px;height:8px;border-radius:50%;background:${d}`)} />))}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="collab" style={s('max-width:1120px;margin:0 auto;padding:30px 28px 70px')}>
        <div style={s('background:#16142e;border-radius:18px;padding:52px 44px;position:relative;overflow:hidden')}>
          <div style={s('position:relative;max-width:620px')}>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.4vw,38px);letter-spacing:-.02em;color:#fff;margin:0 0 14px`)}>Open to collaboration.</h2>
            <p style={s('font-size:16px;line-height:1.6;color:#bdb8d6;margin:0 0 26px')}>Postgraduate supervision (Master&apos;s &amp; PhD), industry research collaboration, and conference invitations are always welcome.</p>
            <a href="/contact" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 24px;border-radius:9px')}>Get in touch →</a>
          </div>
        </div>
      </section>

      {/* PUBLICATION PREVIEW PANEL */}
      <div onClick={() => setSelected(null)} style={s(`position:fixed;inset:0;z-index:99;background:rgba(8,7,12,.55);transition:opacity .3s;opacity:${panelOpen ? '1' : '0'};pointer-events:${panelOpen ? 'auto' : 'none'}`)} />
      <aside style={s(`position:fixed;top:0;right:0;height:100%;width:min(400px,90vw);z-index:100;background:#141019;border-left:1px solid rgba(255,255,255,.1);box-shadow:-30px 0 60px -20px rgba(0,0,0,.6);display:flex;flex-direction:column;transform:translateX(${panelOpen ? '0' : '101%'});transition:transform .34s cubic-bezier(.4,0,.2,1)`)}>
        {sp && (
          <>
            <div style={s(`height:5px;flex-shrink:0;background:${pc}`)} />
            <div data-darkscroll="1" style={s('padding:22px 24px 28px;display:flex;flex-direction:column;gap:16px;overflow-y:auto')}>
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6f6a82")}>Publication</span>
                <button type="button" onClick={() => setSelected(null)} aria-label="Close preview" style={s('width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:none;border-radius:8px;background:rgba(255,255,255,.06);color:#9b96aa;font-size:19px;line-height:1;cursor:pointer')}>×</button>
              </div>
              <div style={s('display:flex;gap:8px;align-items:center;flex-wrap:wrap')}>
                {spills.map((p) => (<span key={p} style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;background:${PCOL[p]}22;color:${PCOL[p]}`)}>{PNAME[p]}</span>))}
              </div>
              <h3 style={s("font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:22px;line-height:1.26;letter-spacing:-.01em;color:#ECEAF3;margin:0;text-wrap:pretty")}>{sp.t}</h3>
              <div style={s('display:flex;gap:34px;padding:15px 0;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)')}>
                <div>
                  <div style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;color:#6f6a82;margin-bottom:6px")}>YEAR</div>
                  <div style={s("font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:600;color:#ECEAF3;line-height:1")}>{sp.y}</div>
                </div>
                <div>
                  <div style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;color:#6f6a82;margin-bottom:6px")}>RESEARCH AREA</div>
                  <div style={s('font-size:15px;font-weight:500;color:#ECEAF3;line-height:1.2')}>{spills.map((p) => PNAME[p]).join(' + ')}</div>
                </div>
              </div>
              <a href={sp.scholar} target="_blank" rel="noopener noreferrer" style={s("display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;text-decoration:none;color:#0f0e14;background:#ECEAF3;padding:11px 17px;border-radius:8px;align-self:flex-start")}>Find on Google Scholar →</a>
              <div style={s('display:flex;flex-direction:column;gap:10px;padding-top:16px;border-top:1px solid rgba(255,255,255,.08)')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#6f6a82")}>Chicago citation</span>
                <p style={s("font-family:Georgia,'Times New Roman',serif;font-size:13.5px;line-height:1.6;color:#c9c4d6;margin:0;text-wrap:pretty")}>{sp.citation}</p>
                <button type="button" onClick={copyCite} style={s(`display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;color:${copied ? '#21b3a0' : '#cfcad9'};background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);padding:10px 15px;border-radius:8px;align-self:flex-start;transition:color .2s`)}>{copied ? '✓ Citation copied' : 'Copy Chicago citation'}</button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
