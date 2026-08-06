'use client'

// Compact, NON-interactive crowd-evacuation embed for a paper's page.
// It plays a looping "recorded" run of the simulation with fixed defaults — no
// sliders, no controls, no editing — to keep the paper page simple. The full
// interactive version lives at /demos/crowd-evacuation. Honours reduced-motion
// (renders a single static frame) and pauses when scrolled off-screen.
import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import { EvacSim, DEFAULTS } from '@/lib/evac-sim'

export default function CrowdEvacuation({ accent = '#4d8df0', height }: { accent?: string; height?: number }) {
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
    const sim = new EvacSim(accent)
    sim.setParams({ ...DEFAULTS, crowd: 200, panic: 0.35 })

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
      for (let i = 0; i < 140; i++) sim.step() // a representative mid-evacuation frame
      sim.draw(ctx, { hotspots: false })
      return
    }

    let raf = 0
    let visible = true
    let idle = 0
    const io = new IntersectionObserver(
      (en) => en.forEach((e) => (visible = e.isIntersecting)),
      { threshold: 0.05 },
    )
    io.observe(cv)

    const loop = () => {
      if (visible) {
        if (sim.agents.length > 0) sim.step()
        else if (++idle > 90) {
          idle = 0
          sim.reset()
        }
        sim.draw(ctx)
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
      aria-label="Looping crowd-evacuation simulation (illustrative)"
      style={s(`display:block;width:100%;height:${H}px;border-radius:10px`)}
    />
  )
}
