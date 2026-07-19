// ============================================================================
//  Crowd-evacuation simulation engine — framework-agnostic (no React, no DOM
//  beyond a 2D canvas context passed into draw()).
//
//  A faithful, simplified re-design of the emergency-route-planning model from
//  Dr. Khalid's papers, for illustrative/teaching use. A flood-fill navigation
//  field from every exit routes agents through a shopping-mall interior;
//  congestion and panic shape the flow (the "faster-is-slower" effect).
//
//  Used by two React wrappers:
//    · CrowdEvacuation.tsx      — compact, non-interactive auto-looping embed
//    · CrowdEvacuationFull.tsx  — full interactive sim (sliders, wall editing)
// ============================================================================

export type EvacParams = { crowd: number; panic: number; nExits: number; exitW: number }

export const DEFAULTS: EvacParams = { crowd: 240, panic: 0.3, nExits: 3, exitW: 3 }
export const CELL = 9
export const ACCENT = '#4d8df0'
export const EXIT_WIDTH_LABELS = ['tight', 'narrow', 'wide', 'broad', 'very broad']

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

export class EvacSim {
  cols = 0
  rows = 0
  W = 0
  H = 0
  grid: Uint8Array = new Uint8Array(0) // 0 wall · 1 floor · 2 exit
  field: Float32Array = new Float32Array(0) // BFS distance to nearest exit
  dens: Float32Array = new Float32Array(0) // per-cell occupancy
  agents: { x: number; y: number; vx: number; vy: number }[] = []
  hotspots: { x: number; y: number }[] = []
  evac = 0
  total = 0
  frames = 0
  clearFrame = 0
  flowWin: number[] = []
  P: EvacParams = { ...DEFAULTS }
  accent: string

  constructor(accent: string = ACCENT) {
    this.accent = accent
  }

  private idx(c: number, r: number) {
    return r * this.cols + c
  }

  /** Set canvas pixel size → derive the cell grid. Caller re-runs reset() after. */
  resize(W: number, H: number) {
    this.W = Math.max(320, W)
    this.H = H
    this.cols = Math.floor(this.W / CELL)
    this.rows = Math.floor(this.H / CELL)
  }

  setParams(p: Partial<EvacParams>) {
    this.P = { ...this.P, ...p }
  }

  private rect(c0: number, r0: number, c1: number, r1: number, v: number) {
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        if (c >= 0 && r >= 0 && c < this.cols && r < this.rows) this.grid[this.idx(c, r)] = v
  }

  /** Build the shopping-mall floor plan and place exits + start hotspots. */
  buildPlan() {
    const n = this.cols * this.rows
    this.grid = new Uint8Array(n).fill(1)
    this.field = new Float32Array(n)
    this.dens = new Float32Array(n)
    const CX = this.cols
    const RY = this.rows
    const fx = (f: number) => Math.round(f * CX)
    const fy = (f: number) => Math.round(f * RY)
    // outer walls
    this.rect(0, 0, CX - 1, 0, 0)
    this.rect(0, RY - 1, CX - 1, RY - 1, 0)
    this.rect(0, 0, 0, RY - 1, 0)
    this.rect(CX - 1, 0, CX - 1, RY - 1, 0)
    const conT = fy(0.4)
    const conB = fy(0.6) // concourse band rows
    // concourse top & bottom walls
    this.rect(1, conT, CX - 2, conT, 0)
    this.rect(1, conB, CX - 2, conB, 0)
    // storefront doorways onto the concourse (gaps every ~9 cells)
    for (let c = fx(0.06); c < fx(0.94); c += 9) {
      this.rect(c, conT, c + 2, conT, 1)
      this.rect(c, conB, c + 2, conB, 1)
    }
    // vertical shop dividers (top & bottom rows of shops)
    for (let f = 0.1; f < 0.95; f += 0.11) {
      const c = fx(f)
      this.rect(c, 1, c, conT - 1, 0)
      this.rect(c, conB + 1, c, RY - 2, 0)
    }
    // two vertical connector corridors linking concourse to perimeter
    const conns = [fx(0.27), fx(0.73)]
    for (const cc of conns) this.rect(cc - 1, 1, cc + 1, RY - 2, 1)
    // atrium core (island in the concourse — routed around)
    this.rect(fx(0.47), conT + 3, fx(0.53), conB - 3, 0)
    // exits (priority order), width from P.exitW
    const hw = this.P.exitW + 1
    const midC = Math.round((conT + conB) / 2)
    const cand: [string, number, number][] = [
      ['V', CX - 1, midC],
      ['V', 0, midC], // right / left concourse ends
      ['H', RY - 1, conns[0]],
      ['H', 0, conns[1]], // bottom-left / top-right connector
      ['H', 0, conns[0]],
      ['H', RY - 1, conns[1]], // top-left / bottom-right connector
    ]
    for (let i = 0; i < this.P.nExits && i < cand.length; i++) {
      const [o, fixed, center] = cand[i]
      if (o === 'V') {
        for (let r = center - hw; r <= center + hw; r++)
          if (r > 0 && r < RY - 1) this.grid[this.idx(fixed, r)] = 2
      } else {
        for (let c = center - hw; c <= center + hw; c++)
          if (c > 0 && c < CX - 1) this.grid[this.idx(c, fixed)] = 2
      }
    }
    // realistic start clusters: atrium sides, concourse ends, a couple of shops
    this.hotspots = ([
      [fx(0.42), midC],
      [fx(0.58), midC],
      [fx(0.15), midC],
      [fx(0.85), midC],
      [fx(0.27), fy(0.22)],
      [fx(0.73), fy(0.78)],
      [fx(0.5), fy(0.2)],
    ] as [number, number][])
      .map(([c, r]) => ({ x: c * CELL, y: r * CELL }))
      .filter((h) => {
        const c = (h.x / CELL) | 0
        const r = (h.y / CELL) | 0
        return c > 0 && r > 0 && c < this.cols && r < this.rows && this.grid[this.idx(c, r)] === 1
      })
  }

