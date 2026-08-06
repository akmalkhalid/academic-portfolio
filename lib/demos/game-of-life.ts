// Conway's Game of Life — four rules, unbounded emergence. Four local rules on a
// toroidal grid produce gliders, oscillators and still lifes that nobody encoded.
// Ported from the hand-rolled sketch that used to live on the tools page, so the
// board is now a first-class demo with its own page, controls and stat readouts.
import type { DemoFactory } from './types'

// One generation every STRIDE frames (~130ms at 60fps) — Life is unreadable at
// full frame rate, and the runtime calls step() once per frame.
const STRIDE = 8

export const createGameOfLife: DemoFactory = () => {
  const palette = ['#8b7bf0', '#4d8df0', '#21b3a0', '#84b53a', '#d99320', '#f2683f']
  let W = 0
  let H = 0
  let cell = 12
  let cols = 1
  let rows = 1
  let grid = new Uint8Array(1)
  let gen = 0
  let frame = 0
  let idleFor = 0
  // pointer painting state
  let painting = false
  let paintVal: 0 | 1 = 1

  const idx = (x: number, y: number) => y * cols + x

  const seed = () => {
    grid = new Uint8Array(cols * rows)
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.3 ? 1 : 0
    gen = 0
    idleFor = 0
  }

  const population = () => {
    let p = 0
    for (let i = 0; i < grid.length; i++) p += grid[i]
    return p
  }

  const advance = () => {
    const next = new Uint8Array(cols * rows)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let n = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            n += grid[idx((x + dx + cols) % cols, (y + dy + rows) % rows)]
          }
        }
        const alive = grid[idx(x, y)]
        next[idx(x, y)] = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0
      }
    }
    grid = next
    gen++
  }

  return {
    resize(w, h) {
      W = w
      H = h
      cell = Math.max(9, Math.round(W / 34))
      cols = Math.max(4, Math.floor(W / cell))
      rows = Math.max(4, Math.floor(H / cell))
      seed()
    },
    step() {
      frame++
      if (frame % STRIDE) return
      advance()
      // A board that has died out or frozen near-empty reseeds itself, so the
      // tile never sits on a blank grid.
      if (population() < 3) {
        idleFor++
        if (idleFor > 8) seed()
      } else idleFor = 0
    },
    draw(ctx) {
      ctx.fillStyle = '#100e1a'
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 0.9
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (!grid[idx(x, y)]) continue
          ctx.fillStyle = palette[(x + y) % palette.length]
          ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2)
        }
      }
      ctx.globalAlpha = 1
    },
    pointer(x, y, type) {
      if (type === 'leave') {
        painting = false
        return
      }
      const cx = Math.floor(x / cell)
      const cy = Math.floor(y / cell)
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return
      const i = idx(cx, cy)
      if (type === 'down') {
        paintVal = grid[i] ? 0 : 1
        grid[i] = paintVal
        painting = true
      } else if (painting) {
        grid[i] = paintVal
      }
    },
    reset: seed,
    resetLabel: 'Reseed',
    stats() {
      return [
        { label: 'GEN', value: String(gen) },
        { label: 'ALIVE', value: String(population()) },
      ]
    },
    settle() {
      for (let i = 0; i < 40; i++) advance()
    },
  }
}
