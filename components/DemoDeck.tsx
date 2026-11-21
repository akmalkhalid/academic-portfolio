'use client'

// The home page's live demo as a two-sided 3D viewer.
//
// Both sides run the SAME Generative Optimization loop (generate, evaluate, search with a
// MAP-Elites archive). Only the design problem changes:
//   front  Sudoku puzzles, tuned for how engaging they are     components/PuzzleLoop.tsx
//   back   game levels (caves), explored for variety           components/LevelEngine.tsx
//
// How the flip works (styles: .deck-* in app/globals.css)
//   - The two faces sit in the same grid cell, back to back. The back face is pre-rotated 180deg.
//   - Turning the whole card 180deg around its vertical axis brings the other face forward.
//   - `backface-visibility: hidden` hides whichever face points away from the viewer.
//   - While a face is hidden its demo is paused and it is `inert` (no focus, no clicks).
//   - Once a turn has finished the hidden face is collapsed, so the card is only as tall as
//     the demo you are looking at.

import { useEffect, useRef, useState } from 'react'
import PuzzleLoop from '@/components/PuzzleLoop'
import LevelEngine from '@/components/LevelEngine'

type Side = 'puzzle' | 'level'
const TURN_MS = 900

const SIDES: { id: Side; label: string; sub: string }[] = [
  { id: 'puzzle', label: 'Sudoku puzzles', sub: 'tuned for engagement' },
  { id: 'level', label: 'Game levels', sub: 'explored for variety' },
]

const COPY: Record<Side, { lede: string; note: React.ReactNode }> = {
  puzzle: {
    lede: 'A generator edits Sudoku puzzles, a simulated player rates how engaging each one is, and a search archive keeps the best puzzle for every style. Most designs land too easy; watch the search find the narrow comfortable zone.',
    note: (
      <>
        An illustrative teaching model of my work on{' '}
        <a href="/publications/2025-Khalid2025a">puzzle generation</a> and{' '}
        <a href="/publications/2020-Iida2020">game refinement</a>: the generator here makes random edits where the research
        uses AI agents, and GR = √G / T is a simplified measure (G cells placed, T candidate values weighed).
      </>
    ),
  },
  level: {
    lede: 'The same loop, a different problem. A recipe grows a cave level, a flood-fill test measures how much of it a player can reach, and the archive keeps the most playable cave for every style, from cramped to open and from short routes to long ones.',
    note: (
      <>
        An illustrative model of quality-diversity search for{' '}
        <a href="/research/#ideas">procedural content generation</a>: caves are grown with a cellular automaton, and
        each tile is one of 108 styles. Teal floor is reachable; coral floor is cut off.
      </>
    ),
  },
}

export default function DemoDeck() {
  const [side, setSide] = useState<Side>('puzzle')
  const [turning, setTurning] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const show = (next: Side) => {
    if (next === side) return
    setSide(next)
    setTurning(true)                                   // both faces keep their height while the card turns
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTurning(false), TURN_MS)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const face = (id: Side, child: React.ReactNode) => {
    const active = side === id
    return (
      <div
        className={`deck-face deck-${id}${!active && !turning ? ' deck-rest' : ''}`}
        aria-hidden={!active}
        {...(!active ? ({ inert: '' } as object) : {})}   /* React 18 needs the attribute written as a string */
      >
        {child}
      </div>
    )
  }

  return (
    <div className="deck-wrap">
      <div className="deck-tabs" role="tablist" aria-label="Design problem">
        {SIDES.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={side === t.id} className="deck-tab" onClick={() => show(t.id)}>
            <b>{t.label}</b><span>{t.sub}</span>
          </button>
        ))}
        <button type="button" className="deck-turn" onClick={() => show(side === 'puzzle' ? 'level' : 'puzzle')} aria-label="Turn the viewer to the other design problem">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 4v6h-6l2.3-2.3A6 6 0 1 0 18 12h2a8 8 0 0 1-16 0z" fill="currentColor" /></svg>
          Turn
        </button>
      </div>
      <p className="deck-lede">{COPY[side].lede}</p>
      <div className="deck" data-side={side}>
        <div className="deck-card">
          {face('puzzle', <PuzzleLoop paused={side !== 'puzzle'} />)}
          {face('level', <LevelEngine paused={side !== 'level'} />)}
        </div>
      </div>
      <p className="deck-note">{COPY[side].note}</p>
    </div>
  )
}
