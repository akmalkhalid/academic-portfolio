// Puzzle loop — the engine behind the signature Generative Optimization demo.
//
// One full loop over 9×9 Sudoku puzzles, kept small enough to read:
//   GENERATE  mutate an elite puzzle (remove / add / move a given, or mirror one)
//             and repair it until it has exactly one solution;
//   EVALUATE  let a simulated player solve it and compute a game-refinement value
//             GR = √G / T, where G = cells placed and T = candidate values the
//             player had to weigh along the way (guesses cost extra);
//   SEARCH    keep it in a MAP-Elites archive (axes: number of givens × symmetry)
//             if it lands closer to the comfortable zone GR ≈ 0.07–0.08 than the
//             puzzle already in its niche.
//
// This is an illustrative teaching model of the published idea, not the full
// method of any one paper. Pure TypeScript, no DOM, deterministic per seed.

export type Grid = Int8Array // 81 cells, 0 = empty

export const GR_LO = 0.07
export const GR_HI = 0.08
export const GR_TARGET = 0.075

export const GIVEN_MIN = 22
export const GIVEN_BIN = 3
export const X_BINS = 8 // 22–24, 25–27, … 43–45
export const Y_BINS = 5 // symmetry 0–20 %, … 80–100 %

export type Puzzle = {
  givens: Grid // the puzzle as shown to the player
  solution: Grid // its unique solution
}

export type Scored = Puzzle & {
  gr: number
  G: number
  T: number
  guesses: number
  nGivens: number
  symmetry: number // 0..1, share of givens whose 180° partner is also given
  quality: number // 0..1, closeness to the comfortable zone
  x: number
  y: number
}

// ---------- rng ----------
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type R = () => number
const shuffle = <T,>(a: T[], r: R) => { for (let i = a.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]] } return a }

// ---------- sudoku basics (bitmask candidates) ----------
const ROW = (i: number) => (i / 9) | 0
const COL = (i: number) => i % 9
const BOX = (i: number) => ((ROW(i) / 3) | 0) * 3 + ((COL(i) / 3) | 0)
const PEERS: number[][] = []
const UNITS: number[][] = []
for (let k = 0; k < 9; k++) {
  UNITS.push([...Array(9)].map((_, j) => k * 9 + j))
  UNITS.push([...Array(9)].map((_, j) => j * 9 + k))
  const br = ((k / 3) | 0) * 3, bc = (k % 3) * 3
  UNITS.push([...Array(9)].map((_, j) => (br + ((j / 3) | 0)) * 9 + bc + (j % 3)))
}
for (let i = 0; i < 81; i++) {
  const s = new Set<number>()
  for (let j = 0; j < 81; j++) if (j !== i && (ROW(j) === ROW(i) || COL(j) === COL(i) || BOX(j) === BOX(i))) s.add(j)
  PEERS.push([...s])
}
const ALL = 0x3fe // bits 1..9
const popcount = (m: number) => { let c = 0; while (m) { m &= m - 1; c++ } return c }
const bits = (m: number) => { const out: number[] = []; for (let v = 1; v <= 9; v++) if (m & (1 << v)) out.push(v); return out }

function candidates(g: Grid, i: number) {
  let m = ALL
  for (const p of PEERS[i]) if (g[p]) m &= ~(1 << g[p])
  return m
}

/** Count solutions up to `limit` (MRV backtracking). */
export function countSolutions(g0: Grid, limit = 2): number {
  const g = Int8Array.from(g0)
  let found = 0
  const go = (): boolean => {
    let best = -1, bestM = 0, bestC = 10
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue
      const m = candidates(g, i), c = popcount(m)
      if (c === 0) return false
      if (c < bestC) { best = i; bestM = m; bestC = c; if (c === 1) break }
    }
    if (best < 0) { found++; return found >= limit }
    for (const v of bits(bestM)) { g[best] = v; if (go()) return true }
    g[best] = 0
    return false
  }
  go()
  return found
}

function makeSolution(r: R): Grid {
  const g = new Int8Array(81)
  const go = (i: number): boolean => {
    if (i === 81) return true
    for (const v of shuffle(bits(candidates(g, i)), r)) { g[i] = v; if (go(i + 1)) return true }
    g[i] = 0
    return false
  }
  go(0)
  return g
}

/** Add solution values back at random empty cells until the puzzle is unique. */
function repair(p: Puzzle, r: R): Puzzle | null {
  const g = Int8Array.from(p.givens)
  for (let tries = 0; tries < 30; tries++) {
    if (countSolutions(g) === 1) return { givens: g, solution: p.solution }
    const empty = [] as number[]
    for (let i = 0; i < 81; i++) if (!g[i]) empty.push(i)
    const i = empty[(r() * empty.length) | 0]
    g[i] = p.solution[i]
  }
  return null
}

// ---------- GENERATE ----------
export function randomPuzzle(r: R): Puzzle {
  const solution = makeSolution(r)
  const g = Int8Array.from(solution)
  const target = GIVEN_MIN + ((r() * (X_BINS * GIVEN_BIN)) | 0)
  const order = shuffle([...Array(81).keys()], r)
  let n = 81
  for (const i of order) {
    if (n <= target) break
    const v = g[i]; g[i] = 0
    if (countSolutions(g) !== 1) g[i] = v
    else n--
  }
  return { givens: g, solution }
}

export type MutationOp = 'remove' | 'add' | 'move' | 'mirror'

