'use client'

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'

const stack = "'Space Grotesk', system-ui, sans-serif"

const TOOLS = [
  {
    href: '/tools/gaya-ukm-formatter/',
    accent: '#21409A', kicker: 'Reference formatter', status: 'Live',
    title: 'Gaya UKM Reference Formatter',
    blurb: 'Turn a form, raw BibTeX, a .bib file or a DOI into a clean Gaya UKM reference list — author–date, hanging indents, italics preserved. Bahasa Melayu or English, with a live preview and one-click copy.',
    chips: ['Fields · BibTeX · DOI', 'Crossref lookup', 'BM / EN', 'Copy & export'],
  },
]

export default function Page() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mazeRef = useRef<HTMLCanvasElement>(null)
  const flockRef = useRef<HTMLCanvasElement>(null)
  const lifeRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rafs: number[] = []; const ios: IntersectionObserver[] = []; const fits: (() => void)[] = []
    const root = () => wrapRef.current || document
    let trPoll: any = null, onTrScroll: any = null, lifeUp: any = null
    const fit = (cv: HTMLCanvasElement, fh?: number) => { const dpr = Math.min(window.devicePixelRatio || 1, 2); const r = cv.getBoundingClientRect(); const w = r.width || cv.clientWidth, h = r.height || fh || 210; cv.width = w * dpr; cv.height = h * dpr; const ctx = cv.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { w, h, ctx } }

    function setupTextReveal(tries = 0) {
      const r = wrapRef.current
      if (!r) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      let els = ([...r.querySelectorAll('section h1, section h2, section h3, section > p')] as HTMLElement[]).filter((el) => !el.closest('header,footer,nav') && el.textContent!.trim().length)
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

    function setupMaze() {
      const cv = mazeRef.current; if (!cv || !cv.getBoundingClientRect().width) { requestAnimationFrame(setupMaze); return }
      let g = fit(cv, 210)
      let cs: number, cols: number, rows: number, cells: any[], queue: number[], parent: number[], path: number[] | null, phase: string, exitIdx: number
      let visitedOrder: number[] = [], pathDraw = 0, holdT = 0
      const idx = (x: number, y: number) => y * cols + x
      const build = () => {
        cs = Math.max(11, Math.floor(g.w / 24)); cols = Math.max(4, Math.floor((g.w - 2) / cs)); rows = Math.max(3, Math.floor((g.h - 2) / cs))
        cells = []; for (let i = 0; i < cols * rows; i++) cells.push({ n: true, e: true, s: true, w: true, v: false, bfs: false })
        const stack = [0]; cells[0].v = true; let count = 1; const total = cols * rows
        while (count < total) {
          const cur = stack[stack.length - 1], cx = cur % cols, cy = (cur / cols) | 0, nb: any[] = []
          if (cy > 0 && !cells[idx(cx, cy - 1)].v) nb.push([idx(cx, cy - 1), 'n', 's'])
          if (cx < cols - 1 && !cells[idx(cx + 1, cy)].v) nb.push([idx(cx + 1, cy), 'e', 'w'])
          if (cy < rows - 1 && !cells[idx(cx, cy + 1)].v) nb.push([idx(cx, cy + 1), 's', 'n'])
          if (cx > 0 && !cells[idx(cx - 1, cy)].v) nb.push([idx(cx - 1, cy), 'w', 'e'])
          if (nb.length) { const [ni, wa, wb] = nb[(Math.random() * nb.length) | 0]; cells[cur][wa] = false; cells[ni][wb] = false; cells[ni].v = true; stack.push(ni); count++ } else stack.pop()
        }
        queue = [0]; cells[0].bfs = true; parent = new Array(cols * rows).fill(-1); exitIdx = cols * rows - 1; path = null; phase = 'search'; visitedOrder = []; pathDraw = 0; holdT = 0
      }
      const openNb = (i: number) => { const x = i % cols, y = (i / cols) | 0, c = cells[i], r: number[] = []; if (!c.n) r.push(idx(x, y - 1)); if (!c.e) r.push(idx(x + 1, y)); if (!c.s) r.push(idx(x, y + 1)); if (!c.w) r.push(idx(x - 1, y)); return r }
      const stepBFS = (k: number) => { for (let st = 0; st < k && queue.length; st++) { const cur = queue.shift()!; if (cur === exitIdx) { path = []; let p = cur; while (p !== -1) { path.push(p); p = parent[p] } phase = 'path'; return } for (const nb of openNb(cur)) { if (!cells[nb].bfs) { cells[nb].bfs = true; parent[nb] = cur; queue.push(nb); visitedOrder.push(nb) } } } }
      const draw = () => {
        const ctx = g.ctx; ctx.clearRect(0, 0, g.w, g.h); ctx.fillStyle = '#0c1614'; ctx.fillRect(0, 0, g.w, g.h)
        ctx.fillStyle = 'rgba(77,141,240,0.13)'
        for (const i of visitedOrder) { const x = i % cols, y = (i / cols) | 0; ctx.fillRect(1 + x * cs, 1 + y * cs, cs, cs) }
        ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.4
        for (let i = 0; i < cells.length; i++) { const x = i % cols, y = (i / cols) | 0, px = 1 + x * cs, py = 1 + y * cs, c = cells[i]; ctx.beginPath(); if (c.n) { ctx.moveTo(px, py); ctx.lineTo(px + cs, py) } if (c.w) { ctx.moveTo(px, py); ctx.lineTo(px, py + cs) } if (c.e) { ctx.moveTo(px + cs, py); ctx.lineTo(px + cs, py + cs) } if (c.s) { ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py + cs) } ctx.stroke() }
        ctx.fillStyle = '#21b3a0'; ctx.fillRect(1 + cs * 0.28, 1 + cs * 0.28, cs * 0.44, cs * 0.44)
        const ex = exitIdx % cols, ey = (exitIdx / cols) | 0; ctx.fillStyle = '#f2683f'; ctx.fillRect(1 + ex * cs + cs * 0.28, 1 + ey * cs + cs * 0.28, cs * 0.44, cs * 0.44)
        if (path) { ctx.strokeStyle = '#4d8df0'; ctx.lineWidth = Math.max(2.4, cs * 0.2); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); const n = Math.min(pathDraw, path.length); for (let k = 0; k < n; k++) { const i = path[path.length - 1 - k], x = i % cols, y = (i / cols) | 0, cxp = 1 + x * cs + cs / 2, cyp = 1 + y * cs + cs / 2; if (k === 0) ctx.moveTo(cxp, cyp); else ctx.lineTo(cxp, cyp) } ctx.stroke() }
      }
      build(); draw()
      fits.push(() => { g = fit(cv, 210); build(); draw() })
      if (reduce) { let guard = 0; while (phase === 'search' && guard++ < 99999) stepBFS(50); pathDraw = path ? path.length : 0; draw(); return }
      let vis = true; const io = new IntersectionObserver((en) => { en.forEach((x) => (vis = x.isIntersecting)) }, { threshold: .15 }); io.observe(cv); ios.push(io)
      const loop = () => { if (vis) { if (phase === 'search') stepBFS(2); else if (phase === 'path') { if (pathDraw < path!.length) pathDraw += 1; else { holdT++; if (holdT > 150) build() } } draw() } rafs.push(requestAnimationFrame(loop)) }; loop()
    }

    function setupFlock() {
      const cv = flockRef.current; if (!cv || !cv.getBoundingClientRect().width) { requestAnimationFrame(setupFlock); return }
      let g = fit(cv, 210)
      const cols = ['#8b7bf0', '#4d8df0', '#21b3a0', '#84b53a', '#d99320', '#f2683f']
      let bs: any[] = []
      const target = () => (g.w < 420 ? 40 : 60)
      const spawn = (n: number, x?: number, y?: number) => { for (let i = 0; i < n; i++) { const a = Math.random() * 7; bs.push({ x: x == null ? Math.random() * g.w : x, y: y == null ? Math.random() * g.h : y, vx: Math.cos(a), vy: Math.sin(a), c: cols[(Math.random() * cols.length) | 0] }) } }
      spawn(target())
      const mouse = { x: -999, y: -999 }
      cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top })
      cv.addEventListener('pointerleave', () => { mouse.x = -999; mouse.y = -999 })
      cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(); if (bs.length < 220) spawn(8, e.clientX - r.left, e.clientY - r.top) })
      fits.push(() => { g = fit(cv, 210) })
      const step = () => { const per = 54; for (const b of bs) { let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0; for (const o of bs) { if (o === b) continue; const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); if (d < per && d > 0) { ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; if (d < 22) { sx -= dx / d; sy -= dy / d } n++ } } if (n) { ax /= n; ay /= n; cx = cx / n - b.x; cy = cy / n - b.y; b.vx += (ax - b.vx) * 0.05 + cx * 0.0009 + sx * 0.06; b.vy += (ay - b.vy) * 0.05 + cy * 0.0009 + sy * 0.06 } const mdx = b.x - mouse.x, mdy = b.y - mouse.y, md = Math.hypot(mdx, mdy); if (md < 86 && md > 0) { b.vx += mdx / md * 0.5; b.vy += mdy / md * 0.5 } const sp = Math.hypot(b.vx, b.vy), max = 2.4; if (sp > max) { b.vx = b.vx / sp * max; b.vy = b.vy / sp * max } b.x += b.vx; b.y += b.vy; if (b.x < 0) b.x += g.w; if (b.x > g.w) b.x -= g.w; if (b.y < 0) b.y += g.h; if (b.y > g.h) b.y -= g.h } }
      const draw = () => { const ctx = g.ctx; ctx.clearRect(0, 0, g.w, g.h); ctx.globalAlpha = .92; for (const b of bs) { const a = Math.atan2(b.vy, b.vx); ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a); ctx.fillStyle = b.c; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, 3.4); ctx.lineTo(-5, -3.4); ctx.closePath(); ctx.fill(); ctx.restore() } ctx.globalAlpha = 1 }
      draw()
      if (reduce) { step(); draw(); return }
      let vis = true; const io = new IntersectionObserver((en) => { en.forEach((x) => (vis = x.isIntersecting)) }, { threshold: .15 }); io.observe(cv); ios.push(io)
      const loop = () => { if (vis) { step(); draw() } rafs.push(requestAnimationFrame(loop)) }; loop()
    }

    function setupLife() {
      const cv = lifeRef.current; if (!cv || !cv.getBoundingClientRect().width) { requestAnimationFrame(setupLife); return }
      let g = fit(cv, 210)
      const palette = ['#8b7bf0', '#4d8df0', '#21b3a0', '#84b53a', '#d99320', '#f2683f']
      let cs = 12, cols = 1, rows = 1, grid: Uint8Array = new Uint8Array(1)
      const idx = (x: number, y: number) => y * cols + x
      const resize = () => { cs = Math.max(9, Math.round(g.w / 30)); cols = Math.max(4, Math.floor(g.w / cs)); rows = Math.max(4, Math.floor(g.h / cs)) }
      const randomize = () => { grid = new Uint8Array(cols * rows); for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.3 ? 1 : 0 }
      const stepGen = () => { const ng = new Uint8Array(cols * rows); for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = (x + dx + cols) % cols, yy = (y + dy + rows) % rows; n += grid[idx(xx, yy)] } const a = grid[idx(x, y)]; ng[idx(x, y)] = ((a && (n === 2 || n === 3)) || (!a && n === 3)) ? 1 : 0 } grid = ng }
      const pop = () => { let p = 0; for (let i = 0; i < grid.length; i++) p += grid[i]; return p }
      const draw = () => { const ctx = g.ctx; ctx.clearRect(0, 0, g.w, g.h); ctx.globalAlpha = .9; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { if (grid[idx(x, y)]) { ctx.fillStyle = palette[(x + y) % palette.length]; ctx.fillRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2) } } ctx.globalAlpha = 1 }
      resize(); randomize(); draw()
      fits.push(() => { g = fit(cv, 210); resize(); randomize(); draw() })
      let painting = false, paintVal = 1
      const cellAt = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / cs), y = Math.floor((e.clientY - r.top) / cs); return (x >= 0 && y >= 0 && x < cols && y < rows) ? idx(x, y) : -1 }
      cv.addEventListener('pointerdown', (e) => { const i = cellAt(e); if (i < 0) return; paintVal = grid[i] ? 0 : 1; grid[i] = paintVal; painting = true; draw() })
      cv.addEventListener('pointermove', (e) => { if (!painting) return; const i = cellAt(e); if (i >= 0 && grid[i] !== paintVal) { grid[i] = paintVal; draw() } })
      lifeUp = () => { painting = false }; window.addEventListener('pointerup', lifeUp)
      if (reduce) { for (let st = 0; st < 40; st++) stepGen(); draw(); return }
      let vis = true; const io = new IntersectionObserver((en) => { en.forEach((x) => (vis = x.isIntersecting)) }, { threshold: .15 }); io.observe(cv); ios.push(io)
      let acc = 0, lastT = performance.now(), idleAt = 0
      const loop = (t: number) => { const dt = t - lastT; lastT = t; if (vis) { acc += dt; const interval = 130; let steps = 0; while (acc >= interval && steps < 4) { stepGen(); acc -= interval; steps++ } if (steps) { draw(); if (pop() < 3) { if (!idleAt) idleAt = t + 1200; else if (t > idleAt) { randomize(); idleAt = 0 } } else idleAt = 0 } } else { acc = 0 } rafs.push(requestAnimationFrame(loop)) }
      rafs.push(requestAnimationFrame(loop))
    }

    const onResize = () => fits.forEach((f) => f && f())
    window.addEventListener('resize', onResize)
    setupTextReveal(); setupMaze(); setupFlock(); setupLife()

    return () => {
      rafs.forEach((r) => cancelAnimationFrame(r)); ios.forEach((o) => o.disconnect())
      if (trPoll) clearInterval(trPoll); if (onTrScroll) { window.removeEventListener('scroll', onTrScroll); window.removeEventListener('resize', onTrScroll) }
      if (lifeUp) window.removeEventListener('pointerup', lifeUp)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toolCount = TOOLS.length + (TOOLS.length === 1 ? ' tool · more coming' : ' tools')

  return (
    <div ref={wrapRef} data-screen-label="Tools" style={s('min-height:100vh;overflow-x:hidden')}>
      <section style={s('max-width:1120px;margin:0 auto;padding:56px 28px 30px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>/ tools · research utilities</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(38px,5.6vw,68px);line-height:1.02;letter-spacing:-.02em;margin:0 0 18px;max-width:900px;text-wrap:balance`)}>Small tools for the work.</h1>
        <p style={s('font-size:18px;line-height:1.6;color:#57514b;max-width:680px;margin:0')}>A growing shelf of free, browser-based utilities built around things I needed in my own research and teaching. No sign-up, nothing uploaded — everything runs locally in your browser.</p>
      </section>

      {/* TOOLKIT */}
      <section style={s('max-width:1120px;margin:0 auto;padding:6px 28px 8px')}>
        <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(22px,2.8vw,30px);letter-spacing:-.02em;margin:0`)}>The toolkit</h2>
          <span style={s("font-family:'JetBrains Mono',monospace;font-size:12px;color:#a39a8f")}>{toolCount}</span>
        </div>
        <div style={s('display:flex;flex-wrap:wrap;gap:18px')}>
          {TOOLS.map((t, i) => (
            <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" style={s(`flex:0 1 380px;max-width:440px;display:flex;flex-direction:column;text-decoration:none;color:#1c1917;background:#fff;border:1px solid #e7e3dd;border-top:3px solid ${t.accent};border-radius:14px;padding:22px 22px 20px;transition:transform .2s,box-shadow .2s`)}>
              <div style={s('display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px')}>
                <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${t.accent}`)}>{t.kicker}</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#10b07f;background:#e6f6ef;padding:3px 9px;border-radius:5px")}>{t.status}</span>
              </div>
              <h3 style={s(`font-family:${stack};font-weight:600;font-size:21px;line-height:1.2;letter-spacing:-.01em;margin:0 0 10px;text-wrap:pretty`)}>{t.title}</h3>
              <p style={s('font-size:14px;line-height:1.55;color:#57514b;margin:0 0 18px')}>{t.blurb}</p>
              <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px')}>
                {t.chips.map((c, k) => (<span key={k} style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:500;color:#57514b;background:#f3f0ea;border:1px solid #e7e3dd;padding:3px 8px;border-radius:5px")}>{c}</span>))}
              </div>
              <span style={s(`margin-top:auto;font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;color:${t.accent}`)}>Open tool →</span>
            </a>
          ))}
          <div style={s('flex:0 1 380px;max-width:440px;display:flex;flex-direction:column;justify-content:center;color:#a39a8f;background:transparent;border:1.5px dashed #ddd6cc;border-radius:14px;padding:22px;min-height:200px')}>
            <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#b4ab9f;margin:0 0 10px")}>More on the way</p>
            <p style={s('font-size:14px;line-height:1.55;color:#8a8279;margin:0')}>New utilities land here as research throws up problems worth solving once and sharing. Have a request? <a href="/contact" style={s('color:#16142e;font-weight:500;text-decoration:none;border-bottom:1px solid #d9d3ca')}>Get in touch →</a></p>
          </div>
        </div>
      </section>

      {/* LIVE DEMOS */}
      <section style={s('background:#0f0e14;padding:50px 0 56px;margin-top:46px;border-top:1px solid rgba(255,255,255,.05)')}>
        <div style={s('max-width:1120px;margin:0 auto;padding:0 28px')}>
          <div style={s('margin-bottom:24px')}>
            <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6f6a82;margin:0 0 10px")}>/ the playground · running live</p>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;margin:0;color:#ECEAF3`)}>Algorithms, demonstrated.</h2>
            <p style={s('font-size:14.5px;line-height:1.6;color:#9b96aa;max-width:640px;margin:12px 0 0')}>The methods behind the research, distilled to three small live sketches — a maze being solved, a flock self-organizing, and a cellular world unfolding. Touch them.</p>
          </div>
          <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
            <div style={s('display:flex;flex-direction:column;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:radial-gradient(120% 120% at 50% 0%,#13231f 0%,#0c1513 72%)')}>
              <div style={s('padding:15px 16px 9px')}>
                <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#21b3a0;margin:0 0 5px")}>Search · Pathfinding</p>
                <h3 style={s(`font-family:${stack};font-weight:600;font-size:16px;color:#ECEAF3;margin:0`)}>A maze, solved live</h3>
              </div>
              <canvas ref={mazeRef} style={s('display:block;width:100%;height:210px')} />
              <div style={s('padding:11px 16px;border-top:1px solid rgba(255,255,255,.06)')}><p style={s('font-size:12px;color:#9b96aa;line-height:1.45;margin:0')}>Breadth-first search floods the maze from the start, then retraces the shortest path to the exit.</p></div>
            </div>
            <div style={s('display:flex;flex-direction:column;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:radial-gradient(120% 120% at 50% 0%,#241410 0%,#160c0a 72%)')}>
              <div style={s('padding:15px 16px 9px')}>
                <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#f2683f;margin:0 0 5px")}>Games · Simulation</p>
                <h3 style={s(`font-family:${stack};font-weight:600;font-size:16px;color:#ECEAF3;margin:0`)}>A flock self-organizing</h3>
              </div>
              <canvas ref={flockRef} style={s('display:block;width:100%;height:210px;cursor:crosshair')} />
              <div style={s('padding:11px 16px;border-top:1px solid rgba(255,255,255,.06)')}><p style={s('font-size:12px;color:#9b96aa;line-height:1.45;margin:0')}>Three local rules, emergent murmuration. Click to seed, sweep to scatter.</p></div>
            </div>
            <div style={s('display:flex;flex-direction:column;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:radial-gradient(120% 120% at 50% 0%,#1b1830 0%,#100e1a 72%)')}>
              <div style={s('padding:15px 16px 9px')}>
                <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8b7bf0;margin:0 0 5px")}>Emergence · Cellular automata</p>
                <h3 style={s(`font-family:${stack};font-weight:600;font-size:16px;color:#ECEAF3;margin:0`)}>A universe from four rules</h3>
              </div>
              <canvas ref={lifeRef} style={s('display:block;width:100%;height:210px;cursor:crosshair')} />
              <div style={s('padding:11px 16px;border-top:1px solid rgba(255,255,255,.06)')}><p style={s('font-size:12px;color:#9b96aa;line-height:1.45;margin:0')}>Conway&apos;s Game of Life. Click and drag the grid to paint your own seed.</p></div>
            </div>
          </div>
          <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56516a;margin:16px 0 0;letter-spacing:.04em")}>All honour <span style={s('color:#9b96aa')}>prefers-reduced-motion</span> · paused when scrolled out of view</p>
        </div>
      </section>
    </div>
  )
}
