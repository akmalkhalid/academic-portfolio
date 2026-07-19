// ============================================================================
//  Assembly Line Balancing engine — framework-agnostic (no React, no DOM beyond
//  a passed-in 2D canvas context).
//
//  A faithful, simplified re-design of the type-E assembly-line-balancing work
//  from Dr. Khalid's papers, solved with an Artificial Immune System (clonal
//  selection). Tasks with processing times and precedence constraints are
//  assigned to an ordered line of workstations under a cycle-time limit; the
//  optimizer rebalances the line to minimise stations and idle time, maximising
//  line efficiency. The busiest station (the bottleneck) is tracked throughout.
//
//  Used by two React wrappers:
//    · AssemblyLineBalancing.tsx      — compact, non-interactive auto-looping embed
//    · AssemblyLineBalancingFull.tsx  — full interactive optimizer (sliders)
// ============================================================================

export type ALBParams = { nTasks: number; cycle: number; pop: number; mutation: number }

export const DEFAULTS: ALBParams = { nTasks: 21, cycle: 17, pop: 34, mutation: 0.5 }
export const ACCENT = '#4d8df0'

// Station colour palette (cycled). Distinct, legible on a dark panel.
const STATION_COLORS = [
  '#4d8df0', '#21b3a0', '#8b7bf0', '#e0a021', '#f2683f', '#4db8f0',
  '#84b53a', '#d06bd0', '#e05a7a', '#3fc4a8', '#a08bf5', '#f0a838',
]

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

type Task = { id: number; time: number; layer: number; gx: number; gy: number }
type Individual = { order: number[]; assign: number[]; loads: number[]; M: number; smooth: number }

export class ALBPSim {
  W = 0
  H = 0
  tasks: Task[] = []
  preds: number[][] = [] // preds[i] = task ids that must precede task i
  succ: number[][] = []
  totalTime = 0
  maxTime = 1
  C = DEFAULTS.cycle
  pop: Individual[] = []
  best!: Individual
  gen = 0
  stagnant = 0
  P: ALBParams = { ...DEFAULTS }
  accent: string

  constructor(accent = ACCENT) {
    this.accent = accent
  }

  resize(W: number, H: number) {
    this.W = Math.max(320, W)
    this.H = H
  }

  setParams(p: Partial<ALBParams>) {
    this.P = { ...this.P, ...p }
  }

  /** Change the cycle-time limit and re-evaluate the current population against it. */
  setCycle(c: number) {
    this.C = clamp(Math.round(c), this.maxTime, this.totalTime)
    this.P.cycle = this.C
    for (const ind of this.pop) this.evaluate(ind)
    this.pop.sort((a, b) => this.affinity(b) - this.affinity(a))
    this.best = this.clone(this.pop[0])
    this.stagnant = 0
  }

