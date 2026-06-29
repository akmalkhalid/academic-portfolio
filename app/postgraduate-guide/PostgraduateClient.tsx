'use client'

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'

const stack = "'Space Grotesk', system-ui, sans-serif"

const glanceFacts = [
  { k: 'Degrees', v: 'PhD · MSc by Research' },
  { k: 'Response', v: '~10 working days' },
  { k: 'Funding', v: 'Self · scholarship · secured' },
  { k: 'Faculty', v: 'FTSM, UKM' },
]
const looking = [
  { accent: '#8b7bf0', title: 'Technical foundation', body: 'Comfort with calculus, linear algebra, probability, and at least one of: PyTorch/TensorFlow, evolutionary-computing toolkits, or simulation environments.' },
  { accent: '#f2683f', title: 'Research curiosity over credential collection', body: 'Strong applicants articulate a problem they find genuinely interesting and have begun reading around it.' },
  { accent: '#4d8df0', title: 'Communication discipline', body: 'Postgraduate research is largely a writing exercise. Concise, structured initial emails predict thesis quality.' },
]
const areas = [
  { accent: '#8b7bf0', title: 'Generative AI for domain-specific reasoning', desc: 'Combining large language models with structured knowledge.' },
  { accent: '#21b3a0', title: 'Evolutionary neural architecture search', desc: 'Multi-objective AutoML.' },
  { accent: '#f2683f', title: 'Procedural content generation in games', desc: 'AI-driven generation of levels, quests and narratives.' },
  { accent: '#84b53a', title: 'Agent-based simulation', desc: 'Applied to education, public health and sustainability.' },
  { accent: '#4d8df0', title: 'Hybrid metaheuristics for combinatorial optimization', desc: 'Scheduling, routing and allocation.' },
]
const sendItems = [
  { n: '01', text: 'A two-paragraph introduction citing at least one of my papers by title.' },
  { n: '02', text: 'Degree level (PhD / MSc by Research) and intended start semester.' },
  { n: '03', text: 'Funding situation (self-funded, seeking scholarship, or secured).' },
  { n: '04', text: 'A one-page research proposal (PDF) with problem statement, brief literature context and proposed approach.' },
  { n: '05', text: 'CV (PDF) with transcripts and English-proficiency evidence.' },
]
const nextSteps = [
  { tag: 'RESPONSE 01', accent: '#21b3a0', label: 'Let\u2019s discuss further', desc: 'The proposal resonates and there is capacity — we set up a conversation.' },
  { tag: 'RESPONSE 02', accent: '#d99320', label: 'Not the right fit, but try X', desc: 'I point you toward a colleague or a direction better matched to your interests.' },
  { tag: 'RESPONSE 03', accent: '#f2683f', label: 'Promising, but at capacity', desc: 'A strong application, but supervision slots are full for the intended intake.' },
]

