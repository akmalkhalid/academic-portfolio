'use client'

// Compact, NON-interactive production-scheduling embed for a paper's page.
// It plays a looping "recorded" run of the artificial-immune optimizer on a
// fresh random job-shop instance, compacting the Gantt chart (shrinking the
// makespan) generation by generation, then rolls a new instance. No controls —
// the full interactive version lives at /demos/production-scheduling. Honours
// reduced-motion (static frame) and pauses when scrolled off-screen.
import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import { FMSSim, DEFAULTS } from '@/lib/fms-sched-sim'

export default function ProductionScheduling({ accent = '#21b3a0' }: { accent?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const H = 300
    let dpr = 1
    const sim = new FMSSim(accent)
    sim.setParams({ ...DEFAULTS })

    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.max(320, cv!.getBoundingClientRect().width)
      cv!.width = W * dpr
      cv!.height = H * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      sim.resize(W, H)
      sim.buildInstance()
    }
    fit()

    if (reduce) {
      for (let i = 0; i < 70; i++) sim.step()
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
        if (frame % 5 === 0) {
          if (sim.gen < 90 && sim.stagnant < 34) sim.step()
          else if (++hold > 40) {
            hold = 0
            sim.buildInstance()
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
  }, [accent])

  return (
    <canvas
      ref={canvasRef}
      aria-label="Looping production-scheduling optimization (illustrative)"
      style={s('display:block;width:100%;height:300px;border-radius:10px')}
    />
  )
}
