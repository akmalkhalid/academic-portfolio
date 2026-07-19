'use client'

// Agent-based crowd-evacuation sim — an interactive stand-in for the emergency
// route-planning problem. Each agent steers toward the exit while separating
// from neighbours and avoiding obstacles; click to drop a pillar and the crowd
// re-routes. Honours reduced-motion (renders a single static frame) and pauses
// when scrolled off-screen.
import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'

export default function CrowdEvacuation({ accent = '#4d8df0' }: { accent?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [stats, setStats] = useState({ evacuated: 0, total: 0, t: 0 })
  const playingRef = useRef(true)
  playingRef.current = playing
  const apiRef = useRef<{ addPeople: () => void; reset: () => void } | null>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(!!reduce)

    const H = 380
    let W = 0, dpr = 1
    type Ag = { x: number; y: number; vx: number; vy: number }
    let agents: Ag[] = []
    let obstacles: { x: number; y: number; r: number }[] = []
    let evac = 0, total = 0, frames = 0
    const exitY = () => H / 2
    const exitHalf = 34

    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.max(240, cv!.getBoundingClientRect().width)
      cv!.width = W * dpr; cv!.height = H * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function spawn(n: number) {
      for (let i = 0; i < n && agents.length < 130; i++) {
        agents.push({ x: 16 + Math.random() * (W * 0.34), y: 26 + Math.random() * (H - 52), vx: 0, vy: 0 })
        total++
      }
    }
    function reset() { agents = []; obstacles = []; evac = 0; total = 0; frames = 0; spawn(70) }

    function step() {
      const ey = exitY()
      for (let i = agents.length - 1; i >= 0; i--) {
        const a = agents[i]
        let fx = 0, fy = 0
        const dx = W - a.x, dy = ey - a.y, d = Math.hypot(dx, dy) || 1
        fx += (dx / d) * 1.15; fy += (dy / d) * 1.15               // toward exit
        for (let j = 0; j < agents.length; j++) {                  // separation
          if (j === i) continue
          const b = agents[j], ox = a.x - b.x, oy = a.y - b.y, dd = ox * ox + oy * oy
          if (dd > 0 && dd < 220) { const inv = 1 / Math.sqrt(dd); fx += ox * inv * 0.55; fy += oy * inv * 0.55 }
        }
        for (const o of obstacles) {                               // obstacle avoidance
          const ox = a.x - o.x, oy = a.y - o.y, dist = Math.hypot(ox, oy)
          if (dist < o.r + 15) { const inv = 1 / (dist || 1); fx += ox * inv * 2.4; fy += oy * inv * 2.4 }
        }
        if (a.y < 14) fy += 1.6; if (a.y > H - 14) fy -= 1.6; if (a.x < 12) fx += 1.2   // walls
        if (a.x > W - 18 && Math.abs(a.y - ey) > exitHalf) { fx -= 2.2; fy += (a.y < ey ? 1 : -1) * 0.7 }
        a.vx = a.vx * 0.86 + fx * 0.14; a.vy = a.vy * 0.86 + fy * 0.14
        const sp = Math.hypot(a.vx, a.vy), max = 1.7
        if (sp > max) { a.vx = a.vx / sp * max; a.vy = a.vy / sp * max }
        a.x += a.vx; a.y += a.vy
        if (a.x >= W - 4 && Math.abs(a.y - ey) <= exitHalf) { agents.splice(i, 1); evac++ }
      }
      frames++
    }

    function draw() {
      const ey = exitY()
      ctx!.clearRect(0, 0, W, H)
      ctx!.fillStyle = '#0c0b11'; ctx!.fillRect(0, 0, W, H)
      ctx!.strokeStyle = 'rgba(255,255,255,.14)'; ctx!.lineWidth = 2
      ctx!.beginPath()
      ctx!.moveTo(2, 2); ctx!.lineTo(W - 2, 2)
      ctx!.moveTo(2, H - 2); ctx!.lineTo(W - 2, H - 2)
      ctx!.moveTo(2, 2); ctx!.lineTo(2, H - 2)
      ctx!.moveTo(W - 2, 2); ctx!.lineTo(W - 2, ey - exitHalf)
      ctx!.moveTo(W - 2, ey + exitHalf); ctx!.lineTo(W - 2, H - 2)
      ctx!.stroke()
      ctx!.fillStyle = accent + '30'; ctx!.fillRect(W - 9, ey - exitHalf, 9, exitHalf * 2)
      ctx!.fillStyle = accent; ctx!.font = "700 10px 'JetBrains Mono', monospace"; ctx!.fillText('EXIT', W - 44, ey - exitHalf - 6)
      for (const o of obstacles) {
        ctx!.fillStyle = 'rgba(255,255,255,.14)'; ctx!.beginPath(); ctx!.arc(o.x, o.y, o.r, 0, 7); ctx!.fill()
        ctx!.strokeStyle = 'rgba(255,255,255,.32)'; ctx!.stroke()
      }
      ctx!.fillStyle = accent
      for (const a of agents) { ctx!.beginPath(); ctx!.arc(a.x, a.y, 3.2, 0, 7); ctx!.fill() }
    }

    fit(); reset()
    let raf = 0, visible = true
    const io = new IntersectionObserver((en) => en.forEach((e) => (visible = e.isIntersecting)), { threshold: 0.05 })
    io.observe(cv)
    const loop = () => {
      if (visible && playingRef.current && agents.length > 0) step()
      draw()
      if (frames % 12 === 0) setStats({ evacuated: evac, total, t: Math.round(frames / 60) })
      raf = requestAnimationFrame(loop)
    }
    if (reduce) { obstacles.push({ x: W * 0.55, y: H * 0.5, r: 20 }); draw(); setStats({ evacuated: 0, total, t: 0 }) }
    else raf = requestAnimationFrame(loop)

    const onDown = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top
      if (x < W - 22 && x > 10 && y > 10 && y < H - 10) obstacles.push({ x, y, r: 16 })
    }
    cv.addEventListener('pointerdown', onDown)
    const onResize = () => fit()
    window.addEventListener('resize', onResize)
    apiRef.current = { addPeople: () => spawn(30), reset }

    return () => { cancelAnimationFrame(raf); io.disconnect(); cv.removeEventListener('pointerdown', onDown); window.removeEventListener('resize', onResize) }
  }, [accent])

  const btn = (solid: boolean) => `font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;padding:7px 13px;border-radius:7px;border:1px solid ${solid ? accent : 'rgba(255,255,255,.16)'};background:${solid ? accent : 'transparent'};color:${solid ? '#0c0b11' : '#cfcad9'}`

  return (
    <div>
      <canvas ref={canvasRef} style={s('display:block;width:100%;height:380px;border-radius:10px;cursor:crosshair')} />
      <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px')}>
        {!reduced && (
          <>
            <button type="button" onClick={() => setPlaying((v) => !v)} style={s(btn(true))}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
            <button type="button" onClick={() => apiRef.current?.addPeople()} style={s(btn(false))}>+ Add 30 people</button>
            <button type="button" onClick={() => apiRef.current?.reset()} style={s(btn(false))}>Reset</button>
          </>
        )}
        <span style={s("font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#9b96aa;margin-left:auto")}>
          Evacuated {stats.evacuated}/{stats.total} · {stats.t}s
        </span>
      </div>
      <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;margin:8px 0 0")}>
        {reduced ? 'Animation reduced (static frame shown).' : 'Click inside the room to drop a pillar — the crowd re-routes around it.'}
      </p>
    </div>
  )
}
