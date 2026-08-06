'use client'

// Compact, NON-interactive agentic quest-generation embed for a paper's page.
// A genetic loop with a critic agent evolves a rough draft into a well-formed
// role-playing-game quest, redrawing the quest graph and its difficulty arc as
// the quality climbs, then rolls a fresh draft. No controls — the full
// interactive generator lives at /demos/quest-generation. Honours reduced-motion
// (static frame) and pauses when scrolled off-screen.
import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import { QuestGenSim, DEFAULTS } from '@/lib/quest-gen-sim'

export default function QuestGeneration({ accent = '#8b7bf0', height }: { accent?: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const H = height ?? 300

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
    const sim = new QuestGenSim(accent)
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
      for (let i = 0; i < 40; i++) sim.step()
      sim.draw(ctx)
      return
    }

    let raf = 0
    let visible = true
    let frame = 0
    let hold = 0
    const io = new IntersectionObserver(
      (en) => en.forEach((e) => (visible = e.isIntersecting)),
      { threshold: 0.06 },
    )
    io.observe(cv)

    const loop = () => {
      if (visible) {
        if (frame % 7 === 0) {
          if (sim.gen < 60 && sim.stagnant < 26) sim.step()
          else if (++hold > 44) {
            hold = 0
            sim.reset()
          }
        }
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
      aria-label="Looping agentic quest-generation (illustrative)"
      style={s(`display:block;width:100%;height:${H}px;border-radius:10px`)}
    />
  )
}
