// ============================================================================
//  Game-refinement self-play engine — framework-agnostic (no React, no DOM
//  beyond a passed-in 2D canvas context).
//
//  A faithful, simplified re-design of the game-refinement / "motion in mind"
//  work from Dr. Khalid's papers. An abstract two-sided game plays itself many
//  times; from the emergent average branching factor B and game length D we
//  compute the game-refinement value GR = sqrt(B)/D and locate it against the
//  "comfortable zone" (~0.07–0.08) where sophisticated, engaging games cluster.
//  The averaged game-progress curve yields its acceleration ("thrill") and its
//  jerk (the addiction signature). Tune the game and watch its value drift
//  toward — or past — the zone.
//
//  Used by two React wrappers:
//    · GameRefinement.tsx      — compact, non-interactive auto-looping embed
//    · GameRefinementFull.tsx  — full interactive tuner (sliders)
// ============================================================================

export type GRParams = { branching: number; pace: number; balance: number }

export const DEFAULTS: GRParams = { branching: 32, pace: 0.58, balance: 0.6 }
export const ACCENT = '#f2683f'

// Representative game-refinement values from the literature (illustrative
// landmarks — exact figures vary by dataset and paper).
export const LANDMARKS = [
  { name: 'Basketball', gr: 0.073 },
  { name: 'Soccer', gr: 0.073 },
  { name: 'Chess', gr: 0.074 },
  { name: 'Table tennis', gr: 0.077 },
  { name: 'Go', gr: 0.078 },
]
export const ZONE: [number, number] = [0.07, 0.08]
export const AXIS_MAX = 0.16
const GRID = 26 // resolution of the averaged progress curve

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

type GameResult = { D: number; B: number; adv: number[]; cert: number[] }

export class GRSim {
  W = 0
  H = 0
  P: GRParams = { ...DEFAULTS }
  accent: string
  window: { D: number; B: number }[] = [] // rolling recent games
  progress: number[] = new Array(GRID).fill(0) // EMA of certainty over normalized time
  live: GameResult | null = null // the game currently being animated
  playhead = 0
  frames = 0
  gr = 0
  dAvg = 0
  bAvg = 0
  thrill = 0
  addiction = 0

  constructor(accent = ACCENT) {
    this.accent = accent
  }

  resize(W: number, H: number) {
    this.W = Math.max(320, W)
    this.H = H
  }

  setParams(p: Partial<GRParams>) {
    this.P = { ...this.P, ...p }
  }

  // ---- one self-play game --------------------------------------------------
  // A contest between two players. One side is favored (by 1 − balance); a net
  // drift set by `pace` carries the game toward a decision, while `balance`
  // adds see-saw wobble that keeps it close and can force late swings. `pace`
  // mainly sets the game length D; `balance` mainly shapes the tension curve.
  private playGame(): GameResult {
    const maxMoves = 140
    const { branching, pace, balance } = this.P
    const drift = 0.006 + pace * 0.032 // net progress toward a decision per move
    const wobble = 0.02 + balance * 0.075 // see-saw noise (closeness / late swings)
    const strength = 1 - balance // 0 = perfectly even, 1 = one side dominant
    const favored = Math.random() < 0.5 ? 1 : -1
    let adv = 0 // advantage in [-1, 1]; |adv| >= 1 ends the game
    const advTrace: number[] = [0]
    const certTrace: number[] = [0]
    let Bsum = 0
    let moves = 0
    for (let m = 0; m < maxMoves; m++) {
      const cert = Math.abs(adv)
      // effective branching: fewer real choices as the game becomes decided
      Bsum += 1 + (branching - 1) * (1 - cert)
      adv += favored * drift * (0.35 + strength) + (Math.random() - 0.5) * wobble * 2
      adv = clamp(adv, -1.25, 1.25)
      advTrace.push(clamp(adv, -1, 1))
      certTrace.push(Math.min(1, Math.abs(adv)))
      moves++
      if (Math.abs(adv) >= 1) break
    }
    return { D: moves, B: Bsum / Math.max(1, moves), adv: advTrace, cert: certTrace }
  }

  // resample a game's certainty trace onto the fixed normalized-time grid
  private resample(cert: number[]): number[] {
    const out = new Array(GRID).fill(0)
    const n = cert.length
    for (let i = 0; i < GRID; i++) {
      const t = (i / (GRID - 1)) * (n - 1)
      const lo = Math.floor(t)
      const hi = Math.min(n - 1, lo + 1)
      out[i] = cert[lo] + (cert[hi] - cert[lo]) * (t - lo)
    }
    return out
  }

