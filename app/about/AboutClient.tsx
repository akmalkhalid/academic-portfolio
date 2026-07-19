'use client'

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'

const P = { purple: '#8b7bf0', blue: '#4d8df0', teal: '#21b3a0', coral: '#f2683f', green: '#84b53a', amber: '#d99320' }
const stack = "'Space Grotesk', system-ui, sans-serif"

const competencies = [
  { title: 'Computational Intelligence', accent: P.teal, detail: 'Evolutionary and immune algorithms, particle-swarm optimization and multi-objective metaheuristics.' },
  { title: 'Games Informatics & Engagement', accent: P.coral, detail: 'Game refinement theory, the “motion in mind” model, procedural content and serious games.' },
  { title: 'Computational Optimization', accent: P.blue, detail: 'Combinatorial optimization, scheduling, assembly-line balancing and AutoML.' },
  { title: 'Generative & Agentic AI', accent: P.purple, detail: 'Generative models, LLM applications, agentic content generation and knowledge-based expert systems.' },
  { title: 'Simulation & Modelling', accent: P.green, detail: 'Agent-based simulation, crowd dynamics and Monte-Carlo methods.' },
  { title: 'Technical Stack', accent: P.amber, detail: 'Python, PyTorch, MATLAB, Unity, R and LaTeX.' },
]
const facts = [
  { k: 'Role', v: 'Senior Lecturer' },
  { k: 'Faculty', v: 'FTSM, UKM' },
  { k: 'Location', v: 'Bangi, Selangor' },
  { k: 'PhD', v: '2018' },
]

