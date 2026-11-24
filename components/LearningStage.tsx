'use client'

// LearningStage — the Teaching page's content as one 3D model that rearranges itself.
//
// Every course, training session, student and open resource is a small tile. Choosing a
// focus moves that group to the front in a structure that says something about the kind
// of learning it is; the other three groups shrink into a faint ring behind it.
//
//     Teaching      ->  HALL     rows on a curve, like seats in a lecture hall (structured, tiered)
//     Training      ->  HELIX    a spiral staircase, newest session at the top (hands-on, step by step)
//     Supervision   ->  ORBIT    two rings around a centre: main supervision inside, co outside (long, close)
//     Open learning ->  COMMONS  signposts on an open field (walk in anywhere, no gate)
//
// HOW IT WORKS
//   1. layout() gives every tile a position (x, y, z) for the current focus.
//   2. Each tile is a normal HTML link placed with CSS `translate3d`. When the focus
//      changes only that transform changes, and a CSS transition glides the tile to its new
//      place. That glide is the "fluid" part; no animation library is involved.
//   3. The whole model sits inside a wrapper that is tilted and slowly turned. Each tile's
//      face undoes that turn (a "billboard"), so text always faces the reader. The glide
//      (step 2) is on the tile, the counter-turn on its face: mixing them in one transform
//      would restart the glide on every frame.
//   4. Dragging turns the model. Reduced-motion visitors get the same arrangement, still.
//
// The page owns the focus (TeachingClient passes `focus` and `onFocus`), because the same
// choice also re-orders the sections underneath.

import { useEffect, useMemo, useRef, useState } from 'react'

export type Focus = 'teaching' | 'training' | 'supervision' | 'open'
export type StageTile = { group: Focus; kicker: string; title: string; href: string; inner?: boolean; /** greyed, not a link */ dim?: boolean }

export const FOCUS: Record<Focus, { label: string; col: string; shape: string; says: string; anchor: string }> = {
  teaching: { label: 'Teaching', col: '#8b7bf0', shape: 'Hall', says: 'Courses sit in rows, like a lecture hall: a set path, taken together, one level above the last.', anchor: 'teaching' },
  training: { label: 'Training', col: '#e0a03a', shape: 'Helix', says: 'Workshops climb like a staircase: short, hands-on steps, the newest at the top.', anchor: 'training' },
  supervision: { label: 'Supervision', col: '#4d8df0', shape: 'Orbit', says: 'Researchers circle one long question for years: main supervision on the inner ring, co-supervision on the outer.', anchor: 'supervision' },
  open: { label: 'Open learning', col: '#21b3a0', shape: 'Commons', says: 'Open material stands in an open field: no gate, no order, start anywhere.', anchor: 'open-learning' },
}
export const FOCUS_ORDER: Focus[] = ['teaching', 'training', 'supervision', 'open']

type Pos = { x: number; y: number; z: number; s: number; o: number }

/** Where tile number i of n goes, in the structure for its group. R is the model's radius in px. */
function place(shape: Focus, i: number, n: number, R: number, inner: boolean, k: { inner: number; outer: number; ni: number; no: number }): Pos {
  switch (shape) {
    case 'teaching': {                       // HALL: curved rows of five, each row higher and further back
      const perRow = R < 200 ? 3 : 5, row = Math.floor(i / perRow), inRow = Math.min(perRow, n - row * perRow)
      const a = ((i % perRow) - (inRow - 1) / 2) * (R < 200 ? 0.8 : 0.58), rad = R * 1.05 + row * R * 0.3
      return { x: Math.sin(a) * rad, y: R * (R < 200 ? 0.55 : 0.2) - row * R * 0.4, z: R * 0.75 - Math.cos(a) * rad, s: 1, o: 1 }
    }
    case 'training': {                       // HELIX: one step up and a 44° turn per tile
      const a = i * 0.77
      return { x: Math.cos(a) * R * 0.82, y: (i - (n - 1) / 2) * (R * 0.92 / Math.max(n, 6)), z: Math.sin(a) * R * 0.82, s: 0.9, o: 1 }
    }
    case 'supervision': {                    // ORBIT: two rings, slightly tipped against each other
      const idx = inner ? k.ni++ : k.no++, count = inner ? k.inner : k.outer
      const a = (idx / Math.max(count, 1)) * Math.PI * 2, rad = inner ? R * 0.62 : R * 1.08
      return { x: Math.cos(a) * rad, y: Math.sin(a) * (inner ? -R * 0.12 : R * 0.16), z: Math.sin(a) * rad, s: inner ? 1 : 0.9, o: 1 }
    }
    case 'open': {                           // COMMONS: a loose, staggered field; the first row is nearest
      const cols = R < 200 ? 2 : 4, row = Math.floor(i / cols), col = i % cols
      const rows = Math.ceil(n / cols), gapX = R < 200 ? 1.1 : 0.66
      return { x: (col - (cols - 1) / 2) * R * gapX + (row % 2 ? R * 0.14 : -R * 0.1), y: (row - (rows - 1) / 2) * R * (R < 200 ? 0.42 : 0.33) + R * 0.06, z: ((rows - 1) / 2 - row) * R * 0.4, s: 1, o: 1 }
    }
  }
}

