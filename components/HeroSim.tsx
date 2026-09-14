'use client'

// ---------------------------------------------------------------------------
// HeroSim — the searching population, drawn ON TOP of ProcLandscape.
//
// This is not decoration. It is a particle swarm (inertia + cognitive + social
// terms, plus a mutation kick) maximising `terrainAt()` — the very same field
// ProcLandscape renders. The agents are therefore climbing the ridges you can
// see, and when a click re-seeds the generator the ground moves under them and
// the population has to find the new optimum. That is dynamic optimization, and
// it is genuinely running: the GEN / BEST / SPREAD readout is the live state of
// the search, not a scripted animation.
//
// This canvas is TRANSPARENT and paints only agents, trails and the incumbent
// reticle. The terrain underneath belongs to ProcLandscape.
//
// Perf: DPR capped, offscreen and hidden tabs pause the loop, glow is drawn from
// cached sprites rather than shadowBlur. prefers-reduced-motion runs the search
// to convergence once and paints a single static frame.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import { landscape, terrainAt } from '@/lib/landscape'

type Variant = 'hero' | 'banner'

// Signature pillar colours (kept in step with lib/view PCOL).
const SWARM_COLOURS = ['#21b3a0', '#4d8df0', '#8b7bf0', '#f2683f', '#d99320', '#84b53a']

type Agent = {
  x: number; y: number; vx: number; vy: number
  px: number; py: number; pf: number
  c: string; ci: number
  trail: number[]
}

const PHASE_LABEL = {
  search: 'SEARCHING',
  converge: 'CONVERGING',
  locked: 'OPTIMUM LOCKED',
  shift: 'TERRAIN RE-GENERATED · RE-SEARCHING',
} as const

