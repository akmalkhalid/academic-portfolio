'use client'

// ResearchAtlas — the whole research record as one small "galaxy", for the header of /research.
//
// HOW TO READ IT
//   · Time runs outwards: the innermost ring is the first year, the outermost the last.
//   · Three spiral arms, one per pillar (Generate, Evaluate, Search). The arms twist a little
//     with every year, which is what turns three pie slices into a spiral.
//   · A dot is a paper, a line along an arm is a grant (thicker = larger, ringed head = led as
//     PI), a small square is a student, placed at the year they started.
//
// HOW IT WORKS (no 3D library, same approach as Constellation3D.tsx)
//   1. place()    turns (pillar, year, position across the arm) into a point x, y, z.
//   2. project()  rotates that point by the camera's yaw and pitch and divides by depth,
//                 which is all a perspective camera is.
//   3. draw()     runs every animation frame: rings, arms, grants, students, papers, labels.
//   4. Pointer events find the nearest paper to the cursor for the tooltip and the click.
//
// The page owns the state. This component only draws what it is given and reports clicks:
// onSelect(paperIndex | null) and onYear(year).

import { useEffect, useRef } from 'react'

export type APillar = 'gen' | 'eva' | 'sea'
export type APaper = { t: string; y: number; pl: APillar; v: string }
export type AGrant = { t: string; y0: number; y1: number; pl: APillar; amt: number; pi: boolean }
export type AStudent = { t: string; y: number; pl: APillar }

const COL: Record<APillar, string> = { gen: '#8b7bf0', eva: '#f2683f', sea: '#21b3a0' }
const VERB: Record<APillar, string> = { gen: 'GENERATE', eva: 'EVALUATE', sea: 'SEARCH' }
const ORDER: APillar[] = ['gen', 'eva', 'sea']
const TAU = Math.PI * 2
const ARM = 0.78          // half-width of an arm, in radians (three arms of 2 × 0.78 leave small gaps)
const TWIST = 0.085       // how far an arm turns per year, in radians

