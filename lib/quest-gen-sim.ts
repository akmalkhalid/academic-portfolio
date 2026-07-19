// ============================================================================
//  Agentic procedural quest-generation engine — framework-agnostic (no React,
//  no DOM beyond a passed-in 2D canvas context).
//
//  A faithful, simplified re-design of the genetic-transformer / AI-human
//  collaborative content-generation work from Dr. Khalid's papers. A role-
//  playing-game quest — a chain of typed "beats" (travel, gather, talk, puzzle,
//  combat, boss, reward) with optional side branches — is evolved by a genetic
//  loop. A critic agent scores each candidate against design objectives
//  (structure, difficulty arc, variety, pacing, branching); a generator agent
//  then hypermutates candidates, biasing its edits toward whichever objective is
//  currently weakest (the "agentic", transformer-guided step). Over generations
//  a well-formed, playable quest emerges.
//
//  Used by two React wrappers:
//    · QuestGeneration.tsx      — compact, non-interactive auto-looping embed
//    · QuestGenerationFull.tsx  — full interactive generator (sliders)
// ============================================================================

export type QuestParams = { length: number; difficulty: number; variety: number; mutation: number }

export const DEFAULTS: QuestParams = { length: 8, difficulty: 0.9, variety: 0.6, mutation: 0.5 }
export const ACCENT = '#8b7bf0'

// Beat types. `boss` and `reward` are terminal; the rest fill the body.
export const TYPES = [
  { key: 'travel', name: 'Travel', diff: 0.22, col: '#4d8df0' },
  { key: 'gather', name: 'Gather', diff: 0.32, col: '#21b3a0' },
  { key: 'talk', name: 'Talk', diff: 0.16, col: '#8b7bf0' },
  { key: 'puzzle', name: 'Puzzle', diff: 0.55, col: '#e0a021' },
  { key: 'combat', name: 'Combat', diff: 0.62, col: '#f2683f' },
  { key: 'boss', name: 'Boss', diff: 0.95, col: '#e05a7a' },
  { key: 'reward', name: 'Reward', diff: 0.12, col: '#84b53a' },
]
const BOSS = 5
const REWARD = 6
const BODY = [0, 1, 2, 3, 4] // non-terminal type indices

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const rnd = (n: number) => Math.floor(Math.random() * n)

type Beat = { t: number; diff: number; side: boolean }
type Obj = { structure: number; arc: number; variety: number; pacing: number; branching: number }
type Quest = { beats: Beat[]; quality: number; obj: Obj }

export class QuestGenSim {
  W = 0
  H = 0
  P: QuestParams = { ...DEFAULTS }
  accent: string
  pop: Quest[] = []
  best!: Quest
  gen = 0
  stagnant = 0

  constructor(accent = ACCENT) {
    this.accent = accent
  }

  resize(W: number, H: number) {
    this.W = Math.max(320, W)
    this.H = H
  }

  setParams(p: Partial<QuestParams>) {
    this.P = { ...this.P, ...p }
  }

  private mkBeat(t: number, side = false): Beat {
    return { t, diff: clamp(TYPES[t].diff + (Math.random() - 0.5) * 0.25, 0.05, 1), side }
  }

  // A rough, unstructured draft — random beat types, random difficulties, no
  // guaranteed intro/boss/reward. The evolutionary loop has to discover the
  // structure, so the quality visibly climbs.
  private randomQuest(): Quest {
    const L = clamp(this.P.length + rnd(3) - 1, 4, 14)
    const beats: Beat[] = []
    for (let i = 0; i < L; i++) beats.push(this.mkBeat(rnd(TYPES.length), Math.random() < 0.18))
    const q: Quest = { beats, quality: 0, obj: { structure: 0, arc: 0, variety: 0, pacing: 0, branching: 0 } }
    this.evaluate(q)
    return q
  }

  // ideal difficulty for a main beat at fractional position f (0..1): rises to a
  // climax near the end (the boss) then drops for the reward.
  private idealDiff(f: number): number {
    const climax = 0.55 + this.P.difficulty * 0.4
    if (f >= 0.99) return 0.12 // reward
    // rise from 0.2 to climax across the body, peaking just before the end
    return clamp(0.2 + (climax - 0.2) * Math.pow(f / 0.9, 1.15), 0.1, 1)
  }