  private recompute() {
    if (!this.window.length) return
    let dSum = 0
    let bSum = 0
    for (const g of this.window) {
      dSum += g.D
      bSum += g.B
    }
    this.dAvg = dSum / this.window.length
    this.bAvg = bSum / this.window.length
    this.gr = Math.sqrt(this.bAvg) / this.dAvg
    // smooth the averaged progress curve, then finite-difference it
    const s = this.progress.slice()
    const sm = s.map((_, i) => {
      const a = s[Math.max(0, i - 1)]
      const b = s[i]
      const c = s[Math.min(GRID - 1, i + 1)]
      return (a + 2 * b + c) / 4
    })
    let maxAcc = 0
    let maxJerk = 0
    for (let i = 2; i < GRID; i++) {
      const acc = sm[i] - 2 * sm[i - 1] + sm[i - 2]
      if (Math.abs(acc) > maxAcc) maxAcc = Math.abs(acc)
    }
    for (let i = 3; i < GRID; i++) {
      const jerk = sm[i] - 3 * sm[i - 1] + 3 * sm[i - 2] - sm[i - 3]
      if (Math.abs(jerk) > maxJerk) maxJerk = Math.abs(jerk)
    }
    this.thrill = clamp(maxAcc * 900, 0, 100)
    this.addiction = clamp(maxJerk * 2600, 0, 100)
  }

  /** One tick: run background games to fill the rolling window + advance the
      animated live game. */
  step() {
    // background sims to keep stats responsive
    for (let k = 0; k < 6; k++) {
      const g = this.playGame()
      this.window.push({ D: g.D, B: g.B })
      if (this.window.length > 70) this.window.shift()
      const rs = this.resample(g.cert)
      for (let i = 0; i < GRID; i++) this.progress[i] = this.progress[i] * 0.9 + rs[i] * 0.1
    }
    this.recompute()
    // advance the animated game
    if (!this.live || this.playhead >= this.live.adv.length - 1) {
      this.live = this.playGame()
      this.playhead = 0
    } else {
      this.playhead += 1
    }
    this.frames++
  }

  reset() {
    this.window = []
    this.progress = new Array(GRID).fill(0)
    this.live = null
    this.playhead = 0
    this.frames = 0
    // warm up so the first frame is meaningful
    for (let i = 0; i < 12; i++) this.step()
  }

  verdict(): string {
    if (!this.window.length) return '—'
    if (this.gr < ZONE[0] - 0.012) return 'Too simple — under-refined'
    if (this.gr > ZONE[1] + 0.025) return 'Too complex — hard to follow'
    if (this.gr < ZONE[0]) return 'Approaching the zone'
    if (this.gr > ZONE[1]) return 'Just above the zone'
    return 'Engaging — the comfortable zone'
  }

  // ---- drawing ------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D) {
    const { W, H } = this
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0910'
    ctx.fillRect(0, 0, W, H)
    const padX = 20

