// Swarm intelligence on a multimodal fitness landscape — particle-swarm-style
// agents combine local flocking with a pull toward the best-known peak, climbing
// a landscape whose brighter regions are higher fitness. Ported from the research
// optimization-pillar canvas. A stand-in for metaheuristic optimization.
import type { DemoFactory } from './types'

export const createSwarmLandscape: DemoFactory = () => {
  let W = 0
  let H = 0
  const off = typeof document !== 'undefined' ? document.createElement('canvas') : (null as unknown as HTMLCanvasElement)
  let octx: CanvasRenderingContext2D | null = null
  type Peak = { cx: number; cy: number; h: number; s: number }
  let peaks: Peak[] = []
  let maxV = 1
  type Particle = { x: number; y: number; vx: number; vy: number; bx: number; by: number; bv: number }
  let swarm: Particle[] = []
  let gbest = { x: 0, y: 0, v: -1 }
  let iter = 0

  const fval = (x: number, y: number) => {
    let sum = 0
    for (const p of peaks) {
      const dx = x - p.cx
      const dy = y - p.cy
      sum += p.h * Math.exp(-(dx * dx + dy * dy) / (2 * p.s * p.s))
    }
    return sum
  }

  const buildLandscape = () => {
    peaks = []
    const np = 3 + ((Math.random() * 2) | 0)
    for (let i = 0; i < np; i++)
      peaks.push({
        cx: 46 + Math.random() * (W - 92),
        cy: 40 + Math.random() * (H - 80),
        h: 0.42 + Math.random() * 0.5,
        s: 38 + Math.random() * 52,
      })
    let gi = 0
    for (let i = 1; i < peaks.length; i++) if (peaks[i].h > peaks[gi].h) gi = i
    peaks[gi].h = 1.15
    peaks[gi].s = Math.max(peaks[gi].s, 52)
    maxV = 0.0001
    for (let x = 0; x < W; x += 8) for (let y = 0; y < H; y += 8) { const v = fval(x, y); if (v > maxV) maxV = v }
    off.width = W
    off.height = H
    octx = off.getContext('2d')!
    octx.fillStyle = '#0b1513'
    octx.fillRect(0, 0, W, H)
    const st = 7
    for (let x = 0; x < W; x += st)
      for (let y = 0; y < H; y += st) {
        const v = fval(x, y) / maxV
        octx.fillStyle = 'rgba(33,179,160,' + Math.pow(v, 1.7) * 0.82 + ')'
        octx.fillRect(x, y, st, st)
      }
  }

  const initSwarm = () => {
    swarm = []
    gbest = { x: 0, y: 0, v: -1 }
    iter = 0
    for (let i = 0; i < 46; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      const v = fval(x, y)
      if (v > gbest.v) gbest = { x, y, v }
      swarm.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, bx: x, by: y, bv: v })
    }
  }

  const advance = () => {
    const w = 0.8
    const toBest = 0.05
    const toG = 0.07
    const per = 44
    for (const p of swarm) {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0
      for (const o of swarm) {
        if (o === p) continue
        const dx = o.x - p.x
        const dy = o.y - p.y
        const d = Math.hypot(dx, dy)
        if (d < per && d > 0) {
          ax += o.vx; ay += o.vy; cx += o.x; cy += o.y
          if (d < 18) { sx -= dx / d; sy -= dy / d }
          n++
        }
      }
      if (n) {
        ax /= n; ay /= n; cx = cx / n - p.x; cy = cy / n - p.y
        p.vx += (ax - p.vx) * 0.04 + cx * 0.0006 + sx * 0.05
        p.vy += (ay - p.vy) * 0.04 + cy * 0.0006 + sy * 0.05
      }
      p.vx = w * p.vx + toBest * Math.random() * (p.bx - p.x) + toG * Math.random() * (gbest.x - p.x)
      p.vy = w * p.vy + toBest * Math.random() * (p.by - p.y) + toG * Math.random() * (gbest.y - p.y)
      const sp = Math.hypot(p.vx, p.vy)
      const mx = 4.6
      if (sp > mx) { p.vx = (p.vx / sp) * mx; p.vy = (p.vy / sp) * mx }
      p.x = Math.max(0, Math.min(W, p.x + p.vx))
      p.y = Math.max(0, Math.min(H, p.y + p.vy))
      const v = fval(p.x, p.y)
      if (v > p.bv) { p.bv = v; p.bx = p.x; p.by = p.y }
      if (v > gbest.v) gbest = { x: p.x, y: p.y, v }
    }
    iter++
  }

  return {
    resize(w, h) {
      W = w
      H = h
      buildLandscape()
      initSwarm()
    },
    step: advance,
    draw(ctx) {
      if (off && off.width) ctx.drawImage(off, 0, 0, W, H)
      else {
        ctx.fillStyle = '#0b1513'
        ctx.fillRect(0, 0, W, H)
      }
      ctx.strokeStyle = 'rgba(255,255,255,.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(gbest.x, gbest.y, 10, 0, 7)
      ctx.stroke()
      ctx.globalAlpha = 0.95
      for (const p of swarm) {
        const a = Math.atan2(p.vy, p.vx)
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(a)
        ctx.fillStyle = '#7af0dd'
        ctx.beginPath()
        ctx.moveTo(6, 0)
        ctx.lineTo(-4, 3)
        ctx.lineTo(-4, -3)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      ctx.globalAlpha = 1
    },
    reset() {
      buildLandscape()
      initSwarm()
    },
    resetLabel: 'New landscape',
    stats() {
      return [
        { label: 'ITERATION', value: String(iter) },
        { label: 'BEST FITNESS', value: Math.round((gbest.v / maxV) * 100) + '%' },
      ]
    },
    settle() {
      for (let i = 0; i < 120; i++) advance()
    },
  }
}
