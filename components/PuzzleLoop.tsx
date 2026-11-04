'use client'

// The signature demo: one Generative Optimization loop over Sudoku puzzles.
// GENERATE mutates an elite puzzle, EVALUATE plays it and computes its
// game-refinement value, SEARCH files it into a MAP-Elites archive.
// Engine: lib/puzzle-loop.ts (pure, deterministic per seed).
//
// Behaviour: pauses off-screen; with prefers-reduced-motion it pre-runs the
// search and shows a still archive until the visitor presses Play.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Archive, X_BINS, Y_BINS, GIVEN_MIN, GIVEN_BIN, GR_LO, GR_HI, zone,
  type Scored, type StepEvent,
} from '@/lib/puzzle-loop'

const C = { gen: '#8b7bf0', eva: '#f2683f', sea: '#21b3a0', text: '#ECEAF3', mute: '#9b96aa', dim: '#6f6a82', line: 'rgba(255,255,255,.08)' }
const mono = "'JetBrains Mono', monospace"
const OP_LABEL: Record<StepEvent['op'], string> = {
  seed: 'seeded a random puzzle', remove: 'removed givens', add: 'added a given', move: 'moved a given', mirror: 'mirrored a given',
}
// GR gauge spans this range; values outside are clamped to the ends.
const G_MIN = 0.04, G_MAX = 0.18
const gx = (gr: number) => Math.max(0, Math.min(1, (gr - G_MIN) / (G_MAX - G_MIN))) * 100

function cellColour(e: Scored | null) {
  if (!e) return 'rgba(255,255,255,.035)'
  const z = zone(e.gr)
  if (z === 'comfortable') return C.eva
  // fade toward the zone colour by how close the elite is to the comfortable band
  const a = (0.28 + 0.6 * e.quality).toFixed(2)
  return z === 'too easy' ? `rgba(33,179,160,${a})` : `rgba(139,123,240,${a})`
}

