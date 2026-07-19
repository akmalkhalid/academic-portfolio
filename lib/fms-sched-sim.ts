// ============================================================================
//  Distributed production-scheduling engine — framework-agnostic (no React, no
//  DOM beyond a passed-in 2D canvas context).
//
//  A faithful, simplified re-design of the flexible-manufacturing-system
//  distributed-scheduling work (subject to machine maintenance) from Dr. Khalid's
//  papers, solved with an Artificial Immune System (clonal selection). A set of
//  jobs, each a chain of operations routed across machines, must be scheduled so
//  every machine runs one operation at a time and avoids its maintenance window;
//  the optimizer reorders operations to minimise the makespan (the time the last
//  job finishes). Rendered as a Gantt chart.
//
//  Used by two React wrappers:
//    · ProductionScheduling.tsx      — compact, non-interactive auto-looping embed
//    · ProductionSchedulingFull.tsx  — full interactive optimizer (sliders)
// ============================================================================

export type FMSParams = { nJobs: number; nMachines: number; maintenance: boolean; pop: number; mutation: number }

export const DEFAULTS: FMSParams = { nJobs: 6, nMachines: 5, maintenance: true, pop: 34, mutation: 0.5 }
export const ACCENT = '#21b3a0'

const JOB_COLORS = [
  '#21b3a0', '#4d8df0', '#8b7bf0', '#e0a021', '#f2683f', '#84b53a',
  '#d06bd0', '#4db8f0', '#e05a7a', '#3fc4a8', '#a08bf5', '#f0a838',
]

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

type Op = { job: number; k: number; machine: number; time: number }
type Placed = { job: number; machine: number; start: number; end: number }
type Individual = { seq: number[]; placed: Placed[]; makespan: number }

export class FMSSim {
  W = 0
  H = 0
  J = DEFAULTS.nJobs
  M = DEFAULTS.nMachines
  routing: number[][] = [] // routing[j] = machine order for job j
  times: number[][] = [] // times[j][k] = processing time of job j's k-th op
  maint: { start: number; dur: number }[] = [] // per machine (dur 0 = none)
  totalWork = 0
  horizon = 1 // x-axis scale (worst makespan seen at gen 0)
  pop: Individual[] = []
  best!: Individual
  gen = 0
  stagnant = 0
  P: FMSParams = { ...DEFAULTS }
  accent: string

  constructor(accent = ACCENT) {
    this.accent = accent
  }

  resize(W: number, H: number) {
    this.W = Math.max(320, W)
    this.H = H
  }

  setParams(p: Partial<FMSParams>) {
    this.P = { ...this.P, ...p }
  }

  // ---- instance generation ------------------------------------------------
  buildInstance() {
    this.J = this.P.nJobs
    this.M = this.P.nMachines
    this.routing = []
    this.times = []
    this.totalWork = 0
    for (let j = 0; j < this.J; j++) {
      // a random routing (each job visits every machine once, in its own order)
      const order = Array.from({ length: this.M }, (_, m) => m)
      for (let i = order.length - 1; i > 0; i--) {
        const r = (Math.random() * (i + 1)) | 0
        const t = order[i]; order[i] = order[r]; order[r] = t
      }
      this.routing.push(order)
      const t: number[] = []
      for (let k = 0; k < this.M; k++) {
        const p = 3 + Math.floor(Math.random() * 8) // 3..10
        t.push(p)
        this.totalWork += p
      }
      this.times.push(t)
    }
    // maintenance window per machine, placed mid-schedule
    const perMachine = this.totalWork / this.M
    this.maint = []
    for (let m = 0; m < this.M; m++) {
      if (this.P.maintenance && Math.random() < 0.7) {
        const dur = Math.round(perMachine * (0.1 + Math.random() * 0.12))
        const start = Math.round(perMachine * (0.25 + Math.random() * 0.4))
        this.maint.push({ start, dur })
      } else {
        this.maint.push({ start: 0, dur: 0 })
      }
    }
    this.initPop()
    this.horizon = Math.max(this.best.makespan, 1)
  }

  // operation list: each job id appears M times; k-th occurrence = job's k-th op
  private baseSequence(): number[] {
    const seq: number[] = []
    for (let j = 0; j < this.J; j++) for (let k = 0; k < this.M; k++) seq.push(j)
    return seq
  }

  private shuffle(seq: number[]): number[] {
    const o = seq.slice()
    for (let i = o.length - 1; i > 0; i--) {
      const r = (Math.random() * (i + 1)) | 0
      const t = o[i]; o[i] = o[r]; o[r] = t
    }
    return o
  }

  // ---- decode: earliest-feasible placement, avoiding maintenance ----------
  private decode(seq: number[]): { placed: Placed[]; makespan: number } {
    const opIndex = new Array(this.J).fill(0)
    const jobFree = new Array(this.J).fill(0)
    const machFree = new Array(this.M).fill(0)
    const placed: Placed[] = []
    let makespan = 0
    for (const j of seq) {
      const k = opIndex[j]
      const m = this.routing[j][k]
      const proc = this.times[j][k]
      let start = Math.max(jobFree[j], machFree[m])
      const mw = this.maint[m]
      if (mw.dur > 0) {
        const ms = mw.start
        const me = mw.start + mw.dur
        // if the op would overlap the maintenance window, push it to after
        if (start < me && start + proc > ms) start = me
      }
      const end = start + proc
      placed.push({ job: j, machine: m, start, end })
      jobFree[j] = end
      machFree[m] = end
      opIndex[j] = k + 1
      if (end > makespan) makespan = end
    }
    return { placed, makespan }
  }

