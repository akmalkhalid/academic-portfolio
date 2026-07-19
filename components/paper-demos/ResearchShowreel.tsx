'use client'

// Project-teaser-style showreel for the home page "see the research run" block.
// Features one research-driven simulation at a time on a large dark stage, auto-
// advancing every few seconds with a cinematic fade-through reveal. Only the
// active sim's canvas is mounted, so exactly one requestAnimationFrame loop runs.
// Auto-advance pauses on hover, when scrolled off-screen, and under reduced motion
// (which shows a single static slide). Progress dots + prev/next allow manual jumps.
import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import CrowdEvacuation from '@/components/paper-demos/CrowdEvacuation'
import AssemblyLineBalancing from '@/components/paper-demos/AssemblyLineBalancing'
import ProductionScheduling from '@/components/paper-demos/ProductionScheduling'
import GameRefinement from '@/components/paper-demos/GameRefinement'
import QuestGeneration from '@/components/paper-demos/QuestGeneration'

const stack = "'Space Grotesk', system-ui, sans-serif"
const mono = "'JetBrains Mono', monospace"

type Slide = {
  key: string
  href: string
  eyebrow: string
  accent: string
  title: string
  note: string
  render: (accent: string) => JSX.Element
}

// Newest research first, matching the /demos gallery ordering.
const SLIDES: Slide[] = [
  {
    key: 'quest-generation',
    href: '/demos/quest-generation/',
    eyebrow: 'Generative AI · agentic',
    accent: '#8b7bf0',
    title: 'Agentic content generation',
    note: 'Generator and critic agents evolve a rough draft into a well-formed quest, matching a target difficulty arc.',
    render: (a) => <QuestGeneration accent={a} />,
  },
  {
    key: 'game-refinement',
    href: '/demos/game-refinement/',
    eyebrow: 'Games & simulation · self-play',
    accent: '#f2683f',
    title: 'Game refinement',
    note: 'A game plays itself; its refinement value settles on the engagement spectrum toward the comfortable zone.',
    render: (a) => <GameRefinement accent={a} />,
  },
  {
    key: 'assembly-line-balancing',
    href: '/demos/assembly-line-balancing/',
    eyebrow: 'Optimization · immune algorithm',
    accent: '#4d8df0',
    title: 'Assembly line balancing',
    note: 'An artificial immune system packs precedence-constrained tasks into stations, raising line efficiency.',
    render: (a) => <AssemblyLineBalancing accent={a} />,
  },
  {
    key: 'crowd-evacuation',
    href: '/demos/crowd-evacuation/',
    eyebrow: 'Optimization · agent-based',
    accent: '#4d8df0',
    title: 'Crowd evacuation',
    note: 'A navigation field routes shoppers to the exits while congestion and panic reshape the flow.',
    render: (a) => <CrowdEvacuation accent={a} />,
  },
  {
    key: 'production-scheduling',
    href: '/demos/production-scheduling/',
    eyebrow: 'Optimization · immune algorithm',
    accent: '#21b3a0',
    title: 'Production scheduling',
    note: 'Operations reorder around maintenance windows, compacting the Gantt chart to cut the makespan.',
    render: (a) => <ProductionScheduling accent={a} />,
  },
]

const DWELL = 6200 // ms a slide holds before advancing
const FADE = 360 // ms fade-through duration