export default function PostgraduateClient({ email }: { email: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let trPoll: any = null, onTrScroll: any = null
    function setupTextReveal(tries = 0) {
      const r = wrapRef.current
      if (!r) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      let els = ([...r.querySelectorAll('section h1, section h2, section h3, section p')] as HTMLElement[]).filter((el) => !el.closest('header,footer,nav') && el.textContent!.trim().length)
      if (!els.length || !els[0].offsetHeight) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      els = els.filter((el) => el.offsetHeight > 0)
      els.forEach((el, i) => { (el as any).__order = i; el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; (el as any).__shown = false })
      const reveal = (el: HTMLElement, d: number) => { (el as any).__shown = true; el.style.animation = 'dc-fade-up .6s cubic-bezier(.22,.61,.36,1) ' + d + 'ms both'; setTimeout(() => { el.style.animation = ''; el.style.opacity = '1'; el.style.transform = 'none' }, d + 720) }
      let sched = false
      const check = () => { sched = false; const vh = window.innerHeight; const pend = els.filter((el) => !(el as any).__shown).sort((a, b) => (a as any).__order - (b as any).__order); let i = 0; for (const el of pend) if (el.getBoundingClientRect().top < vh * 0.92) reveal(el, Math.min(i++, 7) * 80); if (els.every((el) => (el as any).__shown) && trPoll) { clearInterval(trPoll); trPoll = null } }
      onTrScroll = () => { if (sched) return; sched = true; requestAnimationFrame(check) }
      window.addEventListener('scroll', onTrScroll, { passive: true }); window.addEventListener('resize', onTrScroll)
      trPoll = setInterval(check, 220); check()
    }
    setupTextReveal()
    return () => { if (trPoll) clearInterval(trPoll); if (onTrScroll) { window.removeEventListener('scroll', onTrScroll); window.removeEventListener('resize', onTrScroll) } }
  }, [])

  return (
    <div ref={wrapRef} data-screen-label="Postgraduate guide" style={s('min-height:100vh;overflow-x:hidden')}>
      {/* HERO */}
      <section style={s('max-width:1120px;margin:0 auto;padding:58px 28px 26px;display:grid;grid-template-columns:1.4fr .6fr;gap:48px;align-items:start')}>
        <div>
          <p style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>/ postgraduate · supervision</p>
          <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(36px,5vw,60px);line-height:1.03;letter-spacing:-.02em;margin:0 0 16px;text-wrap:balance`)}>Postgraduate Application Guide</h1>
          <p style={s(`font-family:${stack};font-size:clamp(17px,2vw,21px);color:#57514b;font-style:italic;margin:0 0 20px;max-width:640px;line-height:1.4`)}>For prospective MSc by Research and PhD candidates considering supervision under my direction at FTSM, UKM.</p>
          <p style={s('font-size:17px;line-height:1.7;color:#44403c;max-width:640px;margin:0')}>Thank you for your interest in pursuing postgraduate research with me. This guide exists to help you decide whether we are a good research fit — before we both invest time in an application process.</p>
        </div>
        <aside style={s('background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:20px 22px')}>
          <h3 style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin:0 0 14px")}>At a glance</h3>
          {glanceFacts.map((f) => (
            <div key={f.k} style={s('display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #f3efe9;font-size:13.5px')}>
              <span style={s('color:#8a8279')}>{f.k}</span>
              <span style={s('color:#1c1917;font-weight:500;text-align:right')}>{f.v}</span>
            </div>
          ))}
          <a href={`mailto:${email}`} style={s("display:block;text-align:center;margin-top:16px;font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:500;text-decoration:none;color:#fff;background:#16142e;padding:10px 14px;border-radius:8px")}>Start an application →</a>
        </aside>
      </section>

      {/* BEFORE YOU WRITE */}
      <section style={s('max-width:1120px;margin:0 auto;padding:34px 28px 6px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px")}>/ first step</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3.1vw,34px);letter-spacing:-.02em;margin:0 0 20px`)}>Before you write to me</h2>
        <div style={s('background:#fff;border:1px solid #e7e3dd;border-left:3px solid #8b7bf0;border-radius:14px;padding:22px 24px;max-width:760px')}>
          <p style={s('font-size:16px;line-height:1.7;color:#44403c;margin:0 0 14px')}>Please read at least three of my recent first-author publications. Your proposal should connect to themes in my actual work — not just a research-area title.</p>
          <a href="/publications" style={s("font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;text-decoration:none;color:#16142e")}>Browse publications →</a>
        </div>
      </section>

      {/* WHAT I'M LOOKING FOR */}
      <section style={s('max-width:1120px;margin:0 auto;padding:46px 28px 6px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px")}>/ what i&apos;m looking for</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3.1vw,34px);letter-spacing:-.02em;margin:0 0 26px`)}>Three things that predict a good fit</h2>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
          {looking.map((c) => (
            <div key={c.title} style={s(`background:#fff;border:1px solid #e7e3dd;border-left:3px solid ${c.accent};border-radius:13px;padding:22px`)}>
              <div style={s('display:flex;align-items:center;gap:9px;margin-bottom:12px')}>
                <span style={s(`width:9px;height:9px;border-radius:50%;background:${c.accent}`)} />
                <h3 style={s('font-size:16px;font-weight:600;margin:0;line-height:1.25')}>{c.title}</h3>
              </div>
              <p style={s('font-size:13.5px;color:#57514b;line-height:1.6;margin:0')}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RESEARCH AREAS */}
      <section style={s('max-width:1120px;margin:0 auto;padding:46px 28px 6px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px")}>/ supervision areas</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3.1vw,34px);letter-spacing:-.02em;margin:0 0 22px`)}>Research areas I currently supervise in</h2>
        <div style={s('max-width:820px')}>
          {areas.map((a) => (
            <div key={a.title} style={s('display:flex;gap:16px;align-items:flex-start;padding:16px 0;border-top:1px solid #ece8e1')}>
              <span style={s(`width:10px;height:10px;border-radius:50%;background:${a.accent};margin-top:6px;flex-shrink:0`)} />
              <div>
                <h3 style={s('font-size:16.5px;font-weight:600;margin:0 0 4px;line-height:1.3')}>{a.title}</h3>
                <p style={s('font-size:14px;color:#57514b;line-height:1.55;margin:0')}>{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT TO SEND */}
      <section style={s('max-width:1120px;margin:0 auto;padding:46px 28px 6px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px")}>/ your initial email</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3.1vw,34px);letter-spacing:-.02em;margin:0 0 22px`)}>What to send</h2>
        <div style={s('background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:8px 24px;max-width:820px')}>
          {sendItems.map((it) => (
            <div key={it.n} style={s('display:flex;gap:18px;align-items:flex-start;padding:15px 0;border-top:1px solid #f0ece5')}>
              <span style={s("font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#16142e;flex-shrink:0;width:26px")}>{it.n}</span>
              <p style={s('font-size:15px;color:#44403c;line-height:1.55;margin:0')}>{it.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT HAPPENS NEXT */}
      <section style={s('max-width:1120px;margin:0 auto;padding:46px 28px 6px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px")}>/ what happens next</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3.1vw,34px);letter-spacing:-.02em;margin:0 0 12px`)}>My response is one of three</h2>
        <p style={s('font-size:16px;line-height:1.7;color:#44403c;max-width:680px;margin:0 0 26px')}>I respond within roughly 10 working days during teaching semesters.</p>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
          {nextSteps.map((n) => (
            <div key={n.tag} style={s(`background:#fff;border:1px solid #e7e3dd;border-top:3px solid ${n.accent};border-radius:13px;padding:22px`)}>
              <div style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.06em;color:${n.accent};font-weight:600;margin-bottom:10px`)}>{n.tag}</div>
              <h3 style={s('font-size:16px;font-weight:600;margin:0 0 8px;line-height:1.3')}>{n.label}</h3>
              <p style={s('font-size:13.5px;color:#57514b;line-height:1.6;margin:0')}>{n.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL THOUGHT */}
      <section style={s('max-width:1120px;margin:0 auto;padding:50px 28px 10px')}>
        <div style={s('max-width:760px;border-left:3px solid #16142e;padding-left:26px')}>
          <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 12px")}>/ final thought</p>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(23px,2.9vw,32px);letter-spacing:-.02em;margin:0 0 14px;line-height:1.15`)}>A doctorate is several years of your life.</h2>
          <p style={s('font-size:17px;line-height:1.75;color:#44403c;margin:0')}>The single most important factor in whether those years are productive — beyond funding, beyond institution prestige — is whether you and your supervisor are working on a question you both genuinely care about. Take the time to find that match.</p>
        </div>
      </section>

      {/* CTA */}
      <section style={s('max-width:1120px;margin:30px auto 0;padding:20px 28px 70px')}>
        <div style={s('background:#16142e;border-radius:18px;padding:48px 44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;color:#fff;margin:0 0 12px`)}>Ready to apply?</h2>
          <p style={s('font-size:16px;line-height:1.6;color:#bdb8d6;margin:0 0 24px;max-width:560px')}>Send your materials and I&apos;ll respond within roughly 10 working days during teaching semesters.</p>
          <a href={`mailto:${email}`} style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 24px;border-radius:9px')}>Email me — {email} →</a>
        </div>
      </section>
    </div>
  )
}