export default function AboutClient({ name, jobTitle, profiles }: { name: string; jobTitle: string; profiles: { label: string; href: string }[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const motifRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rafs: number[] = []
    const root = () => wrapRef.current || document
    let fitFn: (() => void) | null = null
    let twPoll: any = null, onScrollTW: any = null

    function setupTextReveal(tries = 0) {
      const els = [...root().querySelectorAll('[data-tw]')] as HTMLElement[]
      if (!els.length || els.some((el) => el.offsetHeight === 0)) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      if (reduce) return
      els.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; (el as any).__shown = false })
      const reveal = (el: HTMLElement, delayMs: number) => { (el as any).__shown = true; el.style.animation = 'dc-fade-up .6s cubic-bezier(.22,.61,.36,1) ' + delayMs + 'ms both'; setTimeout(() => { el.style.animation = ''; el.style.opacity = '1'; el.style.transform = 'none' }, delayMs + 720) }
      let sched = false
      const check = () => { sched = false; const vh = window.innerHeight; const pend = els.filter((el) => !(el as any).__shown).sort((a, b) => (+a.dataset.tw!) - (+b.dataset.tw!)); let i = 0; for (const el of pend) { if (el.getBoundingClientRect().top < vh * 0.92) reveal(el, (i++) * 90) } if (els.every((el) => (el as any).__shown) && twPoll) { clearInterval(twPoll); twPoll = null } }
      onScrollTW = () => { if (sched) return; sched = true; requestAnimationFrame(check) }
      window.addEventListener('scroll', onScrollTW, { passive: true })
      window.addEventListener('resize', onScrollTW)
      twPoll = setInterval(check, 220)
      check()
    }

    function setupReveal(tries = 0) {
      const els = [...root().querySelectorAll('[data-reveal]')] as HTMLElement[]
      if (!els.length) { if (tries < 120) requestAnimationFrame(() => setupReveal(tries + 1)); return }
      if (reduce) return
      els.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(14px)' })
      let shown = 0
      const check = () => { const vh = window.innerHeight; for (const el of els) { if ((el as any).__shown) continue; if (el.getBoundingClientRect().top < vh * 0.88) { (el as any).__shown = true; el.style.transitionDelay = ((shown++) * 70) + 'ms'; el.style.opacity = '1'; el.style.transform = 'none' } } if (shown < els.length) rafs.push(requestAnimationFrame(check)) }
      check()
    }

    function setupMotif() {
      const cv = motifRef.current
      if (!cv || !cv.getBoundingClientRect().width) { requestAnimationFrame(setupMotif); return }
      const fit = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); const r = cv.getBoundingClientRect(); const w = r.width, h = r.height; cv.width = w * dpr; cv.height = h * dpr; const ctx = cv.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { w, h, ctx } }
      let g = fit()
      const cols = ['#8b7bf0', '#4d8df0', '#21b3a0', '#f2683f', '#84b53a', '#d99320']
      const cx0 = () => g.w / 2, cy0 = () => g.h / 2, R = () => Math.min(g.w, g.h) * 0.40
      const N = cols.length * 9
      let ps: any[] = []
      const mk = () => { ps = []; for (let i = 0; i < N; i++) { const ang = Math.random() * Math.PI * 2; const rad = R() + (Math.random() - .2) * 22; ps.push({ a: ang, r: rad, sp: (0.0016 + Math.random() * 0.0022) * (Math.random() < .5 ? 1 : -1), c: cols[i % cols.length], sz: Math.random() * 1.6 + 1.2, ph: Math.random() * Math.PI * 2 }) } }
      mk()
      fitFn = () => { g = fit(); mk() }
      const draw = (t: number) => {
        const ctx = g.ctx; ctx.clearRect(0, 0, g.w, g.h)
        const pts = ps.map((p) => { const rr = p.r + Math.sin(t * 0.001 + p.ph) * 7; return { x: cx0() + Math.cos(p.a) * rr, y: cy0() + Math.sin(p.a) * rr, c: p.c, sz: p.sz } })
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 46) { ctx.strokeStyle = 'rgba(28,25,23,' + (0.07 * (1 - d / 46)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke() } }
        ctx.globalAlpha = .9; for (const p of pts) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, 7); ctx.fill() } ctx.globalAlpha = 1
      }
      if (reduce) { draw(0); return }
      const loop = (t: number) => { for (const p of ps) p.a += p.sp; draw(t || 0); rafs.push(requestAnimationFrame(loop)) }
      loop(0)
    }

    const onResize = () => fitFn && fitFn()
    window.addEventListener('resize', onResize)
    setupMotif(); setupTextReveal(); setupReveal()

    return () => {
      rafs.forEach((r) => cancelAnimationFrame(r))
      if (twPoll) clearInterval(twPoll)
      if (onScrollTW) { window.removeEventListener('scroll', onScrollTW); window.removeEventListener('resize', onScrollTW) }
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={wrapRef} data-screen-label="About" style={s('min-height:100vh;overflow-x:hidden')}>
      {/* HERO */}
      <section style={s('max-width:1120px;margin:0 auto;padding:58px 28px 40px;display:grid;grid-template-columns:1.25fr .75fr;gap:48px;align-items:center')}>
        <div>
          <p data-tw="1" style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>/ about</p>
          <h1 data-tw="2" style={s(`font-family:${stack};font-weight:600;font-size:clamp(36px,5vw,62px);line-height:1.03;letter-spacing:-.02em;margin:0 0 10px;text-wrap:balance`)}>{name}</h1>
          <p data-tw="3" style={s(`font-family:${stack};font-size:clamp(18px,2vw,23px);color:#57514b;margin:0 0 22px;font-weight:500`)}>{jobTitle} · FTSM, Universiti Kebangsaan Malaysia</p>
          <p data-tw="4" style={s('font-size:17px;line-height:1.65;color:#44403c;max-width:600px;margin:0 0 26px')}>Teaching and researching at the convergence of artificial intelligence, computational intelligence and interactive systems — designing systems that adapt, optimize and create, not just compute.</p>
          <div data-reveal style={s('display:flex;flex-wrap:wrap;gap:10px')}>
            <a href="/research" style={s('font-size:14.5px;font-weight:500;text-decoration:none;color:#fff;background:#16142e;padding:11px 18px;border-radius:8px')}>Explore the research →</a>
            <a href="/contact" style={s('font-size:14.5px;font-weight:500;text-decoration:none;color:#1c1917;background:#fff;border:1px solid #d9d3ca;padding:11px 18px;border-radius:8px')}>Get in touch</a>
          </div>
        </div>
        <div style={s('position:relative;width:300px;height:300px;justify-self:center')}>
          <canvas ref={motifRef} style={s('position:absolute;inset:-30px;width:calc(100% + 60px);height:calc(100% + 60px)')} />
          <img src="/profile.jpg" alt="" aria-hidden="true" style={s('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%;filter:blur(36px);opacity:.4;transform:scale(1.1)')} />
          <img src="/profile.jpg" alt={name} style={s('position:relative;width:100%;height:100%;object-fit:cover;border-radius:50%;border:5px solid #fff;box-shadow:0 20px 50px -20px rgba(28,25,23,.5)')} />
        </div>
      </section>

      {/* BIO */}
      <section style={s('max-width:1120px;margin:0 auto;padding:24px 28px 10px;display:grid;grid-template-columns:1.6fr 1fr;gap:48px;align-items:start')}>
        <div style={s('max-width:680px')}>
          <h2 data-tw="5" style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,32px);letter-spacing:-.02em;margin:0 0 20px`)}>A research program built on one question.</h2>
          <p data-tw="6" style={s('font-size:16.5px;line-height:1.75;color:#44403c;margin:0 0 18px')}>My academic journey has been shaped by a single guiding question — <em style={s('color:#1c1917')}>how can we design intelligent systems that adapt, optimize and create, not just compute?</em> It runs through everything from generative AI and evolutionary computing to expert systems and games informatics.</p>
          <p data-tw="7" style={s('font-size:16.5px;line-height:1.75;color:#44403c;margin:0 0 18px')}>I am a senior lecturer at the Faculty of Information Science and Technology (FTSM), Universiti Kebangsaan Malaysia, where I teach and conduct research at the intersection of artificial intelligence, computational intelligence and interactive systems.</p>
          <p data-tw="8" style={s('font-size:16.5px;line-height:1.75;color:#44403c;margin:0')}>At UKM I am committed to nurturing the next generation of AI researchers across Malaysia and the region — supervising postgraduate students working on metaheuristic optimization, simulation modelling and applied generative AI.</p>
        </div>
        <aside style={s('display:flex;flex-direction:column;gap:14px')}>
          <div style={s('background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:20px')}>
            <h3 style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin:0 0 14px")}>At a glance</h3>
            {facts.map((f) => (
              <div key={f.k} style={s('display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid #f3efe9;font-size:13.5px')}>
                <span style={s('color:#8a8279')}>{f.k}</span>
                <span style={s('color:#1c1917;font-weight:500;text-align:right')}>{f.v}</span>
              </div>
            ))}
          </div>
          <div style={s('background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:20px')}>
            <h3 style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin:0 0 12px")}>Profiles</h3>
            <div style={s('display:flex;flex-direction:column;gap:9px')}>
              {profiles.map((p) => (
                <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer" style={s('font-size:14px;color:#16142e;text-decoration:none;display:flex;justify-content:space-between')}><span>{p.label}</span><span style={s('color:#a39a8f')}>→</span></a>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {/* COMPETENCIES */}
      <section style={s('max-width:1120px;margin:0 auto;padding:46px 28px 20px')}>
        <p data-tw="9" style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px")}>/ core competencies</p>
        <h2 data-tw="10" style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.4vw,38px);letter-spacing:-.02em;margin:0 0 30px`)}>What I work with.</h2>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
          {competencies.map((c) => (
            <div key={c.title} data-reveal style={s(`background:#fff;border:1px solid #e7e3dd;border-left:3px solid ${c.accent};border-radius:13px;padding:20px;transition:opacity .5s ease, transform .5s ease, box-shadow .2s`)}>
              <div style={s('display:flex;align-items:center;gap:9px;margin-bottom:11px')}>
                <span style={s(`width:9px;height:9px;border-radius:50%;background:${c.accent}`)} />
                <h3 style={s('font-size:16px;font-weight:600;margin:0')}>{c.title}</h3>
              </div>
              <p style={s('font-size:13.5px;color:#57514b;line-height:1.55;margin:0')}>{c.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s('max-width:1120px;margin:30px auto 0;padding:20px 28px 70px')}>
        <div style={s('background:#16142e;border-radius:18px;padding:48px 44px')}>
          <h2 data-tw="11" style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;color:#fff;margin:0 0 12px`)}>Let&apos;s build something intelligent.</h2>
          <p data-tw="12" style={s('font-size:16px;line-height:1.6;color:#bdb8d6;margin:0 0 24px;max-width:560px')}>Postgraduate supervision, research collaboration and conference invitations are always welcome.</p>
          <a href="/contact" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 24px;border-radius:9px')}>Get in touch →</a>
        </div>
      </section>
    </div>
  )
}
