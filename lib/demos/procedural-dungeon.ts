// Procedural content generation — a roguelike dungeon synthesized from nothing:
// non-overlapping rooms are scattered, then stitched together with corridors.
// Every roll is unique. Ported from the research games-pillar canvas.
import type { DemoFactory } from './types'

export const createProceduralDungeon: DemoFactory = () => {
  let W = 0
  let H = 0
  const cell = 12
  let cols = 0
  let rows = 0
  let grid: number[] = []
  let floors: number[] = []
  let rooms: { x: number; y: number; w: number; h: number; cx: number; cy: number }[] = []
  let timer = 0

  const gen = () => {
    cols = Math.floor(W / cell)
    rows = Math.floor(H / cell)
    grid = new Array(cols * rows).fill(0)
    rooms = []
    for (let t = 0; t < 70 && rooms.length < 11; t++) {
      const rw = 3 + ((Math.random() * 5) | 0)
      const rh = 3 + ((Math.random() * 4) | 0)
      const rx = 1 + ((Math.random() * (cols - rw - 2)) | 0)
      const ry = 1 + ((Math.random() * (rows - rh - 2)) | 0)
      let ok = true
      for (const o of rooms) {
        if (rx < o.x + o.w + 1 && rx + rw + 1 > o.x && ry < o.y + o.h + 1 && ry + rh + 1 > o.y) { ok = false; break }
      }
      if (!ok) continue
      rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: rx + (rw >> 1), cy: ry + (rh >> 1) })
    }
    for (const r of rooms)
      for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) grid[y * cols + x] = 1
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1]
      const b = rooms[i]
      let x = a.cx
      let y = a.cy
      while (x !== b.cx) { if (!grid[y * cols + x]) grid[y * cols + x] = 2; x += x < b.cx ? 1 : -1 }
      while (y !== b.cy) { if (!grid[y * cols + x]) grid[y * cols + x] = 2; y += y < b.cy ? 1 : -1 }
    }
    floors = []
    for (let i = 0; i < grid.length; i++) if (grid[i]) floors.push(i)
    timer = 0
  }

  return {
    resize(w, h) {
      W = w
      H = h
      gen()
    },
    step() {
      timer++
      if (timer > 360) gen()
    },
    draw(ctx) {
      ctx.fillStyle = '#160c0a'
      ctx.fillRect(0, 0, W, H)
      for (let i = 0; i < floors.length; i++) {
        const idx = floors[i]
        const x = idx % cols
        const y = (idx / cols) | 0
        ctx.fillStyle = grid[idx] === 2 ? 'rgba(242,104,63,0.5)' : '#f2683f'
        ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2)
      }
    },
    pointer(_x, _y, type) {
      if (type === 'down') gen()
    },
    reset: gen,
    resetLabel: 'Regenerate',
    stats() {
      return [
        { label: 'ROOMS', value: String(rooms.length) },
        { label: 'FLOOR TILES', value: String(floors.length) },
      ]
    },
    settle() {
      gen()
    },
  }
}