  private evaluate(q: Quest) {
    const beats = q.beats
    const main = beats.filter((b) => !b.side)
    const n = main.length
    // structure
    let sOK = 0
    const bossCount = main.filter((b) => b.t === BOSS).length
    const rewardCount = main.filter((b) => b.t === REWARD).length
    if (n >= 4) sOK += 1
    if (main[n - 1] && main[n - 1].t === REWARD) sOK += 1
    if (main[n - 2] && main[n - 2].t === BOSS) sOK += 1
    if (bossCount === 1) sOK += 1
    if (rewardCount === 1) sOK += 1
    if (main[0] && (main[0].t === 2 || main[0].t === 0)) sOK += 1
    const structure = sOK / 6
    // difficulty arc (body only, excluding the reward)
    let arcErr = 0
    let cnt = 0
    for (let i = 0; i < n - 1; i++) {
      const f = n > 2 ? i / (n - 2) : 0
      arcErr += Math.abs(main[i].diff - this.idealDiff(f))
      cnt++
    }
    const arc = clamp(1 - arcErr / Math.max(1, cnt) / 0.5, 0, 1)
    // variety: penalise adjacent duplicate types; reward distinct types used
    let dup = 0
    for (let i = 1; i < main.length; i++) if (main[i].t === main[i - 1].t) dup++
    const distinct = new Set(main.map((b) => b.t)).size
    const variety = clamp((1 - dup / Math.max(1, main.length - 1)) * 0.6 + (distinct / 6) * 0.4, 0, 1)
    // pacing: length match to target
    const pacing = clamp(1 - Math.abs(n - this.P.length) / this.P.length, 0, 1)
    // branching: side beats vs a target of ~2
    const sideCount = beats.filter((b) => b.side).length
    const branching = clamp(1 - Math.abs(sideCount - 2) / 3, 0, 1)
    q.obj = { structure, arc, variety, pacing, branching }
    // weighted quality (structure & arc matter most; variety scaled by the knob)
    const vW = 0.7 + this.P.variety * 0.6
    q.quality =
      (structure * 1.4 + arc * 1.2 + variety * vW + pacing * 0.8 + branching * 0.5) /
      (1.4 + 1.2 + vW + 0.8 + 0.5)
  }

  private clone(q: Quest): Quest {
    return { beats: q.beats.map((b) => ({ ...b })), quality: q.quality, obj: { ...q.obj } }
  }

  // Generator agent: bias edits toward the weakest objective.
  private mutate(src: Quest): Quest {
    const q = this.clone(src)
    const b = q.beats
    const weakest = (Object.entries(q.obj).sort((x, y) => x[1] - y[1])[0][0]) as keyof Obj
    const edits = 1 + Math.floor(this.P.mutation * 3)
    for (let e = 0; e < edits; e++) {
      const guided = Math.random() < 0.7
      const target = guided ? weakest : (['structure', 'arc', 'variety', 'pacing', 'branching'][rnd(5)] as keyof Obj)
      if (target === 'structure') {
        // enforce boss then reward at the end, intro at the start
        const main = b.filter((x) => !x.side)
        if (main.length) {
          // remove stray boss/reward in the body
          for (const bt of b) if (!bt.side && (bt.t === BOSS || bt.t === REWARD)) bt.t = BODY[rnd(BODY.length)]
          // set the last two non-side beats
          const idxMain = b.map((x, i) => (!x.side ? i : -1)).filter((i) => i >= 0)
          const li = idxMain[idxMain.length - 1]
          const pi = idxMain[idxMain.length - 2]
          if (li != null) { b[li].t = REWARD; b[li].diff = TYPES[REWARD].diff }
          if (pi != null) { b[pi].t = BOSS; b[pi].diff = TYPES[BOSS].diff }
          const fi = idxMain[0]
          if (fi != null && Math.random() < 0.5) b[fi].t = 2
        }
      } else if (target === 'arc') {
        const idxMain = b.map((x, i) => (!x.side ? i : -1)).filter((i) => i >= 0)
        if (idxMain.length > 2) {
          const k = rnd(idxMain.length - 1)
          const f = k / (idxMain.length - 2)
          const want = this.idealDiff(f)
          const bi = idxMain[k]
          // nudge type toward the desired difficulty, and its diff
          b[bi].diff = clamp(b[bi].diff + (want - b[bi].diff) * 0.7, 0.05, 1)
          if (Math.random() < 0.5) {
            let bestT = b[bi].t
            let bestD = 9
            for (const t of BODY) if (Math.abs(TYPES[t].diff - want) < bestD) { bestD = Math.abs(TYPES[t].diff - want); bestT = t }
            b[bi].t = bestT
          }
        }
      } else if (target === 'variety') {
        for (let i = 1; i < b.length; i++) if (b[i].t === b[i - 1].t && b[i].t !== BOSS && b[i].t !== REWARD) {
          b[i] = this.mkBeat(BODY[rnd(BODY.length)], b[i].side)
          break
        }
      } else if (target === 'pacing') {
        const n = b.filter((x) => !x.side).length
        if (n > this.P.length && b.length > 4) {
          const i = b.findIndex((x) => !x.side && x.t !== BOSS && x.t !== REWARD)
          if (i >= 0) b.splice(i, 1)
        } else if (n < this.P.length) {
          b.splice(1 + rnd(Math.max(1, b.length - 3)), 0, this.mkBeat(BODY[rnd(BODY.length)]))
        }
      } else {
        // branching: toggle a body beat's side flag toward the target of 2
        const sideCount = b.filter((x) => x.side).length
        if (sideCount < 2) {
          const cand = b.map((x, i) => (!x.side && x.t !== BOSS && x.t !== REWARD ? i : -1)).filter((i) => i >= 0)
          if (cand.length) b[cand[rnd(cand.length)]].side = true
        } else if (sideCount > 2) {
          const cand = b.map((x, i) => (x.side ? i : -1)).filter((i) => i >= 0)
          if (cand.length) b[cand[rnd(cand.length)]].side = false
        } else {
          const i = b.findIndex((x) => !x.side && x.t !== BOSS && x.t !== REWARD)
          if (i >= 0) b[i] = this.mkBeat(BODY[rnd(BODY.length)])
        }
      }
    }
    this.evaluate(q)
    return q
  }