export function mutate(p: Puzzle, r: R): { child: Puzzle; op: MutationOp } | null {
  const g = Int8Array.from(p.givens)
  const filled: number[] = [], empty: number[] = []
  for (let i = 0; i < 81; i++) (g[i] ? filled : empty).push(i)
  const pick = (a: number[]) => a[(r() * a.length) | 0]
  const roll = r()
  let op: MutationOp
  if (roll < 0.34) { op = 'remove'; const n = 1 + ((r() * 3) | 0); for (let k = 0; k < n; k++) g[pick(filled)] = 0 }
  else if (roll < 0.58) { op = 'add'; const i = pick(empty); g[i] = p.solution[i] }
  else if (roll < 0.82) { op = 'move'; const a = pick(filled), b = pick(empty); g[a] = 0; g[b] = p.solution[b] }
  else { op = 'mirror'; const a = pick(filled), b = 80 - a; if (!g[b]) g[b] = p.solution[b]; else g[a] = 0 }
  const child = repair({ givens: g, solution: p.solution }, r)
  return child ? { child, op } : null
}

// ---------- EVALUATE ----------
/**
 * A simulated player. Each move it looks for a forced placement — a cell with a
 * single candidate (naked single) or a value with a single home in a row,
 * column or box (hidden single) — and places the cheapest one it can find. The
 * cost of a move (T) is how many candidate values the player had to weigh in
 * that cell; when nothing is forced it guesses in the most constrained cell,
 * which costs every candidate plus a penalty for the dead ends behind it.
 */
export function playthrough(p: Puzzle): { G: number; T: number; guesses: number } {
  const g = Int8Array.from(p.givens)
  let G = 0, T = 0, guesses = 0
  for (;;) {
    let left = 0
    let bestCell = -1, bestCost = 99, bestVal = 0
    const cand: number[] = new Array(81).fill(0)
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue
      left++
      const m = candidates(g, i); cand[i] = m
      const c = popcount(m)
      if (c === 1 && c < bestCost) { bestCell = i; bestCost = 1; bestVal = bits(m)[0] }
    }
    if (!left) break
    if (bestCost > 1) {
      // hidden singles — cost is the candidate count of the cell it lands in
      for (const u of UNITS) {
        for (let v = 1; v <= 9; v++) {
          let home = -1, n = 0
          for (const i of u) if (!g[i] && cand[i] & (1 << v)) { home = i; n++ }
          if (n === 1) { const c = popcount(cand[home]); if (c < bestCost) { bestCell = home; bestCost = c; bestVal = v } }
        }
      }
    }
    if (bestCell < 0) {
      // stuck: guess in the most constrained cell
      let mc = 10
      for (let i = 0; i < 81; i++) if (!g[i]) { const c = popcount(cand[i]); if (c < mc) { mc = c; bestCell = i } }
      bestCost = mc * 3
      bestVal = p.solution[bestCell]
      guesses++
    }
    g[bestCell] = bestVal
    G++
    T += bestCost
  }
  return { G, T, guesses }
}

export function score(p: Puzzle): Scored {
  const { G, T, guesses } = playthrough(p)
  const gr = T ? Math.sqrt(G) / T : 0
  let nGivens = 0, paired = 0
  for (let i = 0; i < 81; i++) if (p.givens[i]) { nGivens++; if (p.givens[80 - i]) paired++ }
  const symmetry = nGivens ? paired / nGivens : 0
  const dist = gr < GR_LO ? GR_LO - gr : gr > GR_HI ? gr - GR_HI : 0
  const quality = Math.max(0, 1 - dist / 0.04)
  const x = Math.min(X_BINS - 1, Math.max(0, Math.floor((nGivens - GIVEN_MIN) / GIVEN_BIN)))
  const y = Math.min(Y_BINS - 1, Math.floor(symmetry * Y_BINS))
  return { ...p, gr, G, T, guesses, nGivens, symmetry, quality, x, y }
}

/** Where a GR value sits on the engagement spectrum. */
export const zone = (gr: number) => (gr > GR_HI ? 'too easy' : gr < GR_LO ? 'too hard' : 'comfortable')

// ---------- SEARCH (MAP-Elites) ----------
export type StepEvent = {
  parent: Scored | null
  child: Scored | null
  op: MutationOp | 'seed'
  outcome: 'new niche' | 'improved' | 'rejected' | 'invalid'
}

export class Archive {
  cells: (Scored | null)[] = new Array(X_BINS * Y_BINS).fill(null)
  evals = 0
  private r: R
  constructor(seed = 7) { this.r = rng(seed) }

  get filled() { return this.cells.filter(Boolean) as Scored[] }
  get coverage() { return this.filled.length / this.cells.length }
  get comfortable() { return this.filled.filter((e) => e.gr >= GR_LO && e.gr <= GR_HI).length }

  insert(s: Scored): StepEvent['outcome'] {
    const k = s.y * X_BINS + s.x
    const cur = this.cells[k]
    if (!cur) { this.cells[k] = s; return 'new niche' }
    if (s.quality > cur.quality || (s.quality === cur.quality && Math.abs(s.gr - GR_TARGET) < Math.abs(cur.gr - GR_TARGET))) { this.cells[k] = s; return 'improved' }
    return 'rejected'
  }

  /** One iteration of the loop: generate → evaluate → search. */
  step(): StepEvent {
    this.evals++
    const elites = this.filled
    if (elites.length < 4) {
      const child = score(randomPuzzle(this.r))
      return { parent: null, child, op: 'seed', outcome: this.insert(child) }
    }
    const parent = elites[(this.r() * elites.length) | 0]
    const m = mutate(parent, this.r)
    if (!m) return { parent, child: null, op: 'move', outcome: 'invalid' }
    const child = score(m.child)
    return { parent, child, op: m.op, outcome: this.insert(child) }
  }
}
