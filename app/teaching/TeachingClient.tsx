'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { s } from '@/lib/style'
import PageBanner from '@/components/PageBanner'
import { AMAZON_DELEGATE, AMAZON_PROPOSAL, ETSY_PROPOSAL } from '@/lib/books'
import LearningStage, { FOCUS, FOCUS_ORDER, type Focus, type StageTile } from '@/components/LearningStage'

const stack = "'Space Grotesk', system-ui, sans-serif"

type Course = { code: string; title: string; meta: string; accent: string; link: string; hasLabs: boolean; labs: { title: string; href: string; blurb: string }[] }
type Ongoing = { name: string; thesis: string; startYear: string; degShort: string; degStyle: string; roleShort: string; dots: string[] }
type TrRow = { when: string; kind: string; title: string; client: string; audience: string }
type Training = { done: TrRow[]; next: TrRow[]; stats: { num: string; label: string; color: string }[] }
const KIND_COL: Record<string, string> = { workshop: '#21b3a0', course: '#8b7bf0', talk: '#4d8df0', keynote: '#e0a03a', webinar: '#8a8279' }
type Grad = { name: string; thesis: string; degree: string; completion: number | string; role: string; now: string }

export default function TeachingClient({
  current, past, currentCount, pastCount, ongoing, graduated, supStats, training,
}: {
  training: Training
  current: Course[]; past: Course[]; currentCount: number; pastCount: number
  ongoing: Ongoing[]; graduated: Grad[]; supStats: { num: string; label: string; color: string }[]
}) {
  const wrapRef = useRef<HTMLDivElement>(null)

  // ---- the learning focus ------------------------------------------------------------
  // One choice drives two things: the 3D stage at the top (which structure is in front)
  // and which of the four panels below it is shown. Only the chosen panel is visible;
  // the other three stay in the page (hidden) so search engines and the site assistant
  // still read them.
  // The address can carry it too: /teaching/#training opens on Training.
  const [focus, setFocus] = useState<Focus>('teaching')
  // which current course has its companion tools unfolded (a course code, or '')
  const [openCourse, setOpenCourse] = useState('')
  useEffect(() => {
    const fromHash = () => {
      const h = location.hash.slice(1)
      // #course-TTTC6544 (a course tile in the stage): show Teaching and unfold that course
      if (h.startsWith('course-')) {
        setFocus('teaching'); setOpenCourse(h.slice(7))
        requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
        return
      }
      const hit = FOCUS_ORDER.find((k) => k === h || FOCUS[k].anchor === h)
      if (hit) setFocus(hit)
    }
    fromHash(); window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])
  const pickFocus = (f: Focus) => {
    // Where the browser supports it, the swap of panels is cross-faded.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void }
    if (doc.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) doc.startViewTransition(() => setFocus(f))
    else setFocus(f)
    history.replaceState(null, '', '#' + f)
  }

  // Every item on the page as one small tile for the 3D stage.
  const tiles = useMemo<StageTile[]>(() => {
    const labs = [...current, ...past].flatMap((c) => c.labs.map((l) => ({ group: 'open' as const, kicker: c.code + ' · lab tool', title: l.title, href: l.href })))
    return [
      // a current course tile jumps to that course in the list below and unfolds its tools;
      // previously taught ones are greyed and not links
      ...current.map((c) => ({ group: 'teaching' as const, kicker: c.code + ' · now', title: c.title, href: '#course-' + c.code })),
      ...past.map((c) => ({ group: 'teaching' as const, kicker: c.code + ' · taught', title: c.title, href: '', dim: true })),
      ...training.next.slice(0, 2).map((r) => ({ group: 'training' as const, kicker: r.when + ' · next', title: r.title, href: '#training' })),
      ...training.done.slice(0, 12).map((r) => ({ group: 'training' as const, kicker: r.when, title: r.title, href: '#training' })),
      ...ongoing.map((o) => ({ group: 'supervision' as const, kicker: o.degShort + ' · ' + o.roleShort, title: o.name, href: '#supervision', inner: o.roleShort === 'Main' })),
      ...graduated.map((g) => ({ group: 'supervision' as const, kicker: g.degree + ' · graduated', title: g.name, href: '#supervision', inner: g.role === 'Main' })),
      { group: 'open', kicker: 'Weekly newsletter', title: 'Kopi & Prompt, the archive', href: '/newsletter/kopi-prompt/' },
      { group: 'open', kicker: 'Book · free', title: 'Prompt Cookbook', href: '/cookbook/' },
      { group: 'open', kicker: 'Tools', title: 'The toolkit from my workshops', href: '/toolkit/' },
      { group: 'open', kicker: 'Live demos', title: 'Playground: things you can run', href: '/playground/' },
      ...labs.slice(0, 8),
    ]
  }, [current, past, training, ongoing, graduated])
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
      <PageBanner
        eyebrow="/ teaching & mentorship"
        title="Courses, supervision and open learning."
        lede="Undergraduate and postgraduate courses at FTSM, postgraduate researchers under supervision, and open-access materials anyone can learn from."
      />

      {/* THE 3D STAGE: pick a focus, the model and the sections below rearrange */}
      <LearningStage tiles={tiles} focus={focus} onFocus={pickFocus} />

      {/* THE PANEL: only the chosen focus is shown. Each panel is a short list, not a wall
          of cards; the 3D stage above is the overview, this is the readable detail.
          Unlisted workshop kits are deliberately not linked from here. */}
      <div className="teach-flow">

        {/* TEACHING */}
        <section id="teaching" hidden={focus !== 'teaching'} className="tp">
          <h2 className="tp-h">Courses</h2>
          <p className="tp-label">Teaching now · {currentCount}</p>
          <div className="tp-list">
            {current.map((c) => {
              const row = (
                <>
                  <span className="tp-code" style={s(`color:${c.accent}`)}>{c.code}</span>
                  <span className="tp-main"><b>{c.title}</b><i>{c.meta}{c.hasLabs ? ` · ${c.labs.length} companion ${c.labs.length === 1 ? 'tool' : 'tools'}` : ''}</i></span>
                  <span className="tp-go">{c.hasLabs ? (openCourse === c.code ? 'Hide tools ↑' : 'Show tools ↓') : ''}</span>
                </>
              )
              // A course with companion tools unfolds in place (it does not jump to a tool);
              // a course without any is a plain row.
              if (!c.hasLabs) return c.link
                ? <a key={c.code} id={'course-' + c.code} href={c.link} className="tp-row tp-link" style={s(`border-left-color:${c.accent}`)}>{row}<span className="tp-go">Syllabus →</span></a>
                : <div key={c.code} id={'course-' + c.code} className="tp-row" style={s(`border-left-color:${c.accent}`)}>{row}</div>
              const open = openCourse === c.code
              return (
                <div key={c.code} id={'course-' + c.code} className="tp-course" style={s(`border-left-color:${c.accent}`)}>
                  <button type="button" className="tp-row tp-link" aria-expanded={open} onClick={() => setOpenCourse(open ? '' : c.code)}>{row}</button>
                  <div className="tp-tools" hidden={!open}>
                    {c.link ? <a href={c.link}><b>Syllabus</b><span>Open →</span></a> : null}
                    {c.labs.map((l) => (
                      <a key={l.href} href={l.href}>
                        <b>{l.title}</b>
                        {l.blurb ? <i>{l.blurb}</i> : null}
                        <span>Open →</span>
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="tp-label">Previously taught · {pastCount}</p>
          <div className="tp-past">
            {past.map((c) => (<span key={c.code}><b>{c.code}</b> {c.title}</span>))}
          </div>
        </section>

        {/* TRAINING — rows come from content/cv.yml › training.delivered, the same data both
            CVs print. Future-dated rows show as "next". */}
        <section id="training" hidden={focus !== 'training'} className="tp">
          <h2 className="tp-h">Training &amp; workshops</h2>
          <p className="tp-lede">Hands-on AI training beyond the lecture hall, for police officers, hospital staff, corporate teams, faculties, libraries and visiting cohorts.</p>
          <div className="tp-stats">
            {training.stats.map((st, i) => (<div key={i} style={s(`border-top-color:${st.color}`)}><b>{st.num}</b><span>{st.label}</span></div>))}
          </div>
          <div className="tp-list">
            {training.next.map((r, i) => (
              <div key={'n' + i} className="tp-row tp-next" style={s(`border-left-color:${KIND_COL[r.kind] || '#8a8279'}`)}>
                <span className="tp-code" style={s(`color:${KIND_COL[r.kind] || '#8a8279'}`)}>{r.when}</span>
                <span className="tp-main"><b>{r.title}</b><i>{r.client}</i></span>
                <span className="tp-go">next · {r.kind}</span>
              </div>
            ))}
            {training.done.slice(0, 8).map((r, i) => (
              <div key={i} className="tp-row" style={s(`border-left-color:${KIND_COL[r.kind] || '#8a8279'}`)}>
                <span className="tp-code" style={s(`color:${KIND_COL[r.kind] || '#8a8279'}`)}>{r.when}</span>
                <span className="tp-main"><b>{r.title}</b><i>{r.client}{r.audience ? ' · ' + r.audience : ''}</i></span>
                <span className="tp-go">{r.kind}</span>
              </div>
            ))}
          </div>
          <p className="tp-more"><a href="/cv/?reader=industry&pages=full">All {training.done.length} sessions, with audiences and formats, in the trainer CV →</a></p>
          <p className="tp-book">The AI-in-research sessions, condensed into a short book: <a href={AMAZON_DELEGATE} target="_blank" rel="noopener noreferrer"><i>Delegate Tasks, Never Judgment</i> on Kindle ↗</a></p>
        </section>

        {/* SUPERVISION */}
        <section id="supervision" hidden={focus !== 'supervision'} className="tp">
          <h2 className="tp-h">Postgraduate supervision</h2>
          <div className="tp-stats">
            {supStats.map((st, i) => (<div key={i} style={s(`border-top-color:${st.color}`)}><b>{st.num}</b><span>{st.label}</span></div>))}
          </div>
          <p className="tp-label">Ongoing researchers</p>
          <div className="tp-list">
            {ongoing.map((st, i) => (
              <div key={i} className="tp-row" style={s('border-left-color:#4d8df0')}>
                <span className="tp-code" style={s('color:#4d8df0')}>{st.degShort} · {st.roleShort}</span>
                <span className="tp-main"><b>{st.name}</b><i>{st.thesis}</i></span>
                <span className="tp-go">since &apos;{st.startYear}</span>
              </div>
            ))}
          </div>
          <p className="tp-label">Graduated</p>
          <div className="tp-list">
            {graduated.map((st, i) => (
              <div key={i} className="tp-row" style={s('border-left-color:#84b53a')}>
                <span className="tp-code" style={s('color:#84b53a')}>{st.degree} · {st.completion}</span>
                <span className="tp-main"><b>{st.name}</b><i>{st.thesis}{st.now && st.now !== '—' ? ' · Now: ' + st.now : ''}</i></span>
                <span className="tp-go">{st.role}</span>
              </div>
            ))}
          </div>
          <p className="tp-more"><a href="/postgraduate-guide/">Thinking of applying? Read the postgraduate guide →</a></p>
          <p className="tp-book">My proposal workbook for Master&apos;s and PhD students: <i>From Idea to Proposal</i>, as a <a href={AMAZON_PROPOSAL} target="_blank" rel="noopener noreferrer">paperback on Amazon ↗</a> or a <a href={ETSY_PROPOSAL} target="_blank" rel="noopener noreferrer">printable on Etsy ↗</a></p>
        </section>

        {/* OPEN LEARNING — everything here is public: no sign-up, no paywall */}
        <section id="open-learning" hidden={focus !== 'open'} className="tp">
          <h2 className="tp-h">Open learning</h2>
          <p className="tp-lede">Open-access material anyone can read, use and adapt. No sign-up, no paywall.</p>
          <div className="tp-list">
            {[
              { k: 'Newsletter', t: 'Kopi & Prompt, the archive', d: 'Weekly Friday issues of practical AI prompts for academic staff: one real headache, one tool, one named technique, cited evidence.', h: '/newsletter/kopi-prompt/' },
              { k: 'Book · free', t: 'Prompt Cookbook', d: 'The published prompt book, as a free download.', h: '/cookbook/' },
              { k: 'Tools', t: 'The toolkit', d: 'The AI tools I use and teach in workshops, with what each is good for.', h: '/toolkit/' },
              { k: 'Live demos', t: 'Playground', d: 'Small simulations and research demos you can run in the browser.', h: '/playground/' },
            ].map((o) => (
              <a key={o.h} href={o.h} className="tp-row tp-link" style={s('border-left-color:#21b3a0')}>
                <span className="tp-code" style={s('color:#21b3a0')}>{o.k}</span>
                <span className="tp-main"><b>{o.t}</b><i>{o.d}</i></span>
                <span className="tp-go">Open →</span>
              </a>
            ))}
          </div>
          <p className="tp-more"><a href="#teaching">Course lab tools are listed under each course in Teaching →</a></p>
        </section>
      </div>

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