  private initPop() {
    this.pop = []
    for (let i = 0; i < 30; i++) this.pop.push(this.randomQuest())
    this.pop.sort((a, b) => b.quality - a.quality)
    this.best = this.clone(this.pop[0])
    this.gen = 0
    this.stagnant = 0
  }

  step() {
    const n = this.pop.length
    const selectN = Math.max(4, Math.round(n * 0.5))
    const cand: Quest[] = []
    for (let i = 0; i < selectN; i++) {
      const parent = this.pop[i]
      const clones = 1 + Math.round(((selectN - i) / selectN) * 3)
      for (let c = 0; c < clones; c++) cand.push(this.mutate(parent))
    }
    for (let i = 0; i < 3; i++) cand.push(this.randomQuest())
    const merged = this.pop.concat(cand)
    merged.sort((a, b) => b.quality - a.quality)
    this.pop = merged.slice(0, n)
    if (this.pop[0].quality > this.best.quality + 1e-6) {
      this.best = this.clone(this.pop[0])
      this.stagnant = 0
    } else this.stagnant++
    this.gen++
  }

  reset() {
    this.initPop()
  }

  // ---- drawing ------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D) {
    const { W, H } = this
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0a0910'
    ctx.fillRect(0, 0, W, H)
    const q = this.best
    if (!q) return
    const padX = 26
    const main = q.beats.filter((b) => !b.side)
    const idxOf: number[] = q.beats.map((b, i) => (!b.side ? i : -1)).filter((i) => i >= 0)
    const n = main.length

    ctx.fillStyle = 'rgba(255,255,255,.45)'
    ctx.font = "600 10px 'JetBrains Mono', monospace"
    ctx.textAlign = 'left'
    ctx.fillText('GENERATED QUEST', padX, 22)

    // main chain positions
    const chainY = H * 0.36
    const x0 = padX + 10
    const x1 = W - padX - 10
    const xAt = (k: number) => (n <= 1 ? (x0 + x1) / 2 : x0 + (k / (n - 1)) * (x1 - x0))
    const r = clamp((x1 - x0) / (n * 2.4), 12, 20)

