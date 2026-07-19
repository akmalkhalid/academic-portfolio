'use client'

// Full interactive crowd-evacuation simulation — the "open the full simulation"
// experience. Sliders for crowd size, panic, and the number & width of exits;
// click the floor to drop or clear a wall and watch the navigation field
// re-route; toggle the route heat-map. Backed by the shared EvacSim engine.
// Honours reduced-motion (static frame, controls hidden).
import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import { EvacSim, DEFAULTS, EXIT_WIDTH_LABELS, type EvacParams } from '@/lib/evac-sim'

export default function CrowdEvacuationFull({ accent = '#4d8df0' }: { accent?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [heat, setHeat] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [p, setP] = useState<EvacParams>({ ...DEFAULTS })
  const [stats, setStats] = useState({ evac: 0, total: 0, clear: 0, flow: 0, remaining: 0 })

  const playingRef = useRef(playing)
  playingRef.current = playing
  const heatRef = useRef(heat)
  heatRef.current = heat
  const simRef = useRef<EvacSim | null>(null)

  // one-time engine + render loop
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

    const H = 400
    let dpr = 1
    const sim = new EvacSim(accent)
    simRef.current = sim

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
      for (let i = 0; i < 140; i++) sim.step()
      sim.draw(ctx, { hotspots: false })
      setStats(sim.stats())
      return
    }

    let raf = 0
    let visible = true
    const io = new IntersectionObserver(
      (en) => en.forEach((e) => (visible = e.isIntersecting)),
      { threshold: 0.05 },
    )
    io.observe(cv)

    const loop = () => {
      if (visible && playingRef.current && sim.agents.length > 0) sim.step()
      sim.draw(ctx, { heat: heatRef.current })
      if (sim.frames % 10 === 0) setStats(sim.stats())
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onDown = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      sim.toggleWallAt(e.clientX - r.left, e.clientY - r.top)
    }
    cv.addEventListener('pointerdown', onDown)
    const onResize = () => fit()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      cv.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', onResize)
    }
  }, [accent])

  // param changes
  const live = (key: keyof EvacParams, value: number) => {
    setP((prev) => ({ ...prev, [key]: value }))
    simRef.current?.setParams({ [key]: value } as Partial<EvacParams>)
  }
  const rebuild = (key: keyof EvacParams, value: number) => {
    setP((prev) => ({ ...prev, [key]: value }))
    const sim = simRef.current
    if (sim) {
      sim.setParams({ [key]: value } as Partial<EvacParams>)
      sim.reset()
    }
  }
  const reset = () => simRef.current?.reset()

  const btn = (on: boolean) =>
    `font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;padding:8px 14px;border-radius:8px;border:1px solid ${on ? accent : 'rgba(255,255,255,.16)'};background:${on ? accent : 'transparent'};color:${on ? '#0a0910' : '#cfcad9'}`

  const slider = (
    label: string,
    valueText: string,
    inputProps: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div style={s('display:flex;flex-direction:column;gap:5px')}>
      <label style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.04em;color:#9b96aa;display:flex;justify-content:space-between")}>
        <span>{label}</span>
        <b style={s('color:#e4e0ec;font-weight:700')}>{valueText}</b>
      </label>
      <input type="range" {...inputProps} style={{ width: '100%', accentColor: accent }} />
    </div>
  )

  return (
    <div>
      <canvas ref={canvasRef} style={s('display:block;width:100%;height:400px;border-radius:10px;cursor:crosshair')} />

      {!reduced && (
        <div style={s('display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px 24px;margin-top:16px')}>
          {slider('Crowd size', String(p.crowd), {
            min: 50, max: 600, step: 10, value: p.crowd,
            onChange: (e) => live('crowd', +e.target.value),
            onPointerUp: (e) => rebuild('crowd', +(e.target as HTMLInputElement).value),
            onKeyUp: (e) => rebuild('crowd', +(e.target as HTMLInputElement).value),
          })}
          {slider('Panic level', `${Math.round(p.panic * 100)}%`, {
            min: 0, max: 100, step: 1, value: Math.round(p.panic * 100),
            onChange: (e) => live('panic', +e.target.value / 100),
          })}
          {slider('Number of exits', String(p.nExits), {
            min: 1, max: 6, step: 1, value: p.nExits,
            onChange: (e) => live('nExits', +e.target.value),
            onPointerUp: (e) => rebuild('nExits', +(e.target as HTMLInputElement).value),
            onKeyUp: (e) => rebuild('nExits', +(e.target as HTMLInputElement).value),
          })}
          {slider('Exit width', EXIT_WIDTH_LABELS[p.exitW - 1], {
            min: 1, max: 5, step: 1, value: p.exitW,
            onChange: (e) => live('exitW', +e.target.value),
            onPointerUp: (e) => rebuild('exitW', +(e.target as HTMLInputElement).value),
            onKeyUp: (e) => rebuild('exitW', +(e.target as HTMLInputElement).value),
          })}
        </div>
      )}

      <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px')}>
        {!reduced && (
          <>
            <button type="button" onClick={() => setPlaying((v) => !v)} style={s(btn(true))}>
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
            <button type="button" onClick={reset} style={s(btn(false))}>Reset</button>
            <button type="button" onClick={() => setHeat((v) => !v)} style={s(btn(heat))}>Show routes</button>
          </>
        )}
        <span style={s("font-family:'JetBrains Mono',monospace;font-size:12px;color:#9b96aa;margin-left:auto;display:flex;gap:16px")}>
          <span>Evacuated <b style={s('color:#e4e0ec')}>{stats.evac}</b>/<b style={s('color:#e4e0ec')}>{stats.total}</b></span>
          <span>clearance <b style={s('color:#e4e0ec')}>{stats.clear}</b>s</span>
          <span>flow <b style={s('color:#e4e0ec')}>{stats.flow}</b>/s</span>
        </span>
      </div>

      <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;margin:12px 0 0;line-height:1.6")}>
        {reduced
          ? 'Animation reduced (static frame shown).'
          : 'Green = exits · blue → red = shoppers coloured by local congestion (red = jammed) · orange rings = crowd start hotspots. Panic updates live; crowd size and exits rebuild the run. Click the floor to add or clear a wall block and watch the crowd re-route.'}
      </p>
    </div>
  )
}