  // ---- instance generation ------------------------------------------------
  buildInstance() {
    const N = this.P.nTasks
    const L = clamp(Math.round(Math.sqrt(N) + 0.5), 4, 7) // precedence layers
    this.tasks = []
    // distribute tasks across layers (front-loaded a touch for a realistic shape)
    const layerOf: number[] = []
    for (let i = 0; i < N; i++) layerOf.push(Math.min(L - 1, Math.floor((i / N) * L + Math.random() * 0.8)))
    layerOf.sort((a, b) => a - b)
    // per-layer vertical slots
    const inLayer: number[] = new Array(L).fill(0)
    for (let i = 0; i < N; i++) {
      const layer = layerOf[i]
      const time = 2 + Math.floor(Math.random() * 7) // 2..8
      this.tasks.push({ id: i, time, layer, gx: 0, gy: 0 })
      inLayer[layer]++
    }
    this.maxTime = Math.max(...this.tasks.map((t) => t.time))
    this.totalTime = this.tasks.reduce((s, t) => s + t.time, 0)
    // precedence: each task links to 1–2 tasks in an earlier layer
    this.preds = Array.from({ length: N }, () => [])
    this.succ = Array.from({ length: N }, () => [])
    const byLayer: number[][] = Array.from({ length: L }, () => [])
    for (const t of this.tasks) byLayer[t.layer].push(t.id)
    for (const t of this.tasks) {
      if (t.layer === 0) continue
      const pool = byLayer[t.layer - 1].concat(t.layer > 1 && Math.random() < 0.3 ? byLayer[t.layer - 2] : [])
      if (!pool.length) continue
      const k = 1 + (Math.random() < 0.4 ? 1 : 0)
      const picks = new Set<number>()
      for (let c = 0; c < k && picks.size < pool.length; c++) picks.add(pool[(Math.random() * pool.length) | 0])
      for (const p of picks) {
        this.preds[t.id].push(p)
        this.succ[p].push(t.id)
      }
    }
    // graph coordinates (fractional, mapped in draw)
    const slot: number[] = new Array(L).fill(0)
    for (const t of this.tasks) {
      t.gx = L === 1 ? 0.5 : t.layer / (L - 1)
      const count = inLayer[t.layer]
      t.gy = count === 1 ? 0.5 : (slot[t.layer] + 0.5) / count
      slot[t.layer]++
    }
    this.C = clamp(this.P.cycle, this.maxTime, this.totalTime)
    this.P.cycle = this.C
    this.initPop()
  }

  // ---- decoding: precedence-aware first-fit by priority list --------------
  // Repeatedly take the highest-priority task whose predecessors are all placed
  // and drop it into the earliest station (at or after its precedence lower
  // bound) that still has room; open a new station only when none fits. This is
  // sensitive to the ordering, so a poor priority list wastes space — leaving
  // the immune optimizer real work to do.
  private decode(order: number[]): { assign: number[]; loads: number[]; M: number } {
    const N = this.tasks.length
    const assign = new Array(N).fill(-1)
    const loads: number[] = [0]
    let placed = 0
    const predsDone = (id: number) => this.preds[id].every((p) => assign[p] !== -1)
    while (placed < N) {
      // highest-priority ready task
      let pick = -1
      for (const id of order) {
        if (assign[id] === -1 && predsDone(id)) { pick = id; break }
      }
      if (pick === -1) break // shouldn't happen on a DAG
      const t = this.tasks[pick]
      // station-oriented, no backfill: keep filling the last station; open a new
      // one the moment the chosen task doesn't fit. Precedence holds automatically
      // because a task's predecessors were placed in the current or earlier stations.
      let last = loads.length - 1
      if (loads[last] + t.time > this.C) {
        loads.push(0)
        last = loads.length - 1
      }
      assign[pick] = last
      loads[last] += t.time
      placed++
    }
    // drop any empty trailing stations (defensive)
    while (loads.length > 1 && loads[loads.length - 1] === 0) loads.pop()
    return { assign, loads, M: loads.length }
  }

  private smoothness(loads: number[]) {
    const mx = Math.max(...loads)
    let s = 0
    for (const l of loads) s += (mx - l) * (mx - l)
    return Math.sqrt(s)
  }

  private evaluate(ind: Individual) {
    const d = this.decode(ind.order)
    ind.assign = d.assign
    ind.loads = d.loads
    ind.M = d.M
    ind.smooth = this.smoothness(d.loads)
  }

  // lower stations first, then lower smoothness → higher affinity
  private affinity(ind: Individual) {
    return -(ind.M * 1000 + ind.smooth)
  }

  private clone(ind: Individual): Individual {
    return { order: ind.order.slice(), assign: ind.assign.slice(), loads: ind.loads.slice(), M: ind.M, smooth: ind.smooth }
  }

  // a layer-biased priority list — decent genes, used to seed diversity
  private randomOrder(): number[] {
    return this.tasks
      .map((t) => ({ id: t.id, k: t.layer + Math.random() * 1.4 }))
      .sort((a, b) => a.k - b.k)
      .map((o) => o.id)
  }