    // edges (main line)
    ctx.strokeStyle = 'rgba(255,255,255,.25)'
    ctx.lineWidth = 2
    for (let k = 0; k < n - 1; k++) {
      ctx.beginPath()
      ctx.moveTo(xAt(k) + r, chainY)
      ctx.lineTo(xAt(k + 1) - r, chainY)
      ctx.stroke()
    }
    // side branches: attach each side beat to the nearest preceding main node
    const sideBeats = q.beats.map((b, i) => ({ b, i })).filter((o) => o.b.side)
    for (const { b, i } of sideBeats) {
      // main index preceding this side beat
      let mk = 0
      for (let k = 0; k < idxOf.length; k++) if (idxOf[k] < i) mk = k
      const ax = xAt(mk)
      const sy = chainY - r - 30
      ctx.strokeStyle = 'rgba(255,255,255,.18)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(ax, chainY - r)
      ctx.lineTo(ax, sy + 12)
      ctx.stroke()
      // side node
      ctx.fillStyle = TYPES[b.t].col
      ctx.globalAlpha = 0.65
      ctx.beginPath()
      ctx.arc(ax, sy, r * 0.62, 0, 7)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(255,255,255,.4)'
      ctx.font = "600 7.5px 'JetBrains Mono', monospace"
      ctx.textAlign = 'center'
      ctx.fillText('side', ax, sy + r * 0.62 + 9)
    }

    // main nodes
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let k = 0; k < n; k++) {
      const x = xAt(k)
      const t = main[k].t
      const isBoss = t === BOSS
      const isReward = t === REWARD
      ctx.fillStyle = TYPES[t].col
      if (isBoss) {
        // diamond
        ctx.beginPath()
        ctx.moveTo(x, chainY - r - 2)
        ctx.lineTo(x + r + 2, chainY)
        ctx.lineTo(x, chainY + r + 2)
        ctx.lineTo(x - r - 2, chainY)
        ctx.closePath()
        ctx.fill()
      } else if (isReward) {
        // rounded square
        ctx.fillRect(x - r, chainY - r, r * 2, r * 2)
      } else {
        ctx.beginPath()
        ctx.arc(x, chainY, r, 0, 7)
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(10,9,16,.9)'
      ctx.font = `700 ${Math.round(r * 0.7)}px 'JetBrains Mono', monospace`
      ctx.fillText(String(k + 1), x, chainY + 0.5)
      // type label below
      ctx.fillStyle = 'rgba(255,255,255,.55)'
      ctx.font = "500 9px 'JetBrains Mono', monospace"
      ctx.fillText(TYPES[t].name, x, chainY + r + 14)
    }
    ctx.textBaseline = 'alphabetic'

    // ---- difficulty arc ----
    const ay0 = H * 0.62
    const ay1 = H - 30
    const aH = ay1 - ay0
    ctx.strokeStyle = 'rgba(255,255,255,.08)'
    ctx.strokeRect(x0 - 6, ay0, x1 - x0 + 12, aH)
    ctx.fillStyle = 'rgba(255,255,255,.4)'
    ctx.font = "600 9.5px 'JetBrains Mono', monospace"
    ctx.textAlign = 'left'
    ctx.fillText('DIFFICULTY ARC — ideal (dashed) vs generated', x0 - 6, ay0 - 7)
    const ay = (d: number) => ay1 - clamp(d, 0, 1) * aH
    // ideal
    ctx.strokeStyle = 'rgba(160,150,175,.5)'
    ctx.setLineDash([4, 3])
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let k = 0; k < n; k++) {
      const f = n > 2 ? k / (n - 2) : 0
      const x = xAt(k)
      const y = ay(k === n - 1 ? 0.12 : this.idealDiff(f))
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
    // generated
    ctx.strokeStyle = this.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let k = 0; k < n; k++) {
      const x = xAt(k)
      const y = ay(main[k].diff)
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = TYPES[main[k].t].col
      ctx.beginPath()
      ctx.arc(xAt(k), ay(main[k].diff), 3, 0, 7)
      ctx.fill()
    }
  }

  stats() {
    const q = this.best
    const pct = (v: number) => Math.round(v * 100)
    return {
      gen: this.gen,
      quality: q ? pct(q.quality) : 0,
      structure: q ? pct(q.obj.structure) : 0,
      arc: q ? pct(q.obj.arc) : 0,
      variety: q ? pct(q.obj.variety) : 0,
      pacing: q ? pct(q.obj.pacing) : 0,
      branching: q ? pct(q.obj.branching) : 0,
      beats: q ? q.beats.filter((b) => !b.side).length : 0,
    }
  }
}
