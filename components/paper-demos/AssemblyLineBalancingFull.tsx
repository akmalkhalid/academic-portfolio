'use client'

// Full interactive assembly-line-balancing optimizer — the "open the full
// simulation" experience. Tune the cycle-time limit (live), the number of tasks,
// and the immune-system mutation rate; watch the line rebalance as stations,
// efficiency, balance delay, and the smoothness index update. Backed by ALBPSim.
// Honours reduced-motion (settled frame, controls hidden).
import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import { ALBPSim, DEFAULTS } from '@/lib/albp-sim'

type Stats = ReturnType<ALBPSim['stats']>

export default function AssemblyLineBalancingFull({ accent = '#4d8df0' }: { accent?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [cycle, setCycle] = useState(DEFAULTS.cycle)
  const [nTasks, setNTasks] = useState(DEFAULTS.nTasks)
  const [mutation, setMutation] = useState(DEFAULTS.mutation)
  const [cycleRange, setCycleRange] = useState({ min: 8, max: 40 })
  const [stats, setStats] = useState<Stats | null>(null)

  const playingRef = useRef(playing)
  playingRef.current = playing
  const simRef = useRef<ALBPSim | null>(null)

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

    const H = 470
    let dpr = 1
    const sim = new ALBPSim(accent)
    simRef.current = sim
    sim.setParams({ ...DEFAULTS })

    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.max(320, cv!.getBoundingClientRect().width)
      cv!.width = W * dpr
      cv!.height = H * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      sim.resize(W, H)
      sim.buildInstance()
      syncRanges()
    }
    function syncRanges() {
      setCycleRange({ min: sim.maxTime, max: Math.max(sim.maxTime + 6, Math.round(sim.totalTime * 0.6)) })
      setCycle(sim.C)
      setStats(sim.stats())
    }
    fit()

    if (reduce) {
      for (let i = 0; i < 70; i++) sim.step()
      sim.draw(ctx)
      setStats(sim.stats())
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
      if (visible && playingRef.current && frame % 4 === 0 && sim.stagnant < 60) sim.step()
      sim.draw(ctx)
      if (frame % 6 === 0) setStats(sim.stats())
      frame++
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

  const onCycle = (v: number) => {
    setCycle(v)
    simRef.current?.setCycle(v)
  }
  const onMutation = (v: number) => {
    setMutation(v)
    simRef.current?.setParams({ mutation: v })
  }
  const onTasks = (v: number) => {
    setNTasks(v)
    const sim = simRef.current
    if (sim) {
      sim.setParams({ nTasks: v })
      sim.buildInstance()
      setCycleRange({ min: sim.maxTime, max: Math.max(sim.maxTime + 6, Math.round(sim.totalTime * 0.6)) })
      setCycle(sim.C)
    }
  }
  const newInstance = () => {
    const sim = simRef.current
    if (!sim) return
    sim.buildInstance()
    setCycleRange({ min: sim.maxTime, max: Math.max(sim.maxTime + 6, Math.round(sim.totalTime * 0.6)) })
    setCycle(sim.C)
  }

  const btn = (on: boolean) =>
    `font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;padding:8px 14px;border-radius:8px;border:1px solid ${on ? accent : 'rgba(255,255,255,.16)'};background:${on ? accent : 'transparent'};color:${on ? '#0a0910' : '#cfcad9'}`

  const slider = (label: string, valueText: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div style={s('display:flex;flex-direction:column;gap:5px')}>
      <label style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.04em;color:#9b96aa;display:flex;justify-content:space-between")}>
        <span>{label}</span>
        <b style={s('color:#e4e0ec;font-weight:700')}>{valueText}</b>
      </label>
      <input type="range" {...props} style={{ width: '100%', accentColor: accent }} />
    </div>
  )

  const stat = (label: string, value: string, hot = false) => (
    <div style={s('display:flex;flex-direction:column;gap:2px')}>
      <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;color:#6f6a82")}>{label}</span>
      <span style={s(`font-family:'Space Grotesk',system-ui,sans-serif;font-size:22px;font-weight:600;line-height:1;color:${hot ? accent : '#e4e0ec'}`)}>{value}</span>
    </div>
  )

  return (
    <div>
      <canvas ref={canvasRef} style={s('display:block;width:100%;height:470px;border-radius:10px')} />

      {!reduced && stats && (
        <div style={s('display:flex;flex-wrap:wrap;gap:26px;margin-top:14px')}>
          {stat('GENERATION', String(stats.gen))}
          {stat('STATIONS', String(stats.stations), true)}
          {stat('LINE EFFICIENCY', stats.efficiency + '%', true)}
          {stat('BALANCE DELAY', stats.balanceDelay + '%')}
          {stat('SMOOTHNESS', String(stats.smoothness))}
        </div>
      )}

      {!reduced && (
        <div style={s('display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px 24px;margin-top:16px')}>
          {slider('Cycle time (station limit)', String(cycle), {
            min: cycleRange.min, max: cycleRange.max, step: 1, value: cycle,
            onChange: (e) => onCycle(+e.target.value),
          })}
          {slider('Number of tasks', String(nTasks), {
            min: 12, max: 34, step: 1, value: nTasks,
            onChange: (e) => setNTasks(+e.target.value),
            onPointerUp: (e) => onTasks(+(e.target as HTMLInputElement).value),
            onKeyUp: (e) => onTasks(+(e.target as HTMLInputElement).value),
          })}
          {slider('Mutation rate (hypermutation)', `${Math.round(mutation * 100)}%`, {
            min: 5, max: 100, step: 5, value: Math.round(mutation * 100),
            onChange: (e) => onMutation(+e.target.value / 100),
          })}
        </div>
      )}

      <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px')}>
        {!reduced && (
          <>
            <button type="button" onClick={() => setPlaying((v) => !v)} style={s(btn(true))}>
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
            <button type="button" onClick={newInstance} style={s(btn(false))}>New instance</button>
          </>
        )}
        <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;margin-left:auto")}>
          Immune optimizer · clonal selection
        </span>
      </div>

      <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;margin:12px 0 0;line-height:1.6")}>
        {reduced
          ? 'Animation reduced (settled frame shown).'
          : 'Top: precedence graph, each node a task (its time) coloured by assigned station. Bottom: workstations filling with task-time blocks under the cycle-time limit (dashed); the outlined column is the current bottleneck. Raise or lower the cycle time and watch stations and efficiency trade off.'}
      </p>
    </div>
  )
}