  /** Multi-source BFS flood-fill: distance from every cell to the nearest exit. */
  computeField() {
    this.field.fill(Infinity)
    const q: number[] = []
    let head = 0
    for (let i = 0; i < this.grid.length; i++)
      if (this.grid[i] === 2) {
        this.field[i] = 0
        q.push(i)
      }
    while (head < q.length) {
      const i = q[head++]
      const c = i % this.cols
      const r = (i / this.cols) | 0
      const d = this.field[i] + 1
      const nb: [number, number][] = [
        [c + 1, r],
        [c - 1, r],
        [c, r + 1],
        [c, r - 1],
      ]
      for (const [nc, nr] of nb) {
        if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) continue
        const ni = this.idx(nc, nr)
        if ((this.grid[ni] === 1 || this.grid[ni] === 2) && d < this.field[ni]) {
          this.field[ni] = d
          q.push(ni)
        }
      }
    }
  }

  private walkAt(x: number, y: number) {
    const c = (x / CELL) | 0
    const r = (y / CELL) | 0
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return false
    const v = this.grid[this.idx(c, r)]
    return v === 1 || v === 2
  }

  private reachableRnd() {
    for (let t = 0; t < 80; t++) {
      const c = 1 + Math.floor(Math.random() * (this.cols - 2))
      const r = 1 + Math.floor(Math.random() * (this.rows - 2))
      const i = this.idx(c, r)
      if (this.grid[i] === 1 && isFinite(this.field[i]) && this.field[i] > 5)
        return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 }
    }
    return null
  }

  spawn(n: number) {
    for (let k = 0; k < n; k++) {
      let pos: { x: number; y: number } | null = null
      if (this.hotspots.length && Math.random() < 0.66) {
        const h = this.hotspots[Math.floor(Math.random() * this.hotspots.length)]
        for (let t = 0; t < 12; t++) {
          const x = h.x + (Math.random() - 0.5) * 70
          const y = h.y + (Math.random() - 0.5) * 70
          const fi = ((y / CELL) | 0) * this.cols + ((x / CELL) | 0)
          if (this.walkAt(x, y) && isFinite(this.field[fi])) {
            pos = { x, y }
            break
          }
        }
      }
      if (!pos) pos = this.reachableRnd()
      if (!pos) continue
      this.agents.push({ x: pos.x, y: pos.y, vx: 0, vy: 0 })
      this.total++
    }
  }

  reset() {
    this.agents = []
    this.evac = 0
    this.total = 0
    this.frames = 0
    this.clearFrame = 0
    this.flowWin = []
    this.buildPlan()
    this.computeField()
    this.spawn(this.P.crowd)
  }

  step() {
    const panic = this.P.panic
    const speed = 0.75 + panic * 1.35
    const sepK = 0.62 - panic * 0.42
    const gamma = 2.2
    this.dens.fill(0)
    for (const a of this.agents) {
      const c = (a.x / CELL) | 0
      const r = (a.y / CELL) | 0
      if (c >= 0 && r >= 0 && c < this.cols && r < this.rows) this.dens[this.idx(c, r)]++
    }
    let evacuatedThis = 0
    for (let k = this.agents.length - 1; k >= 0; k--) {
      const a = this.agents[k]
      const c = (a.x / CELL) | 0
      const r = (a.y / CELL) | 0
      if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) {
        this.agents.splice(k, 1)
        continue
      }
      const ci = this.idx(c, r)
      if (this.grid[ci] === 2) {
        this.agents.splice(k, 1)
        this.evac++
        evacuatedThis++
        continue
      }
      // pick the neighbour cell minimizing field + congestion
      let best = Infinity
      let tx = a.x
      let ty = a.y
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue
          const nc = c + dc
          const nr = r + dr
          if (!(nc >= 0 && nr >= 0 && nc < this.cols && nr < this.rows)) continue
          const v = this.grid[this.idx(nc, nr)]
          if (!(v === 1 || v === 2)) continue
          if (dc && dr) {
            const s1 = this.grid[this.idx(c + dc, r)]
            const s2 = this.grid[this.idx(c, r + dr)]
            if (!((s1 === 1 || s1 === 2) && (s2 === 1 || s2 === 2))) continue // no corner-cutting
          }
          const ni = this.idx(nc, nr)
          const sc = this.field[ni] + gamma * this.dens[ni]
          if (sc < best) {
            best = sc
            tx = nc * CELL + CELL / 2
            ty = nr * CELL + CELL / 2
          }
        }
      let fx = tx - a.x
      let fy = ty - a.y
      const d = Math.hypot(fx, fy) || 1
      fx = (fx / d) * speed
      fy = (fy / d) * speed
      for (const b of this.agents) {
        if (b === a) continue
        const ox = a.x - b.x
        const oy = a.y - b.y
        const dd = ox * ox + oy * oy
        if (dd > 0 && dd < 64) {
          const inv = 1 / Math.sqrt(dd)
          fx += ox * inv * sepK
          fy += oy * inv * sepK
        }
      }
      a.vx = a.vx * 0.72 + fx * 0.28
      a.vy = a.vy * 0.72 + fy * 0.28
      const sp = Math.hypot(a.vx, a.vy)
      const mx = speed * 1.35
      if (sp > mx) {
        a.vx = (a.vx / sp) * mx
        a.vy = (a.vy / sp) * mx
      }
      const nx = a.x + a.vx
      const ny = a.y + a.vy
      if (this.walkAt(nx, a.y)) a.x = nx
      else a.vx *= -0.2
      if (this.walkAt(a.x, ny)) a.y = ny
      else a.vy *= -0.2
    }
    this.frames++
    if (this.agents.length > 0) this.clearFrame = this.frames
    this.flowWin.push(evacuatedThis)
    if (this.flowWin.length > 60) this.flowWin.shift()
  }

  draw(ctx: CanvasRenderingContext2D, opts: { heat?: boolean; hotspots?: boolean } = {}) {
    const { W, H, cols, rows } = this
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0910'
    ctx.fillRect(0, 0, W, H)
    if (opts.heat) {
      let mx = 0
      for (let i = 0; i < this.field.length; i++) if (isFinite(this.field[i]) && this.field[i] > mx) mx = this.field[i]
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const i = this.idx(c, r)
          if (this.grid[i] === 1 && isFinite(this.field[i])) {
            const t = this.field[i] / (mx || 1)
            ctx.fillStyle = `hsla(${205 - t * 150},72%,55%,.15)`
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL)
          }
        }
    }
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const v = this.grid[this.idx(c, r)]
        if (v === 0) {
          ctx.fillStyle = '#2c2937'
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL)
        } else if (v === 2) {
          ctx.fillStyle = '#39d98a'
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL)
        }
      }
    // start hotspots (fade over ~2.5s)
    if (opts.hotspots !== false && this.frames < 150) {
      const al = (1 - this.frames / 150) * 0.5
      ctx.strokeStyle = `rgba(242,140,60,${al})`
      ctx.lineWidth = 2
      for (const h of this.hotspots) {
        ctx.beginPath()
        ctx.arc(h.x, h.y, 26, 0, 7)
        ctx.stroke()
      }
    }
    // agents — blue → red by local congestion (the "faster-is-slower" signature)
    for (const a of this.agents) {
      const c = (a.x / CELL) | 0
      const r = (a.y / CELL) | 0
      let dd = 0
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nc = c + dc
          const nr = r + dr
          if (nc >= 0 && nr >= 0 && nc < cols && nr < rows) dd += this.dens[this.idx(nc, nr)]
        }
      const cong = clamp((dd - 3) / 6, 0, 1)
      ctx.fillStyle =
        cong <= 0
          ? this.accent
          : `rgb(${(77 + (242 - 77) * cong) | 0},${(141 + (104 - 141) * cong) | 0},${(240 + (63 - 240) * cong) | 0})`
      ctx.beginPath()
      ctx.arc(a.x, a.y, 3, 0, 7)
      ctx.fill()
    }
  }

  /** Toggle a wall block under a pixel coordinate; returns true if the map changed. */
  toggleWallAt(px: number, py: number) {
    const c = (px / CELL) | 0
    const r = (py / CELL) | 0
    if (c <= 0 || r <= 0 || c >= this.cols - 1 || r >= this.rows - 1) return false
    const i = this.idx(c, r)
    if (this.grid[i] === 1) this.grid[i] = 0
    else if (this.grid[i] === 0) this.grid[i] = 1
    else return false // don't paint over exits
    this.computeField()
    return true
  }

  stats() {
    return {
      evac: this.evac,
      total: this.total,
      clear: Math.round(this.clearFrame / 60),
      flow: Math.round(this.flowWin.reduce((s, x) => s + x, 0)),
      remaining: this.agents.length,
    }
  }
}
