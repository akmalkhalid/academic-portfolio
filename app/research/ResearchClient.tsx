'use client'

import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'

const stack = "'Space Grotesk', system-ui, sans-serif"
const PB: Record<string, { bg: string; fg: string }> = {
  purple: { bg: '#eeedfe', fg: '#3c3489' }, amber: { bg: '#faeeda', fg: '#633806' }, teal: { bg: '#e1f5ee', fg: '#085041' },
  blue: { bg: '#e6f1fb', fg: '#0c447c' }, coral: { bg: '#faece7', fg: '#712b13' }, green: { bg: '#eaf3de', fg: '#27500a' },
}
const chip = (label: string, c: string) => ({ label, style: `font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;padding:3px 9px;border-radius:6px;background:${PB[c].bg};color:${PB[c].fg}` })
const motif = [{ delay: '0s' }, { delay: '.3s' }, { delay: '.6s' }, { delay: '.9s' }]

type Stat = { num: number; prefix: string; display: string; label: string; hint: string; dot: string }
type TL = { short: string; amountFmt: string; roleShort: string; title: string; barStyle: string; barLabel: string }
type Grant = { title: string; agency: string; grantCode: string; role: string; amountFmt: string; years: string; accent: string; tags: { label: string; style: string }[] }

export default function ResearchClient({
  stats, timeline, years, todayLeft, active, completed, activeCount, completedCount,
}: {
  stats: Stat[]; timeline: TL[]; years: { label: string; left: number }[]; todayLeft: number
  active: Grant[]; completed: Grant[]; activeCount: number; completedCount: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const genRef = useRef<HTMLCanvasElement>(null)
  const tspRef = useRef<HTMLCanvasElement>(null)
  const boidsRef = useRef<HTMLCanvasElement>(null)
  const [optPlaying, setOptPlaying] = useState(true)
  const optWantRef = useRef(true)
  const resetOptRef = useRef<() => void>(() => {})
  const regenPcgRef = useRef<() => void>(() => {})

  const toggleOpt = () => { optWantRef.current = !optWantRef.current; setOptPlaying(optWantRef.current) }
  const resetOpt = () => resetOptRef.current()
  const regenPcg = () => regenPcgRef.current()

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rafs: number[] = []; const ios: IntersectionObserver[] = []; const fits: (() => void)[] = []
    const root = () => wrapRef.current || document
    let trPoll: any = null, onTrScroll: any = null
    const fit = (cv: HTMLCanvasElement, fh?: number) => { const dpr = Math.min(window.devicePixelRatio || 1, 2); const r = cv.getBoundingClientRect(); const w = r.width || cv.clientWidth, h = r.height || fh || 320; cv.width = w * dpr; cv.height = h * dpr; const ctx = cv.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { w, h, ctx } }

    function setupTextReveal(tries = 0) {
      const r = wrapRef.current
      if (!r) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      let els = ([...r.querySelectorAll('section h1, section h2, section h3, section p')] as HTMLElement[]).filter((el) => !el.closest('header,footer,nav') && el.textContent!.trim().length)
      if (!els.length || !els[0].offsetHeight) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      if (reduce) return
      els = els.filter((el) => el.offsetHeight > 0)
      els.forEach((el, i) => { (el as any).__order = i; el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; (el as any).__shown = false })
      const reveal = (el: HTMLElement, d: number) => { (el as any).__shown = true; el.style.animation = 'dc-fade-up .6s cubic-bezier(.22,.61,.36,1) ' + d + 'ms both'; setTimeout(() => { el.style.animation = ''; el.style.opacity = '1'; el.style.transform = 'none' }, d + 720) }
      let sched = false
      const check = () => { sched = false; const vh = window.innerHeight; const pend = els.filter((el) => !(el as any).__shown).sort((a, b) => (a as any).__order - (b as any).__order); let i = 0; for (const el of pend) if (el.getBoundingClientRect().top < vh * 0.92) reveal(el, Math.min(i++, 7) * 80); if (els.every((el) => (el as any).__shown) && trPoll) { clearInterval(trPoll); trPoll = null } }
      onTrScroll = () => { if (sched) return; sched = true; requestAnimationFrame(check) }
      window.addEventListener('scroll', onTrScroll, { passive: true }); window.addEventListener('resize', onTrScroll)
      trPoll = setInterval(check, 220); check()
    }

    function setupCounters(tries = 0) {
      const els = [...root().querySelectorAll('[data-count]')] as HTMLElement[]
      if (!els.length) { if (tries < 300) requestAnimationFrame(() => setupCounters(tries + 1)); return }
      const run = () => els.forEach((el) => { const tgt = +el.getAttribute('data-count')!, t0 = performance.now(), dur = 1600; const step = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(tgt * e).toLocaleString(); if (k < 1) requestAnimationFrame(step) }; requestAnimationFrame(step) })
      if (reduce) { els.forEach((el) => (el.textContent = (+el.getAttribute('data-count')!).toLocaleString())); return }
      const io = new IntersectionObserver((en) => { en.forEach((x) => { if (x.isIntersecting) { run(); io.disconnect() } }) }, { threshold: .4 })
      io.observe(els[0].closest('[data-stats]') || els[0]); ios.push(io)
    }

    // ---- generative field ----
    function setupGen() {
      const cv = genRef.current; if (!cv || !cv.getBoundingClientRect().width) { requestAnimationFrame(setupGen); return }
      let g = fit(cv, 320)
      const cols = ['#8b7bf0', '#a99bf5', '#d99320', '#b98ad6']
      const mk = () => { const a: any[] = []; const N = g.w < 640 ? 64 : 108; for (let i = 0; i < N; i++) a.push({ x: Math.random() * g.w, y: Math.random() * g.h, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, c: cols[i % cols.length], r: Math.random() * 1.6 + 1 }); return a }
      let ps = mk(); const mouse = { x: -999, y: -999 }
      cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top })
      cv.addEventListener('pointerleave', () => { mouse.x = -999; mouse.y = -999 })
      fits.push(() => { g = fit(cv, 320); ps = mk() })
      const draw = () => { const ctx = g.ctx; ctx.clearRect(0, 0, g.w, g.h)
        for (const p of ps) { const a = Math.sin(p.y * 0.012 + p.x * 0.009) * 0.7; p.vx += Math.cos(a) * 0.012; p.vy += Math.sin(a) * 0.012; const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy; if (d2 < 12000) { const d = Math.sqrt(d2) || 1; p.vx += dx / d * 0.5; p.vy += dy / d * 0.5 } p.vx *= 0.95; p.vy *= 0.95; p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x += g.w; if (p.x > g.w) p.x -= g.w; if (p.y < 0) p.y += g.h; if (p.y > g.h) p.y -= g.h }
        for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { const a = ps[i], b = ps[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 110) { ctx.strokeStyle = 'rgba(139,123,240,' + (0.16 * (1 - d / 110)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke() } }
        ctx.globalAlpha = .85; for (const p of ps) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill() } ctx.globalAlpha = 1
      }
      if (reduce) { draw(); return }
      let vis = true; const io = new IntersectionObserver((en) => { en.forEach((x) => (vis = x.isIntersecting)) }, { threshold: .1 }); io.observe(cv); ios.push(io)
      const loop = () => { if (vis) draw(); rafs.push(requestAnimationFrame(loop)) }; loop()
    }

    // ---- swarm optimization on a fitness landscape ----
    function setupOpt() {
      const cv = tspRef.current; if (!cv || !cv.getBoundingClientRect().width) { requestAnimationFrame(setupOpt); return }
      let g = fit(cv, 320)
      const off = document.createElement('canvas'); let octx: CanvasRenderingContext2D, peaks: any[] = [], maxV = 1
      const fval = (x: number, y: number) => { let s = 0; for (const p of peaks) { const dx = x - p.cx, dy = y - p.cy; s += p.h * Math.exp(-(dx * dx + dy * dy) / (2 * p.s * p.s)) } return s }
      const buildLandscape = () => {
        peaks = []; const np = 3 + ((Math.random() * 2) | 0)
        for (let i = 0; i < np; i++) peaks.push({ cx: 46 + Math.random() * (g.w - 92), cy: 40 + Math.random() * (g.h - 80), h: 0.42 + Math.random() * 0.5, s: 38 + Math.random() * 52 })
        let gi = 0; for (let i = 1; i < peaks.length; i++) if (peaks[i].h > peaks[gi].h) gi = i; peaks[gi].h = 1.15; peaks[gi].s = Math.max(peaks[gi].s, 52)
        maxV = 0.0001; for (let x = 0; x < g.w; x += 8) for (let y = 0; y < g.h; y += 8) { const v = fval(x, y); if (v > maxV) maxV = v }
        off.width = g.w; off.height = g.h; octx = off.getContext('2d')!
        octx.fillStyle = '#0b1513'; octx.fillRect(0, 0, g.w, g.h)
        const st = 7; for (let x = 0; x < g.w; x += st) for (let y = 0; y < g.h; y += st) { const v = fval(x, y) / maxV; octx.fillStyle = 'rgba(33,179,160,' + (Math.pow(v, 1.7) * 0.82) + ')'; octx.fillRect(x, y, st, st) }
      }
      let swarm: any[] = [], gbest = { x: 0, y: 0, v: -1 }, iter = 0
      const initSwarm = () => { swarm = []; gbest = { x: 0, y: 0, v: -1 }; iter = 0; for (let i = 0; i < 46; i++) { const x = Math.random() * g.w, y = Math.random() * g.h, v = fval(x, y); if (v > gbest.v) gbest = { x, y, v }; swarm.push({ x, y, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, bx: x, by: y, bv: v }) } }
      const updEl = () => { const a = root().querySelector('[data-r1="evolutionary"]') as HTMLElement, b = root().querySelector('[data-r2="evolutionary"]') as HTMLElement; if (a) a.textContent = String(iter); if (b) b.textContent = Math.round(gbest.v / maxV * 100) + '%' }
      const stepSwarm = () => {
        const w = 0.8, toBest = 0.05, toG = 0.07, per = 44
        for (const p of swarm) {
          let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0
          for (const o of swarm) { if (o === p) continue; const dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy); if (d < per && d > 0) { ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; if (d < 18) { sx -= dx / d; sy -= dy / d } n++ } }
          if (n) { ax /= n; ay /= n; cx = cx / n - p.x; cy = cy / n - p.y; p.vx += (ax - p.vx) * 0.04 + cx * 0.0006 + sx * 0.05; p.vy += (ay - p.vy) * 0.04 + cy * 0.0006 + sy * 0.05 }
          p.vx = w * p.vx + toBest * Math.random() * (p.bx - p.x) + toG * Math.random() * (gbest.x - p.x)
          p.vy = w * p.vy + toBest * Math.random() * (p.by - p.y) + toG * Math.random() * (gbest.y - p.y)
          const sp = Math.hypot(p.vx, p.vy), mx = 4.6; if (sp > mx) { p.vx = p.vx / sp * mx; p.vy = p.vy / sp * mx }
          p.x = Math.max(0, Math.min(g.w, p.x + p.vx)); p.y = Math.max(0, Math.min(g.h, p.y + p.vy))
          const v = fval(p.x, p.y); if (v > p.bv) { p.bv = v; p.bx = p.x; p.by = p.y } if (v > gbest.v) gbest = { x: p.x, y: p.y, v }
        }
        iter++
      }
      const draw = () => { const ctx = g.ctx; if (off.width) ctx.drawImage(off, 0, 0, g.w, g.h); else { ctx.fillStyle = '#0b1513'; ctx.fillRect(0, 0, g.w, g.h) }
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(gbest.x, gbest.y, 10, 0, 7); ctx.stroke()
        ctx.globalAlpha = .95
        for (const p of swarm) { const a = Math.atan2(p.vy, p.vx); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.fillStyle = '#7af0dd'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 3); ctx.lineTo(-4, -3); ctx.closePath(); ctx.fill(); ctx.restore() }
        ctx.globalAlpha = 1
      }
      buildLandscape(); initSwarm(); draw(); updEl()
      fits.push(() => { g = fit(cv, 320); buildLandscape(); initSwarm(); draw() })
      resetOptRef.current = () => { buildLandscape(); initSwarm(); draw(); updEl() }
      if (reduce) { for (let st = 0; st < 120; st++) stepSwarm(); draw(); updEl(); return }
      let vis = true; const io = new IntersectionObserver((en) => { en.forEach((x) => (vis = x.isIntersecting)) }, { threshold: .2 }); io.observe(cv); ios.push(io)
      let acc = 0
      const tick = () => { if (optWantRef.current && vis) { stepSwarm(); draw(); if ((acc++ % 3) === 0) updEl() } rafs.push(requestAnimationFrame(tick)) }; tick()
    }

    // ---- procedural dungeon ----
    function setupPCG() {
      const cv = boidsRef.current; if (!cv || !cv.getBoundingClientRect().width) { requestAnimationFrame(setupPCG); return }
      let g = fit(cv, 320)
      const cell = 12; let cols: number, rows: number, grid: number[], floors: number[], reveal = 0, rooms: any[] = [], timer = 0
      const gen = () => {
        cols = Math.floor(g.w / cell); rows = Math.floor(g.h / cell); grid = new Array(cols * rows).fill(0); rooms = []
        for (let t = 0; t < 70 && rooms.length < 11; t++) {
          const rw = 3 + ((Math.random() * 5) | 0), rh = 3 + ((Math.random() * 4) | 0)
          const rx = 1 + ((Math.random() * (cols - rw - 2)) | 0), ry = 1 + ((Math.random() * (rows - rh - 2)) | 0)
          let ok = true; for (const o of rooms) { if (rx < o.x + o.w + 1 && rx + rw + 1 > o.x && ry < o.y + o.h + 1 && ry + rh + 1 > o.y) { ok = false; break } }
          if (!ok) continue; rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: rx + (rw >> 1), cy: ry + (rh >> 1) })
        }
        for (const r of rooms) for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) grid[y * cols + x] = 1
        for (let i = 1; i < rooms.length; i++) { const a = rooms[i - 1], b = rooms[i]; let x = a.cx, y = a.cy; while (x !== b.cx) { if (!grid[y * cols + x]) grid[y * cols + x] = 2; x += x < b.cx ? 1 : -1 } while (y !== b.cy) { if (!grid[y * cols + x]) grid[y * cols + x] = 2; y += y < b.cy ? 1 : -1 } }
        floors = []; for (let i = 0; i < grid.length; i++) if (grid[i]) floors.push(i)
        const ox = rooms.length ? rooms[0].cx : 0, oy = rooms.length ? rooms[0].cy : 0
        floors.sort((p, q) => { const ax = p % cols, ay = (p / cols) | 0, bx = q % cols, by = (q / cols) | 0; return (Math.abs(ax - ox) + Math.abs(ay - oy)) - (Math.abs(bx - ox) + Math.abs(by - oy)) })
        reveal = floors.length; timer = 0
        const a = root().querySelector('[data-r1="games"]') as HTMLElement, b = root().querySelector('[data-r2="games"]') as HTMLElement; if (a) a.textContent = String(rooms.length); if (b) b.textContent = String(floors.length)
      }
      const draw = () => { const ctx = g.ctx; ctx.fillStyle = '#160c0a'; ctx.fillRect(0, 0, g.w, g.h); const n = reduce ? floors.length : Math.min(reveal, floors.length); for (let i = 0; i < n; i++) { const idx = floors[i], x = idx % cols, y = (idx / cols) | 0; ctx.fillStyle = grid[idx] === 2 ? 'rgba(242,104,63,0.5)' : '#f2683f'; ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2) } }
      gen(); draw()
      fits.push(() => { g = fit(cv, 320); gen(); draw() })
      regenPcgRef.current = () => { gen(); draw() }
      cv.addEventListener('pointerdown', () => { gen(); draw() })
      if (reduce) { draw(); return }
      let vis = true; const io = new IntersectionObserver((en) => { en.forEach((x) => (vis = x.isIntersecting)) }, { threshold: .15 }); io.observe(cv); ios.push(io)
      const loop = () => { if (vis) { timer++; if (timer > 360) { gen(); draw() } } rafs.push(requestAnimationFrame(loop)) }; loop()
    }

    const onResize = () => fits.forEach((f) => f && f())
    window.addEventListener('resize', onResize)
    setupTextReveal(); setupGen(); setupOpt(); setupPCG(); setupCounters()

    return () => {
      rafs.forEach((r) => cancelAnimationFrame(r)); ios.forEach((o) => o.disconnect())
      if (trPoll) clearInterval(trPoll); if (onTrScroll) { window.removeEventListener('scroll', onTrScroll); window.removeEventListener('resize', onTrScroll) }
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const darkBtn = (c: string) => `font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;color:#0f0e14;background:${c};border:none;padding:8px 16px;border-radius:7px;cursor:pointer`
  const ghostBtn = "font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#ECEAF3;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);padding:8px 14px;border-radius:7px;cursor:pointer"

  const pillars = [
    { id: 'generative-ai', n: '03', accent: '#8b7bf0', accentSoft: '#eeedfe', title: 'Generative & Agentic AI',
      body: 'Two complementary visions of machine intelligence: one that creates and one that reasons. My research couples generative models — transformers, diffusion architectures and GANs — with structured, symbolic and rule-based knowledge to build systems that are both creative and explainable.',
      themes: [chip('Transformers & diffusion', 'purple'), chip('LLM-assisted reasoning', 'purple'), chip('Text-to-image / video', 'purple'), chip('Explainable decision support', 'amber'), chip('Knowledge-based systems', 'amber')],
      slot: { level: 'PhD', funding: 'Funded', title: 'LLM-Driven Human–AI Collaboration in Team Settings', desc: 'Large language models as collaborative teammates — how humans and AI co-reason, divide work and build shared understanding in team-based problem solving.' },
      labBg: 'radial-gradient(120% 120% at 50% 0%,#1b1830 0%,#100e1a 72%)', ref: genRef, cursor: 'default',
      demoEyebrow: 'Latent flow field · generative', demoCaption: 'Particles self-organize and connections form and dissolve — emergence as a stand-in for the generative process. Move your cursor to perturb the field.',
      readoutDisp: 'none', r1label: '', r2label: '', controls: [] as any[] },
    { id: 'evolutionary', n: '01', accent: '#21b3a0', accentSoft: '#e1f5ee', title: 'Computational Intelligence & Optimization',
      body: 'Many of the most important problems in engineering, logistics and AI are NP-hard. My work designs nature-inspired metaheuristics — genetic algorithms, swarm intelligence and hybrid memetic methods — for large-scale combinatorial and continuous optimization.',
      themes: [chip('Genetic & immune algorithms', 'teal'), chip('Swarm intelligence', 'teal'), chip('Memetic hybrids', 'teal'), chip('Assembly-line balancing', 'blue'), chip('Production scheduling', 'blue'), chip('Combinatorial optimization', 'blue')],
      slot: { level: 'PhD / MSc', funding: 'Scholarship-eligible', title: 'Optimizing for Engagement: Game Refinement Meets Optimization', desc: 'Coupling metaheuristic optimization with game-refinement theory — deriving new performance and engagement metrics that quantify what makes systems and play compelling.' },
      labBg: 'radial-gradient(120% 120% at 50% 0%,#142420 0%,#0c1614 72%)', ref: tspRef, cursor: 'default',
      demoEyebrow: 'Swarm intelligence · fitness landscape', demoCaption: 'A flock of agents foraging a multimodal landscape — local flocking rules combined with a pull toward the best-known peak. Swarm behaviour and optimization in one. Brighter regions are higher fitness.',
      readoutDisp: 'flex', r1label: 'ITERATION', r2label: 'BEST FITNESS',
      controls: [{ label: optPlaying ? '❚❚ Pause' : '▶ Play', onClick: toggleOpt, style: darkBtn('#21b3a0') }, { label: 'New landscape', onClick: resetOpt, style: ghostBtn }] },
    { id: 'games', n: '02', accent: '#f2683f', accentSoft: '#faece7', title: 'Games Informatics & Engagement Modelling',
      body: 'My signature line of work: extending game-refinement theory and the “motion in mind” model to measure and optimize engagement, addiction and player experience. It spans procedural content generation where human and AI players co-create, gamification and serious games, and agent-based simulation of how people actually play.',
      themes: [chip('Procedural content generation', 'coral'), chip('Roguelike level design', 'coral'), chip('Gamification', 'coral'), chip('Serious games', 'green'), chip('Agent-based simulation', 'green'), chip('Player-experience modelling', 'green')],
      slot: { level: 'PhD', funding: 'Scholarship-eligible', title: 'Agentic Procedural Content Generation for Adaptive Play', desc: 'Integrating PCG with agentic and generative AI — co-designing levels, mechanics and narratives that adapt for richer, more entertaining player experiences.' },
      labBg: 'radial-gradient(120% 120% at 50% 0%,#241410 0%,#160c0a 72%)', ref: boidsRef, cursor: 'pointer',
      demoEyebrow: 'Procedural dungeon · content generation', demoCaption: 'A roguelike level synthesized from nothing — rooms scattered, then stitched with corridors. Every roll is unique. Click the canvas or Regenerate to roll a new one.',
      readoutDisp: 'flex', r1label: 'ROOMS', r2label: 'FLOOR TILES', controls: [{ label: 'Regenerate', onClick: regenPcg, style: darkBtn('#f2683f') }] },
  ]

  return (
    <div ref={wrapRef} data-screen-label="Research" style={s('min-height:100vh;overflow-x:hidden')}>
      {/* HEADER */}
      <section style={s('max-width:1120px;margin:0 auto;padding:56px 28px 20px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>/ research · projects · funding</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(38px,5.6vw,68px);line-height:1.02;letter-spacing:-.02em;margin:0 0 18px;max-width:920px;text-wrap:balance`)}>Three interconnected pillars at the convergence of AI, optimization and play.</h1>
        <p style={s('font-size:18px;line-height:1.6;color:#57514b;max-width:680px;margin:0 0 22px')}>Each pillar carries its own signature colour and a live demonstration you can touch — followed by the <a href="#projects" style={s('color:#16142e;font-weight:500;text-decoration:none;border-bottom:1px solid #cfc7bb')}>funded projects</a> where the methods meet real-world delivery. The research doesn&apos;t just describe; it runs.</p>
        <div style={s("display:flex;flex-wrap:wrap;gap:18px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#8a8279")}>
          <a href="#generative-ai" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>01 · Generative AI</a>
          <a href="#evolutionary" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>02 · Optimization</a>
          <a href="#games" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>03 · Games &amp; Simulation</a>
          <a href="#projects" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>↓ Funded projects</a>
        </div>
      </section>

      {/* PILLARS */}
      {pillars.slice().sort((a, b) => a.n.localeCompare(b.n)).map((p) => (
        <section key={p.id} id={p.id} style={s('max-width:1120px;margin:0 auto;padding:40px 28px 24px;scroll-margin-top:80px')}>
          <div style={s('display:flex;align-items:center;gap:16px;margin-bottom:26px')}>
            <span style={s(`font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:${p.accent};letter-spacing:.08em`)}>PILLAR {p.n}</span>
            <span style={s(`flex:1;height:1px;background:linear-gradient(90deg,${p.accent}55,transparent)`)} />
            <div style={s('display:flex;gap:5px')}>
              {motif.map((m, i) => (<span key={i} style={s(`width:7px;height:7px;border-radius:50%;background:${p.accent};animation:computePulse 2.4s ease-in-out infinite;animation-delay:${m.delay}`)} />))}
            </div>
          </div>
          <div style={s('display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:start')}>
            <div>
              <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.2vw,38px);line-height:1.08;letter-spacing:-.02em;margin:0 0 18px`)}>{p.title}</h2>
              <p style={s('font-size:16px;line-height:1.7;color:#44403c;margin:0 0 22px')}>{p.body}</p>
              <div style={s('display:flex;flex-wrap:wrap;gap:8px')}>
                {p.themes.map((t, i) => (<span key={i} style={s(t.style)}>{t.label}</span>))}
              </div>
            </div>
            <div style={s(`background:#fff;border:1px solid #e7e3dd;border-left:3px solid ${p.accent};border-radius:12px;padding:22px`)}>
              <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:12px')}>
                <span style={s(`font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.06em;color:${p.accent};background:${p.accentSoft};padding:3px 8px;border-radius:5px`)}>OPEN POSITION</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279")}>{p.slot.level} · {p.slot.funding}</span>
              </div>
              <h3 style={s('font-size:15.5px;font-weight:600;line-height:1.32;margin:0 0 10px')}>{p.slot.title}</h3>
              <p style={s('font-size:13.5px;color:#57514b;line-height:1.55;margin:0 0 14px')}>{p.slot.desc}</p>
              <a href="/contact" style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:500;text-decoration:none;color:#fff;background:#16142e;padding:8px 14px;border-radius:7px;display:inline-block")}>Enquire →</a>
            </div>
          </div>
          <div style={s(`margin-top:30px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:${p.labBg}`)}>
            <div style={s('padding:18px 22px 0;display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap')}>
              <div>
                <p style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${p.accent};margin:0 0 6px`)}>{p.demoEyebrow}</p>
                <p style={s('font-size:14.5px;color:#cfcad9;margin:0;max-width:620px;line-height:1.55')}>{p.demoCaption}</p>
              </div>
              <div style={s(`display:${p.readoutDisp};gap:26px;flex-shrink:0`)}>
                <div><div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#6f6a82;letter-spacing:.08em")}>{p.r1label}</div><div data-r1={p.id} style={s(`font-family:${stack};font-size:28px;font-weight:600;color:${p.accent};line-height:1.1`)}>—</div></div>
                <div><div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#6f6a82;letter-spacing:.08em")}>{p.r2label}</div><div data-r2={p.id} style={s(`font-family:${stack};font-size:28px;font-weight:600;color:#ECEAF3;line-height:1.1`)}>—</div></div>
              </div>
            </div>
            <div style={s('position:relative;margin-top:14px')}>
              <canvas ref={p.ref} style={s(`display:block;width:100%;height:320px;cursor:${p.cursor}`)} />
              <div style={s('position:absolute;left:18px;bottom:14px;display:flex;gap:10px')}>
                {p.controls.map((ctl, i) => (<button key={i} type="button" onClick={ctl.onClick} style={s(ctl.style)}>{ctl.label}</button>))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* FUNDED PROJECTS */}
      <section id="projects" style={s('max-width:1120px;margin:0 auto;padding:58px 28px 4px;scroll-margin-top:80px')}>
        <div style={s('display:flex;align-items:center;gap:16px;margin-bottom:22px')}>
          <span style={s("font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#4d8df0;letter-spacing:.08em")}>FUNDED WORK</span>
          <span style={s('flex:1;height:1px;background:linear-gradient(90deg,#4d8df055,transparent)')} />
        </div>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.2vw,38px);line-height:1.08;letter-spacing:-.02em;margin:0 0 14px`)}>From grant to delivery.</h2>
        <p style={s('font-size:16px;line-height:1.7;color:#44403c;margin:0;max-width:700px')}>Competitive grants spanning national AI infrastructure, healthcare optimization and creativity-based learning. The projects where the three pillars meet real-world delivery.</p>
      </section>

      {/* STATS */}
      <section data-stats="1" style={s('max-width:1120px;margin:0 auto;padding:24px 28px 10px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px')}>
        {stats.map((st, i) => (
          <div key={i} style={s('position:relative;padding-left:16px')}>
            <span style={s(`position:absolute;left:0;top:8px;width:7px;height:7px;border-radius:50%;background:${st.dot};animation:computePulse 2.6s ease-in-out infinite`)} />
            <div style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,3.2vw,40px);line-height:1;letter-spacing:-.02em`)}>{st.prefix}<span data-count={st.num}>{st.display}</span></div>
            <div style={s('font-size:13px;color:#57514b;margin-top:8px;line-height:1.35')}>{st.label}</div>
            <div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.06em;color:#a39a8f;margin-top:3px;text-transform:uppercase")}>{st.hint}</div>
          </div>
        ))}
      </section>

      {/* FUNDING TIMELINE */}
      <section style={s('max-width:1120px;margin:0 auto;padding:40px 28px 20px')}>
        <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(22px,2.6vw,30px);letter-spacing:-.02em;margin:0`)}>Funding timeline</h2>
          <div style={s("display:flex;gap:18px;align-items:center;font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279")}>
            <span style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:18px;height:9px;border-radius:3px;background:#4d8df0;display:inline-block')} />Active</span>
            <span style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:18px;height:9px;border-radius:3px;background:#4d8df0;opacity:.4;display:inline-block')} />Completed</span>
            <span style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:2px;height:13px;background:#d9542b;display:inline-block')} />Today</span>
          </div>
        </div>
        <div style={s('background:#fff;border:1px solid #e7e3dd;border-radius:16px;padding:20px 22px')}>
          <div data-tlscroll style={s('max-height:322px;overflow-y:auto;margin:-5px -6px 0;padding:5px 6px 0')}>
            {timeline.map((g, i) => (
              <div key={i} style={s('display:grid;grid-template-columns:230px 1fr;gap:16px;align-items:center;padding:5px 0')}>
                <div style={s('min-width:0')}>
                  <div style={s('font-size:13px;font-weight:500;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{g.short}</div>
                  <div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#a39a8f")}>{g.amountFmt} · {g.roleShort}</div>
                </div>
                <div style={s('position:relative;height:30px;border-radius:6px;background:repeating-linear-gradient(90deg,transparent,transparent calc(15.384% - 1px),#f0ece5 calc(15.384% - 1px),#f0ece5 15.384%)')}>
                  <div style={s(`position:absolute;top:0;bottom:0;width:2px;background:#d9542b;left:${todayLeft}%`)} />
                  <div title={g.title} style={s(g.barStyle)}>
                    <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;color:#fff;white-space:nowrap;overflow:hidden")}>{g.barLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={s('display:grid;grid-template-columns:230px 1fr;gap:16px;margin-top:10px;padding-top:10px;border-top:1px solid #f0ece5')}>
            <div />
            <div style={s('position:relative;height:16px')}>
              {years.map((y, i) => (<span key={i} style={s(`position:absolute;font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f;left:${y.left}%;transform:translateX(-50%)`)}>{y.label}</span>))}
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE GRANTS */}
      <section style={s('max-width:1120px;margin:0 auto;padding:30px 28px 10px')}>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(20px,2.4vw,26px);letter-spacing:-.02em;margin:0 0 18px`)}>Active grants <span style={s("font-family:'JetBrains Mono',monospace;font-size:14px;color:#a39a8f;font-weight:500")}>· {activeCount}</span></h2>
        <div style={s('display:grid;grid-template-columns:repeat(2,1fr);gap:18px')}>
          {active.map((g, i) => (
            <div key={i} style={s(`background:#fff;border:1px solid #e7e3dd;border-top:3px solid ${g.accent};border-radius:14px;padding:22px`)}>
              <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:14px')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.06em;color:#27500a;background:#eaf3de;padding:3px 8px;border-radius:5px")}>ACTIVE</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279")}>{g.role}</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#1c1917;font-weight:600;margin-left:auto")}>{g.amountFmt}</span>
              </div>
              <h3 style={s('font-size:15.5px;font-weight:600;line-height:1.34;margin:0 0 8px')}>{g.title}</h3>
              <p style={s('font-size:13px;color:#57514b;margin:0 0 14px')}>{g.agency}{g.grantCode ? ' · ' + g.grantCode : ''}</p>
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <div style={s('display:flex;flex-wrap:wrap;gap:6px')}>{g.tags.map((t, k) => (<span key={k} style={s(t.style)}>{t.label}</span>))}</div>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f")}>{g.years}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPLETED GRANTS */}
      <section style={s('max-width:1120px;margin:0 auto;padding:30px 28px 10px')}>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(20px,2.4vw,26px);letter-spacing:-.02em;margin:0 0 18px`)}>Completed grants <span style={s("font-family:'JetBrains Mono',monospace;font-size:14px;color:#a39a8f;font-weight:500")}>· {completedCount}</span></h2>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
          {completed.map((g, i) => (
            <div key={i} style={s('background:#fbfaf8;border:1px solid #ece8e1;border-radius:12px;padding:18px')}>
              <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:12px')}>
                <span style={s(`width:8px;height:8px;border-radius:50%;background:${g.accent}`)} />
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279")}>{g.role}</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#57514b;font-weight:600;margin-left:auto")}>{g.amountFmt}</span>
              </div>
              <h3 style={s('font-size:14px;font-weight:600;line-height:1.34;margin:0 0 8px')}>{g.title}</h3>
              <p style={s('font-size:12px;color:#8a8279;margin:0 0 4px')}>{g.agency}</p>
              <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f;margin:0")}>{g.years}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s('max-width:1120px;margin:30px auto 0;padding:30px 28px 70px')}>
        <div style={s('background:#16142e;border-radius:18px;padding:48px 44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;color:#fff;margin:0 0 12px`)}>Want to work on one of these?</h2>
          <p style={s('font-size:16px;line-height:1.6;color:#bdb8d6;margin:0 0 24px;max-width:560px')}>Postgraduate supervision and research collaboration across all three pillars. Funded and scholarship-eligible positions open. Prospective students — start with the postgraduate guide.</p>
          <div style={s('display:flex;flex-wrap:wrap;gap:12px;align-items:center')}>
            <a href="/contact" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 24px;border-radius:9px')}>Get in touch →</a>
            <a href="/postgraduate-guide" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);padding:13px 24px;border-radius:9px')}>Postgraduate guide →</a>
          </div>
        </div>
      </section>
    </div>
  )
}
