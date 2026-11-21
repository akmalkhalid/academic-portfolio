'use client'

// The second face of the home page's live demo: the SAME Generative Optimization loop as the
// Sudoku demo (components/PuzzleLoop.tsx), pointed at a different design problem: cave levels
// for a game.
//
//   GENERATE  a "recipe" (wall chance, smoothing passes, wall rule, seed) grows a cave with a
//             cellular automaton, the classic way games make natural-looking caves.
//   EVALUATE  flood-fill the cave: how much floor is there, how long is the longest route,
//             and how much of the floor can a player actually reach?
//   SEARCH    MAP-Elites keeps the most playable cave for every STYLE of cave. Columns run from
//             cramped to open, rows from short routes to long ones (12 x 9 = 108 niches).
//
// Everything runs in the visitor's browser. It stops after 9,000 caves, pauses when it is
// off-screen or on the hidden side of the viewer, and shows a finished archive straight away
// for visitors who prefer reduced motion. (This demo first lived on the /engine/ page.)

import { useEffect, useRef, useState } from 'react'

const GW = 22, GH = 22          // one cave is 22 x 22 cells
const BX = 12, BY = 9           // the archive is 12 x 9 niches
const BUDGET = 9000             // caves generated per run
const COL = { gen: '#b6a8ff', eva: '#ff9b78', sea: '#4fd8c6' }
const mono = "'JetBrains Mono', monospace"

type Recipe = { p: number; steps: number; birth: number; seed: number }
type Score = { open: number; fit: number; route: number; mark: Int16Array; bestId: number }
type Elite = { g: Recipe; ev: Score; ix: number; iy: number; img: HTMLCanvasElement; born: number }

/* ---------- GENERATE: recipe -> cave ---------- */
function rng(s: number) {                       // small seeded random generator (mulberry32)
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function build(g: Recipe): Uint8Array {
  const r = rng(g.seed)
  let a = new Uint8Array(GW * GH)               // 1 = wall, 0 = floor
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) a[y * GW + x] = x === 0 || y === 0 || x === GW - 1 || y === GH - 1 || r() < g.p ? 1 : 0
  for (let s = 0; s < g.steps; s++) {           // smoothing: a cell becomes wall when enough neighbours are wall
    const b = new Uint8Array(GW * GH)
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      let n = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const X = x + dx, Y = y + dy
        n += X < 0 || Y < 0 || X >= GW || Y >= GH ? 1 : a[Y * GW + X]
      }
      b[y * GW + x] = x === 0 || y === 0 || x === GW - 1 || y === GH - 1 ? 1 : n >= g.birth ? 1 : n <= 2 ? 0 : a[y * GW + x]
    }
    a = b
  }
  return a
}

/* ---------- EVALUATE: flood fill ---------- */
function bfs(a: Uint8Array, start: number, mark?: Int16Array, id = 0) {
  const q = [start], dist = new Int16Array(GW * GH).fill(-1)
  dist[start] = 0
  if (mark) mark[start] = id
  let h = 0, last = start
  while (h < q.length) {
    const c = q[h++]; last = c
    const x = c % GW
    for (const n of [c - 1, c + 1, c - GW, c + GW]) {
      if (n < 0 || n >= GW * GH || Math.abs((n % GW) - x) > 1 || a[n] || dist[n] >= 0) continue
      dist[n] = dist[c] + 1
      if (mark) mark[n] = id
      q.push(n)
    }
  }
  return { n: q.length, last, d: dist[last] }
}
function evaluate(a: Uint8Array): Score | null {
  const mark = new Int16Array(GW * GH)
  let open = 0, best = 0, bestStart = -1, bestId = 0, id = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i]) continue
    open++
    if (mark[i]) continue
    id++
    const r = bfs(a, i, mark, id)
    if (r.n > best) { best = r.n; bestStart = i; bestId = id }
  }
  if (open < 12) return null                                   // not a level at all
  const far = bfs(a, bestStart).last, route = bfs(a, far).d     // longest route, end to end
  return { open: open / ((GW - 2) * (GH - 2)), fit: best / open, route: route / (GW + GH), mark, bestId }
}

