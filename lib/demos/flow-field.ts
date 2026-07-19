// Generative "latent flow field" — particles self-organize along a sinusoidal
// flow and draw proximity links; the pointer perturbs the field. Ported from the
// home/research generative-pillar canvases. A stand-in for the generative process.
import type { DemoFactory } from './types'

const PAL = ['#8b7bf0', '#a99bf5', '#d99320', '#b98ad6', '#6d8bf0']

export const createFlowField: DemoFactory = () => {
  let W = 0
  let H = 0
  type P = { x: number; y: number; vx: number; vy: number; c: string; r: number }
  let ps: P[] = []
  const mouse = { x: -999, y: -999 }

  const build = () => {
    ps = []
    const N = W < 300 ? 50 : W < 640 ? 74 : 108
    for (let i = 0; i < N; i++)
      ps.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        c: PAL[i % PAL.length],
        r: Math.random() * 1.6 + 1,
      })
  }

  const advance = () => {
    for (const p of ps) {
      const a = Math.sin(p.y * 0.012 + p.x * 0.009) * 0.7
      p.vx += Math.cos(a) * 0.012
      p.vy += Math.sin(a) * 0.012
      const dx = p.x - mouse.x
      const dy = p.y - mouse.y
      const d2 = dx * dx + dy * dy
      if (d2 < 12000) {
        const d = Math.sqrt(d2) || 1
        p.vx += (dx / d) * 0.5
        p.vy += (dy / d) * 0.5
      }
      p.vx *= 0.95
      p.vy *= 0.95
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0) p.x += W
      if (p.x > W) p.x -= W
      if (p.y < 0) p.y += H
      if (p.y > H) p.y -= H
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
      for (let i = 0; i < ps.length; i++)
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i]
          const b = ps[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 110) {
            ctx.strokeStyle = 'rgba(139,123,240,' + 0.16 * (1 - d / 110) + ')'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      ctx.globalAlpha = 0.85
      for (const p of ps) {
        ctx.fillStyle = p.c
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, 7)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
    pointer(x, y, type) {
      if (type === 'leave') {
        mouse.x = -999
        mouse.y = -999
      } else {
        mouse.x = x
        mouse.y = y
      }
    },
    reset: build,
    resetLabel: 'Reseed',
    settle() {
      for (let i = 0; i < 40; i++) advance()
    },
  }
}