  private evaluate(ind: Individual) {
    const d = this.decode(ind.seq)
    ind.placed = d.placed
    ind.makespan = d.makespan
  }

  private affinity(ind: Individual) {
    return -ind.makespan
  }

  private clone(ind: Individual): Individual {
    return { seq: ind.seq.slice(), placed: ind.placed.map((p) => ({ ...p })), makespan: ind.makespan }
  }

  private mutate(seq: number[], rate: number): number[] {
    const o = seq.slice()
    const swaps = 1 + Math.floor(rate * 5)
    for (let s = 0; s < swaps; s++) {
      const i = (Math.random() * o.length) | 0
      const j = (Math.random() * o.length) | 0
      const t = o[i]; o[i] = o[j]; o[j] = t
    }
    return o
  }

  private initPop() {
    const base = this.baseSequence()
    this.pop = []
    for (let i = 0; i < this.P.pop; i++) {
      const ind: Individual = { seq: this.shuffle(base), placed: [], makespan: 0 }
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
    for (let i = 0; i < selectN; i++) {
      const parent = this.pop[i]
      const rank = (selectN - i) / selectN
      const nClones = 1 + Math.round(rank * 4)
      const mutRate = clamp((1 - rank) * this.P.mutation + 0.05, 0.05, 1)
      for (let c = 0; c < nClones; c++) {
        const child: Individual = { seq: this.mutate(parent.seq, mutRate), placed: [], makespan: 0 }
        this.evaluate(child)
        candidates.push(child)
      }
    }
    const nNew = Math.max(2, Math.round(n * 0.15))
    const base = this.baseSequence()
    for (let i = 0; i < nNew; i++) {
      const ind: Individual = { seq: this.shuffle(base), placed: [], makespan: 0 }
      this.evaluate(ind)
      candidates.push(ind)
    }
    const merged = this.pop.concat(candidates)
    merged.sort((a, b) => this.affinity(b) - this.affinity(a))
    this.pop = merged.slice(0, n)
    if (this.affinity(this.pop[0]) > this.affinity(this.best)) {
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
  draw(ctx: CanvasRenderingContext2D) {
    const { W, H } = this
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0910'
    ctx.fillRect(0, 0, W, H)
    const b = this.best
    if (!b) return
    const col = (j: number) => JOB_COLORS[j % JOB_COLORS.length]

    const padL = 40
    const padR = 16
    const padT = 26
    const padB = 20
    const plotW = W - padL - padR
    const plotH = H - padT - padB
    const rowH = plotH / this.M
    const scale = plotW / this.horizon
    const x0 = padL

    // machine rows + labels + maintenance windows
    ctx.textBaseline = 'middle'
    for (let m = 0; m < this.M; m++) {
      const y = padT + m * rowH
      ctx.fillStyle = m % 2 === 0 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.015)'
      ctx.fillRect(x0, y, plotW, rowH - 2)
      ctx.fillStyle = 'rgba(255,255,255,.5)'
      ctx.font = "600 10px 'JetBrains Mono', monospace"
      ctx.textAlign = 'right'
      ctx.fillText(`M${m + 1}`, x0 - 8, y + rowH / 2)
      // maintenance
      const mw = this.maint[m]
      if (mw.dur > 0) {
        const mx = x0 + mw.start * scale
        const mwpx = mw.dur * scale
        ctx.fillStyle = 'rgba(180,180,190,.18)'
        ctx.fillRect(mx, y + 2, mwpx, rowH - 6)
        // hatch
        ctx.strokeStyle = 'rgba(210,210,220,.28)'
        ctx.lineWidth = 1
        for (let hx = mx - rowH; hx < mx + mwpx; hx += 6) {
          ctx.beginPath()
          ctx.moveTo(Math.max(mx, hx), y + 2 + Math.max(0, mx - hx))
          ctx.lineTo(Math.min(mx + mwpx, hx + rowH), y + 2 + Math.min(rowH - 6, mx + mwpx - hx))
          ctx.stroke()
        }
      }
    }

    // operation bars
    ctx.textAlign = 'center'
    for (const p of b.placed) {
      const y = padT + p.machine * rowH
      const x = x0 + p.start * scale
      const w = Math.max(2, (p.end - p.start) * scale)
      ctx.fillStyle = col(p.job)
      ctx.globalAlpha = 0.9
      ctx.fillRect(x + 0.5, y + 3, w - 1, rowH - 8)
      ctx.globalAlpha = 1
      if (w > 14) {
        ctx.fillStyle = 'rgba(10,9,16,.85)'
        ctx.font = "700 9px 'JetBrains Mono', monospace"
        ctx.fillText(`J${p.job + 1}`, x + w / 2, y + rowH / 2)
      }
    }

    // makespan line
    const mkx = x0 + b.makespan * scale
    ctx.strokeStyle = this.accent
    ctx.setLineDash([4, 3])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(mkx, padT - 4)
    ctx.lineTo(mkx, H - padB + 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = this.accent
    ctx.font = "700 10px 'JetBrains Mono', monospace"
    ctx.textAlign = mkx > W - 60 ? 'right' : 'left'
    ctx.fillText(`makespan ${b.makespan}`, mkx > W - 60 ? mkx - 4 : mkx + 5, padT - 12 < 6 ? padT + 6 : 12)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  stats() {
    const b = this.best
    const util = b && b.makespan > 0 ? (this.totalWork / (this.M * b.makespan)) * 100 : 0
    return {
      gen: this.gen,
      makespan: b ? b.makespan : 0,
      utilization: Math.round(util),
      jobs: this.J,
      machines: this.M,
    }
  }
}