const rnd = Math.random
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const fresh = (): Recipe => ({ p: 0.3 + rnd() * 0.32, steps: 1 + ((rnd() * 5) | 0), birth: 4 + ((rnd() * 3) | 0), seed: (rnd() * 2 ** 31) | 0 })
function mutate(g: Recipe): Recipe {
  const m = { ...g }, k = rnd()
  if (k < 0.4) m.p = clamp(m.p + (rnd() - 0.5) * 0.08, 0.26, 0.66)
  else if (k < 0.6) m.steps = clamp(m.steps + (rnd() < 0.5 ? -1 : 1), 1, 6)
  else if (k < 0.75) m.birth = clamp(m.birth + (rnd() < 0.5 ? -1 : 1), 4, 6)
  else m.seed = (rnd() * 2 ** 31) | 0
  return m
}
// a cave as a tiny image: reachable floor in teal, cut-off pockets in coral
function thumb(a: Uint8Array, ev: Score) {
  const c = document.createElement('canvas'); c.width = GW; c.height = GH
  const x = c.getContext('2d')!, im = x.createImageData(GW, GH)
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const S = hex(COL.sea), E = hex(COL.eva)
  for (let i = 0; i < a.length; i++) {
    const k = i * 4
    if (a[i]) { im.data[k + 3] = 0; continue }
    const m = ev.mark[i] === ev.bestId ? S : E
    im.data[k] = m[0]; im.data[k + 1] = m[1]; im.data[k + 2] = m[2]; im.data[k + 3] = 255
  }
  x.putImageData(im, 0, 0)
  return c
}

