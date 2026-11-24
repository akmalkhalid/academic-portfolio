'use client'

// Home — deliberately sparse. Six beats, in order:
//   hero (the question + the record)
//   → books and tools (free Prompt Cookbook; AutoWriterAI and Prompt Culinary Masterclass coming soon)
//   → the signature demo (the loop, running on two problems: Sudoku puzzles and game levels)
//   → the three research pillars (one per stage of the loop, each with its record) + horizon
//   → selected work → contact.
// The former standalone /engine/ page was folded in here: its live level search is the second
// face of the demo, and its pillar figures sit on the three stage cards.
// Everything else lives one click away: grants on /research, demos on
// /playground, the full record on /publications.

import Glyph from '@/components/Glyph'
import { s } from '@/lib/style'
import { PCOL } from '@/lib/view'
import LatentField from '@/components/LatentField'
import DemoDeck from '@/components/DemoDeck'

type Stats = {
  pubs: number; citations: number; hIndex: number | null; i10Index: number | null
  grants: number; students: number
  autoCitations?: number | null; autoSource?: string | null
  fundingTotal: number; fundingPI: number; firstYear: number
}
// One research pillar's record, counted in page.tsx (rule: lib/pillars.ts).
type PillarStat = { papers: number; perYear: number[]; grants: number; amount: number; students: number }
type SelectedGroup = { title: string; accent: string; items: { quartile: string; marker: string; cite: string; slug: string }[] }

const stack = "'Space Grotesk', system-ui, sans-serif"
const eyebrow = (dark: boolean) => s(`font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:${dark ? '#6f6a82' : '#a39a8f'};margin:0 0 10px`)
const h2 = (dark: boolean) => s(`font-family:${stack};font-weight:600;font-size:clamp(28px,3.6vw,40px);line-height:1.08;letter-spacing:-.02em;margin:0;color:${dark ? '#ECEAF3' : '#1c1917'}`)

const STAGES = [
  { n: '01', key: 'gen' as const, q: 'What could exist?', stage: 'Generate', accent: PCOL.gen, title: 'Generative & Agentic AI', line: 'Generative models, LLMs and agent teams propose candidate designs.', glyph: 'generate' as const, impact: 'Ludogenist' },
  { n: '02', key: 'eva' as const, q: 'Is it any good, for people?', stage: 'Evaluate', accent: PCOL.gam, title: 'Games Informatics & Engagement Modelling', line: 'Game refinement theory scores each design by how engaging it is to people.', glyph: 'evaluate' as const, impact: 'Explainability' },
  { n: '03', key: 'sea' as const, q: 'How do we find better ones?', stage: 'Search', accent: PCOL.evo, title: 'Computational Intelligence & Optimization', line: 'Metaheuristics and quality-diversity search decide what to generate next.', glyph: 'search' as const, impact: 'Sustainability' },
]

