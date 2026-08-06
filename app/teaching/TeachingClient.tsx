'use client'

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'

const stack = "'Space Grotesk', system-ui, sans-serif"

type Course = { code: string; title: string; meta: string; accent: string; hasLabs: boolean; labs: { title: string; href: string; blurb: string }[] }
type Ongoing = { name: string; thesis: string; startYear: string; degShort: string; degStyle: string; roleShort: string; dots: string[] }
type Grad = { name: string; thesis: string; degree: string; completion: number | string; role: string; now: string }

export default function TeachingClient({
  current, past, currentCount, pastCount, ongoing, graduated, supStats,
}: {
  current: Course[]; past: Course[]; currentCount: number; pastCount: number
  ongoing: Ongoing[]; graduated: Grad[]; supStats: { num: string; label: string; color: string }[]
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const root = () => wrapRef.current || document
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
    <div ref={wrapRef} data-screen-label="Teaching" style={s('min-height:100vh;overflow-x:hidden')}>
      <section style={s('max-width:1120px;margin:0 auto;padding:56px 28px 20px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>/ teaching &amp; mentorship</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(38px,5.6vw,68px);line-height:1.02;letter-spacing:-.02em;margin:0 0 18px;max-width:900px;text-wrap:balance`)}>Courses, supervision and open learning.</h1>
        <p style={s('font-size:18px;line-height:1.6;color:#57514b;max-width:660px;margin:0')}>Undergraduate and postgraduate courses at FTSM, postgraduate researchers under supervision, and open-access materials anyone can learn from.</p>
      </section>

      {/* Prompt Engineering Architect used to be featured here. It now lives with
          the other self-paced series under /workshops/, which are unlisted —
          shared directly with a cohort rather than linked from the site. */}

      {/* COURSES */}
      <section style={s('max-width:1120px;margin:0 auto;padding:40px 28px 10px')}>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,32px);letter-spacing:-.02em;margin:0 0 8px`)}>Courses</h2>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>Currently teaching · {currentCount}</p>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px')}>
          {current.map((c) => (
            <div key={c.code} style={s(`background:#fff;border:1px solid #e7e3dd;border-top:3px solid ${c.accent};border-radius:12px;padding:14px 15px`)}>
              <p style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;color:${c.accent};font-weight:600;margin:0 0 6px`)}>{c.code}</p>
              <h3 style={s('font-size:15px;font-weight:600;line-height:1.28;margin:0 0 7px')}>{c.title}</h3>
              <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8279;margin:0")}>{c.meta}</p>
              {c.hasLabs && (
                <div style={s('margin-top:12px;padding-top:11px;border-top:1px solid #f0ece5')}>
                  <p style={s("font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#b4ab9f;margin:0 0 8px")}>Companion lab tools</p>
                  {c.labs.map((lab, i) => (
                    <a key={i} href={lab.href} style={s('display:flex;gap:9px;text-decoration:none;color:#1c1917;padding:8px 8px;margin:0 -6px;border-radius:9px')}>
                      <span style={s(`width:7px;height:7px;border-radius:50%;background:${c.accent};flex-shrink:0;margin-top:5px`)} />
                      <span style={s('min-width:0')}>
                        <span style={s('display:block;font-size:13px;font-weight:600;line-height:1.25')}>{lab.title}</span>
                        <span style={s('display:block;font-size:11.5px;color:#8a8279;line-height:1.4;margin-top:2px')}>{lab.blurb}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>Previously taught · {pastCount}</p>
        <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:12px')}>
          {past.map((c) => (
            <div key={c.code} style={s('background:#fbfaf8;border:1px solid #ece8e1;border-radius:11px;padding:15px')}>
              <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#a39a8f;font-weight:600;margin:0 0 6px")}>{c.code}</p>
              <h3 style={s('font-size:14px;font-weight:600;line-height:1.3;margin:0 0 6px')}>{c.title}</h3>
              <p style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#a39a8f;margin:0")}>{c.meta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SUPERVISION */}
      <section style={s('max-width:1120px;margin:0 auto;padding:46px 28px 10px')}>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,32px);letter-spacing:-.02em;margin:0 0 18px`)}>Postgraduate supervision</h2>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:28px')}>
          {supStats.map((st, i) => (
            <div key={i} style={s(`border-top:2px solid ${st.color};padding-top:12px`)}>
              <div style={s(`font-family:${stack};font-weight:600;font-size:30px;line-height:1;letter-spacing:-.02em`)}>{st.num}</div>
              <div style={s('font-size:13px;color:#57514b;margin-top:6px')}>{st.label}</div>
            </div>
          ))}
        </div>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin:0 0 14px")}>Ongoing researchers</p>
        <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-bottom:30px')}>
          {ongoing.map((st, i) => (
            <div key={i} title={st.thesis} style={s('display:flex;flex-direction:column;background:#fff;border:1px solid #e7e3dd;border-radius:11px;padding:13px 14px')}>
              <div style={s('display:flex;align-items:center;gap:7px;margin-bottom:7px')}>
                <span style={s(st.degStyle)}>{st.degShort}</span>
                <span style={s('display:flex;gap:3px')}>{st.dots.map((d, k) => (<span key={k} style={s(`width:7px;height:7px;border-radius:50%;background:${d}`)} />))}</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;color:#a39a8f;margin-left:auto")}>{st.roleShort} · &apos;{st.startYear}</span>
              </div>
              <h3 style={s('font-size:13.5px;font-weight:600;line-height:1.3;margin:0 0 4px')}>{st.name}</h3>
              <p style={s('font-size:11.5px;color:#8a8279;line-height:1.45;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden')}>{st.thesis}</p>
            </div>
          ))}
        </div>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin:0 0 14px")}>Graduated</p>
        <div style={s('display:grid;grid-template-columns:repeat(2,1fr);gap:14px')}>
          {graduated.map((st, i) => (
            <div key={i} title={st.thesis} style={s('background:#fbfaf8;border:1px solid #ece8e1;border-radius:11px;padding:13px 14px')}>
              <div style={s('display:flex;align-items:center;gap:8px;margin-bottom:6px')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:#27500a;background:#eaf3de;padding:2px 7px;border-radius:5px")}>{st.degree} · {st.completion}</span>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;color:#a39a8f;margin-left:auto")}>{st.role}</span>
              </div>
              <h3 style={s('font-size:13.5px;font-weight:600;line-height:1.3;margin:0 0 3px')}>{st.name}</h3>
              <p style={s('font-size:11.5px;color:#8a8279;line-height:1.45;margin:0 0 6px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden')}>{st.thesis}</p>
              <p style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#1c1917;margin:0")}>Now: {st.now}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s('max-width:1120px;margin:36px auto 0;padding:20px 28px 70px')}>
        <div style={s('background:#16142e;border-radius:18px;padding:48px 44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;color:#fff;margin:0 0 12px`)}>Thinking of a postgraduate degree?</h2>
          <p style={s('font-size:16px;line-height:1.6;color:#bdb8d6;margin:0 0 24px;max-width:560px')}>I welcome strong PhD and Master&apos;s applicants. Open positions aligned with my active research are listed on the Research page.</p>
          <div style={s('display:flex;gap:12px;flex-wrap:wrap')}>
            <a href="/postgraduate-guide" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 24px;border-radius:9px')}>Read the application guide →</a>
            <a href="/research" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:13px 24px;border-radius:9px')}>See open positions</a>
            <a href="/contact" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);padding:13px 24px;border-radius:9px')}>Get in touch</a>
          </div>
        </div>
      </section>
    </div>
  )
}