export default function ResearchAtlas({
  papers, grants, students, pm, gm, sm, year, selected, onSelect, onYear, years, active = true, height = 400,
}: {
  papers: APaper[]; grants: AGrant[]; students: AStudent[]
  /** which papers / grants / students match the page's current filters (the rest are dimmed) */
  pm: boolean[]; gm: boolean[]; sm: boolean[]
  year: number | null; selected: number | null
  onSelect: (i: number | null) => void; onYear: (y: number) => void
  years: [number, number]; active?: boolean; height?: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  // The draw loop is set up once; it reads the newest props through this ref.
  const live = useRef({ pm, gm, sm, year, selected, active, onSelect, onYear })
  live.current = { pm, gm, sm, year, selected, active, onSelect, onYear }

  useEffect(() => {
    const cv = cvRef.current!, wrap = wrapRef.current!, tip = tipRef.current!
    const ctx = cv.getContext('2d')!
    const [Y0, Y1] = years
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ---- 1. geometry ---------------------------------------------------------------------
    const radius = (y: number) => 46 + (y - Y0) * 15
    const lift = (y: number) => (y - (Y0 + Y1) / 2) * 5            // later years sit slightly higher
    const armAngle = (pl: APillar, y: number) => ORDER.indexOf(pl) * (TAU / 3) - Math.PI / 2 + (y - Y0) * TWIST
    /** u runs from -1 to 1 across the width of the arm */
    const place = (pl: APillar, y: number, u: number) => {
      const a = armAngle(pl, y) + u * ARM, r = radius(y)
      return { x: Math.cos(a) * r, y: lift(y), z: Math.sin(a) * r }
    }

    // Papers of one pillar and year are spread evenly across the arm.
    const groups = new Map<string, number[]>()
    papers.forEach((p, i) => { const k = p.pl + p.y; groups.set(k, [...(groups.get(k) || []), i]) })
    const P = papers.map((p, i) => {
      const g = groups.get(p.pl + p.y)!, n = g.length, k = g.indexOf(i)
      return place(p.pl, p.y, n === 1 ? 0 : (k / (n - 1)) * 1.5 - 0.75)
    })
    // Grants run along the arm, each on its own track near the arm's edge.
    const lanes: Record<APillar, number> = { gen: 0, eva: 0, sea: 0 }
    const G = grants.map((g) => {
      const u = 0.9 - (lanes[g.pl]++ % 5) * 0.09
      const pts: { x: number; y: number; z: number }[] = []
      for (let y = g.y0; y <= g.y1 + 1e-6; y += 0.25) pts.push(place(g.pl, y, u))
      return pts
    })
    const sl: Record<string, number> = {}
    const S = students.map((st) => { const k = st.pl + st.y; sl[k] = (sl[k] || 0) + 1; return place(st.pl, st.y, -0.86 - (sl[k] - 1) * 0.07) })

    // ---- 2. camera -----------------------------------------------------------------------
    const cam = { yaw: 0.5, pitch: 0.92, dist: 760, goal: 760 }
    let W = 0, H = 0, dpr = 1
    const project = (p: { x: number; y: number; z: number }) => {
      const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw)
      const x = p.x * cy - p.z * sy, z0 = p.x * sy + p.z * cy
      const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch)
      const y = p.y * cp - z0 * sp, z = p.y * sp + z0 * cp
      // fit: the outer ring (about 340 units) must stay inside the canvas at the resting distance
      const fit = Math.min(W * 0.47, H * 0.58) / 340
      const k = (fit * 760) / (cam.dist + z)                       // perspective: farther = smaller
      return { x: W / 2 + x * k, y: H * 0.47 - y * k, k, z }
    }
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = wrap.clientWidth; H = cv.clientHeight
      cv.width = W * dpr; cv.height = H * dpr
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(wrap)

    // ---- 3. drawing ----------------------------------------------------------------------
    let hover = -1, visible = true, dragging = false, raf = 0, last = 0
    const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting }); io.observe(wrap)
    const ring = (y: number, stroke: string, w: number) => {
      ctx.beginPath()
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * TAU, q = project({ x: Math.cos(a) * radius(y), y: lift(y), z: Math.sin(a) * radius(y) })
        i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)
      }
      ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke()
    }
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (!visible || !live.current.active || !W) { last = t; return }
      const dt = Math.min(50, t - last); last = t
      if (!dragging && !reduce && hover < 0) cam.yaw += dt * 0.00007   // slow idle turn
      cam.dist += (cam.goal - cam.dist) * 0.12
      const { pm, gm, sm, year, selected } = live.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
      ctx.font = "10px 'JetBrains Mono', monospace"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

      // year rings, with a label on every third
      const step = W < 520 ? 6 : 3                                   // fewer year labels on a narrow screen
      for (let y = Y0; y <= Y1; y++) {
        const on = year === y
        ring(y, on ? 'rgba(236,234,243,.75)' : 'rgba(255,255,255,' + ((y - Y0) % 3 === 0 ? '.11' : '.045') + ')', on ? 1.4 : 1)
        if ((y - Y0) % step === 0 || on) {
          const q = project({ x: 0, y: lift(y), z: radius(y) })
          ctx.fillStyle = on ? '#ECEAF3' : 'rgba(155,150,170,.7)'; ctx.fillText(String(y), q.x, q.y + 9)
        }
      }
      // the three arms: a soft centre line and the pillar's name at the rim
      ORDER.forEach((pl) => {
        ctx.beginPath()
        for (let y = Y0; y <= Y1; y += 0.5) { const q = project(place(pl, y, 0)); y === Y0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y) }
        ctx.strokeStyle = COL[pl] + '38'; ctx.lineWidth = 1; ctx.stroke()
        const q = project(place(pl, Y1 + 1.6, 0))
        ctx.fillStyle = COL[pl]; ctx.font = "600 10.5px 'JetBrains Mono', monospace"; ctx.fillText(VERB[pl], q.x, q.y)
        ctx.font = "10px 'JetBrains Mono', monospace"
      })
      // grants: a line along the arm from start to end
      grants.forEach((g, i) => {
        const pts = G[i].map(project)
        ctx.globalAlpha = gm[i] ? 0.9 : 0.13
        ctx.beginPath(); pts.forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
        ctx.strokeStyle = COL[g.pl]; ctx.lineWidth = 1.2 + Math.sqrt(g.amt / 60000); ctx.lineCap = 'round'; ctx.stroke()
        if (g.pi) { ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, 4, 0, TAU); ctx.fillStyle = '#0f0e14'; ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke() }
      })
      // students: small squares
      students.forEach((st, i) => {
        const q = project(S[i]), r = Math.max(2.4, 3.6 * q.k)
        ctx.globalAlpha = sm[i] ? 0.95 : 0.13
        ctx.fillStyle = '#ECEAF3'; ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2)
        ctx.strokeStyle = COL[st.pl]; ctx.lineWidth = 1.5; ctx.strokeRect(q.x - r, q.y - r, r * 2, r * 2)
      })
      // papers: far ones first, so near dots overlap far ones
      const order = P.map((p, i) => ({ i, q: project(p) })).sort((a, b) => b.q.z - a.q.z)
      order.forEach(({ i, q }) => {
        const on = pm[i], r = Math.max(1.8, 4.6 * q.k) * (i === selected || i === hover ? 1.9 : 1)
        ctx.globalAlpha = on ? 0.95 : 0.12
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fillStyle = COL[papers[i].pl]; ctx.fill()
        if (i === selected || i === hover) { ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke() }
      })
      ctx.globalAlpha = 1
    }
    raf = requestAnimationFrame(draw)

    // ---- 4. pointer ----------------------------------------------------------------------
    const pos = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top } }
    const nearest = (m: { x: number; y: number }) => {
      let best = -1, bd = 13 * 13
      P.forEach((p, i) => { if (!live.current.pm[i]) return; const q = project(p), d = (q.x - m.x) ** 2 + (q.y - m.y) ** 2; if (d < bd) { bd = d; best = i } })
      return best
    }
    let start = { x: 0, y: 0, yaw: 0, pitch: 0, moved: false }
    const down = (e: PointerEvent) => { const m = pos(e); dragging = true; start = { ...m, yaw: cam.yaw, pitch: cam.pitch, moved: false }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing' }
    const move = (e: PointerEvent) => {
      const m = pos(e)
      if (dragging) {
        if (Math.hypot(m.x - start.x, m.y - start.y) > 4) start.moved = true
        cam.yaw = start.yaw + (m.x - start.x) * 0.006
        cam.pitch = Math.max(0.35, Math.min(1.45, start.pitch + (m.y - start.y) * 0.004))
        return
      }
      hover = nearest(m)
      cv.style.cursor = hover >= 0 ? 'pointer' : 'grab'
      if (hover >= 0) {
        const p = papers[hover];
        (tip.children[0] as HTMLElement).textContent = p.t;
        (tip.children[1] as HTMLElement).textContent = p.y + ' · ' + p.v
        tip.style.left = Math.min(W - 250, m.x + 14) + 'px'; tip.style.top = Math.max(6, m.y - 10) + 'px'; tip.style.opacity = '1'
      } else tip.style.opacity = '0'
    }
    const up = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false; cv.style.cursor = 'grab'
      if (start.moved) return
      // a click: a paper if one is under the cursor, otherwise the year ring that was clicked
      const m = pos(e), hit = nearest(m)
      if (hit >= 0) return live.current.onSelect(hit)
      let by = -1, bd = 9
      for (let y = Y0; y <= Y1; y++) for (let i = 0; i < 72; i++) {
        const a = (i / 72) * TAU, q = project({ x: Math.cos(a) * radius(y), y: lift(y), z: Math.sin(a) * radius(y) })
        const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < bd) { bd = d; by = y }
      }
      if (by >= 0) live.current.onYear(by); else live.current.onSelect(null)
    }
    const leave = () => { hover = -1; tip.style.opacity = '0' }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); wrap.addEventListener('pointerleave', leave)
    ;(wrap as any).__zoom = (f: number) => { cam.goal = f ? Math.max(420, Math.min(1300, cam.goal * f)) : 760; if (!f) { cam.pitch = 0.92 } }

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); wrap.removeEventListener('pointerleave', leave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papers, grants, students])

  const zoom = (f: number) => (wrapRef.current as any)?.__zoom?.(f)
  const btn: React.CSSProperties = { width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(20,18,28,.75)', color: '#ECEAF3', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, cursor: 'pointer' }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <canvas ref={cvRef} role="img" aria-label="Atlas of the research record: three spiral arms for the three pillars, rings for years, dots for papers, lines for grants, squares for students"
        style={{ display: 'block', width: '100%', height: `min(${height}px, 62vh, 96vw)`, cursor: 'grab', touchAction: 'pan-y' }} />
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button type="button" style={btn} onClick={() => zoom(0.8)} aria-label="Zoom in">+</button>
        <button type="button" style={btn} onClick={() => zoom(1.25)} aria-label="Zoom out">−</button>
        <button type="button" style={{ ...btn, fontSize: 13 }} onClick={() => { onSelect(null); zoom(0) }} aria-label="Reset view">⟲</button>
      </div>
      <div style={{ position: 'absolute', left: 14, bottom: 12, right: 60, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#6f6a82', pointerEvents: 'none' }}>
        ● paper · ━ grant · ■ student · drag to turn · click a ring to pick a year
      </div>
      <div ref={tipRef} style={{ position: 'absolute', pointerEvents: 'none', opacity: 0, transition: 'opacity .12s', background: '#1c1b24', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: '9px 12px', maxWidth: 240, boxShadow: '0 14px 40px rgba(0,0,0,.5)', zIndex: 3 }}>
        <div style={{ fontSize: 13, color: '#ECEAF3', lineHeight: 1.35, marginBottom: 4 }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#9b96aa' }} />
      </div>
    </div>
  )
}
