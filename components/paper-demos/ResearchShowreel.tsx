'use client'

// Slow-moving showreel for the home page "see the research run" block.
// The research-driven simulations ride a horizontal track that eases gently from
// one panel to the next on a slow cadence (seamless infinite loop via a trailing
// clone), and a soft light drifts across the stage so the panel is never fully
// static. Each compact sim pauses its own requestAnimationFrame loop when it is
// translated out of view, so only the panel(s) actually on screen animate. Auto-
// advance pauses on hover, off-screen, and under reduced motion (static slide 0).
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

const N = SLIDES.length
const DWELL = 5200 // ms a panel dwells before the track eases on
const GLIDE = 1500 // ms the track takes to ease to the next panel

export default function ResearchShowreel() {
  // idx runs 0..N; index N is a trailing clone of slide 0 for a seamless wrap.
  const [idx, setIdx] = useState(0)
  const [glide, setGlide] = useState(true) // whether the track transition is armed
  const pausedRef = useRef(false)
  const visRef = useRef(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceRef = useRef(false)

  const real = idx % N
  const cur = SLIDES[real]
  const panels = [...SLIDES, SLIDES[0]] // trailing clone

  // Pause auto-advance while the section is off-screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (en) => en.forEach((e) => (visRef.current = e.isIntersecting)),
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Slow auto-advance. Recursive setTimeout so pause / off-screen just defers.
  useEffect(() => {
    reduceRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceRef.current) return

    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const schedule = (ms: number) => {
      timer = setTimeout(step, ms)
    }
    const step = () => {
      if (!alive) return
      if (pausedRef.current || !visRef.current) {
        schedule(700)
        return
      }
      setGlide(true)
      setIdx((i) => i + 1)
      schedule(DWELL + GLIDE)
    }
    schedule(DWELL)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  // When the track reaches the trailing clone, snap back to the real slide 0 with
  // the transition disarmed so the loop is seamless, then re-arm on the next frame.
  const onGlideEnd = () => {
    if (idx === N) {
      setGlide(false)
      setIdx(0)
      requestAnimationFrame(() => requestAnimationFrame(() => setGlide(true)))
    }
  }

  // Manual navigation.
  const goNext = () => {
    setGlide(true)
    setIdx((i) => (i >= N ? 1 : i + 1))
  }
  const goPrev = () => {
    if (idx <= 0) {
      // jump to the clone (visually identical to slide 0), then glide left to N-1
      setGlide(false)
      setIdx(N)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setGlide(true)
          setIdx(N - 1)
        }),
      )
    } else {
      setGlide(true)
      setIdx((i) => i - 1)
    }
  }
  const goTo = (t: number) => {
    setGlide(true)
    setIdx(t)
  }

  const arrow = () =>
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
      style={s('border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:#0e0d16')}
    >
      <style
        dangerouslySetInnerHTML={{
          __html:
            '@keyframes reelDrift{0%{transform:translate3d(-14%,-6%,0)}100%{transform:translate3d(14%,6%,0)}}' +
            '@media (prefers-reduced-motion: reduce){.reel-track{transition:none!important}.reel-glow{animation:none!important}}',
        }}
      />

      {/* Viewport clips the sliding track */}
      <div style={s('position:relative;overflow:hidden')}>
        {/* Soft light that slowly drifts so the panel is never fully static */}
        <div
          className="reel-glow"
          aria-hidden
          style={s(
            `position:absolute;inset:-20% -10%;z-index:0;pointer-events:none;` +
              `background:radial-gradient(38% 55% at 50% 40%, ${cur.accent}22 0%, transparent 70%);` +
              `animation:reelDrift 17s ease-in-out infinite alternate;transition:background ${GLIDE}ms ease`,
          )}
        />

        <div
          className="reel-track"
          onTransitionEnd={onGlideEnd}
          style={s(
            `position:relative;z-index:1;display:flex;width:${panels.length * 100}%;` +
              `transform:translate3d(-${idx * (100 / panels.length)}%,0,0);` +
              `transition:${glide ? `transform ${GLIDE}ms cubic-bezier(.5,0,.2,1)` : 'none'}`,
          )}
        >
          {panels.map((sl, i) => (
            <div key={i} style={s(`flex:0 0 ${100 / panels.length}%;padding:18px 20px 10px`)}>
              {/* Panel header */}
              <div style={s('display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px')}>
                <div>
                  <p style={s(`font-family:${mono};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${sl.accent};margin:0 0 5px`)}>{sl.eyebrow}</p>
                  <h3 style={s(`font-family:${stack};font-weight:600;font-size:20px;letter-spacing:-.01em;color:#ECEAF3;margin:0`)}>{sl.title}</h3>
                </div>
                <span style={s(`font-family:${mono};font-size:11px;color:#6f6a82;white-space:nowrap;padding-top:3px`)}>{(i % N) + 1} / {N}</span>
              </div>

              {/* Stage */}
              <div style={s('height:320px;border-radius:12px;overflow:hidden;background:#0b0a12;display:flex;align-items:center')}>
                <div style={s('width:100%')}>{sl.render(sl.accent)}</div>
              </div>

              {/* Caption */}
              <p style={s(`font-size:13px;line-height:1.55;color:#9b96aa;margin:12px 0 0;min-height:38px;max-width:640px`)}>{sl.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={s('display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:6px 20px 18px')}>
        <div style={s('display:flex;gap:8px')}>
          <button type="button" aria-label="Previous demo" onClick={goPrev} style={arrow()}>‹</button>
          <button type="button" aria-label="Next demo" onClick={goNext} style={arrow()}>›</button>
        </div>
        <div style={s('display:flex;gap:7px;align-items:center;flex:1')}>
          {SLIDES.map((sl, i) => (
            <button
              key={sl.key}
              type="button"
              aria-label={`Show ${sl.title}`}
              onClick={() => goTo(i)}
              style={s(
                `height:8px;border:none;border-radius:99px;cursor:pointer;padding:0;` +
                  `transition:width ${GLIDE}ms ease, background ${GLIDE}ms ease;` +
                  `width:${i === real ? '26px' : '8px'};background:${i === real ? sl.accent : 'rgba(255,255,255,.18)'}`,
              )}
            />
          ))}
        </div>
        <a
          href={cur.href}
          style={s(
            `font-family:${mono};font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;` +
              `color:#0a0910;background:${cur.accent};padding:8px 14px;border-radius:8px;transition:background ${GLIDE}ms ease`,
          )}
        >
          Open the full simulation →
        </a>
      </div>
    </div>
  )
}