export default function HeroSim({
  variant = 'hero',
  hud = true,
  className,
  style,
}: {
  variant?: Variant
  hud?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const sparkRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const cv = cvRef.current
    if (!host || !cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const isBanner = variant === 'banner'
    const DIM = isBanner ? 0.72 : 1

    let W = 0, H = 0, DPR = 1

    function measure() {
      const r = host!.getBoundingClientRect()
      W = Math.max(1, Math.round(r.width))
      H = Math.max(1, Math.round(r.height))
      DPR = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2)
      cv!.width = Math.round(W * DPR)
      cv!.height = Math.round(H * DPR)
      cv!.style.width = W + 'px'
      cv!.style.height = H + 'px'
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    // The pointer is a penalty well subtracted from the objective — a moving
    // constraint the population has to route around, not just a repulsor.
    const ptr = { x: -9999, y: -9999, on: 0 }
    const PTR_R = () => Math.min(W, H) * 0.16

    function objective(px: number, py: number) {
      let f = terrainAt(px / W, py / H)
      if (ptr.on > 0.01) {
        const dx = px - ptr.x, dy = py - ptr.y
        const r = PTR_R()
        f -= 0.9 * ptr.on * Math.exp(-(dx * dx + dy * dy) / (2 * r * r * 0.34))
      }
      return f
    }

    // ---- population -------------------------------------------------------
    let agents: Agent[] = []
    let gx = 0, gy = 0, gf = -Infinity
    let gen = 0, spread = 0
    let phase: keyof typeof PHASE_LABEL = 'search'
    let phaseHold = 0
    let lastEpoch = landscape.epoch
    const history: number[] = []

    function popSize() {
      if (isBanner) return W < 700 ? 22 : 40
      return W < 700 ? 40 : W < 1100 ? 68 : 96
    }

    function seedPopulation() {
      const N = popSize()
      const next: Agent[] = []
      for (let i = 0; i < N; i++) {
        const x = Math.random() * W
        const y = Math.random() * H
        const ci = i % SWARM_COLOURS.length
        next.push({
          x, y,
          vx: (Math.random() - 0.5) * 3.2,
          vy: (Math.random() - 0.5) * 3.2,
          px: x, py: y, pf: -Infinity,
          c: SWARM_COLOURS[ci], ci,
          trail: [x, y, x, y, x, y, x, y],
        })
      }
      agents = next
      gf = -Infinity
      gx = W / 2; gy = H / 2
    }

    // Soft glow sprites, one per colour — far cheaper than shadowBlur per dot.
    const sprites: HTMLCanvasElement[] = SWARM_COLOURS.map((col) => {
      const sp = document.createElement('canvas')
      const R = 16
      sp.width = sp.height = R * 2
      const sc = sp.getContext('2d')!
      const grd = sc.createRadialGradient(R, R, 0, R, R, R)
      grd.addColorStop(0, col)
      grd.addColorStop(0.28, col + 'aa')
      grd.addColorStop(1, col + '00')
      sc.fillStyle = grd
      sc.fillRect(0, 0, R * 2, R * 2)
      return sp
    })

    const W_INERTIA = 0.73, C1 = 1.45, C2 = 1.55

    function reSearch() {
      gf = -Infinity
      const vmax = Math.max(W, H) * 0.028
      for (const a of agents) {
        a.pf = -Infinity
        a.vx += (Math.random() - 0.5) * vmax * 4
        a.vy += (Math.random() - 0.5) * vmax * 4
      }
      phase = 'shift'
      phaseHold = 0
    }

    function step() {
      gen++

      // The landscape owns terrain changes; the swarm reacts to them.
      if (landscape.epoch !== lastEpoch) { lastEpoch = landscape.epoch; reSearch() }

      const vmax = Math.max(W, H) * 0.028
      let sumD = 0
      for (const a of agents) {
        const f = objective(a.x, a.y)
        if (f > a.pf) { a.pf = f; a.px = a.x; a.py = a.y }
        if (f > gf) { gf = f; gx = a.x; gy = a.y }

        const r1 = Math.random(), r2 = Math.random()
        a.vx = W_INERTIA * a.vx + C1 * r1 * (a.px - a.x) * 0.028 + C2 * r2 * (gx - a.x) * 0.028
        a.vy = W_INERTIA * a.vy + C1 * r1 * (a.py - a.y) * 0.028 + C2 * r2 * (gy - a.y) * 0.028

        // mutation — keeps the swarm from collapsing into a single pixel
        if (Math.random() < 0.035) {
          a.vx += (Math.random() - 0.5) * vmax * 1.6
          a.vy += (Math.random() - 0.5) * vmax * 1.6
        }
        if (ptr.on > 0.01) {
          const dx = a.x - ptr.x, dy = a.y - ptr.y
          const d2 = dx * dx + dy * dy
          const R = PTR_R()
          if (d2 < R * R * 1.6) {
            const d = Math.sqrt(d2) || 1
            const push = (1 - d / (R * 1.27)) * 2.2 * ptr.on
            a.vx += (dx / d) * push
            a.vy += (dy / d) * push
          }
        }

        const sp2 = a.vx * a.vx + a.vy * a.vy
        if (sp2 > vmax * vmax) { const k = vmax / Math.sqrt(sp2); a.vx *= k; a.vy *= k }

        a.x += a.vx
        a.y += a.vy
        if (a.x < 2) { a.x = 2; a.vx = Math.abs(a.vx) * 0.6 }
        if (a.x > W - 2) { a.x = W - 2; a.vx = -Math.abs(a.vx) * 0.6 }
        if (a.y < 2) { a.y = 2; a.vy = Math.abs(a.vy) * 0.6 }
        if (a.y > H - 2) { a.y = H - 2; a.vy = -Math.abs(a.vy) * 0.6 }

        a.trail.push(a.x, a.y)
        if (a.trail.length > 10) a.trail.splice(0, 2)

        sumD += Math.hypot(a.x - gx, a.y - gy)
      }
      spread = sumD / Math.max(1, agents.length)

      // the incumbent goes stale as the terrain drifts — re-evaluate it
      gf = objective(gx, gy)

      if (gen % 4 === 0) {
        history.push(gf)
        if (history.length > 56) history.shift()
      }

      const minDim = Math.min(W, H)
      if (phase === 'shift') {
        if (!landscape.transitioning) phase = 'search'
      } else if (spread < minDim * 0.052) {
        if (phase !== 'locked') { phase = 'locked'; phaseHold = 0 }
        phaseHold++
      } else if (spread < minDim * 0.16) {
        phase = 'converge'
      } else {
        phase = 'search'
      }
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, W, H)

      if (isFinite(spread) && spread > 0) {
        ctx!.strokeStyle = 'rgba(255,255,255,' + (0.1 * DIM).toFixed(3) + ')'
        ctx!.lineWidth = 1
        ctx!.setLineDash([3, 6])
        ctx!.beginPath(); ctx!.arc(gx, gy, spread, 0, 7); ctx!.stroke()
        ctx!.setLineDash([])
      }

      ctx!.globalCompositeOperation = 'lighter'
      ctx!.lineCap = 'round'
      for (const a of agents) {
        const tr = a.trail
        for (let i = 2; i < tr.length; i += 2) {
          const k = i / tr.length
          ctx!.strokeStyle = a.c
          ctx!.globalAlpha = 0.07 + k * 0.3 * DIM
          ctx!.lineWidth = 0.6 + k * 1.5
          ctx!.beginPath()
          ctx!.moveTo(tr[i - 2], tr[i - 1])
          ctx!.lineTo(tr[i], tr[i + 1])
          ctx!.stroke()
        }
      }

      // halo fades as the population contracts, so "converged" reads as a tight
      // constellation rather than one blown-out blob
      const tight = Math.min(1, spread / (Math.min(W, H) * 0.22))
      const halo = (0.3 + 0.7 * tight) * 0.62 * DIM
      for (const a of agents) {
        ctx!.globalAlpha = halo
        ctx!.drawImage(sprites[a.ci], a.x - 16, a.y - 16, 32, 32)
        ctx!.globalAlpha = 0.95 * DIM
        ctx!.fillStyle = '#ffffff'
        ctx!.beginPath(); ctx!.arc(a.x, a.y, 1.35, 0, 7); ctx!.fill()
      }
      ctx!.globalAlpha = 1
      ctx!.globalCompositeOperation = 'source-over'

      const pulse = 0.5 + 0.5 * Math.sin(t * 0.0032)
      const R0 = 9 + pulse * 7
      ctx!.strokeStyle = 'rgba(255,255,255,' + (0.5 * DIM).toFixed(3) + ')'
      ctx!.lineWidth = 1.2
      ctx!.beginPath(); ctx!.arc(gx, gy, R0, 0, 7); ctx!.stroke()
      ctx!.strokeStyle = 'rgba(255,255,255,' + ((0.26 - pulse * 0.16) * DIM).toFixed(3) + ')'
      ctx!.beginPath(); ctx!.arc(gx, gy, R0 + 10 + pulse * 12, 0, 7); ctx!.stroke()
      ctx!.strokeStyle = 'rgba(255,255,255,' + (0.62 * DIM).toFixed(3) + ')'
      ctx!.lineWidth = 1
      const tick = 6
      ctx!.beginPath()
      ctx!.moveTo(gx - R0 - tick, gy); ctx!.lineTo(gx - R0 - 2, gy)
      ctx!.moveTo(gx + R0 + 2, gy); ctx!.lineTo(gx + R0 + tick, gy)
      ctx!.moveTo(gx, gy - R0 - tick); ctx!.lineTo(gx, gy - R0 - 2)
      ctx!.moveTo(gx, gy + R0 + 2); ctx!.lineTo(gx, gy + R0 + tick)
      ctx!.stroke()
    }

    // ---- HUD --------------------------------------------------------------
    const hudGen = host.querySelector('[data-sim-gen]') as HTMLElement | null
    const hudBest = host.querySelector('[data-sim-best]') as HTMLElement | null
    const hudSpread = host.querySelector('[data-sim-spread]') as HTMLElement | null
    const hudPhase = host.querySelector('[data-sim-phase]') as HTMLElement | null

    function paintSpark() {
      const sc = sparkRef.current
      if (!sc) return
      const c2 = sc.getContext('2d')
      if (!c2) return
      const w = 66, h = 16
      if (sc.width !== w * 2) { sc.width = w * 2; sc.height = h * 2; sc.style.width = w + 'px'; sc.style.height = h + 'px' }
      c2.setTransform(2, 0, 0, 2, 0, 0)
      c2.clearRect(0, 0, w, h)
      if (history.length < 2) return
      let lo = Infinity, hi = -Infinity
      for (const v of history) { if (v < lo) lo = v; if (v > hi) hi = v }
      const rng = Math.max(0.0001, hi - lo)
      c2.beginPath()
      history.forEach((v, i) => {
        const x = (i / (history.length - 1)) * w
        const y = h - 1 - ((v - lo) / rng) * (h - 2)
        i ? c2.lineTo(x, y) : c2.moveTo(x, y)
      })
      c2.strokeStyle = 'rgba(33,179,160,.85)'
      c2.lineWidth = 1.2
      c2.stroke()
    }

    let hudTick = 0
    function paintHud(force = false) {
      if (!hud) return
      if (!force && hudTick++ % 6) return
      if (hudGen) hudGen.textContent = 'GEN ' + String(gen).padStart(4, '0')
      if (hudBest) hudBest.textContent = 'BEST ' + (isFinite(gf) ? gf.toFixed(4) : '—')
      if (hudSpread) hudSpread.textContent = 'SPREAD ' + spread.toFixed(1)
      if (hudPhase) hudPhase.textContent = PHASE_LABEL[phase]
      paintSpark()
    }

    // ---- loop -------------------------------------------------------------
    let raf = 0, running = false, visible = true

    function frame(t: number) {
      if (!running) return
      step(); draw(t); paintHud()
      raf = requestAnimationFrame(frame)
    }
    function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(frame) } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0 }

    measure()
    seedPopulation()

    if (reduce) {
      for (let i = 0; i < 420; i++) step()
      draw(0)
      if (hud) {
        paintHud(true)
        if (hudPhase) hudPhase.textContent = 'CONVERGED · MOTION REDUCED'
      }
    }

    // This host is pointer-events:none so it never blocks the links above it, and
    // the band's content wrapper covers the canvas anyway — so listen on the band
    // itself and let events bubble up to it from the copy and buttons.
    const band = (host.closest('.dark-band') as HTMLElement) || host
    const onPointerMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
      ptr.on = 1
    }
    const onPointerLeave = () => { ptr.on = 0; ptr.x = -9999; ptr.y = -9999 }
    band.addEventListener('pointermove', onPointerMove)
    band.addEventListener('pointerleave', onPointerLeave)

    let rt = 0
    const onResize = () => {
      clearTimeout(rt)
      rt = window.setTimeout(() => {
        const before = W
        measure()
        if (before !== W) seedPopulation()
        if (reduce) draw(0)
      }, 140) as unknown as number
    }
    window.addEventListener('resize', onResize)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(host)

    const io = new IntersectionObserver((en) => {
      visible = en.some((x) => x.isIntersecting)
      if (visible && !document.hidden) start(); else stop()
    }, { threshold: 0.01 })
    io.observe(host)

    const onVis = () => { if (document.hidden) stop(); else if (visible) start() }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      stop()
      clearTimeout(rt)
      io.disconnect(); ro?.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      band.removeEventListener('pointermove', onPointerMove)
      band.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [variant, hud])

  return (
    <div
      ref={hostRef}
      className={className}
      aria-hidden="true"
      style={{ ...s('position:absolute;inset:0;overflow:hidden;pointer-events:none'), ...(style || {}) }}
    >
      <canvas ref={cvRef} style={s('position:absolute;inset:0;display:block')} />
      {hud && (
        <div className="sim-hud">
          <span data-sim-gen>GEN 0000</span>
          <span className="sim-hud-sep">·</span>
          <span data-sim-best>BEST —</span>
          <span className="sim-hud-sep">·</span>
          <span data-sim-spread>SPREAD 0.0</span>
          <canvas ref={sparkRef} className="sim-spark" />
          <span className="sim-phase" data-sim-phase>SEARCHING</span>
        </div>
      )}
    </div>
  )
}
