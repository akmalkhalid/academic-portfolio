'use client'

// Full interactive game-refinement tuner — the "open the full simulation"
// experience. Tune the game's branching (complexity), pace, and balance; the
// abstract game plays itself and its game-refinement value drifts across the
// comfortable-zone spectrum, with live engagement (thrill) and addiction (jerk)
// readouts. Backed by GRSim. Honours reduced-motion (settled frame).
import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import { GRSim, DEFAULTS } from '@/lib/game-refinement-sim'

type Stats = ReturnType<GRSim['stats']>

export default function GameRefinementFull({ accent = '#f2683f' }: { accent?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [branching, setBranching] = useState(DEFAULTS.branching)
  const [pace, setPace] = useState(DEFAULTS.pace)
  const [balance, setBalance] = useState(DEFAULTS.balance)
  const [stats, setStats] = useState<Stats | null>(null)

  const playingRef = useRef(playing)
  playingRef.current = playing
  const simRef = useRef<GRSim | null>(null)

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

    const H = 372
    let dpr = 1
    const sim = new GRSim(accent)
    simRef.current = sim
    sim.setParams({ ...DEFAULTS })

    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.max(320, cv!.getBoundingClientRect().width)
      cv!.width = W * dpr
      cv!.height = H * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      sim.resize(W, H)
      sim.reset()
      setStats(sim.stats())
    }
    fit()

    if (reduce) {
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
      if (visible && playingRef.current && frame % 3 === 0) sim.step()
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

  const onBranching = (v: number) => { setBranching(v); simRef.current?.setParams({ branching: v }) }
  const onPace = (v: number) => { setPace(v); simRef.current?.setParams({ pace: v }) }
  const onBalance = (v: number) => { setBalance(v); simRef.current?.setParams({ balance: v }) }

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

  const stat = (label: string, value: string, color = '#e4e0ec') => (
    <div style={s('display:flex;flex-direction:column;gap:2px')}>
      <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;color:#6f6a82")}>{label}</span>
      <span style={s(`font-family:'Space Grotesk',system-ui,sans-serif;font-size:22px;font-weight:600;line-height:1;color:${color}`)}>{value}</span>
    </div>
  )
  const meter = (label: string, v: number, color: string) => (
    <div style={s('display:flex;flex-direction:column;gap:4px;min-width:130px')}>
      <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;color:#6f6a82;display:flex;justify-content:space-between")}>
        <span>{label}</span><b style={s(`color:${color};font-weight:700`)}>{v}</b>
      </span>
      <div style={s('height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden')}>
        <div style={s(`height:100%;width:${v}%;background:${color};border-radius:3px`)} />
      </div>
    </div>
  )

  return (
    <div>
      <canvas ref={canvasRef} style={s('display:block;width:100%;height:372px;border-radius:10px')} />

      {!reduced && stats && (
        <>
          <div style={s('display:flex;flex-wrap:wrap;gap:26px;align-items:flex-end;margin-top:14px')}>
            {stat('GAME-REFINEMENT VALUE', stats.gr.toFixed(3), stats.inZone ? '#21b3a0' : accent)}
            {stat('VERDICT', '', '#e4e0ec')}
            <div style={s('margin-left:-18px;align-self:center')}>
              <span style={s(`font-family:'Space Grotesk',system-ui,sans-serif;font-size:15px;font-weight:600;color:${stats.inZone ? '#21b3a0' : '#cfcad9'}`)}>{stats.verdict}</span>
            </div>
          </div>
          <div style={s('display:flex;flex-wrap:wrap;gap:26px;margin-top:14px;align-items:center')}>
            {stat('AVG GAME LENGTH', String(stats.length))}
            {stat('AVG BRANCHING', String(stats.branching))}
            {meter('ENGAGEMENT (thrill)', stats.thrill, '#21b3a0')}
            {meter('ADDICTIVENESS (jerk)', stats.addiction, accent)}
          </div>
        </>
      )}

      {!reduced && (
        <div style={s('display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px 24px;margin-top:18px')}>
          {slider('Branching (game complexity)', String(branching), {
            min: 4, max: 44, step: 1, value: branching, onChange: (e) => onBranching(+e.target.value),
          })}
          {slider('Pace (how fast it resolves)', `${Math.round(pace * 100)}%`, {
            min: 10, max: 100, step: 5, value: Math.round(pace * 100), onChange: (e) => onPace(+e.target.value / 100),
          })}
          {slider('Balance (how close the contest)', `${Math.round(balance * 100)}%`, {
            min: 0, max: 100, step: 5, value: Math.round(balance * 100), onChange: (e) => onBalance(+e.target.value / 100),
          })}
        </div>
      )}

      <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px')}>
        {!reduced && (
          <button type="button" onClick={() => setPlaying((v) => !v)} style={s(btn(true))}>
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
        )}
        <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;margin-left:auto")}>
          Self-play · Monte Carlo over games
        </span>
      </div>

      <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;margin:12px 0 0;line-height:1.6")}>
        {reduced
          ? 'Animation reduced (settled frame shown).'
          : 'Top: the game-refinement value GR = √B ⁄ D on the engagement spectrum, with real games as landmarks and the comfortable zone (~0.07–0.08) shaded. Bottom: outcome certainty over the course of a game — flat-then-late means tense, straight-up means a runaway. Tune branching and pace to slide GR into the zone; balance shapes the tension, thrill, and addictiveness.'}
      </p>
    </div>
  )
}
