'use client'

// Generic runtime for a pillar demo. Given an engine factory, it owns canvas
// fitting (DPR-aware), the requestAnimationFrame loop, off-screen pausing via
// IntersectionObserver, and reduced-motion handling (one settled frame). In
// interactive mode it also wires pointer input and exposes Play/Pause, a Reset
// control, and live stat readouts from the engine.
import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import type { DemoEngine, DemoFactory, DemoStat } from '@/lib/demos/types'

export default function DemoCanvas({
  create,
  accent = '#4d8df0',
  height = 200,
  interactive = false,
}: {
  create: DemoFactory
  accent?: string
  height?: number
  interactive?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [stats, setStats] = useState<DemoStat[]>([])
  const [hasReset, setHasReset] = useState(false)
  const [resetLabel, setResetLabel] = useState('Reset')
  const playingRef = useRef(true)
  playingRef.current = playing
  const engineRef = useRef<DemoEngine | null>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(!!reduce)

    const engine = create(accent)
    engineRef.current = engine
    setHasReset(interactive && typeof engine.reset === 'function')
    setResetLabel(engine.resetLabel || 'Reset')
    const showStats = interactive && typeof engine.stats === 'function'

    let dpr = 1
    let W = 0
    let H = height
    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.max(240, cv!.getBoundingClientRect().width)
      cv!.width = W * dpr
      cv!.height = H * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      engine.resize(W, H)
    }
    fit()

    if (reduce) {
      if (engine.settle) engine.settle()
      engine.draw(ctx)
      if (showStats) setStats(engine.stats!())
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
      if (visible && playingRef.current) engine.step()
      engine.draw(ctx)
      if (showStats && frame % 6 === 0) setStats(engine.stats!())
      frame++
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    let onDown: ((e: PointerEvent) => void) | null = null
    let onMove: ((e: PointerEvent) => void) | null = null
    let onLeave: (() => void) | null = null
    if (interactive && engine.pointer) {
      const rel = (e: PointerEvent) => {
        const r = cv.getBoundingClientRect()
        return { x: e.clientX - r.left, y: e.clientY - r.top }
      }
      onDown = (e) => { const p = rel(e); engine.pointer!(p.x, p.y, 'down') }
      onMove = (e) => { const p = rel(e); engine.pointer!(p.x, p.y, 'move') }
      onLeave = () => engine.pointer!(-1, -1, 'leave')
      cv.addEventListener('pointerdown', onDown)
      cv.addEventListener('pointermove', onMove)
      cv.addEventListener('pointerleave', onLeave)
    }

    const onResize = () => fit()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      if (onDown) cv.removeEventListener('pointerdown', onDown)
      if (onMove) cv.removeEventListener('pointermove', onMove)
      if (onLeave) cv.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [create, accent, height, interactive])

  const btn = (on: boolean) =>
    `font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;padding:8px 14px;border-radius:8px;border:1px solid ${on ? accent : 'rgba(255,255,255,.16)'};background:${on ? accent : 'transparent'};color:${on ? '#0a0910' : '#cfcad9'}`

  return (
    <div>
      <canvas
        ref={canvasRef}
        aria-label="Interactive research demonstration"
        style={s(`display:block;width:100%;height:${height}px;border-radius:10px;${interactive ? 'cursor:crosshair' : ''}`)}
      />
      {interactive && !reduced && (
        <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px')}>
          <button type="button" onClick={() => setPlaying((v) => !v)} style={s(btn(true))}>
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          {hasReset && (
            <button type="button" onClick={() => engineRef.current?.reset?.()} style={s(btn(false))}>
              {resetLabel}
            </button>
          )}
          {stats.length > 0 && (
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:12px;color:#9b96aa;margin-left:auto;display:flex;gap:18px")}>
              {stats.map((st) => (
                <span key={st.label}>{st.label} <b style={s('color:#e4e0ec;font-weight:700')}>{st.value}</b></span>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
