'use client'

// Compact, NON-interactive assembly-line-balancing embed for a paper's page.
// It plays a looping "recorded" run of the artificial-immune optimizer on a
// fresh random instance, rebalancing the line generation by generation, then
// rolls a new instance. No sliders/controls — the full interactive version
// lives at /demos/assembly-line-balancing. Honours reduced-motion (static
// frame) and pauses when scrolled off-screen.
import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import { ALBPSim, DEFAULTS } from '@/lib/albp-sim'

export default function AssemblyLineBalancing({ accent = '#4d8df0' }: { accent?: string }) {
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
    const sim = new ALBPSim(accent)
    sim.setParams({ ...DEFAULTS, nTasks: 20 })

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
      for (let i = 0; i < 60; i++) sim.step()
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
        // ~1 generation every 6 frames so the rebalancing is watchable
        if (frame % 6 === 0) {
          if (sim.gen < 70 && sim.stagnant < 26) sim.step()
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
      aria-label="Looping assembly-line-balancing optimization (illustrative)"
      style={s('display:block;width:100%;height:300px;border-radius:10px')}
    />
  )
}
