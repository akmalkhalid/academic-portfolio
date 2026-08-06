'use client'

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import DemoThumb from '@/components/pillar-demos/DemoThumb'
import type { PillarKey } from '@/lib/demos/registry'

const stack = "'Space Grotesk', system-ui, sans-serif"
const PB: Record<string, { bg: string; fg: string }> = {
  purple: { bg: '#eeedfe', fg: '#3c3489' }, amber: { bg: '#faeeda', fg: '#633806' }, teal: { bg: '#e1f5ee', fg: '#085041' },
  blue: { bg: '#e6f1fb', fg: '#0c447c' }, coral: { bg: '#faece7', fg: '#712b13' }, green: { bg: '#eaf3de', fg: '#27500a' },
}
const chip = (label: string, c: string) => ({ label, style: `font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;padding:3px 9px;border-radius:6px;background:${PB[c].bg};color:${PB[c].fg}` })
const motif = [{ delay: '0s' }, { delay: '.3s' }, { delay: '.6s' }, { delay: '.9s' }]

type Stat = { num: number; prefix: string; display: string; label: string; hint: string; dot: string }
type TL = { short: string; amountFmt: string; roleShort: string; title: string; barStyle: string; barLabel: string }
type Grant = { title: string; agency: string; grantCode: string; role: string; amountFmt: string; years: string; accent: string; tags: { label: string; style: string }[] }

