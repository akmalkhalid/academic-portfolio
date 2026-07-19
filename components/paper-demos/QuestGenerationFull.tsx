'use client'

// Full interactive agentic quest generator — the "open the full simulation"
// experience. Tune the target quest length, difficulty climax, variety emphasis,
// and mutation; a genetic loop with a critic agent evolves a rough draft into a
// well-formed quest, and the design-objective meters and overall quality climb.
// Backed by QuestGenSim. Honours reduced-motion (settled frame).
import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import { QuestGenSim, DEFAULTS, TYPES } from '@/lib/quest-gen-sim'

type Stats = ReturnType<QuestGenSim['stats']>

export default function QuestGenerationFull({ accent = '#8b7bf0' }: { accent?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [length, setLength] = useState(DEFAULTS.length)
  const [difficulty, setDifficulty] = useState(DEFAULTS.difficulty)
  const [variety, setVariety] = useState(DEFAULTS.variety)
  const [mutation, setMutation] = useState(DEFAULTS.mutation)
  const [stats, setStats] = useState<Stats | null>(null)

  const playingRef = useRef(playing)
  playingRef.current = playing
  const simRef = useRef<QuestGenSim | null>(null)

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

    const H = 340
    let dpr = 1
    const sim = new QuestGenSim(accent)
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
      for (let i = 0; i < 50; i++) sim.step()
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
      if (visible && playingRef.current && frame % 5 === 0 && sim.stagnant < 50) sim.step()
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

  const onLength = (v: number) => { setLength(v); simRef.current?.setParams({ length: v }); simRef.current?.reset() }
  const onDifficulty = (v: number) => { setDifficulty(v); simRef.current?.setParams({ difficulty: v }) }
  const onVariety = (v: number) => { setVariety(v); simRef.current?.setParams({ variety: v }) }
  const onMutation = (v: number) => { setMutation(v); simRef.current?.setParams({ mutation: v }) }
  const newDraft = () => { simRef.current?.reset(); setStats(simRef.current?.stats() ?? null) }

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
  const meter = (label: string, v: number) => (
    <div style={s('display:flex;flex-direction:column;gap:4px;min-width:120px;flex:1')}>
      <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.04em;color:#6f6a82;display:flex;justify-content:space-between")}>
        <span>{label}</span><b style={s('color:#cfcad9;font-weight:700')}>{v}</b>
      </span>
      <div style={s('height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden')}>
        <div style={s(`height:100%;width:${v}%;background:${accent};border-radius:3px`)} />
      </div>
    </div>
  )

  return (
    <div>
      <canvas ref={canvasRef} style={s('display:block;width:100%;height:340px;border-radius:10px')} />

      {/* beat-type legend */}
      <div style={s('display:flex;flex-wrap:wrap;gap:12px;margin-top:12px')}>
        {TYPES.map((t) => (
          <span key={t.key} style={s("display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#9b96aa")}>
            <span style={s(`width:10px;height:10px;border-radius:3px;background:${t.col};display:inline-block`)} />{t.name}
          </span>
        ))}
      </div>

      {!reduced && stats && (
        <>
          <div style={s('display:flex;flex-wrap:wrap;gap:26px;align-items:flex-end;margin-top:16px')}>
            <div style={s('display:flex;flex-direction:column;gap:2px')}>
              <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;color:#6f6a82")}>QUEST QUALITY</span>
              <span style={s(`font-family:'Space Grotesk',system-ui,sans-serif;font-size:24px;font-weight:600;line-height:1;color:${stats.quality >= 90 ? '#84b53a' : accent}`)}>{stats.quality}%</span>
            </div>
            <div style={s('display:flex;flex-direction:column;gap:2px')}>
              <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;color:#6f6a82")}>GENERATION</span>
              <span style={s("font-family:'Space Grotesk',system-ui,sans-serif;font-size:24px;font-weight:600;line-height:1;color:#e4e0ec")}>{stats.gen}</span>
            </div>
            <div style={s('display:flex;flex-wrap:wrap;gap:16px;flex:1;min-width:280px')}>
              {meter('Structure', stats.structure)}
              {meter('Difficulty arc', stats.arc)}
              {meter('Variety', stats.variety)}
              {meter('Pacing', stats.pacing)}
              {meter('Branching', stats.branching)}
            </div>
          </div>
        </>
      )}

      {!reduced && (
        <div style={s('display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px 24px;margin-top:18px')}>
          {slider('Target length (beats)', String(length), {
            min: 4, max: 13, step: 1, value: length,
            onChange: (e) => setLength(+e.target.value),
            onPointerUp: (e) => onLength(+(e.target as HTMLInputElement).value),
            onKeyUp: (e) => onLength(+(e.target as HTMLInputElement).value),
          })}
          {slider('Difficulty climax', `${Math.round(difficulty * 100)}%`, {
            min: 30, max: 100, step: 5, value: Math.round(difficulty * 100), onChange: (e) => onDifficulty(+e.target.value / 100),
          })}
          {slider('Variety emphasis', `${Math.round(variety * 100)}%`, {
            min: 0, max: 100, step: 5, value: Math.round(variety * 100), onChange: (e) => onVariety(+e.target.value / 100),
          })}
          {slider('Mutation rate', `${Math.round(mutation * 100)}%`, {
            min: 5, max: 100, step: 5, value: Math.round(mutation * 100), onChange: (e) => onMutation(+e.target.value / 100),
          })}
        </div>
      )}

      <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px')}>
        {!reduced && (
          <>
            <button type="button" onClick={() => setPlaying((v) => !v)} style={s(btn(true))}>
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
            <button type="button" onClick={newDraft} style={s(btn(false))}>New draft</button>
          </>
        )}
        <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;margin-left:auto")}>
          Genetic loop · generator + critic agents
        </span>
      </div>

      <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;margin:12px 0 0;line-height:1.6")}>
        {reduced
          ? 'Animation reduced (settled frame shown).'
          : 'Top: the best quest — numbered beats coloured by type (diamond = boss, square = reward), with optional side quests branching above. Bottom: the generated difficulty arc against the ideal (dashed). Each generation the critic scores the design objectives and the generator rewrites the weakest one, so the quest self-assembles from a random draft.'}
      </p>
    </div>
  )
}
