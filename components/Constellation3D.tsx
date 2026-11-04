'use client'

// 3D publication constellation for /publications.
//
// Every paper is a sphere in a 3D space. Six research fields sit at the six
// vertices of an octahedron (related fields adjacent, unrelated ones opposite),
// each wrapped in a particle cloud; a paper is pulled toward the fields it is
// tagged with, so cross-field papers float between clouds. Relationships:
//   citation between my papers → a curved stream of particles flowing from the
//                                citing paper to the cited one (more citations =
//                                more, larger, brighter particles)
//   shared co-author           → a thin curved line
//   similar topic (TF-IDF)     → a faint dotted thread
//
// Plain canvas 2D with a hand-rolled perspective camera: no 3D library, so the
// whole thing stays readable. Drag to orbit, pinch / buttons / (after a click)
// the scroll wheel to zoom, click a paper to fly to it.

import { useEffect, useRef, useState } from 'react'
import { PCOL, PNAME, type Code } from '@/lib/view'

export type CNode = { t: string; y: number; pills: Code[]; q: string; v: string }
export type CLink = { a: number; b: number; kind: 'cite' | 'coauthor' | 'similar'; w: number }
type V3 = { x: number; y: number; z: number }

// Octahedron anchors: gen–opt, exp–sim, evo–gam are the opposite pairs.
const R = 300
const ANCHOR: Record<Code, V3> = {
  gen: { x: R, y: 0, z: 0 }, opt: { x: -R, y: 0, z: 0 },
  exp: { x: 0, y: -R, z: 0 }, sim: { x: 0, y: R, z: 0 },
  evo: { x: 0, y: 0, z: R }, gam: { x: 0, y: 0, z: -R },
} as Record<Code, V3>
const FIELDS = Object.keys(ANCHOR) as Code[]
const RADIUS: Record<string, number> = { Q1: 9, Q2: 7.5, Q3: 6.5, Q4: 6, NA: 5 }

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r())
const hexA = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }

/** Force layout, run once: anchors pull, links spring, papers repel. */
function layout(nodes: CNode[], links: CLink[]) {
  const r = rng(42)
  const target = nodes.map((n) => {
    const ps = n.pills.length ? n.pills : (['opt'] as Code[])
    const t = { x: 0, y: 0, z: 0 }
    ps.forEach((p) => { t.x += ANCHOR[p].x; t.y += ANCHOR[p].y; t.z += ANCHOR[p].z })
    return { x: t.x / ps.length, y: t.y / ps.length, z: t.z / ps.length }
  })
  const P = target.map((t) => ({ x: t.x + gauss(r) * 40, y: t.y + gauss(r) * 40, z: t.z + gauss(r) * 40 }))
  const REST = { cite: 70, coauthor: 80, similar: 90 }, K = { cite: 0.03, coauthor: 0.006, similar: 0.004 }
  const ITER = 300
  for (let it = 0; it < ITER; it++) {
    const heat = 1 - it / ITER
    const F = P.map(() => ({ x: 0, y: 0, z: 0 }))
    P.forEach((p, i) => { F[i].x += (target[i].x - p.x) * 0.06; F[i].y += (target[i].y - p.y) * 0.06; F[i].z += (target[i].z - p.z) * 0.06 })
    for (const l of links) {
      const a = P[l.a], b = P[l.b]
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1
      const f = (d - REST[l.kind]) * K[l.kind] * Math.min(3, l.kind === 'similar' ? 1 : l.w) / d
      F[l.a].x += dx * f; F[l.a].y += dy * f; F[l.a].z += dz * f
      F[l.b].x -= dx * f; F[l.b].y -= dy * f; F[l.b].z -= dz * f
    }
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, dz = P[j].z - P[i].z, d = Math.hypot(dx, dy, dz) || 0.1
      if (d > 42) continue
      const f = ((42 - d) / d) * 0.35
      F[i].x -= dx * f; F[i].y -= dy * f; F[i].z -= dz * f
      F[j].x += dx * f; F[j].y += dy * f; F[j].z += dz * f
    }
    P.forEach((p, i) => {
      const m = Math.hypot(F[i].x, F[i].y, F[i].z), cap = 12 * heat + 0.5
      const k = m > cap ? cap / m : 1
      p.x += F[i].x * k * heat; p.y += F[i].y * k * heat; p.z += F[i].z * k * heat
    })
  }
  return P
}

