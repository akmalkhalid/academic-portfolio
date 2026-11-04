'use client'

// Home — deliberately sparse. Five beats, in order:
//   hero (the question + the record) → the signature demo (the loop, running)
//   → the loop in words (three stages + horizon) → selected work → contact.
// Everything else lives one click away: grants on /research, demos on
// /playground, the full record on /publications.

import { s } from '@/lib/style'
import { PCOL } from '@/lib/view'
import ProcLandscape from '@/components/ProcLandscape'
import HeroSim from '@/components/HeroSim'
import PuzzleLoop from '@/components/PuzzleLoop'

type Stats = {
  pubs: number; citations: number; hIndex: number | null; i10Index: number | null
  grants: number; students: number
  autoCitations?: number | null; autoSource?: string | null
  fundingTotal: number; fundingPI: number; firstYear: number
}
type SelectedGroup = { title: string; accent: string; items: { quartile: string; marker: string; cite: string; slug: string }[] }

const stack = "'Space Grotesk', system-ui, sans-serif"
const eyebrow = (dark: boolean) => s(`font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${dark ? '#6f6a82' : '#a39a8f'};margin:0 0 10px`)
const h2 = (dark: boolean) => s(`font-family:${stack};font-weight:600;font-size:clamp(28px,3.6vw,40px);line-height:1.08;letter-spacing:-.02em;margin:0;color:${dark ? '#ECEAF3' : '#1c1917'}`)

const STAGES = [
  { n: '01', stage: 'Generate', accent: PCOL.gen, title: 'Generative & Agentic AI', line: 'Generative models, LLMs and agent teams propose candidate designs.' },
  { n: '02', stage: 'Evaluate', accent: PCOL.gam, title: 'Games Informatics & Engagement Modelling', line: 'Game refinement theory scores each design by how engaging it is to people.' },
  { n: '03', stage: 'Search', accent: PCOL.evo, title: 'Computational Intelligence & Optimization', line: 'Metaheuristics and quality-diversity search decide what to generate next.' },
]

