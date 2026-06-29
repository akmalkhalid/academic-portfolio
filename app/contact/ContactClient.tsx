'use client'

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'

const stack = "'Space Grotesk', system-ui, sans-serif"

export default function ContactClient({
  email, details, profiles,
}: { email: string; details: { label: string; value: string; href: string; accent: string }[]; profiles: { label: string; href: string }[] }) {
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
    <div ref={wrapRef} data-screen-label="Contact" style={s('min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden')}>
      <section style={s('max-width:1120px;margin:0 auto;width:100%;padding:64px 28px 40px;display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center;flex:1')}>
        <div>
          <p style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>/ contact</p>
          <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(38px,5.4vw,64px);line-height:1.03;letter-spacing:-.02em;margin:0 0 18px;text-wrap:balance`)}>Let&apos;s start a conversation.</h1>
          <p style={s('font-size:17.5px;line-height:1.6;color:#57514b;max-width:520px;margin:0 0 30px')}>Open to postgraduate supervision, research collaboration, joint grant applications and conference invitations. The fastest way to reach me is email.</p>
          <a href={`mailto:${email}`} style={s('display:inline-flex;align-items:center;gap:10px;font-size:15px;font-weight:500;text-decoration:none;color:#fff;background:#16142e;padding:13px 22px;border-radius:9px')}>Write to me <span style={s("font-family:'JetBrains Mono',monospace")}>→</span></a>
          <p style={s('font-size:13.5px;color:#8a8279;margin:18px 0 0')}>Prospective postgraduate students: please read the <a href="/postgraduate-guide" style={s('color:#16142e;font-weight:500')}>application guide</a> before writing.</p>
        </div>

        <div style={s('display:flex;flex-direction:column;gap:12px')}>
          {details.map((d) => (
            <a key={d.label} href={d.href} style={s(`display:block;text-decoration:none;color:#1c1917;background:#fff;border:1px solid #e7e3dd;border-left:3px solid ${d.accent};border-radius:13px;padding:18px`)}>
              <div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin-bottom:7px")}>{d.label}</div>
              <div style={s('font-size:15px;font-weight:500;line-height:1.4')}>{d.value}</div>
            </a>
          ))}
          <div style={s('background:#fff;border:1px solid #e7e3dd;border-radius:13px;padding:18px')}>
            <div style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#a39a8f;margin-bottom:11px")}>Profiles</div>
            <div style={s('display:flex;flex-wrap:wrap;gap:8px')}>
              {profiles.map((p) => (
                <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer" style={s("font-family:'JetBrains Mono',monospace;font-size:12px;text-decoration:none;color:#16142e;background:#f4f2ee;border:1px solid #e7e3dd;padding:6px 12px;border-radius:7px")}>{p.label}</a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