/** Particle clouds wrapped around each field's papers. */
function clouds(nodes: CNode[], P: V3[]) {
  const r = rng(7)
  return FIELDS.map((f) => {
    const mem = P.filter((_, i) => nodes[i].pills[0] === f)
    const c = mem.length ? { x: mem.reduce((s, p) => s + p.x, 0) / mem.length, y: mem.reduce((s, p) => s + p.y, 0) / mem.length, z: mem.reduce((s, p) => s + p.z, 0) / mem.length } : { ...ANCHOR[f] }
    const rms = mem.length ? Math.sqrt(mem.reduce((s, p) => s + (p.x - c.x) ** 2 + (p.y - c.y) ** 2 + (p.z - c.z) ** 2, 0) / mem.length / 3) : 40
    const sd = Math.max(38, rms * 1.05)
    const pts = Array.from({ length: 170 }, () => ({ x: c.x + gauss(r) * sd, y: c.y + gauss(r) * sd, z: c.z + gauss(r) * sd, s: 0.6 + r() * 1.1 }))
    return { f, c, sd, pts, n: mem.length }
  })
}

export default function Constellation3D({
  nodes, links, matched, selected, onSelect, active = true, height = 560,
}: {
  nodes: CNode[]; links: CLink[]; matched: boolean[]; selected: number | null
  onSelect: (i: number | null) => void; active?: boolean; height?: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const live = useRef({ matched, selected, active, onSelect })
  live.current = { matched, selected, active, onSelect }
  const camRef = useRef({ yaw: 0.6, pitch: -0.32, dist: 760, goalDist: 760, tx: 0, ty: 0, tz: 0, idle: 0, engaged: false })
  const [engaged, setEngaged] = useState(false)

  useEffect(() => {
    const cv = cvRef.current!, wrap = wrapRef.current!
    const ctx = cv.getContext('2d')!
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const P = layout(nodes, links)
    const C = clouds(nodes, P)
    const cam = camRef.current
    let W = 0, H = 0, raf = 0, visible = true, hover = -1
    let lastPP: { x: number; y: number; k: number; depth: number }[] = []

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(cv)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0.05 }); io.observe(cv)

    const proj = (p: V3) => {
      const x = p.x - cam.tx, y = p.y - cam.ty, z = p.z - cam.tz
      const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch)
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp
      const depth = z2 + cam.dist
      const F = Math.min(W, H * 1.4) * 1.05
      const k = depth > 30 ? F / depth : 0
      return { x: W / 2 + x1 * k, y: H / 2 + y2 * k, k, depth }
    }

    // ----- drawing helpers -----
    // Each link bows gently out of the straight line (a fixed, per-link 3D
    // control point) and sways slowly over time, so connections look grown
    // rather than drawn. Citations carry particles flowing citing → cited.
    const curve = links.map((l, i) => {
      const r = rng(1000 + i)
      const A = P[l.a], B = P[l.b]
      const d = { x: B.x - A.x, y: B.y - A.y, z: B.z - A.z }
      const len = Math.hypot(d.x, d.y, d.z) || 1
      // any vector not parallel to d, crossed with d, gives a perpendicular
      const u = Math.abs(d.y) < len * 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
      let n = { x: d.y * u.z - d.z * u.y, y: d.z * u.x - d.x * u.z, z: d.x * u.y - d.y * u.x }
      const nl = Math.hypot(n.x, n.y, n.z) || 1
      const ang = r() * Math.PI * 2
      // rotate the perpendicular around d by a random angle (Rodrigues, simplified)
      const m = { x: d.y * n.z - d.z * n.y, y: d.z * n.x - d.x * n.z, z: d.x * n.y - d.y * n.x }
      const ml = Math.hypot(m.x, m.y, m.z) || 1
      n = { x: (n.x / nl) * Math.cos(ang) + (m.x / ml) * Math.sin(ang), y: (n.y / nl) * Math.cos(ang) + (m.y / ml) * Math.sin(ang), z: (n.z / nl) * Math.cos(ang) + (m.z / ml) * Math.sin(ang) }
      return { n, bow: len * (0.12 + r() * 0.12), phase: r(), sway: r() * Math.PI * 2 }
    })
    let clock = 0
    const ctrl = (li: number) => {
      const l = links[li], c = curve[li], A = P[l.a], B = P[l.b]
      const bow = c.bow * (1 + 0.18 * Math.sin(clock * 0.012 + c.sway))
      return proj({ x: (A.x + B.x) / 2 + c.n.x * bow, y: (A.y + B.y) / 2 + c.n.y * bow, z: (A.z + B.z) / 2 + c.n.z * bow })
    }
    const qb = (a: number, c: number, b: number, s: number) => (1 - s) * (1 - s) * a + 2 * (1 - s) * s * c + s * s * b

    function stream(li: number, a: ReturnType<typeof proj>, b: ReturnType<typeof proj>, w: number, hot: boolean, alpha: number) {
      const c = ctrl(li)
      if (!c.k) return
      const ww = Math.min(w, 5)
      const k = (a.k + b.k) / 2
      ctx.globalCompositeOperation = 'lighter'
      // faint filament carrying the particles
      ctx.globalAlpha = alpha * (0.10 + 0.05 * ww) * (hot ? 2 : 1)
      ctx.strokeStyle = hot ? '#ffd9a8' : '#f2e6d4'
      ctx.lineWidth = Math.max(0.6, (0.8 + 0.35 * ww) * k)
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); ctx.stroke()
      // particles: count, size and brightness grow with citation weight
      const N = Math.round(7 + 6 * ww)
      const speed = (reduce ? 0 : 0.0026) * (hot ? 1.8 : 1)
      const base = curve[li].phase
      for (let i = 0; i < N; i++) {
        const s = (base + i / N + clock * speed) % 1
        const x = qb(a.x, c.x, b.x, s), y = qb(a.y, c.y, b.y, s)
        // swell in the middle of the journey, fade at both ends
        const env = Math.sin(Math.PI * s)
        const rad = Math.max(0.5, (0.9 + 0.45 * ww) * k * (0.55 + 0.6 * env))
        ctx.globalAlpha = alpha * (0.35 + 0.12 * ww) * (0.35 + 0.65 * env) * (hot ? 1.4 : 1)
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad * 2.6)
        g.addColorStop(0, hot ? '#fff3e0' : '#fff8ee'); g.addColorStop(0.35, hot ? 'rgba(255,190,120,.7)' : 'rgba(240,226,206,.55)'); g.addColorStop(1, 'rgba(240,226,206,0)')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad * 2.6, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
    }

    function sphere(p: ReturnType<typeof proj>, n: CNode, alpha: number, ring: boolean) {
      const rad = Math.max(1.5, (RADIUS[n.q] || 5) * p.k)
      const col = PCOL[n.pills[0]] || '#9b96aa'
      ctx.globalAlpha = alpha
      const g = ctx.createRadialGradient(p.x - rad * 0.35, p.y - rad * 0.4, rad * 0.1, p.x, p.y, rad)
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.28, col); g.addColorStop(1, hexA(col, 0.55))
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill()
      if (n.pills[1]) { ctx.strokeStyle = PCOL[n.pills[1]]; ctx.lineWidth = Math.max(0.8, rad * 0.16); ctx.beginPath(); ctx.arc(p.x, p.y, rad + ctx.lineWidth * 0.8, 0, Math.PI * 2); ctx.stroke() }
      if (ring) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, rad + 6, 0, Math.PI * 2); ctx.stroke() }
      ctx.globalAlpha = 1
    }

    function frame() {
      raf = requestAnimationFrame(frame)
      if (!visible || !live.current.active || !W) return
      const sel = live.current.selected, M = live.current.matched
      // camera easing
      cam.idle++; clock++
      if (!reduce && sel == null && cam.idle > 240) cam.yaw += 0.0016
      const goal = sel != null ? P[sel] : { x: 0, y: 0, z: 0 }
      cam.tx += (goal.x - cam.tx) * 0.08; cam.ty += (goal.y - cam.ty) * 0.08; cam.tz += (goal.z - cam.tz) * 0.08
      cam.dist += (cam.goalDist - cam.dist) * 0.12

      ctx.clearRect(0, 0, W, H)
      // clouds
      for (const c of C) {
        const pc = proj(c.c)
        if (!pc.k) continue
        const col = PCOL[c.f]
        const gr = ctx.createRadialGradient(pc.x, pc.y, 0, pc.x, pc.y, c.sd * 2.1 * pc.k)
        gr.addColorStop(0, hexA(col, 0.13)); gr.addColorStop(1, hexA(col, 0))
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(pc.x, pc.y, c.sd * 2.1 * pc.k, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = hexA(col, 0.42)
        for (const q of c.pts) { const pp = proj(q); if (!pp.k) continue; const s = q.s * pp.k * 1.3; ctx.fillRect(pp.x - s / 2, pp.y - s / 2, s, s) }
      }

      // everything else depth-sorted, far → near
      const items: { d: number; draw: () => void }[] = []
      const PP = P.map(proj)
      links.forEach((l, li) => {
        const a = PP[l.a], b = PP[l.b]
        if (!a.k || !b.k) return
        const on = M[l.a] && M[l.b]
        const touch = sel != null && (l.a === sel || l.b === sel)
        const dim = sel != null && !touch
        const d = (a.depth + b.depth) / 2
        if (l.kind === 'cite') {
          items.push({ d, draw: () => stream(li, a, b, l.w, touch, on ? (dim ? 0.22 : 1) : 0.08) })
        } else {
          items.push({ d, draw: () => {
            const base = l.kind === 'coauthor' ? 0.22 : 0.14
            ctx.globalAlpha = on ? (touch ? 0.95 : dim ? base * 0.35 : base) : 0.04
            ctx.strokeStyle = touch ? '#ECEAF3' : '#b9b4c8'
            ctx.lineWidth = l.kind === 'coauthor' ? Math.max(0.6, 1.1 * ((a.k + b.k) / 2)) : 0.8
            if (l.kind === 'similar') ctx.setLineDash([2, 4])
            const c = ctrl(li)
            ctx.beginPath(); ctx.moveTo(a.x, a.y); if (c.k) ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); else ctx.lineTo(b.x, b.y); ctx.stroke()
            ctx.setLineDash([]); ctx.globalAlpha = 1
          } })
        }
      })
      nodes.forEach((n, i) => {
        const p = PP[i]; if (!p.k) return
        const dim = sel != null && sel !== i && !links.some((l) => (l.a === sel && l.b === i) || (l.b === sel && l.a === i))
        items.push({ d: p.depth, draw: () => sphere(p, n, M[i] ? (dim ? 0.3 : 1) : 0.1, i === sel || i === hover) })
      })
      items.sort((a, b) => b.d - a.d).forEach((it) => it.draw())

      // field labels on top
      ctx.textAlign = 'center'
      for (const c of C) {
        const pc = proj({ x: c.c.x, y: c.c.y - c.sd * 1.5, z: c.c.z })
        if (!pc.k || !c.n) continue
        const fs = Math.max(9, Math.min(15, 13 * pc.k))
        ctx.font = `600 ${fs}px 'JetBrains Mono', monospace`
        ctx.fillStyle = hexA(PCOL[c.f], 0.95)
        ctx.fillText(PNAME[c.f].toUpperCase(), pc.x, pc.y)
      }
      lastPP = PP
    }
    frame()

    // ----- interaction -----
    const pts = new Map<number, { x: number; y: number }>()
    let moved = 0, pinch0 = 0, dist0 = 0
    const pick = (mx: number, my: number) => {
      const PP = lastPP
      if (!PP.length) return -1
      let best = -1, bd = 1e9
      PP.forEach((p, i) => {
        if (!p.k || !live.current.matched[i]) return
        const r = Math.max(5, (RADIUS[nodes[i].q] || 5) * p.k) + 4
        const d = Math.hypot(p.x - mx, p.y - my)
        if (d < r && p.depth < bd) { bd = p.depth; best = i }
      })
      return best
    }
    const local = (e: PointerEvent | WheelEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
    const showTip = (i: number, x: number, y: number) => {
      const tip = tipRef.current!; if (i < 0) { tip.style.opacity = '0'; return }
      const n = nodes[i]
      ;(tip.firstChild as HTMLElement).textContent = n.t
      ;(tip.lastChild as HTMLElement).textContent = `${n.y} · ${n.q === 'NA' ? 'non-indexed' : n.q} · ${n.v}`
      tip.style.opacity = '1'
      tip.style.left = Math.min(x + 14, W - 280) + 'px'; tip.style.top = Math.max(8, y - 14) + 'px'
    }
    const down = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, local(e)); moved = 0; cam.idle = 0
      if (!cam.engaged) { cam.engaged = true; setEngaged(true) }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = cam.goalDist }
    }
    const move = (e: PointerEvent) => {
      const p = local(e)
      if (!pts.has(e.pointerId)) { hover = pick(p.x, p.y); cv.style.cursor = hover >= 0 ? 'pointer' : 'grab'; showTip(hover, p.x, p.y); return }
      const prev = pts.get(e.pointerId)!; pts.set(e.pointerId, p)
      if (pts.size === 2) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch0) cam.goalDist = Math.max(160, Math.min(1600, dist0 * (pinch0 / d)))
        return
      }
      const dx = p.x - prev.x, dy = p.y - prev.y
      moved += Math.abs(dx) + Math.abs(dy)
      cam.yaw += dx * 0.006; cam.pitch = Math.max(-1.35, Math.min(1.35, cam.pitch + dy * 0.006))
      cam.idle = 0; showTip(-1, 0, 0); cv.style.cursor = 'grabbing'
    }
    const up = (e: PointerEvent) => {
      const p = local(e); pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0
      if (moved < 5 && pts.size === 0) {
        const i = pick(p.x, p.y)
        live.current.onSelect(i >= 0 ? i : null)
        cam.goalDist = i >= 0 ? 380 : 760
      }
      cv.style.cursor = 'grab'
    }
    const wheel = (e: WheelEvent) => {
      if (!cam.engaged && !e.ctrlKey && !e.metaKey) return // let the page scroll until the visitor engages
      e.preventDefault(); cam.idle = 0
      cam.goalDist = Math.max(160, Math.min(1600, cam.goalDist * Math.exp(e.deltaY * 0.0012)))
    }
    const leave = () => { hover = -1; showTip(-1, 0, 0); cam.engaged = false; setEngaged(false) }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move)
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up)
    cv.addEventListener('wheel', wheel, { passive: false }); wrap.addEventListener('pointerleave', leave)
    ;(wrap as any).__zoom = (f: number) => { cam.idle = 0; cam.goalDist = f === 0 ? 760 : Math.max(160, Math.min(1600, cam.goalDist * f)) }

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move)
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up)
      cv.removeEventListener('wheel', wheel); wrap.removeEventListener('pointerleave', leave)
    }
  }, [nodes, links])

  // fly back out when the selection is cleared from outside (panel closed)
  useEffect(() => { if (selected == null) camRef.current.goalDist = Math.max(camRef.current.goalDist, 700) }, [selected])

  const zoom = (f: number) => (wrapRef.current as any)?.__zoom?.(f)
  const btn: React.CSSProperties = { width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(20,18,28,.75)', color: '#ECEAF3', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(4px)' }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <canvas ref={cvRef} aria-label="3D map of publications grouped by research field; citations shown as particle streams" role="img"
        style={{ display: 'block', width: '100%', height: `min(${height}px, 72vh)`, cursor: 'grab', touchAction: 'none' }} />
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button type="button" style={btn} onClick={() => zoom(0.75)} aria-label="Zoom in">+</button>
        <button type="button" style={btn} onClick={() => zoom(1.33)} aria-label="Zoom out">−</button>
        <button type="button" style={{ ...btn, fontSize: 13 }} onClick={() => { onSelect(null); zoom(0) }} aria-label="Reset view">⟲</button>
      </div>
      <div style={{ position: 'absolute', left: 14, bottom: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#6f6a82', pointerEvents: 'none' }}>
        drag to orbit · {engaged ? 'scroll' : 'click, then scroll'} or pinch to zoom · click a paper to fly to it
      </div>
      <div ref={tipRef} style={{ position: 'absolute', pointerEvents: 'none', opacity: 0, transition: 'opacity .12s', background: '#1c1b24', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: '9px 12px', maxWidth: 280, boxShadow: '0 14px 40px -12px rgba(0,0,0,.7)', zIndex: 2 }}>
        <div style={{ fontSize: 13, color: '#ECEAF3', lineHeight: 1.35, marginBottom: 4 }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#9b96aa' }} />
      </div>
    </div>
  )
}