export default function HomeClient({
  hero, stats, articles,
}: { hero: { headline: string; sub: string }; stats: Stats; articles: SelectedGroup[] }) {
  // Ringgit, short form: 1508350 → "RM 1.51M". Derived upstream, never typed.
  const fmtMYR = (n: number) =>
    n >= 1e6 ? `RM ${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `RM ${Math.round(n / 1e3)}k` : `RM ${n}`

  // The credentials card: a label/value list, the way a CV header reads — not a
  // row of big-number tiles. Every figure here is computed in page.tsx.
  const credentials: { k: string; v: string }[] = [
    { k: 'Citations', v: stats.citations.toLocaleString() },
    { k: 'h-index / i10', v: `${stats.hIndex ?? '—'} / ${stats.i10Index ?? '—'}` },
    { k: 'Peer-reviewed', v: String(stats.pubs) },
    { k: 'Grants', v: `${stats.grants} · ${fmtMYR(stats.fundingTotal)}` },
    { k: 'Postgraduates', v: String(stats.students) },
  ]

  // The three verbs in the question are lit in their pillar's colour, so the
  // colour is a real signal rather than decoration: optimize → Computational
  // Intelligence & Optimization (teal), adapt → Games Informatics & Engagement
  // Modelling (coral), create → Generative & Agentic AI (violet). Falls back
  // silently to plain text if the question copy changes.
  const HL: Record<string, string> = { adapt: 'hl-b', optimize: 'hl-a', create: 'hl-c' }
  const headlineNodes = (hero.headline || '').split(/(\s+)/).map((tok, i) => {
    const cls = HL[tok.toLowerCase().replace(/[^a-z]/g, '')]
    return cls ? <span key={i} className={'hl ' + cls}>{tok}</span> : <span key={i}>{tok}</span>
  })


  return (
    <div data-screen-label="Home" style={s('min-height:100vh;overflow-x:hidden')}>
      {/* HERO — the research question, with the record beside it (study E3) */}
      <section id="top" className="dark-band" data-dark-band="1">
        <ProcLandscape variant="hero" />
        <HeroSim variant="hero" />
        <div className="band-inner">
          <div className="hero-grid">
            <div className="hero-in" style={s('min-width:0')}>
              <p className="hero-eyebrow">
                <span className="txt">A research programme built on one question</span>
              </p>
              <h1 className="hero-title">{headlineNodes}</h1>
              <p className="hero-answer">
                {hero.sub} since {stats.firstYear}.
              </p>
              <div className="hero-ctas">
                <a href="#demo" className="btn-lume">Watch the loop run <span aria-hidden="true">→</span></a>
                <a href="/generative-optimization" className="btn-ghost">The programme</a>
                <a href="/cv/" className="btn-ghost">CV <span aria-hidden="true">→</span></a>
              </div>
              <p className="hero-foot">
                The terrain behind this page is generated live and the swarm crossing it is a real search climbing
                those ridges. Click anywhere to regenerate the landscape.
              </p>
            </div>

            {/* The record, as one object: face, name, title and evidence together */}
            <aside className="record" aria-label="Academic record at a glance">
              <div className="record-id">
                <img className="record-face" src="/portrait.png" alt="Dr. Mohd Nor Akmal Khalid" />
                <div style={s('min-width:0')}>
                  <div className="record-name">Dr. Mohd Nor Akmal Khalid</div>
                  <div className="record-role">Senior Lecturer · FTSM, UKM</div>
                </div>
              </div>
              <dl className="record-list">
                {credentials.map((c) => (
                  <div className="record-row" key={c.k}>
                    <dt>{c.k}</dt>
                    <dd>{c.v}</dd>
                  </div>
                ))}
              </dl>
              <a className="record-link" href="/cv">Full curriculum vitae <span aria-hidden="true">→</span></a>
            </aside>
          </div>
        </div>
      </section>

      {/* SIGNATURE DEMO — the whole loop, running */}
      <section id="demo" style={s('background:#0f0e14;padding:66px 0 60px;scroll-margin-top:60px')}>
        <div style={s('max-width:1120px;margin:0 auto;padding:0 28px')}>
          <p style={eyebrow(true)}>/ the loop, running live</p>
          <h2 style={h2(true)}>Watch an algorithm design an engaging puzzle.</h2>
          <p style={s('font-size:15.5px;line-height:1.65;color:#9b96aa;max-width:680px;margin:14px 0 30px')}>
            A generator edits Sudoku puzzles, a simulated player rates how engaging each one is, and a search archive
            keeps the best puzzle for every style. Most designs land too easy; watch the search find the narrow
            comfortable zone.
          </p>
          <div style={s('background:#16141f;border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:24px')}>
            <PuzzleLoop />
          </div>
          <p style={s('font-size:12.5px;line-height:1.6;color:#6f6a82;margin:14px 0 0;max-width:820px')}>
            An illustrative teaching model of my work on{' '}
            <a href="/publications/2025-Khalid2025a" style={s('color:#9b96aa')}>puzzle generation</a> and{' '}
            <a href="/publications/2020-Iida2020" style={s('color:#9b96aa')}>game refinement</a>: the generator here makes
            random edits where the research uses AI agents, and GR = √G / T is a simplified measure (G cells placed, T
            candidate values weighed).
          </p>
        </div>
      </section>

      {/* THE LOOP — three stages, then the horizon */}
      <section id="research" style={s('max-width:1120px;margin:0 auto;padding:70px 28px 30px')}>
        <p style={eyebrow(false)}>/ research programme</p>
        <h2 style={h2(false)}>Generative optimization: one loop, three stages.</h2>
        <div className="home-stages">
          {STAGES.map((st) => (
            <a key={st.n} href="/generative-optimization#loop" className="home-stage" style={s(`border-top:3px solid ${st.accent}`)}>
              <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:600;letter-spacing:.08em;color:${st.accent}`)}>{st.n} · {st.stage.toUpperCase()}</span>
              <span style={s(`display:block;font-family:${stack};font-weight:600;font-size:18px;line-height:1.22;margin:10px 0 8px;color:#1c1917`)}>{st.title}</span>
              <span style={s('display:block;font-size:14px;line-height:1.6;color:#57514b')}>{st.line}</span>
            </a>
          ))}
        </div>
        <div className="home-horizon">
          <div style={s('background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:20px 22px')}>
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.08em;color:#27500a;background:#eaf3de;padding:3px 8px;border-radius:5px")}>NOW</span>
            <div style={s(`font-family:${stack};font-weight:600;font-size:18px;margin:10px 0 6px`)}>Generative Optimization</div>
            <div style={s('font-size:13.5px;line-height:1.55;color:#57514b')}>Closing the loop for individual design problems, optimized against human engagement.</div>
          </div>
          <div className="gopt-arrow" aria-hidden="true">→</div>
          <div style={s('background:#16142e;border-radius:14px;padding:20px 22px')}>
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.08em;color:#c9c1ff;background:rgba(139,123,240,.18);padding:3px 8px;border-radius:5px")}>NEXT</span>
            <div style={s(`font-family:${stack};font-weight:600;font-size:18px;margin:10px 0 6px;color:#fff`)}>Generative Optinformatics</div>
            <div style={s('font-size:13.5px;line-height:1.55;color:#bdb8d6')}>A loop that learns from its own search history and transfers it to new design problems.</div>
          </div>
        </div>
        <a href="/generative-optimization" style={s("display:inline-block;margin-top:24px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;text-decoration:none;color:#1c1917;border-bottom:2px solid #8b7bf0;padding-bottom:2px")}>Read the programme →</a>
      </section>

      {/* SELECTED WORK — two papers per stage */}
      <section id="pubs" style={s('max-width:1120px;margin:0 auto;padding:50px 28px 30px')}>
        <p style={eyebrow(false)}>/ selected work</p>
        <h2 style={h2(false)}>Selected articles.</h2>
        <div className="home-pubs">
          {articles.map((group) => (
            <div key={group.title} style={s('min-width:0')}>
              <div style={s(`font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:600;letter-spacing:.06em;color:${group.accent};margin-bottom:6px`)}>{group.title.split(' · ')[0].toUpperCase()}</div>
              {group.items.slice(0, 2).map((it) => (
                <a key={it.slug} href={`/publications/${it.slug}`} style={s('display:block;padding:12px 0;border-bottom:1px solid #ece8e1;text-decoration:none;font-size:13.5px;line-height:1.55;color:#44403c')}>
                  {it.quartile && it.quartile !== 'NA' && (<span style={s(`font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:${group.accent}22;color:#1c1917;margin-right:7px`)}>{it.quartile}</span>)}
                  {it.cite}
                </a>
              ))}
            </div>
          ))}
        </div>
        <a href="/publications" style={s("display:inline-block;margin-top:22px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;text-decoration:none;color:#1c1917;border-bottom:2px solid #4d8df0;padding-bottom:2px")}>All {stats.pubs} publications →</a>
      </section>

      {/* CONTACT */}
      <section id="collab" style={s('max-width:1120px;margin:0 auto;padding:40px 28px 70px')}>
        <div style={s('background:#16142e;border-radius:18px;padding:48px 44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.4vw,38px);letter-spacing:-.02em;color:#fff;margin:0 0 12px`)}>Open to collaboration.</h2>
          <p style={s('font-size:16px;line-height:1.6;color:#bdb8d6;margin:0 0 24px;max-width:600px')}>PhD and Master&apos;s supervision at every stage of the loop, industry research collaboration, and conference invitations.</p>
          <a href="/contact" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 24px;border-radius:9px')}>Get in touch →</a>
        </div>
      </section>
    </div>
  )
}