export default function PuzzleLoop({ compact = false }: { compact?: boolean }) {
  const archRef = useRef<Archive | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [, force] = useState(0)
  const [ev, setEv] = useState<StepEvent | null>(null)
  const [phase, setPhase] = useState(-1) // 0 generate · 1 evaluate · 2 search
  const [playing, setPlaying] = useState(true)
  const [fast, setFast] = useState(false)
  const [visible, setVisible] = useState(false)
  const [inspect, setInspect] = useState<number | null>(null)
  const [flash, setFlash] = useState<number | null>(null)

  const reset = useCallback((prerun = 0) => {
    const a = new Archive((Date.now() & 0xffff) + 1)
    for (let i = 0; i < prerun; i++) a.step()
    archRef.current = a
    setEv(null); setInspect(null); setPhase(-1); force((n) => n + 1)
  }, [])

  // create the archive on the client only (no hydration mismatch)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    reset(reduce ? 900 : 40)
    if (reduce) setPlaying(false)
    const io = new IntersectionObserver(([en]) => setVisible(en.isIntersecting), { threshold: 0.15 })
    if (rootRef.current) io.observe(rootRef.current)
    return () => io.disconnect()
  }, [reset])

  // the loop clock
  useEffect(() => {
    if (!playing || !visible || !archRef.current) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const tick = () => {
      const a = archRef.current!
      let last: StepEvent | null = null
      // normal pace shows every 4th evaluation so the comfort zone appears within
      // about a minute; ×25 runs 25× the evaluations per second
      const n = fast ? 25 : 4
      for (let i = 0; i < n; i++) {
        const e = a.step()
        if (e.child) last = e
      }
      if (!last) return
      setEv(last); setInspect(null)
      setPhase(0)
      timers.push(setTimeout(() => setPhase(1), fast ? 60 : 320))
      timers.push(setTimeout(() => {
        setPhase(2)
        if (last!.child && (last!.outcome === 'new niche' || last!.outcome === 'improved')) {
          setFlash(last!.child.y * X_BINS + last!.child.x)
          timers.push(setTimeout(() => setFlash(null), 380))
        }
        force((k) => k + 1)
      }, fast ? 120 : 640))
    }
    tick()
    const id = setInterval(tick, fast ? 220 : 900)
    return () => { clearInterval(id); timers.forEach(clearTimeout) }
  }, [playing, visible, fast])

  const a = archRef.current
  const shown: Scored | null = inspect != null && a ? a.cells[inspect] : ev?.child ?? null
  const parent = inspect == null ? ev?.parent ?? null : null
  const cellSize = compact ? 22 : 26

  const stagePill = (i: number, label: string, col: string) => (
    <span key={label} style={{
      fontFamily: mono, fontSize: 11, fontWeight: 600, letterSpacing: '.08em', padding: '5px 10px', borderRadius: 6,
      color: phase === i ? '#0f0e14' : col, background: phase === i ? col : 'transparent',
      border: `1px solid ${phase === i ? col : col + '55'}`, transition: 'all .2s',
    }}>{label}</span>
  )

  const btn: React.CSSProperties = { fontFamily: mono, fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '7px 12px', borderRadius: 7, border: `1px solid ${C.line}`, background: 'rgba(255,255,255,.06)', color: C.text }

  return (
    <div ref={rootRef} className="ploop" style={{ color: C.text }}>
      {/* stage strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {stagePill(0, 'GENERATE', C.gen)}<span style={{ color: C.dim }}>→</span>
        {stagePill(1, 'EVALUATE', C.eva)}<span style={{ color: C.dim }}>→</span>
        {stagePill(2, 'SEARCH', C.sea)}<span style={{ color: C.dim }}>↺</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" style={btn} onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" style={{ ...btn, ...(fast ? { background: C.sea, color: '#0f0e14', borderColor: C.sea } : {}) }} onClick={() => setFast((f) => !f)} aria-pressed={fast}>×25</button>
          <button type="button" style={btn} onClick={() => reset(40)}>Reset</button>
        </span>
      </div>

      <div className="ploop-grid">
        {/* LEFT — the candidate and its evaluation */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.dim, letterSpacing: '.08em', marginBottom: 8 }}>
            {inspect != null ? 'ELITE IN THIS NICHE' : 'CANDIDATE'} {shown ? `· ${shown.nGivens} givens` : ''}
          </div>
          <div role="img" aria-label={shown ? `Sudoku puzzle with ${shown.nGivens} givens` : 'Empty puzzle'}
            style={{ display: 'grid', gridTemplateColumns: `repeat(9, ${cellSize}px)`, width: 'max-content', border: `2px solid ${C.mute}`, borderRadius: 4, background: '#14121c' }}>
            {Array.from({ length: 81 }, (_, i) => {
              const v = shown?.givens[i] || 0
              const added = parent && v && !parent.givens[i]
              const removed = parent && !v && parent.givens[i]
              const r = (i / 9) | 0, c = i % 9
              return (
                <div key={i} style={{
                  width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: mono, fontSize: compact ? 11 : 12.5, fontWeight: 600,
                  color: added ? '#fff' : '#d8d4e6',
                  background: added ? C.gen : removed ? 'rgba(139,123,240,.16)' : 'transparent',
                  borderRight: c === 8 ? 'none' : `1px solid ${c % 3 === 2 ? C.mute : 'rgba(255,255,255,.07)'}`,
                  borderBottom: r === 8 ? 'none' : `1px solid ${r % 3 === 2 ? C.mute : 'rgba(255,255,255,.07)'}`,
                  transition: 'background .25s',
                }}>{v || ''}</div>
              )
            })}
          </div>
          <div style={{ fontFamily: mono, fontSize: 11.5, color: C.gen, margin: '10px 0 16px', minHeight: 16 }}>
            {inspect == null && ev ? `generator ${OP_LABEL[ev.op]}` : ''}
          </div>

          {/* GR gauge */}
          <div style={{ fontFamily: mono, fontSize: 11, color: C.dim, letterSpacing: '.08em', marginBottom: 8 }}>GAME REFINEMENT · GR = √G / T</div>
          <div style={{ position: 'relative', height: 14, borderRadius: 7, background: 'linear-gradient(90deg, rgba(139,123,240,.5), rgba(255,255,255,.08) 40%, rgba(33,179,160,.5))' }}>
            <div title="comfortable zone" style={{ position: 'absolute', top: -3, bottom: -3, left: `${gx(GR_LO)}%`, width: `${gx(GR_HI) - gx(GR_LO)}%`, background: C.eva, borderRadius: 4, opacity: 0.9 }} />
            {shown && (
              <div style={{ position: 'absolute', top: -6, left: `calc(${gx(shown.gr)}% - 2px)`, width: 4, height: 26, borderRadius: 2, background: '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,.18)', transition: phase === 1 || inspect != null ? 'left .35s cubic-bezier(.22,.61,.36,1)' : 'none' }} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10, color: C.dim, marginTop: 7 }}>
            <span>too hard</span><span style={{ color: C.eva }}>comfortable 0.07–0.08</span><span>too easy</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 12, color: C.text, marginTop: 12, minHeight: 34, lineHeight: 1.5 }}>
            {shown ? (
              <>GR <b>{shown.gr.toFixed(3)}</b> · <span style={{ color: zone(shown.gr) === 'comfortable' ? C.eva : C.mute }}>{zone(shown.gr)}</span><br />
                <span style={{ color: C.dim }}>G {shown.G} cells placed · T {shown.T} candidates weighed{shown.guesses ? ` · ${shown.guesses} guess${shown.guesses > 1 ? 'es' : ''}` : ''}</span></>
            ) : <span style={{ color: C.dim }}>waiting for the first candidate…</span>}
          </div>
        </div>

        {/* RIGHT — the MAP-Elites archive */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.dim, letterSpacing: '.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span>MAP-ELITES ARCHIVE · click a niche</span>
            <span style={{ color: C.sea, minHeight: 14 }}>{phase === 2 && ev && inspect == null ? ev.outcome : ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: mono, fontSize: 10, color: C.dim, textAlign: 'center' }}>symmetry →</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${X_BINS}, 1fr)`, gap: 4 }}>
                {Array.from({ length: X_BINS * Y_BINS }, (_, n) => {
                  // draw high symmetry at the top
                  const yy = Y_BINS - 1 - Math.floor(n / X_BINS), xx = n % X_BINS
                  const k = yy * X_BINS + xx
                  const e = a?.cells[k] ?? null
                  const isCur = phase === 2 && ev?.child && ev.child.y * X_BINS + ev.child.x === k
                  return (
                    <button key={n} type="button" disabled={!e}
                      onClick={() => { setPlaying(false); setInspect(k) }}
                      aria-label={e ? `Niche with ${e.nGivens} givens, GR ${e.gr.toFixed(3)}, ${zone(e.gr)}` : 'Empty niche'}
                      style={{
                        aspectRatio: '1.7', border: inspect === k ? '2px solid #fff' : isCur ? `2px solid ${C.text}` : '1px solid rgba(255,255,255,.05)',
                        borderRadius: 5, background: cellColour(e), cursor: e ? 'pointer' : 'default', padding: 0,
                        transform: flash === k ? 'scale(1.18)' : 'none', transition: 'transform .25s, background .4s',
                      }} />
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10, color: C.dim, marginTop: 7 }}>
                <span>{GIVEN_MIN} givens</span><span>← fewer clues · more clues →</span><span>{GIVEN_MIN + X_BINS * GIVEN_BIN - 1}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: mono, fontSize: 10.5, color: C.mute, marginTop: 14 }}>
            <span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: C.eva, marginRight: 6 }} />comfortable</span>
            <span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: C.sea, marginRight: 6 }} />too easy</span>
            <span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: C.gen, marginRight: 6 }} />too hard</span>
          </div>

          <div className="ploop-stats">
            {[
              { k: 'Puzzles evaluated', v: a?.evals ?? 0 },
              { k: 'Niches filled', v: `${a?.filled.length ?? 0} / ${X_BINS * Y_BINS}` },
              { k: 'In comfort zone', v: a?.comfortable ?? 0 },
            ].map((st) => (
              <div key={st.k}>
                <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize: 24, lineHeight: 1 }}>{st.v}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.dim, marginTop: 6, letterSpacing: '.04em' }}>{st.k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