export default function LevelEngine({ paused = false }: { paused?: boolean }) {
  const archCanvas = useRef<HTMLCanvasElement>(null)
  const bigCanvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<{ toggle: () => void; reset: () => void; setPaused: (p: boolean) => void } | null>(null)
  const [stat, setStat] = useState({ gen: 0, eva: 0, kept: 0, cover: 0 })
  const [running, setRunning] = useState(true)
  const [done, setDone] = useState(false)
  const [pick, setPick] = useState<{ born: number; open: number; route: number; fit: number; g: Recipe } | null>(null)

  useEffect(() => {
    const cv = archCanvas.current!, big = bigCanvas.current!
    const cx = cv.getContext('2d')!, bx = big.getContext('2d')!
    cx.imageSmoothingEnabled = false; bx.imageSmoothingEnabled = false
    const CW = cv.width / BX, CH = cv.height / BY
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let arch: Record<string, Elite> = {}, flash: Record<string, number> = {}
    let s = { gen: 0, eva: 0, kept: 0, locked: false }
    let sel: string | null = null, run = true, vis = false, hidden = paused, raf = 0, lastPush = 0

    /* ---------- SEARCH: one MAP-Elites step ---------- */
    function step() {
      const keys = Object.keys(arch)
      const g = s.gen < 80 || !keys.length ? fresh() : mutate(arch[keys[(rnd() * keys.length) | 0]].g)   // random start, then mutate an elite
      s.gen++
      const a = build(g), ev = evaluate(a)
      if (!ev) return
      s.eva++
      const ix = clamp(Math.floor(((ev.open - 0.12) / (0.8 - 0.12)) * BX), 0, BX - 1)   // which style is it?
      const iy = clamp(Math.floor((ev.route / 1.5) * BY), 0, BY - 1)
      const key = ix + ',' + iy, old = arch[key]
      if (!old || ev.fit > old.ev.fit + 1e-9) {                                          // better than the cave already there?
        arch[key] = { g, ev, ix, iy, img: thumb(a, ev), born: s.gen }
        s.kept++
        flash[key] = performance.now()
        if (!sel || sel === key || !s.locked) sel = key
      }
    }
    function draw() {
      cx.clearRect(0, 0, cv.width, cv.height)
      const now = performance.now()
      cx.strokeStyle = 'rgba(255,255,255,.06)'; cx.lineWidth = 1
      for (let i = 1; i < BX; i++) { cx.beginPath(); cx.moveTo(i * CW + 0.5, 0); cx.lineTo(i * CW + 0.5, cv.height); cx.stroke() }
      for (let j = 1; j < BY; j++) { cx.beginPath(); cx.moveTo(0, j * CH + 0.5); cx.lineTo(cv.width, j * CH + 0.5); cx.stroke() }
      for (const k in arch) {
        const e = arch[k], x = e.ix * CW, y = (BY - 1 - e.iy) * CH
        cx.globalAlpha = 0.35 + 0.65 * e.ev.fit; cx.drawImage(e.img, x + 2, y + 2, CW - 4, CH - 4); cx.globalAlpha = 1
        const f = flash[k] && now - flash[k] < 700 ? 1 - (now - flash[k]) / 700 : 0
        if (f > 0) { cx.strokeStyle = COL.gen; cx.globalAlpha = f; cx.lineWidth = 3; cx.strokeRect(x + 1.5, y + 1.5, CW - 3, CH - 3); cx.globalAlpha = 1 }
        if (k === sel) { cx.strokeStyle = '#fff'; cx.lineWidth = 1.5; cx.strokeRect(x + 1, y + 1, CW - 2, CH - 2) }
      }
      const e = sel ? arch[sel] : null
      if (e) { bx.clearRect(0, 0, big.width, big.height); bx.drawImage(e.img, 0, 0, big.width, big.height) }
      if (now - lastPush > 120 || s.gen >= BUDGET) {          // React state at most ~8 times a second
        lastPush = now
        setStat({ gen: s.gen, eva: s.eva, kept: s.kept, cover: Math.round((Object.keys(arch).length / (BX * BY)) * 100) })
        setPick(e ? { born: e.born, open: e.ev.open, route: e.ev.route, fit: e.ev.fit, g: e.g } : null)
        if (s.gen >= BUDGET) setDone(true)
      }
    }
    const active = () => run && vis && !hidden && s.gen < BUDGET
    function loop() {
      raf = 0
      if (active()) for (let i = 0; i < 14; i++) step()
      draw()
      const flashing = Object.values(flash).some((t) => performance.now() - t < 700)
      if (active() || flashing) raf = requestAnimationFrame(loop)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop) }
    function reset() {
      arch = {}; flash = {}; sel = null; s = { gen: 0, eva: 0, kept: 0, locked: false }; run = true; lastPush = 0
      setDone(false); setRunning(true)
      if (reduce) { while (s.gen < 2500) step(); flash = {}; run = false; setRunning(false); draw() }
      else { for (let i = 0; i < 500; i++) step(); kick() }
    }
    const onClick = (ev: MouseEvent) => {                     // hold a tile in the inspector
      const r = cv.getBoundingClientRect()
      const ix = Math.floor(((ev.clientX - r.left) / r.width) * BX), iy = BY - 1 - Math.floor(((ev.clientY - r.top) / r.height) * BY)
      const k = ix + ',' + iy
      if (arch[k]) { sel = k; s.locked = true; lastPush = 0; draw() }
    }
    cv.addEventListener('click', onClick)
    const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis) kick() })
    io.observe(cv)
    api.current = {
      toggle: () => { run = !run; setRunning(run); kick() },
      reset,
      setPaused: (p) => { hidden = p; if (!p) kick() },
    }
    reset()
    return () => { cancelAnimationFrame(raf); io.disconnect(); cv.removeEventListener('click', onClick) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { api.current?.setPaused(paused) }, [paused])

  const btn: React.CSSProperties = { fontFamily: mono, fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '7px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.06)', color: '#ECEAF3' }
  const readout = (label: string, value: string, colour: string) => (
    <div key={label}>
      <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '.1em', color: '#6f6a82' }}>{label}</div>
      <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize: 24, color: colour, lineHeight: 1.2 }}>{value}</div>
    </div>
  )

  return (
    <div className="lvl" style={{ color: '#ECEAF3' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap', marginBottom: 16 }}>
        {readout('GENERATED', stat.gen.toLocaleString(), COL.gen)}
        {readout('PASSED TEST', stat.eva.toLocaleString(), COL.eva)}
        {readout('KEPT', stat.kept.toLocaleString(), COL.sea)}
        {readout('NICHES FILLED', stat.cover + '%', '#ECEAF3')}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" style={btn} disabled={done} onClick={() => api.current?.toggle()}>{running ? 'Pause' : 'Resume'}</button>
          <button type="button" style={btn} onClick={() => api.current?.reset()}>New run</button>
        </span>
      </div>
      <div className="lvl-grid">
        <div style={{ minWidth: 0 }}>
          <canvas ref={archCanvas} width={792} height={594} className="lvl-arch"
            aria-label="Live archive of generated cave levels. Columns run from cramped to open, rows from short routes to long routes." />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10.5, letterSpacing: '.08em', color: '#6f6a82', marginTop: 8 }}>
            <span>CRAMPED</span><span>COLUMN: HOW OPEN THE CAVE IS · ROW: HOW LONG THE ROUTE IS</span><span>OPEN</span>
          </div>
        </div>
        <div className="lvl-pick">
          <canvas ref={bigCanvas} width={176} height={176} aria-hidden="true" className="lvl-big" />
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#9b96aa', margin: 0 }} aria-live="off">
            {pick ? (
              <>
                <b style={{ color: '#ECEAF3' }}>Cave #{pick.born.toLocaleString()}</b> · {Math.round(pick.open * 100)}% open floor · longest route {Math.round(pick.route * (GW + GH))} steps ·{' '}
                <b style={{ color: COL.sea }}>{Math.round(pick.fit * 100)}% reachable</b>
                <br />
                Recipe: wall chance {pick.g.p.toFixed(2)}, {pick.g.steps} smoothing pass{pick.g.steps > 1 ? 'es' : ''}, wall rule {pick.g.birth}.{' '}
                {done ? 'Run finished. Select any tile to inspect it.' : 'Select any tile to hold it here.'}
              </>
            ) : 'Starting the search.'}
          </p>
        </div>
      </div>
    </div>
  )
}