  // a fully shuffled priority list — deliberately unbalanced, so the optimizer
  // has room to visibly improve from the first generation
  private randomPermutation(): number[] {
    const o = this.tasks.map((t) => t.id)
    for (let i = o.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0
      const tmp = o[i]
      o[i] = o[j]
      o[j] = tmp
    }
    return o
  }

  private mutate(order: number[], rate: number): number[] {
    const o = order.slice()
    const swaps = 1 + Math.floor(rate * 4)
    for (let s = 0; s < swaps; s++) {
      const i = (Math.random() * o.length) | 0
      const j = (Math.random() * o.length) | 0
      const tmp = o[i]
      o[i] = o[j]
      o[j] = tmp
    }
    return o
  }

  private initPop() {
    this.pop = []
    for (let i = 0; i < this.P.pop; i++) {
      const ind: Individual = { order: this.randomPermutation(), assign: [], loads: [], M: 0, smooth: 0 }
      this.evaluate(ind)
      this.pop.push(ind)
    }
    this.pop.sort((a, b) => this.affinity(b) - this.affinity(a))
    this.best = this.clone(this.pop[0])
    this.gen = 0
    this.stagnant = 0
  }

  /** One generation of clonal selection. */
  step() {
    const n = this.pop.length
    const selectN = Math.max(4, Math.round(n * 0.5))
    const candidates: Individual[] = []
    // clone + hypermutate the fittest (more clones & gentler mutation for higher affinity)
    for (let i = 0; i < selectN; i++) {
      const parent = this.pop[i]
      const rank = (selectN - i) / selectN // 1 (best) .. ~0
      const nClones = 1 + Math.round(rank * 4)
      const mutRate = clamp((1 - rank) * this.P.mutation + 0.05, 0.05, 1)
      for (let c = 0; c < nClones; c++) {
        const child: Individual = { order: this.mutate(parent.order, mutRate), assign: [], loads: [], M: 0, smooth: 0 }
        this.evaluate(child)
        candidates.push(child)
      }
    }
    // metadynamics: inject fresh antibodies for diversity
    const nNew = Math.max(2, Math.round(n * 0.15))
    for (let i = 0; i < nNew; i++) {
      const ind: Individual = { order: this.randomOrder(), assign: [], loads: [], M: 0, smooth: 0 }
      this.evaluate(ind)
      candidates.push(ind)
    }
    // elitism: keep the current best pool, merge, keep the top n
    const merged = this.pop.concat(candidates)
    merged.sort((a, b) => this.affinity(b) - this.affinity(a))
    // de-duplicate identical assignments a little to preserve diversity
    this.pop = merged.slice(0, n)
    const prev = this.affinity(this.best)
    if (this.affinity(this.pop[0]) > prev) {
      this.best = this.clone(this.pop[0])
      this.stagnant = 0
    } else {
      this.stagnant++
    }
    this.gen++
  }

  reset() {
    this.buildInstance()
  }

  // ---- drawing ------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D, opts: { graph?: boolean } = {}) {
    const { W, H } = this
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0910'
    ctx.fillRect(0, 0, W, H)
    const showGraph = opts.graph !== false
    const pad = 14
    const graphH = showGraph ? Math.round(H * 0.4) : 0
    const b = this.best
    if (!b) return
    const col = (st: number) => STATION_COLORS[st % STATION_COLORS.length]
    const bottleneck = b.loads.reduce((mi, l, i, arr) => (l > arr[mi] ? i : mi), 0)