export default function LearningStage({ tiles, focus, onFocus }: { tiles: StageTile[]; focus: Focus; onFocus: (f: Focus) => void }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef<HTMLDivElement>(null)
  const [R, setR] = useState(300)

  // The model's radius follows the width of the stage, so it fits a phone and a desktop.
  useEffect(() => {
    const box = boxRef.current!
    const fit = () => setR(Math.max(120, Math.min(310, box.clientWidth * (box.clientWidth < 520 ? 0.36 : 0.3))))
    fit(); const ro = new ResizeObserver(fit); ro.observe(box)
    return () => ro.disconnect()
  }, [])

  // 1. positions for every tile under the current focus
  const pos = useMemo(() => {
    const mine = tiles.filter((t) => t.group === focus)
    const k = { inner: mine.filter((t) => t.inner).length, outer: mine.filter((t) => !t.inner).length, ni: 0, no: 0 }
    const others = tiles.filter((t) => t.group !== focus).length
    let a = 0, b = 0
    return tiles.map((t): Pos => {
      if (t.group === focus) return place(focus, a++, mine.length, R, !!t.inner, k)
      // not in focus: a faint ring of small tiles on the floor, under the model
      const ang = (b++ / Math.max(others, 1)) * Math.PI * 2
      return { x: Math.cos(ang) * R * 1.3, y: R * 0.66, z: Math.sin(ang) * R * 1.3, s: 0.3, o: 0.2 }
    })
  }, [tiles, focus, R])

  // 3 + 4. slow turn, drag to turn. One CSS variable (--spin) is written per frame.
  useEffect(() => {
    const box = boxRef.current!, turn = turnRef.current!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const spins = focus === 'training' || focus === 'supervision'   // rings and spirals turn fully; rows and fields only sway
    let spin = 0, drag = 0, dragging = false, startX = 0, startDrag = 0, raf = 0, last = 0, seen = true, hover = false
    const io = new IntersectionObserver((e) => { seen = e[0].isIntersecting }); io.observe(box)
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(50, t - (last || t)); last = t
      if (!seen) return
      if (!reduce && !dragging && !hover) spin += dt * 0.006
      const angle = (spins ? spin : Math.sin(spin * 0.05) * 9) + drag
      turn.style.setProperty('--spin', angle.toFixed(2) + 'deg')
    }
    raf = requestAnimationFrame(frame)
    const down = (e: PointerEvent) => { if ((e.target as HTMLElement).closest('a')) return; dragging = true; startX = e.clientX; startDrag = drag; box.setPointerCapture(e.pointerId) }
    const move = (e: PointerEvent) => { if (dragging) drag = startDrag + (e.clientX - startX) * 0.35 }
    const up = () => { dragging = false }
    const enter = () => { hover = true }, leave = () => { hover = false }
    box.addEventListener('pointerdown', down); box.addEventListener('pointermove', move); box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up)
    box.addEventListener('mouseenter', enter); box.addEventListener('mouseleave', leave)
    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      box.removeEventListener('pointerdown', down); box.removeEventListener('pointermove', move); box.removeEventListener('pointerup', up); box.removeEventListener('pointercancel', up)
      box.removeEventListener('mouseenter', enter); box.removeEventListener('mouseleave', leave)
    }
  }, [focus])

  const tilt = { teaching: 10, training: 6, supervision: 20, open: 12 }[focus]
  const f = FOCUS[focus]

  return (
    <div className="ls">
      <div className="ls-tabs" role="tablist" aria-label="Choose a learning focus">
        {FOCUS_ORDER.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={focus === k} onClick={() => onFocus(k)} className="ls-tab" style={{ ['--c' as string]: FOCUS[k].col }}>
            <b>{FOCUS[k].label}</b>
            <span>{FOCUS[k].shape} · {tiles.filter((t) => t.group === k).length}</span>
          </button>
        ))}
      </div>
      <div ref={boxRef} className="ls-box" style={{ ['--c' as string]: f.col }}>
        {/* two wrappers on purpose: the tilt eases when the focus changes (CSS transition), the
            spin is rewritten every frame (no transition, or it would never catch up) */}
        <div className="ls-tilt" style={{ ['--tilt' as string]: tilt + 'deg' }}>
        <div ref={turnRef} className="ls-turn">
          {/* the centre of the orbit: only shown for Supervision */}
          <div className="ls-core" style={{ opacity: focus === 'supervision' ? 1 : 0 }}>one<br />question</div>
          {tiles.map((t, i) => {
            const p = pos[i], on = t.group === focus
            return (
              <a key={i} href={t.dim ? undefined : t.href} tabIndex={on && !t.dim ? 0 : -1} aria-hidden={on ? undefined : true} className={'ls-tile' + (t.dim ? ' ls-dim' : '')}
                style={{
                  ['--c' as string]: FOCUS[t.group].col,
                  transform: `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px) scale(${p.s})`,
                  opacity: p.o, pointerEvents: on && !t.dim ? 'auto' : 'none', transitionDelay: (i % 12) * 22 + 'ms',
                }}>
                {/* the face undoes the model's turn and tilt, so the text always faces the reader */}
                <span className="ls-face"><i>{t.kicker}</i><span>{t.title}</span></span>
              </a>
            )
          })}
        </div>
        </div>
        <div className="ls-say"><b>{f.shape}.</b> {f.says}</div>
        <div className="ls-hint">drag to turn · bright tiles are links</div>
      </div>
    </div>
  )
}
