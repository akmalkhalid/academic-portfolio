'use client'

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import PageBanner from '@/components/PageBanner'

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
      <PageBanner
        eyebrow="/ contact"
        title={<>Let&apos;s start a conversation.</>}
        lede="Open to postgraduate supervision, research collaboration, joint grant applications and conference invitations. The fastest way to reach me is email."
      >
        <a href={`mailto:${email}`} className="btn-lume">Write to me <span aria-hidden="true">→</span></a>
        <a href="/postgraduate-guide" className="btn-ghost">Postgraduate application guide</a>
      </PageBanner>

      <section style={s('max-width:1120px;margin:0 auto;width:100%;padding:56px 28px 40px;flex:1')}>
        <div style={s('display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;align-items:start')}>
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