export default function HomeClient({
  hero, stats, articles, pillars, years, simCount,
}: {
  hero: { headline: string; sub: string }; stats: Stats; articles: SelectedGroup[]
  pillars: Record<'gen' | 'eva' | 'sea', PillarStat>; years: [number, number]; simCount: number
}) {
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
        <LatentField variant="hero" />
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
                <a href="/research/#ideas" className="btn-ghost">The programme</a>
                <a href="#building" className="btn-ghost">Books and tools</a>
                <a href="/cv/" className="btn-ghost">CV <span aria-hidden="true">→</span></a>
              </div>
              <p className="hero-foot">
                Behind this page is a live latent space: every point is an embedding, not a word, and each spark is a
                thought moving through it, attending to its neighbours as it goes. Click anywhere to start one.
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

      {/* BOOKS AND TOOLS — tiles in the style of a product shelf: each stage shows the thing itself
          rising out of a panel tinted with its own palette; label, line and action sit underneath.
          Styles: .bt-* in app/globals.css (hover needs real CSS). */}
      <section id="building" style={s('max-width:1120px;margin:0 auto;padding:64px 28px 60px;scroll-margin-top:60px')}>
        <p style={eyebrow(false)}>/ books and tools</p>
        <h2 style={h2(false)}>Things I have built that you can use.</h2>
        <p style={s('font-size:15.5px;line-height:1.65;color:#57514b;max-width:680px;margin:14px 0 28px')}>
          A free book to start with today, and a writing app and a second book on the way.
        </p>
        <div className="bt-grid">
          <a href="/cookbook/" className="bt-tile bt-cook">
            <div className="bt-stage">
              <span className="bt-chip">PDF · 88 pages</span>
              <div className="bt-page bt-page-back" aria-hidden="true" />
              <img className="bt-cover" src="/cookbook/cover.jpg" alt="Prompt Cookbook cover" loading="lazy" />
            </div>
            <div className="bt-body">
              <span className="bt-tag">Book · Free download</span>
              <h3>Prompt Cookbook</h3>
              <p>Recipes for AI innovation: prompt engineering for research and academic writing, with frameworks, templates and an ethics chapter.</p>
              <span className="bt-cta">Download free →</span>
            </div>
          </a>
          <a href="/autowriter/" className="bt-tile bt-auto">
            <div className="bt-stage">
              <span className="bt-chip">Desktop · EN / BM</span>
              <div className="bt-win" aria-hidden="true">
                <div className="bt-win-bar"><i /><i /><i /><b>AutoWriterAI</b></div>
                <div className="bt-canvas">
                  <svg viewBox="0 0 100 170" preserveAspectRatio="none" className="bt-wires"><path d="M41 22 C48 22 46 56 52 56" /><path d="M20 34 C20 70 24 70 24 104" /><path d="M66 68 C66 80 70 80 70 92" /></svg>
                  <span className="bt-node" style={s('left:4%;top:10px')}>Research question</span>
                  <span className="bt-node" style={s('left:52%;top:44px')}>1 · Methods</span>
                  <span className="bt-node bt-node-hot" style={s('left:8%;top:104px')}>3 · Introduction</span>
                  <span className="bt-hint"><em>LOGIC</em> “will eliminate” is stronger than your evidence.</span>
                </div>
              </div>
            </div>
            <div className="bt-body">
              <span className="bt-tag">App · Coming soon</span>
              <h3>AutoWriterAI</h3>
              <p>A private desktop workspace for scientific writing, from first idea to published paper, with a mentor that checks your argument as you write.</p>
              <span className="bt-cta">Join the waitlist →</span>
            </div>
          </a>
          <a href="/masterclass/" className="bt-tile bt-master">
            <div className="bt-stage">
              <span className="bt-chip">47 recipes</span>
              <div className="bt-page bt-page-back" aria-hidden="true" />
              <div className="bt-page bt-page-mid" aria-hidden="true" />
              <img className="bt-cover" src="/masterclass/cover.jpg" alt="Prompt Culinary Masterclass cover" loading="lazy" />
            </div>
            <div className="bt-body">
              <span className="bt-tag">Book · Coming soon</span>
              <h3>Prompt Culinary Masterclass</h3>
              <p>The craft and science of building with AI: plain-language recipes for turning prompts into reusable assistants, tools and agent briefs.</p>
              <span className="bt-cta">Get notified →</span>
            </div>
          </a>
        </div>
      </section>

      {/* SIGNATURE DEMO — the whole loop, running, on two design problems (a two-sided 3D viewer) */}
      <section id="demo" style={s('background:#0f0e14;padding:66px 0 60px;scroll-margin-top:60px')}>
        <div style={s('max-width:1120px;margin:0 auto;padding:0 28px')}>
          <p style={eyebrow(true)}>/ the loop, running live</p>
          <h2 style={h2(true)}>Watch an algorithm design, on two different problems.</h2>
          <DemoDeck />
        </div>
      </section>

      {/* THE LOOP — three stages, then the horizon */}
      <section id="research" style={s('max-width:1120px;margin:0 auto;padding:70px 28px 30px')}>
        <p style={eyebrow(false)}>/ research programme</p>
        <h2 style={h2(false)}>Generative optimization: one loop, three stages.</h2>
        <div className="home-stages">
          {STAGES.map((st) => (
            <a key={st.n} href="/research/#ideas" className="home-stage" style={s(`border-top:3px solid ${st.accent}`)}>
              <span style={s('display:flex;align-items:center;justify-content:space-between;gap:10px')}>
                <span style={s(`font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:600;letter-spacing:.08em;color:${st.accent}`)}>{st.n} · {st.stage.toUpperCase()}</span>
                <Glyph name={st.glyph} size={34} color={st.accent} />
              </span>
              <span style={s(`display:block;font-family:${stack};font-weight:600;font-size:18px;line-height:1.22;margin:10px 0 8px;color:#1c1917`)}>{st.title}</span>
              <span style={s(`display:block;font-family:${stack};font-weight:500;font-size:15px;color:${st.accent};margin:0 0 8px`)}>{st.q}</span>
              <span style={s('display:block;font-size:14px;line-height:1.6;color:#57514b;margin-bottom:10px')}>{st.line}</span>
              {/* what this stage is aimed at (the full story is on /about/#impact) */}
              <span style={s(`display:table;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;padding:4px 9px;border-radius:6px;margin-bottom:16px;background:${st.accent}1f;color:${st.accent}`)}>→ {st.impact}</span>
              {/* the record behind this stage: papers per year, then papers, funding and students */}
              <span className="home-spark" role="img" aria-label={`Publications per year, ${years[0]} to ${years[1]}`}>
                {pillars[st.key].perYear.map((n, i) => (
                  <i key={i} style={{ height: `${Math.max(4, (n / Math.max(...pillars[st.key].perYear, 1)) * 100)}%`, background: st.accent, opacity: n ? 1 : 0.18 }} />
                ))}
              </span>
              <span className="home-spark-axis"><span>{years[0]}</span><span>papers per year</span><span>{years[1]}</span></span>
              <span className="home-nums">
                <span><b>{pillars[st.key].papers}</b>papers</span>
                <span><b>{fmtMYR(pillars[st.key].amount)}</b>{pillars[st.key].grants} grant{pillars[st.key].grants === 1 ? '' : 's'}</span>
                {pillars[st.key].students > 0 ? <span><b>{pillars[st.key].students}</b>student{pillars[st.key].students === 1 ? '' : 's'}</span> : null}
              </span>
            </a>
          ))}
        </div>
        <p style={s('font-size:14px;line-height:1.6;color:#57514b;margin:18px 0 0;max-width:820px')}>
          <b style={s('color:#1c1917')}>Simulation is the test bench.</b> {simCount} of {stats.pubs} publications use agent-based, self-play or Monte
          Carlo simulation to run the loop before anything reaches real players, patients or factory floors.
        </p>
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
        <a href="/research/#ideas" style={s("display:inline-block;margin-top:24px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;text-decoration:none;color:#1c1917;border-bottom:2px solid #8b7bf0;padding-bottom:2px")}>Read the programme →</a>
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
        <a href="/research/#papers" style={s("display:inline-block;margin-top:22px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;text-decoration:none;color:#1c1917;border-bottom:2px solid #4d8df0;padding-bottom:2px")}>All {stats.pubs} publications →</a>
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