export default function ResearchClient({
  stats, timeline, years, todayLeft, active, completed, activeCount, completedCount,
}: {
  stats: Stat[]; timeline: TL[]; years: { label: string; left: number }[]; todayLeft: number
  active: Grant[]; completed: Grant[]; activeCount: number; completedCount: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rafs: number[] = []; const ios: IntersectionObserver[] = []; const fits: (() => void)[] = []
    const root = () => wrapRef.current || document
    let trPoll: any = null, onTrScroll: any = null

    function setupTextReveal(tries = 0) {
      const r = wrapRef.current
      if (!r) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      let els = ([...r.querySelectorAll('section h1, section h2, section h3, section p')] as HTMLElement[]).filter((el) => !el.closest('header,footer,nav') && el.textContent!.trim().length)
      if (!els.length || !els[0].offsetHeight) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      if (reduce) return
      els = els.filter((el) => el.offsetHeight > 0)
      els.forEach((el, i) => { (el as any).__order = i; el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; (el as any).__shown = false })
      const reveal = (el: HTMLElement, d: number) => { (el as any).__shown = true; el.style.animation = 'dc-fade-up .6s cubic-bezier(.22,.61,.36,1) ' + d + 'ms both'; setTimeout(() => { el.style.animation = ''; el.style.opacity = '1'; el.style.transform = 'none' }, d + 720) }
      let sched = false
      const check = () => { sched = false; const vh = window.innerHeight; const pend = els.filter((el) => !(el as any).__shown).sort((a, b) => (a as any).__order - (b as any).__order); let i = 0; for (const el of pend) if (el.getBoundingClientRect().top < vh * 0.92) reveal(el, Math.min(i++, 7) * 80); if (els.every((el) => (el as any).__shown) && trPoll) { clearInterval(trPoll); trPoll = null } }
      onTrScroll = () => { if (sched) return; sched = true; requestAnimationFrame(check) }
      window.addEventListener('scroll', onTrScroll, { passive: true }); window.addEventListener('resize', onTrScroll)
      trPoll = setInterval(check, 220); check()
    }

    function setupCounters(tries = 0) {
      const els = [...root().querySelectorAll('[data-count]')] as HTMLElement[]
      if (!els.length) { if (tries < 300) requestAnimationFrame(() => setupCounters(tries + 1)); return }
      const run = () => els.forEach((el) => { const tgt = +el.getAttribute('data-count')!, t0 = performance.now(), dur = 1600; const step = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(tgt * e).toLocaleString(); if (k < 1) requestAnimationFrame(step) }; requestAnimationFrame(step) })
      if (reduce) { els.forEach((el) => (el.textContent = (+el.getAttribute('data-count')!).toLocaleString())); return }
      const io = new IntersectionObserver((en) => { en.forEach((x) => { if (x.isIntersecting) { run(); io.disconnect() } }) }, { threshold: .4 })
      io.observe(els[0].closest('[data-stats]') || els[0]); ios.push(io)
    }

    const onResize = () => fits.forEach((f) => f && f())
    window.addEventListener('resize', onResize)
    setupTextReveal(); setupCounters()

    return () => {
      rafs.forEach((r) => cancelAnimationFrame(r)); ios.forEach((o) => o.disconnect())
      if (trPoll) clearInterval(trPoll); if (onTrScroll) { window.removeEventListener('scroll', onTrScroll); window.removeEventListener('resize', onTrScroll) }
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pillars: {
    id: string; n: string; accent: string; accentSoft: string; title: string; body: string
    themes: { label: string; style: string }[]; slot: { level: string; funding: string; title: string; desc: string }
    labBg: string; demoKey: PillarKey; demoHref: string; demoEyebrow: string; demoCaption: string
  }[] = [
    { id: 'generative-ai', n: '03', accent: '#8b7bf0', accentSoft: '#eeedfe', title: 'Generative & Agentic AI',
      body: 'Two complementary visions of machine intelligence: one that creates and one that reasons. My research couples generative models — transformers, diffusion architectures and GANs — with structured, symbolic and rule-based knowledge to build systems that are both creative and explainable.',
      themes: [chip('Transformers & diffusion', 'purple'), chip('LLM-assisted reasoning', 'purple'), chip('Text-to-image / video', 'purple'), chip('Explainable decision support', 'amber'), chip('Knowledge-based systems', 'amber')],
      slot: { level: 'PhD', funding: 'Funded', title: 'LLM-Driven Human–AI Collaboration in Team Settings', desc: 'Large language models as collaborative teammates — how humans and AI co-reason, divide work and build shared understanding in team-based problem solving.' },
      labBg: 'radial-gradient(120% 120% at 50% 0%,#1b1830 0%,#100e1a 72%)', demoKey: 'flow-field', demoHref: '/demos/flow-field/',
      demoEyebrow: 'Latent flow field · generative', demoCaption: 'Particles self-organize and connections form and dissolve — emergence as a stand-in for the generative process.' },
    { id: 'evolutionary', n: '01', accent: '#21b3a0', accentSoft: '#e1f5ee', title: 'Computational Intelligence & Optimization',
      body: 'Many of the most important problems in engineering, logistics and AI are NP-hard. My work designs nature-inspired metaheuristics — genetic algorithms, swarm intelligence and hybrid memetic methods — for large-scale combinatorial and continuous optimization.',
      themes: [chip('Genetic & immune algorithms', 'teal'), chip('Swarm intelligence', 'teal'), chip('Memetic hybrids', 'teal'), chip('Assembly-line balancing', 'blue'), chip('Production scheduling', 'blue'), chip('Combinatorial optimization', 'blue')],
      slot: { level: 'PhD / MSc', funding: 'Scholarship-eligible', title: 'Optimizing for Engagement: Game Refinement Meets Optimization', desc: 'Coupling metaheuristic optimization with game-refinement theory — deriving new performance and engagement metrics that quantify what makes systems and play compelling.' },
      labBg: 'radial-gradient(120% 120% at 50% 0%,#142420 0%,#0c1614 72%)', demoKey: 'swarm-landscape', demoHref: '/demos/swarm-landscape/',
      demoEyebrow: 'Swarm intelligence · fitness landscape', demoCaption: 'A flock of agents foraging a multimodal landscape — local flocking combined with a pull toward the best-known peak. Brighter regions are higher fitness.' },
    { id: 'games', n: '02', accent: '#f2683f', accentSoft: '#faece7', title: 'Games Informatics & Engagement Modelling',
      body: 'My signature line of work: extending game-refinement theory and the “motion in mind” model to measure and optimize engagement, addiction and player experience. It spans procedural content generation where human and AI players co-create, gamification and serious games, and agent-based simulation of how people actually play.',
      themes: [chip('Procedural content generation', 'coral'), chip('Roguelike level design', 'coral'), chip('Gamification', 'coral'), chip('Serious games', 'green'), chip('Agent-based simulation', 'green'), chip('Player-experience modelling', 'green')],
      slot: { level: 'PhD', funding: 'Scholarship-eligible', title: 'Agentic Procedural Content Generation for Adaptive Play', desc: 'Integrating PCG with agentic and generative AI — co-designing levels, mechanics and narratives that adapt for richer, more entertaining player experiences.' },
      labBg: 'radial-gradient(120% 120% at 50% 0%,#241410 0%,#160c0a 72%)', demoKey: 'procedural-dungeon', demoHref: '/demos/procedural-dungeon/',
      demoEyebrow: 'Procedural dungeon · content generation', demoCaption: 'A roguelike level synthesized from nothing — rooms scattered, then stitched with corridors. Every roll is unique.' },
  ]

  return (
    <div ref={wrapRef} data-screen-label="Research" style={s('min-height:100vh;overflow-x:hidden')}>
      {/* HEADER */}
      <section style={s('max-width:1120px;margin:0 auto;padding:56px 28px 20px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>/ research · projects · funding</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(38px,5.6vw,68px);line-height:1.02;letter-spacing:-.02em;margin:0 0 18px;max-width:920px;text-wrap:balance`)}>Three interconnected pillars at the convergence of AI, optimization and play.</h1>
        <p style={s('font-size:18px;line-height:1.6;color:#57514b;max-width:680px;margin:0 0 22px')}>Each pillar carries its own signature colour and a looping preview of its demo — click any preview for the full interactive version — followed by the<a href="#projects" style={s('color:#16142e;font-weight:500;text-decoration:none;border-bottom:1px solid #cfc7bb')}>funded projects</a> where the methods meet real-world delivery. The research doesn&apos;t just describe; it runs.</p>
        <div style={s("display:flex;flex-wrap:wrap;gap:18px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#8a8279")}>
          <a href="#evolutionary" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>01 · Optimization</a>
          <a href="#games" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>02 · Games &amp; Simulation</a>
          <a href="#generative-ai" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>03 · Generative AI</a>
          <a href="#projects" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>↓ Funded projects</a>
        </div>
      </section>

      {/* PILLARS — three compact cards, side by side */}
      <section style={s('max-width:1120px;margin:0 auto;padding:26px 28px 24px')}>
        <div className="pillar-grid">
          {pillars.slice().sort((a, b) => a.n.localeCompare(b.n)).map((p) => (
            <div key={p.id} id={p.id} className="pillar-card" style={s(`border-top:3px solid ${p.accent};scroll-margin-top:90px`)}>
              <div style={s('display:flex;align-items:center;gap:10px;margin-bottom:14px')}>
                <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:${p.accent};letter-spacing:.08em`)}>PILLAR {p.n}</span>
                <span style={s(`flex:1;height:1px;background:linear-gradient(90deg,${p.accent}55,transparent)`)} />
                <div style={s('display:flex;gap:4px')}>
                  {motif.slice(0, 3).map((m, i) => (<span key={i} style={s(`width:6px;height:6px;border-radius:50%;background:${p.accent};animation:computePulse 2.4s ease-in-out infinite;animation-delay:${m.delay}`)} />))}
                </div>
              </div>

              <DemoThumb demoKey={p.demoKey} href={p.demoHref} accent={p.accent} eyebrow={p.demoEyebrow} height={130} bg={p.labBg} />

              <h2 style={s(`font-family:${stack};font-weight:600;font-size:20px;line-height:1.16;letter-spacing:-.015em;margin:16px 0 10px`)}>{p.title}</h2>
              <p style={s('font-size:13.5px;line-height:1.62;color:#57514b;margin:0 0 14px')}>{p.body}</p>
              <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px')}>
                {p.themes.map((t, i) => (<span key={i} style={s(t.style)}>{t.label}</span>))}
              </div>

              <div style={s('margin-top:auto;padding-top:14px;border-top:1px solid #f0ece5')}>
                <div style={s('margin-bottom:9px')}>
                  <span style={s(`font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:${p.accent};background:${p.accentSoft};padding:3px 7px;border-radius:5px;display:inline-block`)}>OPEN POSITION</span>
                  <div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#8a8279;margin-top:6px")}>{p.slot.level} · {p.slot.funding}</div>
                </div>
                <h3 style={s('font-size:14px;font-weight:600;line-height:1.32;margin:0 0 7px')}>{p.slot.title}</h3>
                <p style={s('font-size:12.5px;color:#57514b;line-height:1.55;margin:0 0 12px')}>{p.slot.desc}</p>
                <a href="/contact" style={s("font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:500;text-decoration:none;color:#fff;background:#16142e;padding:7px 12px;border-radius:7px;display:inline-block")}>Enquire →</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNDED PROJECTS */}
      <section id="projects" style={s('max-width:1120px;margin:0 auto;padding:58px 28px 4px;scroll-margin-top:80px')}>
        <div style={s('display:flex;align-items:center;gap:16px;margin-bottom:22px')}>
          <span style={s("font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#4d8df0;letter-spacing:.08em")}>FUNDED WORK</span>
          <span style={s('flex:1;height:1px;background:linear-gradient(90deg,#4d8df055,transparent)')} />
        </div>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.2vw,38px);line-height:1.08;letter-spacing:-.02em;margin:0 0 14px`)}>From grant to delivery.</h2>
        <p style={s('font-size:16px;line-height:1.7;color:#44403c;margin:0;max-width:700px')}>Competitive grants spanning national AI infrastructure, healthcare optimization and creativity-based learning. The projects where the three pillars meet real-world delivery.</p>
      </section>

      {/* STATS */}
      <section data-stats="1" style={s('max-width:1120px;margin:0 auto;padding:24px 28px 10px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px')}>
        {stats.map((st, i) => (
          <div key={i} style={s('position:relative;padding-left:16px')}>
            <span style={s(`position:absolute;left:0;top:8px;width:7px;height:7px;border-radius:50%;background:${st.dot};animation:computePulse 2.6s ease-in-out infinite`)} />
            <div style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,3.2vw,40px);line-height:1;letter-spacing:-.02em`)}>{st.prefix}<span data-count={st.num}>{st.display}</span></div>
            <div style={s('font-size:13px;color:#57514b;margin-top:8px;line-height:1.35')}>{st.label}</div>
            <div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.06em;color:#a39a8f;margin-top:3px;text-transform:uppercase")}>{st.hint}</div>
          </div>
        ))}
      </section>

      {/* FUNDING TIMELINE */}
      <section style={s('max-width:1120px;margin:0 auto;padding:40px 28px 20px')}>
        <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(22px,2.6vw,30px);letter-spacing:-.02em;margin:0`)}>Funding timeline</h2>
          <div style={s("display:flex;gap:18px;align-items:center;font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279")}>
            <span style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:18px;height:9px;border-radius:3px;background:#4d8df0;display:inline-block')} />Active</span>
            <span style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:18px;height:9px;border-radius:3px;background:#4d8df0;opacity:.4;display:inline-block')} />Completed</span>
            <span style={s('display:flex;align-items:center;gap:6px')}><span style={s('width:2px;height:13px;background:#d9542b;display:inline-block')} />Today</span>
          </div>
        </div>
        <div style={s('background:#fff;border:1px solid #e7e3dd;border-radius:16px;padding:20px 22px')}>
          <div data-tlscroll style={s('max-height:322px;overflow-y:auto;margin:-5px -6px 0;padding:5px 6px 0')}>
            {timeline.map((g, i) => (
              <div key={i} style={s('display:grid;grid-template-columns:230px 1fr;gap:16px;align-items:center;padding:5px 0')}>
                <div style={s('min-width:0')}>
                  <div style={s('font-size:13px;font-weight:500;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{g.short}</div>
                  <div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#a39a8f")}>{g.amountFmt} · {g.roleShort}</div>
                </div>
                <div style={s('position:relative;height:30px;border-radius:6px;background:repeating-linear-gradient(90deg,transparent,transparent calc(15.384% - 1px),#f0ece5 calc(15.384% - 1px),#f0ece5 15.384%)')}>
                  <div style={s(`position:absolute;top:0;bottom:0;width:2px;background:#d9542b;left:${todayLeft}%`)} />
                  <div title={g.title} style={s(g.barStyle)}>
                    <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;color:#fff;white-space:nowrap;overflow:hidden")}>{g.barLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={s('display:grid;grid-template-columns:230px 1fr;gap:16px;margin-top:10px;padding-top:10px;border-top:1px solid #f0ece5')}>
            <div />
            <div style={s('position:relative;height:16px')}>
              {years.map((y, i) => (<span key={i} style={s(`position:absolute;font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f;left:${y.left}%;transform:translateX(-50%)`)}>{y.label}</span>))}
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE GRANTS */}
      <section style={s('max-width:1120px;margin:0 auto;padding:30px 28px 10px')}>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(20px,2.4vw,26px);letter-spacing:-.02em;margin:0 0 18px`)}>Active grants <span style={s("font-family:'JetBrains Mono',monospace;font-size:14px;color:#a39a8f;font-weight:500")}>· {activeCount}</span></h2>
        <div style={s('display:grid;grid-template-columns:repeat(2,1fr);gap:18px')}>
          {active.map((g, i) => (
            <div key={i} style={s(`background:#fff;border:1px solid #e7e3dd;border-top:3px solid ${g.accent};border-radius:14px;padding:22px`)}>
              <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:14px')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.06em;color:#27500a;background:#eaf3de;padding:3px 8px;border-radius:5px")}>ACTIVE</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279")}>{g.role}</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#1c1917;font-weight:600;margin-left:auto")}>{g.amountFmt}</span>
              </div>
              <h3 style={s('font-size:15.5px;font-weight:600;line-height:1.34;margin:0 0 8px')}>{g.title}</h3>
              <p style={s('font-size:13px;color:#57514b;margin:0 0 14px')}>{g.agency}{g.grantCode ? ' · ' + g.grantCode : ''}</p>
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <div style={s('display:flex;flex-wrap:wrap;gap:6px')}>{g.tags.map((t, k) => (<span key={k} style={s(t.style)}>{t.label}</span>))}</div>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f")}>{g.years}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPLETED GRANTS */}
      <section style={s('max-width:1120px;margin:0 auto;padding:30px 28px 10px')}>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(20px,2.4vw,26px);letter-spacing:-.02em;margin:0 0 18px`)}>Completed grants <span style={s("font-family:'JetBrains Mono',monospace;font-size:14px;color:#a39a8f;font-weight:500")}>· {completedCount}</span></h2>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
          {completed.map((g, i) => (
            <div key={i} style={s('background:#fbfaf8;border:1px solid #ece8e1;border-radius:12px;padding:18px')}>
              <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:12px')}>
                <span style={s(`width:8px;height:8px;border-radius:50%;background:${g.accent}`)} />
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279")}>{g.role}</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#57514b;font-weight:600;margin-left:auto")}>{g.amountFmt}</span>
              </div>
              <h3 style={s('font-size:14px;font-weight:600;line-height:1.34;margin:0 0 8px')}>{g.title}</h3>
              <p style={s('font-size:12px;color:#8a8279;margin:0 0 4px')}>{g.agency}</p>
              <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f;margin:0")}>{g.years}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s('max-width:1120px;margin:30px auto 0;padding:30px 28px 70px')}>
        <div style={s('background:#16142e;border-radius:18px;padding:48px 44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;color:#fff;margin:0 0 12px`)}>Want to work on one of these?</h2>
          <p style={s('font-size:16px;line-height:1.6;color:#bdb8d6;margin:0 0 24px;max-width:560px')}>Postgraduate supervision and research collaboration across all three pillars. Funded and scholarship-eligible positions open. Prospective students — start with the postgraduate guide.</p>
          <div style={s('display:flex;flex-wrap:wrap;gap:12px;align-items:center')}>
            <a href="/contact" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 24px;border-radius:9px')}>Get in touch →</a>
            <a href="/postgraduate-guide" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);padding:13px 24px;border-radius:9px')}>Postgraduate guide →</a>
          </div>
        </div>
      </section>
    </div>
  )
}