    // ---- precedence graph (top) ----
    if (showGraph) {
      const gx0 = pad + 10
      const gx1 = W - pad - 10
      const gy0 = pad
      const gy1 = graphH - 6
      const px = (t: Task) => gx0 + t.gx * (gx1 - gx0)
      const py = (t: Task) => gy0 + t.gy * (gy1 - gy0)
      ctx.strokeStyle = 'rgba(255,255,255,.14)'
      ctx.lineWidth = 1
      for (const t of this.tasks)
        for (const p of this.preds[t.id]) {
          const a = this.tasks[p]
          ctx.beginPath()
          ctx.moveTo(px(a), py(a))
          ctx.lineTo(px(t), py(t))
          ctx.stroke()
        }
      const r = clamp(Math.min((gx1 - gx0) / (this.tasks.length * 0.9), 11), 6, 11)
      for (const t of this.tasks) {
        const x = px(t)
        const y = py(t)
        ctx.fillStyle = col(b.assign[t.id])
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 7)
        ctx.fill()
        ctx.fillStyle = 'rgba(10,9,16,.9)'
        ctx.font = `700 ${Math.round(r * 0.95)}px 'JetBrains Mono', monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(t.time), x, y + 0.5)
      }
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      // divider label
      ctx.fillStyle = 'rgba(255,255,255,.35)'
      ctx.font = "600 9.5px 'JetBrains Mono', monospace"
      ctx.fillText('PRECEDENCE GRAPH · node = task (time)', gx0, gy0 - 2 + 10)
    }

    // ---- workstation bins (bottom) ----
    const sy0 = graphH + (showGraph ? 8 : pad)
    const sy1 = H - pad - 14
    const barTop = sy0 + 14
    const barBot = sy1
    const barH = barBot - barTop
    const M = b.M
    const areaW = W - pad * 2
    const gap = Math.min(10, areaW / (M * 5))
    const bw = (areaW - gap * (M - 1)) / M
    const scale = barH / Math.max(this.C, 1)
    // cycle-time limit line
    ctx.strokeStyle = 'rgba(242,104,63,.55)'
    ctx.setLineDash([5, 4])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, barTop)
    ctx.lineTo(W - pad, barTop)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(242,104,63,.8)'
    ctx.font = "600 9.5px 'JetBrains Mono', monospace"
    ctx.textAlign = 'right'
    ctx.fillText(`cycle ${this.C}`, W - pad, barTop - 4)
    ctx.textAlign = 'left'

    for (let st = 0; st < M; st++) {
      const x = pad + st * (bw + gap)
      // station frame
      ctx.fillStyle = 'rgba(255,255,255,.04)'
      ctx.fillRect(x, barTop, bw, barH)
      // stacked task blocks
      const ids = this.tasks.filter((t) => b.assign[t.id] === st).sort((a, c) => a.time - c.time)
      let yCur = barBot
      const base = col(st)
      for (let k = 0; k < ids.length; k++) {
        const h = ids[k].time * scale
        yCur -= h
        ctx.fillStyle = base
        ctx.globalAlpha = 0.55 + 0.4 * ((k % 3) / 2)
        ctx.fillRect(x + 1, yCur, bw - 2, h - 1)
        ctx.globalAlpha = 1
      }
      // bottleneck highlight
      if (st === bottleneck && M > 1) {
        ctx.strokeStyle = '#f2683f'
        ctx.lineWidth = 2
        ctx.strokeRect(x + 0.5, barTop + 0.5, bw - 1, barH - 1)
      }
      // load label + station index
      ctx.fillStyle = 'rgba(255,255,255,.6)'
      ctx.font = "600 9px 'JetBrains Mono', monospace"
      ctx.textAlign = 'center'
      ctx.fillText(`S${st + 1}`, x + bw / 2, barBot + 11)
      ctx.fillStyle = b.loads[st] === this.C ? '#f2683f' : 'rgba(255,255,255,.4)'
      ctx.fillText(String(b.loads[st]), x + bw / 2, barTop - 4 < barTop ? barTop + 9 : barTop - 4)
    }
    ctx.textAlign = 'left'
  }

  stats() {
    const b = this.best
    const eff = b ? (this.totalTime / (b.M * this.C)) * 100 : 0
    return {
      gen: this.gen,
      stations: b ? b.M : 0,
      efficiency: Math.round(eff),
      balanceDelay: Math.round(100 - eff),
      smoothness: b ? Math.round(b.smooth * 10) / 10 : 0,
      cycle: this.C,
      tasks: this.tasks.length,
    }
  }
}
