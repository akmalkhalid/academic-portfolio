// Emergent flocking (boids) — alignment, cohesion, and separation from local
// neighbours produce flocking with no leader. Pointer scatters the flock; click
// seeds more. Ported from the home games-pillar canvas.
import { PCOL } from '@/lib/view'
import type { DemoFactory } from './types'

export const createBoids: DemoFactory = () => {
  let W = 0
  let H = 0
  const cols = Object.values(PCOL)
  type B = { x: number; y: number; vx: number; vy: number; c: string }
  let bs: B[] = []
  const mouse = { x: -999, y: -999 }

  const spawn = (n: number, x?: number, y?: number) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 7
      bs.push({
        x: x == null ? Math.random() * W : x,
        y: y == null ? Math.random() * H : y,
        vx: Math.cos(a),
        vy: Math.sin(a),
        c: cols[(Math.random() * cols.length) | 0],
      })
    }
  }

  const build = () => {
    bs = []
    spawn(W < 640 ? 40 : 78)
  }

  const advance = () => {
    const per = 58
    for (const b of bs) {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0
      for (const o of bs) {
        if (o === b) continue
        const dx = o.x - b.x
        const dy = o.y - b.y
        const d = Math.hypot(dx, dy)
        if (d < per && d > 0) {
          ax += o.vx
          ay += o.vy
          cx += o.x
          cy += o.y
          if (d < 22) {
            sx -= dx / d
            sy -= dy / d
          }
          n++
        }
      }
      if (n) {
        ax /= n
        ay /= n
        cx = cx / n - b.x
        cy = cy / n - b.y
        b.vx += (ax - b.vx) * 0.05 + cx * 0.0009 + sx * 0.06
        b.vy += (ay - b.vy) * 0.05 + cy * 0.0009 + sy * 0.06
      }
      const mdx = b.x - mouse.x
      const mdy = b.y - mouse.y
      const md = Math.hypot(mdx, mdy)
      if (md < 92 && md > 0) {
        b.vx += (mdx / md) * 0.45
        b.vy += (mdy / md) * 0.45
      }
      const sp = Math.hypot(b.vx, b.vy)
      const max = 2.4
      if (sp > max) {
        b.vx = (b.vx / sp) * max
        b.vy = (b.vy / sp) * max
      }
      b.x += b.vx
      b.y += b.vy
      if (b.x < 0) b.x += W
      if (b.x > W) b.x -= W
      if (b.y < 0) b.y += H
      if (b.y > H) b.y -= H
    }
  }

  return {
    resize(w, h) {
      W = w
      H = h
      build()
    },
    step: advance,
    draw(ctx) {
      ctx.clearRect(0, 0, W, H)
      ctx.globalAlpha = 0.92
      for (const b of bs) {
        const a = Math.atan2(b.vy, b.vx)
        ctx.save()
        ctx.translate(b.x, b.y)
        ctx.rotate(a)
        ctx.fillStyle = b.c
        ctx.beginPath()
        ctx.moveTo(7, 0)
        ctx.lineTo(-5, 3.5)
        ctx.lineTo(-5, -3.5)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      ctx.globalAlpha = 1
    },
    pointer(x, y, type) {
      if (type === 'leave') {
        mouse.x = -999
        mouse.y = -999
      } else if (type === 'down') {
        spawn(8, x, y)
      } else {
        mouse.x = x
        mouse.y = y
      }
    },
    reset: build,
    resetLabel: 'Reset flock',
    stats() {
      return [{ label: 'AGENTS', value: String(bs.length) }]
    },
    settle() {
      for (let i = 0; i < 60; i++) advance()
    },
  }
}