export default function ResearchShowreel() {
  const [idx, setIdx] = useState(0)
  const [shown, setShown] = useState(true)
  const pausedRef = useRef(false)
  const visRef = useRef(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const swapRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cur = SLIDES[idx]

  // Fade the current slide out, swap to `next`, fade back in.
  const swapTo = (next: number) => {
    if (swapRef.current) clearTimeout(swapRef.current)
    setShown(false)
    swapRef.current = setTimeout(() => {
      setIdx(((next % SLIDES.length) + SLIDES.length) % SLIDES.length)
      setShown(true)
    }, FADE)
  }

  // Pause auto-advance while off-screen so the reel doesn't churn unseen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (en) => en.forEach((e) => (visRef.current = e.isIntersecting)),
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Master auto-advance clock. Recursive setTimeout so pause / off-screen simply
  // defer the next advance rather than fighting an interval.
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const schedule = (ms: number) => {
      timer = setTimeout(step, ms)
    }
    const step = () => {
      if (!alive) return
      if (pausedRef.current || !visRef.current) {
        schedule(600) // re-check shortly instead of advancing
        return
      }
      setShown(false)
      swapRef.current = setTimeout(() => {
        if (!alive) return
        setIdx((i) => (i + 1) % SLIDES.length)
        setShown(true)
        schedule(DWELL)
      }, FADE)
    }
    schedule(DWELL)
    return () => {
      alive = false
      clearTimeout(timer)
      if (swapRef.current) clearTimeout(swapRef.current)
    }
  }, [])

  const arrow = (dir: -1 | 1) =>
    s(
      `width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;` +
        `border:1px solid rgba(255,255,255,.14);border-radius:8px;background:rgba(255,255,255,.04);` +
        `color:#c9c4d6;font-size:15px;line-height:1;cursor:pointer;user-select:none`,
    )

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      style={s(
        `border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);` +
          `background:radial-gradient(120% 120% at 50% 0%,#171528 0%,#0e0d16 72%)`,
      )}
    >
      {/* Stage header — eyebrow + title, colour-shifted per slide */}
      <div style={s('display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 20px 12px')}>
        <div
          style={s(
            `transition:opacity ${FADE}ms ease, transform ${FADE}ms ease;` +
              `opacity:${shown ? '1' : '0'};transform:translateY(${shown ? '0' : '6px'})`,
          )}
        >
          <p style={s(`font-family:${mono};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${cur.accent};margin:0 0 5px`)}>{cur.eyebrow}</p>
          <h3 style={s(`font-family:${stack};font-weight:600;font-size:20px;letter-spacing:-.01em;color:#ECEAF3;margin:0`)}>{cur.title}</h3>
        </div>
        <span style={s(`font-family:${mono};font-size:11px;color:#6f6a82;white-space:nowrap;padding-top:3px`)}>{idx + 1} / {SLIDES.length}</span>
      </div>

      {/* Stage — only the active sim canvas is mounted */}
      <div style={s('position:relative;height:320px;margin:0 20px;border-radius:12px;overflow:hidden;background:#0b0a12')}>
        <div
          style={s(
            `position:absolute;inset:0;display:flex;align-items:center;` +
              `transition:opacity ${FADE}ms ease;opacity:${shown ? '1' : '0'}`,
          )}
        >
          <div key={cur.key} style={s('width:100%')}>
            {cur.render(cur.accent)}
          </div>
        </div>
      </div>

      {/* Caption + controls */}
      <div style={s('padding:14px 20px 18px')}>
        <p
          style={s(
            `font-size:13px;line-height:1.55;color:#9b96aa;margin:0 0 14px;min-height:40px;max-width:640px;` +
              `transition:opacity ${FADE}ms ease;opacity:${shown ? '1' : '0'}`,
          )}
        >
          {cur.note}
        </p>
        <div style={s('display:flex;align-items:center;gap:12px;flex-wrap:wrap')}>
          <div style={s('display:flex;gap:8px')}>
            <button type="button" aria-label="Previous demo" onClick={() => swapTo(idx - 1)} style={arrow(-1)}>‹</button>
            <button type="button" aria-label="Next demo" onClick={() => swapTo(idx + 1)} style={arrow(1)}>›</button>
          </div>
          <div style={s('display:flex;gap:7px;align-items:center;flex:1')}>
            {SLIDES.map((sl, i) => (
              <button
                key={sl.key}
                type="button"
                aria-label={`Show ${sl.title}`}
                onClick={() => swapTo(i)}
                style={s(
                  `height:8px;border:none;border-radius:99px;cursor:pointer;padding:0;` +
                    `transition:width ${FADE}ms ease, background ${FADE}ms ease;` +
                    `width:${i === idx ? '26px' : '8px'};background:${i === idx ? sl.accent : 'rgba(255,255,255,.18)'}`,
                )}
              />
            ))}
          </div>
          <a
            href={cur.href}
            style={s(
              `font-family:${mono};font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;` +
                `color:#0a0910;background:${cur.accent};padding:8px 14px;border-radius:8px;` +
                `transition:background ${FADE}ms ease`,
            )}
          >
            Open the full simulation →
          </a>
        </div>
      </div>
    </div>
  )
}