    // ===== TOP: comfort-zone spectrum =====
    const specY = 54
    const ax0 = padX + 8
    const ax1 = W - padX - 8
    const gx = (gr: number) => ax0 + (clamp(gr, 0, AXIS_MAX) / AXIS_MAX) * (ax1 - ax0)
    ctx.fillStyle = 'rgba(255,255,255,.45)'
    ctx.font = "600 10px 'JetBrains Mono', monospace"
    ctx.textAlign = 'left'
    ctx.fillText('GAME-REFINEMENT VALUE  GR = √B ⁄ D', ax0, 20)
    // zone band
    const zx0 = gx(ZONE[0])
    const zx1 = gx(ZONE[1])
    ctx.fillStyle = 'rgba(33,179,160,.22)'
    ctx.fillRect(zx0, specY - 14, zx1 - zx0, 28)
    ctx.strokeStyle = 'rgba(33,179,160,.55)'
    ctx.lineWidth = 1
    ctx.strokeRect(zx0, specY - 14, zx1 - zx0, 28)
    ctx.fillStyle = 'rgba(90,220,190,.9)'
    ctx.font = "600 9px 'JetBrains Mono', monospace"
    ctx.textAlign = 'center'
    ctx.fillText('comfortable zone', (zx0 + zx1) / 2, specY - 20)
    // axis line + a few value ticks
    ctx.strokeStyle = 'rgba(255,255,255,.2)'
    ctx.beginPath()
    ctx.moveTo(ax0, specY)
    ctx.lineTo(ax1, specY)
    ctx.stroke()
    // landmarks — labels below the axis with leader lines, min-spaced so the
    // tightly-clustered real games (they all sit near the zone) stay readable
    const lms = LANDMARKS.map((l) => ({ name: l.name, tx: gx(l.gr) })).sort((a, b) => a.tx - b.tx)
    const gap = Math.min(96, (ax1 - ax0) / lms.length)
    const lx = lms.map((l) => l.tx)
    for (let i = 1; i < lx.length; i++) if (lx[i] - lx[i - 1] < gap) lx[i] = lx[i - 1] + gap
    const overR = lx[lx.length - 1] - ax1
    if (overR > 0) for (let i = 0; i < lx.length; i++) lx[i] -= overR
    if (lx[0] < ax0) { const d = ax0 - lx[0]; for (let i = 0; i < lx.length; i++) lx[i] += d }
    const labelY = specY + 30
    ctx.font = "500 9px 'JetBrains Mono', monospace"
    for (let i = 0; i < lms.length; i++) {
      ctx.strokeStyle = 'rgba(255,255,255,.3)'
      ctx.beginPath()
      ctx.moveTo(lms[i].tx, specY + 5)
      ctx.lineTo(lms[i].tx, specY + 10)
      ctx.lineTo(lx[i], labelY - 8)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,.55)'
      ctx.textAlign = 'center'
      ctx.fillText(lms[i].name, lx[i], labelY)
    }
    // current marker (triangle pointing at the axis; value shown in the readout below)
    if (this.window.length) {
      const x = gx(this.gr)
      const inZone = this.gr >= ZONE[0] && this.gr <= ZONE[1]
      ctx.fillStyle = inZone ? '#21b3a0' : this.accent
      ctx.beginPath()
      ctx.moveTo(x, specY - 9)
      ctx.lineTo(x + 6, specY - 18)
      ctx.lineTo(x - 6, specY - 18)
      ctx.closePath()
      ctx.fill()
    }

    // ===== BOTTOM: live self-play + averaged progress curve =====
    const py0 = specY + 56
    const py1 = H - 40
    const plotH = py1 - py0
    ctx.strokeStyle = 'rgba(255,255,255,.08)'
    ctx.strokeRect(ax0, py0, ax1 - ax0, plotH)
    ctx.fillStyle = 'rgba(255,255,255,.4)'
    ctx.font = "600 9.5px 'JetBrains Mono', monospace"
    ctx.textAlign = 'left'
    ctx.fillText('GAME PROGRESS — outcome certainty over the course of a game', ax0, py0 - 8)
    const px = (t: number) => ax0 + t * (ax1 - ax0)
    const py = (c: number) => py1 - clamp(c, 0, 1) * plotH
    // averaged curve (thrill = its acceleration)
    ctx.strokeStyle = 'rgba(160,150,175,.7)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < GRID; i++) {
      const x = px(i / (GRID - 1))
      const y = py(this.progress[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    // the live game drawing itself up to the playhead
    if (this.live) {
      const n = this.live.cert.length
      const upto = Math.min(this.playhead, n - 1)
      ctx.strokeStyle = this.accent
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= upto; i++) {
        const x = px(i / (n - 1))
        const y = py(this.live.cert[i])
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      // playhead dot
      const hx = px(upto / (n - 1))
      const hy = py(this.live.cert[upto])
      ctx.fillStyle = this.accent
      ctx.beginPath()
      ctx.arc(hx, hy, 3.5, 0, 7)
      ctx.fill()
      // tug-of-war bar at the very bottom
      const barY = py1 + 20
      const cxL = ax0
      const cxR = ax1
      const mid = (cxL + cxR) / 2
      ctx.strokeStyle = 'rgba(255,255,255,.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cxL, barY)
      ctx.lineTo(cxR, barY)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,.25)'
      ctx.beginPath()
      ctx.moveTo(mid, barY - 6)
      ctx.lineTo(mid, barY + 6)
      ctx.stroke()
      const a = this.live.adv[upto]
      const dotX = mid + a * (cxR - mid) * 0.94
      ctx.fillStyle = Math.abs(a) >= 0.999 ? '#21b3a0' : this.accent
      ctx.beginPath()
      ctx.arc(dotX, barY, 5, 0, 7)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,.4)'
      ctx.font = "500 9px 'JetBrains Mono', monospace"
      ctx.textAlign = 'left'
      ctx.fillText('◂ player A', cxL, barY + 16)
      ctx.textAlign = 'right'
      ctx.fillText('player B ▸', cxR, barY + 16)
    }
    ctx.textAlign = 'left'
  }

  stats() {
    return {
      gr: this.gr,
      length: Math.round(this.dAvg),
      branching: Math.round(this.bAvg * 10) / 10,
      thrill: Math.round(this.thrill),
      addiction: Math.round(this.addiction),
      verdict: this.verdict(),
      inZone: this.gr >= ZONE[0] && this.gr <= ZONE[1],
    }
  }
}
