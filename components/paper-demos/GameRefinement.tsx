'use client'

// Compact, NON-interactive game-refinement embed for a paper's page. It plays a
// looping self-play run: the abstract game plays itself, the game-refinement
// value settles on the comfortable-zone spectrum, and the game-progress curve
// animates. No controls — the full interactive tuner lives at
// /demos/game-refinement. Honours reduced-motion (static frame) and pauses when
// scrolled off-screen.
import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import { GRSim, DEFAULTS } from '@/lib/game-refinement-sim'

export default function GameRefinement({ accent = '#f2683f', height }: { accent?: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const H = height ?? 320

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let dpr = 1
    const sim = new GRSim(accent)
    sim.setParams({ ...DEFAULTS })

    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.max(320, cv!.getBoundingClientRect().width)
      cv!.width = W * dpr
      cv!.height = H * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      sim.resize(W, H)
      sim.reset()
    }
    fit()

    if (reduce) {
      sim.draw(ctx)
      return
    }

    let raf = 0
    let visible = true
    let frame = 0
    const io = new IntersectionObserver(
      (en) => en.forEach((e) => (visible = e.isIntersecting)),
      { threshold: 0.06 },
    )
    io.observe(cv)

    const loop = () => {
      if (visible) {
        if (frame % 4 === 0) sim.step()
        sim.draw(ctx)
        frame++
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onResize = () => fit()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [accent, H])

  return (
    <canvas
      ref={canvasRef}
      aria-label="Looping game-refinement self-play (illustrative)"
      style={s(`display:block;width:100%;height:${H}px;border-radius:10px`)}
    />
  )
}
