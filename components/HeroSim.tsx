'use client'

// ---------------------------------------------------------------------------
// HeroSim — the live optimization behind the dark banners.
//
// This is NOT decorative noise. It is a real population-based search:
// a particle swarm (inertia + cognitive + social terms, plus a mutation kick)
// hunting the global optimum of a multimodal fitness landscape that is itself
// re-shaped every epoch, so the population must detect the change and re-search.
// The visitor's pointer subtracts a Gaussian penalty from the objective, i.e. it
// is a moving constraint the swarm has to route around.
//
// Everything drawn is derived from the running state — the HUD numbers are the
// actual generation counter, the actual best objective value and the actual
// population spread. Nothing is faked.
//
// Perf contract: DPR capped, offscreen/hidden tabs pause the loop, the landscape
// raster is only recomputed when the peaks actually move, and
// prefers-reduced-motion renders a single converged frame with no animation.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'

type Variant = 'hero' | 'banner'

// Signature pillar colours (kept in step with lib/view PCOL).
const SWARM_COLOURS = ['#21b3a0', '#4d8df0', '#8b7bf0', '#f2683f', '#d99320', '#84b53a']

type Peak = { x: number; y: number; tx: number; ty: number; h: number; sig: number }
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
  shift: 'LANDSCAPE SHIFTED · RE-SEARCHING',
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

    const ctx = cv.getContext('2d', { alpha: false })
    if (!ctx) return

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const isBanner = variant === 'banner'
    const DIM = isBanner ? 0.72 : 1 // banners run the same sim, dimmer and calmer

    // ---- sizing -----------------------------------------------------------
    let W = 0, H = 0, DPR = 1
    let field: HTMLCanvasElement | null = null
    let fctx: CanvasRenderingContext2D | null = null
    let fw = 0, fh = 0
    let fieldDirty = true

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

      const step = W < 700 ? 8 : 9
      fw = Math.max(2, Math.ceil(W / step))
      fh = Math.max(2, Math.ceil(H / step))
      if (!field) {
        field = document.createElement('canvas')
        fctx = field.getContext('2d')
      }
      field.width = fw
      field.height = fh
      fieldDirty = true
    }

    // ---- the objective ----------------------------------------------------
    // A sum of Gaussian peaks. Multimodal on purpose: a naive hill-climber gets
    // trapped, a swarm with a social term does not.
    const PEAKS = isBanner ? 4 : 5
    const peaks: Peak[] = []
    let morph = 0 // 0 = settled, 1 = mid-morph

    function seedPeaks(initial: boolean) {
      // On wide screens the headline owns the left half, so the landscape's peaks
      // (and therefore the swarm) are kept in the open right-hand side.
      const wide = W > 940
      // Banners are short and the copy runs wider across them, so the swarm is
      // pushed further into the right margin than on the tall home hero.
      const x0 = wide ? (isBanner ? 0.60 : 0.46) : 0.08
      const xs = wide ? (isBanner ? 0.34 : 0.48) : 0.84
      for (let i = 0; i < PEAKS; i++) {
        const nx = x0 + Math.random() * xs
        const ny = 0.14 + Math.random() * 0.62
        if (initial) {
          peaks.push({
            x: nx, y: ny, tx: nx, ty: ny,
            h: 0.45 + Math.random() * 0.55,
            sig: 0.1 + Math.random() * 0.12,
          })
        } else {
          const p = peaks[i]
          p.tx = nx
          p.ty = ny
          p.h = 0.45 + Math.random() * 0.55
          p.sig = 0.1 + Math.random() * 0.12
        }
      }
      // Guarantee one clearly dominant optimum so "converged" is meaningful.
      const k = Math.floor(Math.random() * PEAKS)
      peaks[k].h = 1
      peaks[k].sig = 0.085 + Math.random() * 0.03
    }
    seedPeaks(true)

    // Pointer acts as a Gaussian penalty well — a constraint, not a cursor.
    const ptr = { x: -9999, y: -9999, on: 0 }
    const PTR_R = () => Math.min(W, H) * 0.17

    function objective(px: number, py: number) {
      const nx = px / W, ny = py / H
      let f = 0
      for (const p of peaks) {
        const dx = nx - p.x, dy = ny - p.y
        f += p.h * Math.exp(-(dx * dx + dy * dy) / (2 * p.sig * p.sig))
      }
      if (ptr.on > 0.01) {
        const dx = px - ptr.x, dy = py - ptr.y
        const r = PTR_R()
        f -= 1.25 * ptr.on * Math.exp(-(dx * dx + dy * dy) / (2 * r * r * 0.34))
      }
      return f
    }

    // ---- landscape raster -------------------------------------------------
    // Only the static part (the peaks) is rasterised; the pointer well is drawn
    // as a composited radial gradient so the raster survives pointer movement.
    function paintField() {
      if (!fctx || !field) return
      const img = fctx.createImageData(fw, fh)
      const d = img.data
      let maxF = 0.0001
      const raw = new Float32Array(fw * fh)
      for (let j = 0; j < fh; j++) {
        const ny = (j + 0.5) / fh
        for (let i = 0; i < fw; i++) {
          const nx = (i + 0.5) / fw
          let f = 0
          for (const p of peaks) {
            const dx = nx - p.x, dy = ny - p.y
            f += p.h * Math.exp(-(dx * dx + dy * dy) / (2 * p.sig * p.sig))
          }
          raw[j * fw + i] = f
          if (f > maxF) maxF = f
        }
      }
      for (let k = 0; k < raw.length; k++) {
        let t = raw[k] / maxF
        t = Math.pow(Math.max(0, Math.min(1, t)), 0.85)
        // ramp: void → deep indigo → teal shadow → teal light
        let r: number, g: number, b: number
        if (t < 0.45) {
          const u = t / 0.45
          r = 8 + u * 16; g = 7 + u * 24; b = 17 + u * 46
        } else if (t < 0.78) {
          const u = (t - 0.45) / 0.33
          r = 24 + u * 2; g = 31 + u * 52; b = 63 + u * 30
        } else {
          const u = (t - 0.78) / 0.22
          r = 26 + u * 46; g = 83 + u * 106; b = 93 + u * 64
        }
        // contour lines — reads as a fitness landscape, not a smear.
        // Suppressed in the near-flat basin, where they would just look like a grid.
        if (t > 0.27) {
          const cb = (t * 8) % 1
          if (cb < 0.07) {
            const line = (1 - cb / 0.07) * 30 * (0.25 + t)
            r += line; g += line * 1.12; b += line * 1.04
          }
        }
        const o = k * 4
        d[o] = Math.min(255, r * DIM)
        d[o + 1] = Math.min(255, g * DIM)
        d[o + 2] = Math.min(255, b * DIM)
        d[o + 3] = 255
      }
      fctx.putImageData(img, 0, 0)
      fieldDirty = false
    }

    // ---- population -------------------------------------------------------
    let agents: Agent[] = []
    let gx = 0, gy = 0, gf = -Infinity
    let gen = 0
    let spread = 0
    let phase: keyof typeof PHASE_LABEL = 'search'
    let phaseHold = 0
    let epochFrames = 0
    const history: number[] = []

    function popSize() {
      if (isBanner) return W < 700 ? 26 : 46
      return W < 700 ? 44 : W < 1100 ? 74 : 104
    }

    function seedPopulation(scatter = true) {
      const N = popSize()
      const next: Agent[] = []
      for (let i = 0; i < N; i++) {
        const old = agents[i]
        const wide = W > 940
        const x = scatter || !old ? (wide ? W * (isBanner ? 0.55 : 0.4) + Math.random() * W * (isBanner ? 0.43 : 0.58) : Math.random() * W) : old.x
        const y = scatter || !old ? Math.random() * H * 0.9 : old.y
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

    function step() {
      gen++
      epochFrames++

      // landscape morph (dynamic optimization): peaks glide to new targets
      if (morph > 0) {
        morph = Math.max(0, morph - 0.016)
        let moved = false
        for (const p of peaks) {
          const dx = p.tx - p.x, dy = p.ty - p.y
          if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) moved = true
          p.x += dx * 0.06
          p.y += dy * 0.06
        }
        if (moved) fieldDirty = true
      }

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
        // the pointer is a repulsive constraint
        if (ptr.on > 0.01) {
          const dx = a.x - ptr.x, dy = a.y - ptr.y
          const d2 = dx * dx + dy * dy
          const R = PTR_R()
          if (d2 < R * R * 1.6) {
            const d = Math.sqrt(d2) || 1
            const push = (1 - d / (R * 1.27)) * 2.4 * ptr.on
            a.vx += (dx / d) * push
            a.vy += (dy / d) * push
          }
        }

        const sp2 = a.vx * a.vx + a.vy * a.vy
        if (sp2 > vmax * vmax) { const k = vmax / Math.sqrt(sp2); a.vx *= k; a.vy *= k }

        a.x += a.vx
        a.y += a.vy
        // reflective bounds
        if (a.x < 2) { a.x = 2; a.vx = Math.abs(a.vx) * 0.6 }
        if (a.x > W - 2) { a.x = W - 2; a.vx = -Math.abs(a.vx) * 0.6 }
        if (a.y < 2) { a.y = 2; a.vy = Math.abs(a.vy) * 0.6 }
        if (a.y > H - 2) { a.y = H - 2; a.vy = -Math.abs(a.vy) * 0.6 }

        a.trail.push(a.x, a.y)
        if (a.trail.length > 10) a.trail.splice(0, 2)

        sumD += Math.hypot(a.x - gx, a.y - gy)
      }
      spread = sumD / Math.max(1, agents.length)

      // re-evaluate the incumbent: under a moving landscape it can go stale
      gf = objective(gx, gy)

      if (gen % 4 === 0) {
        history.push(gf)
        if (history.length > 56) history.shift()
      }

      // ---- phase machine --------------------------------------------------
      const minDim = Math.min(W, H)
      if (phase === 'shift') {
        if (morph <= 0) { phase = 'search'; }
      } else if (spread < minDim * 0.052) {
        if (phase !== 'locked') { phase = 'locked'; phaseHold = 0 }
        phaseHold++
      } else if (spread < minDim * 0.16) {
        if (phase !== 'locked') phase = 'converge'
      } else {
        if (phase !== 'locked') phase = 'search'
      }

      const tooLong = epochFrames > (isBanner ? 1500 : 1100)
      if ((phase === 'locked' && phaseHold > 105) || tooLong) {
        seedPeaks(false)
        morph = 1
        fieldDirty = true
        phase = 'shift'
        phaseHold = 0
        epochFrames = 0
        gf = -Infinity
        for (const a of agents) {
          a.pf = -Infinity
          a.vx += (Math.random() - 0.5) * vmax * 4
          a.vy += (Math.random() - 0.5) * vmax * 4
        }
      }
    }

    // ---- drawing ----------------------------------------------------------
    function draw(t: number) {
      if (fieldDirty) paintField()

      ctx!.globalAlpha = 1
      ctx!.globalCompositeOperation = 'source-over'
      ctx!.fillStyle = '#07060f'
      ctx!.fillRect(0, 0, W, H)
      if (field) {
        ctx!.imageSmoothingEnabled = true
        ctx!.drawImage(field, 0, 0, W, H)
      }

      // pointer well — a visible hole punched in the objective
      if (ptr.on > 0.01) {
        const R = PTR_R() * 1.5
        const g = ctx!.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, R)
        g.addColorStop(0, 'rgba(5,4,11,' + (0.92 * ptr.on).toFixed(3) + ')')
        g.addColorStop(0.55, 'rgba(5,4,11,' + (0.45 * ptr.on).toFixed(3) + ')')
        g.addColorStop(1, 'rgba(5,4,11,0)')
        ctx!.fillStyle = g
        ctx!.beginPath(); ctx!.arc(ptr.x, ptr.y, R, 0, 7); ctx!.fill()
        ctx!.strokeStyle = 'rgba(242,104,63,' + (0.3 * ptr.on).toFixed(3) + ')'
        ctx!.lineWidth = 1
        ctx!.beginPath(); ctx!.arc(ptr.x, ptr.y, PTR_R() * 0.62, 0, 7); ctx!.stroke()
      }

      // convergence radius — how tight the population currently is
      if (isFinite(spread) && spread > 0) {
        ctx!.strokeStyle = 'rgba(255,255,255,' + (0.1 * DIM).toFixed(3) + ')'
        ctx!.lineWidth = 1
        ctx!.setLineDash([3, 6])
        ctx!.beginPath(); ctx!.arc(gx, gy, spread, 0, 7); ctx!.stroke()
        ctx!.setLineDash([])
      }

      // trails
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

      // agents — halo fades as the population contracts, so "converged" reads as
      // a tight constellation rather than one blown-out blob
      const tight = Math.min(1, spread / (Math.min(W, H) * 0.22))
      const halo = (0.3 + 0.7 * tight) * 0.68 * DIM
      for (const a of agents) {
        const sp = sprites[a.ci]
        ctx!.globalAlpha = halo
        ctx!.drawImage(sp, a.x - 16, a.y - 16, 32, 32)
        ctx!.globalAlpha = 0.95 * DIM
        ctx!.fillStyle = '#ffffff'
        ctx!.beginPath(); ctx!.arc(a.x, a.y, 1.35, 0, 7); ctx!.fill()
      }
      ctx!.globalAlpha = 1
      ctx!.globalCompositeOperation = 'source-over'

      // incumbent best — pulsing reticle
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
    function paintHud() {
      if (!hud) return
      if (hudTick++ % 6) return
      if (hudGen) hudGen.textContent = 'GEN ' + String(gen).padStart(4, '0')
      if (hudBest) hudBest.textContent = 'BEST ' + (isFinite(gf) ? gf.toFixed(4) : '—')
      if (hudSpread) hudSpread.textContent = 'SPREAD ' + spread.toFixed(1)
      if (hudPhase) hudPhase.textContent = PHASE_LABEL[phase]
      paintSpark()
    }

    // ---- loop -------------------------------------------------------------
    let raf = 0
    let visible = true
    let running = false

    function frame(t: number) {
      if (!running) return
      step()
      draw(t)
      paintHud()
      raf = requestAnimationFrame(frame)
    }
    function start() {
      if (running || reduce) return
      running = true
      raf = requestAnimationFrame(frame)
    }
    function stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    measure()
    seedPopulation(true)
    paintField()

    if (reduce) {
      // one settled frame, no animation at all
      for (let i = 0; i < 420; i++) step()
      draw(0)
      if (hud) {
        hudTick = 0
        if (hudGen) hudGen.textContent = 'GEN ' + String(gen).padStart(4, '0')
        if (hudBest) hudBest.textContent = 'BEST ' + gf.toFixed(4)
        if (hudSpread) hudSpread.textContent = 'SPREAD ' + spread.toFixed(1)
        if (hudPhase) hudPhase.textContent = 'CONVERGED · MOTION REDUCED'
        paintSpark()
      }
    }

    // ---- events -----------------------------------------------------------
    const onPointerMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
      ptr.on = 1
      fieldDirty = fieldDirty || false
    }
    const onPointerLeave = () => { ptr.on = 0; ptr.x = -9999; ptr.y = -9999 }
    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerleave', onPointerLeave)

    let rt = 0
    const onResize = () => {
      clearTimeout(rt)
      rt = window.setTimeout(() => {
        const before = { w: W, h: H }
        measure()
        if (before.w !== W) seedPopulation(true)
        paintField()
        if (reduce) draw(0)
      }, 140) as unknown as number
    }
    window.addEventListener('resize', onResize)

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(host)

    const io = new IntersectionObserver(
      (en) => {
        visible = en.some((x) => x.isIntersecting)
        if (visible && !document.hidden) start()
        else stop()
      },
      { threshold: 0.01 },
    )
    io.observe(host)

    const onVis = () => {
      if (document.hidden) stop()
      else if (visible) start()
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      stop()
      clearTimeout(rt)
      io.disconnect()
      ro?.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [variant, hud])

  return (
    <div
      ref={hostRef}
      className={className}
      aria-hidden="true"
      style={{ ...s('position:absolute;inset:0;overflow:hidden;background:#07060f'), ...(style || {}) }}
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
