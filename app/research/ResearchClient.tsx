'use client'

// The interactive half of /research. Everything on the page answers to ONE selection:
//
//     pillar (Generate / Evaluate / Search)  ·  year  ·  search text
//
// Change any of the three (from the buttons, the timeline, the atlas or the search box) and
// the headline numbers, the 3D header, the timeline and the lists all follow, because they
// are all computed from the same three arrays below: pm, gm and sm ("paper / grant /
// student matches the selection").
//
// Page order:
//   1. banner
//   2. header: 3D overview (Atlas or Constellation, switchable) beside the headline numbers
//   3. timeline: one band per pillar; bars = papers, lines = grants, squares = students
//   4. detail panel: Papers / Grants / People / Ideas for the current selection
//   5. full publication list (collapsed) and the collaboration call
//
// The data arrives from page.tsx, which builds it from the content folder at build time.

import { useEffect, useMemo, useRef, useState } from 'react'
import { s } from '@/lib/style'
import PageBanner from '@/components/PageBanner'
import Constellation3D, { type CLink } from '@/components/Constellation3D'
import ResearchAtlas from '@/components/ResearchAtlas'
import ImpactBridge, { type PillarStats } from '@/components/ImpactBridge'
import Glyph from '@/components/Glyph'
import { PCOL, PNAME, QCOL, CATNAME, type Code } from '@/lib/view'
import type { Pillar } from '@/lib/pillars'

type Paper = { t: string; y: number; pl: Pillar; pills: Code[]; q: string; cat: string; v: string; au: string; slug: string; citation: string; scholar: string }
type Grant = { t: string; agency: string; code: string; amt: number; pi: boolean; s0: string; s1: string; y0: number; y1: number; status: string; pl: Pillar; pills: Code[] }
type Student = { name: string; thesis: string; degree: string; status: string; y0: number; y1: number | null; role: string; pl: Pillar }
type Tab = 'papers' | 'grants' | 'people' | 'ideas'

// ---- the three pillars: one per stage of the loop ---------------------------------------
const ORDER: Pillar[] = ['gen', 'eva', 'sea']
const PIL: Record<Pillar, {
  verb: string; col: string; name: string; q: string; body: string; methods: string[]
  demo: { href: string; label: string }; slot: { level: string; funding: string; title: string; desc: string }
}> = {
  gen: {
    verb: 'Generate', col: '#8b7bf0', name: 'Generative & Agentic AI', q: 'What could exist?',
    body: 'Generative models, LLMs and agent teams propose candidate artefacts: levels, quests, puzzles, layouts, schedules, even new search operators. Generation is cheap and plentiful; on its own it has no sense of what is worth keeping.',
    methods: ['LLMs & agentic generation', 'GANs & diffusion', 'Procedural generators', 'LLM-proposed operators'],
    demo: { href: '/demos/quest-generation/', label: 'Agentic quest generation' },
    slot: { level: 'PhD', funding: 'Funded', title: 'LLM-Driven Human–AI Collaboration in Team Settings', desc: 'Large language models as collaborative teammates: how humans and AI co-reason, divide work and build shared understanding in team-based problem solving.' },
  },
  eva: {
    verb: 'Evaluate', col: '#f2683f', name: 'Games Informatics & Engagement Modelling', q: 'Is it any good, for people?',
    body: 'Each candidate is scored by models of how people experience it. Game-refinement theory and the "motion in mind" model turn engagement into a measurable signal, so the objective is human experience, not only accuracy or cost.',
    methods: ['Game-refinement measure', 'Motion-in-mind model', 'Self-play & agent simulation', 'Player-experience models'],
    demo: { href: '/demos/game-refinement/', label: 'Game refinement, self-play' },
    slot: { level: 'PhD', funding: 'Scholarship-eligible', title: 'Agentic Procedural Content Generation for Adaptive Play', desc: 'Integrating PCG with agentic and generative AI: co-designing levels, mechanics and narratives that adapt for richer, more entertaining player experiences.' },
  },
  sea: {
    verb: 'Search', col: '#21b3a0', name: 'Computational Intelligence & Optimization', q: 'How do we find better ones?',
    body: 'Metaheuristics decide what gets generated next: evolutionary, immune and swarm algorithms, and quality-diversity archives such as MAP-Elites that keep many different good solutions rather than one winner.',
    methods: ['Evolutionary & immune algorithms', 'Swarm intelligence', 'MAP-Elites / quality-diversity', 'Memetic hybrids'],
    demo: { href: '/demos/swarm-landscape/', label: 'Swarm on a fitness landscape' },
    slot: { level: 'PhD / MSc', funding: 'Scholarship-eligible', title: 'Optimizing for Engagement: Game Refinement Meets Optimization', desc: 'Coupling metaheuristic optimization with game-refinement theory: deriving new performance and engagement metrics that quantify what makes systems and play compelling.' },
  },
}

// ---- the Ideas tab: how the programme sits next to neighbouring fields ---------------------
// Integrity rule: "optinformatics" is an established term in evolutionary computation.
// Never imply it was coined here; the references below must stay.
const NEIGHBOURS = [
  { field: 'Search-based procedural content generation', shares: 'Search over generated game content.', differs: 'Adds modern generative models as the variation engine, and a theory of engagement as the objective.' },
  { field: 'Quality-diversity (e.g. MAP-Elites)', shares: 'Keeps an archive of diverse, high-performing solutions.', differs: 'Uses QD as one search strategy inside the loop, with engagement measures defining the behaviour space.' },
  { field: 'LLM-driven evolutionary algorithms', shares: 'Language models act as mutation, crossover or operator designers.', differs: 'Targets human-facing artefacts and human-centred fitness, not only benchmark functions.' },
  { field: 'Generative design (engineering)', shares: 'Machine-proposed designs refined by optimization.', differs: 'The designs are experiences (games, learning activities, interactive systems) judged by how people engage with them.' },
]
const REFS = [
  { text: 'Lim, D., Ong, Y.-S., Gupta, A., Goh, C. K. & Dutta, P. S. “Towards a new Praxis in optinformatics targeting knowledge re-use in evolutionary computation: simultaneous problem learning and optimization.” Evolutionary Intelligence 9(4): 203–220 (2016).' },
  { text: 'Feng, L., Hou, Y. & Zhu, Z. Optinformatics in Evolutionary Learning and Optimization. Adaptation, Learning, and Optimization, vol. 25. Springer (2021).', href: 'https://doi.org/10.1007/978-3-030-70920-4' },
  { text: 'Togelius, J., Yannakakis, G. N., Stanley, K. O. & Browne, C. “Search-based procedural content generation: A taxonomy and survey.” IEEE Transactions on Computational Intelligence and AI in Games 3(3): 172–186 (2011).' },
  { text: 'Mouret, J.-B. & Clune, J. “Illuminating search spaces by mapping elites.” arXiv:1504.04909 (2015).', href: 'https://arxiv.org/abs/1504.04909' },
  { text: 'Liu, S., Chen, C., Qu, X., Tang, K. & Ong, Y.-S. “Large language models as evolutionary optimizers.” arXiv:2310.19046 (2023, rev. 2024).', href: 'https://arxiv.org/abs/2310.19046' },
]

const GLYPH = { gen: 'generate', eva: 'evaluate', sea: 'search' } as const
const MONO = "font-family:'JetBrains Mono',monospace;"
const HEAD = "font-family:'Space Grotesk',system-ui,sans-serif;"
const rm = (n: number) => 'RM ' + (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n ? Math.round(n / 1e3) + 'k' : '0')
const TABS: Tab[] = ['papers', 'grants', 'people', 'ideas']

export default function ResearchClient({
  papers, grants, students, links, linkCounts, citeUpdated, years, today, stats,
}: {
  stats: PillarStats
  papers: Paper[]; grants: Grant[]; students: Student[]
  links: CLink[]; linkCounts: Record<CLink['kind'], number>; citeUpdated: string | null
  years: [number, number]; today: number
}) {
  const [Y0, Y1] = years, N = Y1 - Y0 + 1
  const thisYear = Math.floor(today)

  // ---- the selection --------------------------------------------------------------------
  const [pillar, setPillar] = useState<Pillar | null>(null)
  const [year, setYear] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [quart, setQuart] = useState<string[]>([])     // Papers tab only: JCR quartile chips
  const [cats, setCats] = useState<string[]>([])       // Papers tab only: journal / conference / chapter
  // ---- the view -------------------------------------------------------------------------
  const [view, setView] = useState<'atlas' | 'constellation'>('atlas')
  const [tab, setTab] = useState<Tab>('papers')
  const [selected, setSelected] = useState<number | null>(null)   // index of the paper in focus
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Old addresses arrive with a hash (/publications -> #papers, /generative-optimization -> #ideas).
  useEffect(() => {
    const fromHash = () => {
      const h = location.hash.slice(1) as Tab
      if (TABS.includes(h)) { setTab(h); requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'start' })) }
    }
    fromHash(); window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])
  const openTab = (t: Tab) => { setTab(t); history.replaceState(null, '', '#' + t) }
  const toggleYear = (y: number) => setYear((cur) => (cur === y ? null : y))
  const pick = (i: number | null) => { setCopied(false); setSelected(i); if (i != null) setTab('papers') }
  const flip = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  // ---- which records match --------------------------------------------------------------
  const { pmBar, pmAny, pm, gm, sm } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const hit = (...text: string[]) => !q || text.join(' ').toLowerCase().includes(q)
    const inP = (pl: Pillar) => !pillar || pl === pillar
    // pmAny ignores the year, so the timeline can still show every year's bar
    // pmBar ignores pillar and year: it feeds the timeline bars (a dimmed band still shows its bars)
    const pmBar = papers.map((p) => hit(p.t, p.v, p.au, String(p.y)) && (!quart.length || quart.includes(p.q)) && (!cats.length || cats.includes(p.cat)))
    const pmAny = papers.map((p) => inP(p.pl) && hit(p.t, p.v, p.au, String(p.y)) && (!quart.length || quart.includes(p.q)) && (!cats.length || cats.includes(p.cat)))
    const pm = papers.map((p, i) => pmAny[i] && (year == null || p.y === year))
    // a grant or student matches a year if it was running in that year
    const gm = grants.map((g) => inP(g.pl) && hit(g.t, g.agency, g.code) && (year == null || (g.y0 < year + 1 && g.y1 >= year)))
    const sm = students.map((st) => inP(st.pl) && hit(st.name, st.thesis, st.degree) && (year == null || (st.y0 <= year && year <= (st.y1 ?? thisYear))))
    return { pmBar, pmAny, pm, gm, sm }
  }, [papers, grants, students, pillar, year, query, quart, cats, thisYear])

  const shownP = papers.map((p, i) => ({ p, i })).filter((x) => pm[x.i]).sort((a, b) => b.p.y - a.p.y || a.p.t.localeCompare(b.p.t))
  const shownG = grants.filter((_, i) => gm[i])
  const shownS = students.filter((_, i) => sm[i])
  const nQ = (q: string) => shownP.filter((x) => x.p.q === q).length
  const sumG = shownG.reduce((a, g) => a + g.amt, 0), sumPI = shownG.filter((g) => g.pi).reduce((a, g) => a + g.amt, 0)
  const numbers = [
    { n: String(shownP.length), label: 'Papers', hint: `JCR Q1 ${nQ('Q1')} · Q2 ${nQ('Q2')}`, tab: 'papers' as Tab },
    { n: rm(sumG), label: 'Grant value', hint: `${rm(sumPI)} led as PI`, tab: 'grants' as Tab },
    { n: String(shownG.length), label: 'Grants', hint: `${shownG.filter((g) => g.status === 'Active').length} active now`, tab: 'grants' as Tab },
    { n: String(shownS.length), label: 'Students', hint: `${shownS.filter((x) => x.status === 'Graduated').length} graduated`, tab: 'people' as Tab },
  ]
  const narrowed = pillar || year != null || query || quart.length || cats.length
  const clearAll = () => { setPillar(null); setYear(null); setQuery(''); setQuart([]); setCats([]); pick(null) }

  // ---- timeline geometry: a year is one column, X() is a position in percent ----------------
  const X = (f: number) => ((f - Y0) / N) * 100
  const count = (pl: Pillar, y: number) => papers.filter((p, i) => pmBar[i] && p.pl === pl && p.y === y).length
  const peak = Math.max(...ORDER.flatMap((pl) => Array.from({ length: N }, (_, k) => papers.filter((p) => p.pl === pl && p.y === Y0 + k).length)))
  const yearList = Array.from({ length: N }, (_, k) => Y0 + k)

  const sel = selected != null ? papers[selected] : null
  const copyCite = () => { if (sel) navigator.clipboard?.writeText(sel.citation).then(() => setCopied(true)) }
  const chip = (on: boolean, col = '#ECEAF3') => `${MONO}font-size:11.5px;padding:5px 11px;border-radius:999px;cursor:pointer;border:1px solid ${on ? col : 'rgba(255,255,255,.14)'};background:${on ? col + '24' : 'transparent'};color:${on ? col : '#9b96aa'}`
  const label = `${MONO}font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#6f6a82`

  return (
    <div>
      <PageBanner
        eyebrow="Research and publications"
        title={<>One programme, on one page.</>}
        lede={<>Generative AI <em>generates</em>, models of engagement <em>evaluate</em>, metaheuristics <em>search</em>. Every paper, grant and student here belongs to one of those three stages. Pick a stage or a year and the whole page follows.</>}
      >
        {TABS.map((t) => (<a key={t} href={'#' + t} className="banner-jump">↓ {t[0].toUpperCase() + t.slice(1)}</a>))}
      </PageBanner>

      <section className="rs-dark">
        <div className="rs-wrap">

          {/* 2. HEADER: 3D overview + headline numbers */}
          <div className="rs-top">
            <div className="rs-stage">
              <div style={s('position:absolute;top:12px;left:12px;z-index:4;display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(20,18,28,.8);border:1px solid rgba(255,255,255,.12)')} role="group" aria-label="Choose the 3D view">
                {(['atlas', 'constellation'] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
                    style={s(`${MONO}font-size:11.5px;padding:6px 13px;border-radius:999px;border:none;cursor:pointer;background:${view === v ? '#ECEAF3' : 'transparent'};color:${view === v ? '#0f0e14' : '#9b96aa'}`)}>
                    {v === 'atlas' ? 'Atlas' : 'Constellation'}
                  </button>
                ))}
              </div>
              {/* Both stay mounted so switching is instant; the hidden one is paused. */}
              <div style={s('display:' + (view === 'atlas' ? 'block' : 'none'))}>
                <ResearchAtlas
                  papers={papers} grants={grants.map((g) => ({ t: g.t, y0: g.y0, y1: g.y1, pl: g.pl, amt: g.amt, pi: g.pi }))}
                  students={students.map((st) => ({ t: st.name, y: st.y0, pl: st.pl }))}
                  pm={pm} gm={gm} sm={sm} year={year} selected={selected} onSelect={pick} onYear={toggleYear}
                  years={years} active={view === 'atlas'} height={410}
                />
              </div>
              <div style={s('display:' + (view === 'constellation' ? 'block' : 'none'))}>
                <Constellation3D nodes={papers} links={links} matched={pm} selected={selected} onSelect={pick} active={view === 'constellation'} height={410} />
              </div>
            </div>

            <div className="rs-side">
              <div className="rs-nums">
                {numbers.map((x) => (
                  <button key={x.label} type="button" onClick={() => openTab(x.tab)} className="rs-num">
                    <span style={s(`${HEAD}font-weight:600;font-size:clamp(24px,2.6vw,32px);letter-spacing:-.02em;color:#ECEAF3;line-height:1`)}>{x.n}</span>
                    <span style={s('font-size:13px;color:#cfcad9;margin-top:6px')}>{x.label}</span>
                    <span style={s(`${MONO}font-size:10.5px;color:#6f6a82;margin-top:3px`)}>{x.hint}</span>
                  </button>
                ))}
              </div>
              <div style={s('display:flex;flex-direction:column;gap:7px')} role="group" aria-label="Filter by pillar">
                {ORDER.map((k) => {
                  const on = pillar === k, n = papers.filter((p) => p.pl === k).length
                  return (
                    <button key={k} type="button" aria-pressed={on} onClick={() => setPillar(on ? null : k)} className="rs-pill"
                      style={s(`border-color:${on ? PIL[k].col : 'rgba(255,255,255,.1)'};background:${on ? PIL[k].col + '1f' : 'rgba(255,255,255,.03)'};opacity:${pillar && !on ? '.55' : '1'}`)}>
                      <Glyph name={GLYPH[k]} size={26} color={PIL[k].col} />
                      <span style={s('flex:1;min-width:0;text-align:left')}>
                        <span style={s(`${HEAD}font-weight:600;font-size:14.5px;color:#ECEAF3`)}>{PIL[k].verb}</span>
                        <span style={s('font-size:12.5px;color:#9b96aa;margin-left:8px')}>{PIL[k].q}</span>
                      </span>
                      <span style={s(`${MONO}font-size:11px;color:#9b96aa;flex-shrink:0`)}>{n} papers</span>
                    </button>
                  )
                })}
              </div>
              <div style={s('display:flex;gap:8px;align-items:center')}>
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search papers, grants, people…" aria-label="Search papers, grants and people"
                  style={s('flex:1;min-width:0;font-size:14px;color:#ECEAF3;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:10px 13px;outline:none')} />
                {narrowed ? <button type="button" onClick={clearAll} style={s(chip(false) + ';flex-shrink:0')}>Clear ✕</button> : null}
              </div>
            </div>
          </div>
          {view === 'constellation' ? <p style={s(`${MONO}font-size:10.5px;color:#56516a;margin:10px 0 0`)}>{linkCounts.cite} citation streams (particles flow from citing to cited paper{citeUpdated ? `, OpenAlex · ${citeUpdated}` : ''}) · {linkCounts.coauthor} shared co-author links · {linkCounts.similar} topic-similarity links</p> : null}

          {/* 3. TIMELINE */}
          <div style={s('display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:34px 0 10px')}>
            <h2 style={s(`${HEAD}font-weight:600;font-size:19px;letter-spacing:-.01em;color:#ECEAF3;margin:0`)}>{Y0} to {Y1}, by stage</h2>
            <span style={s(`${MONO}font-size:11px;color:#6f6a82`)}>▮ papers per year · ━ grant (● led as PI) · ■ student start · click a year to focus it</span>
          </div>
          <div className="rs-time">
            {ORDER.map((pl) => {
              const dim = pillar && pillar !== pl
              let lane = 0; const seen: Record<number, number> = {}
              return (
                <div key={pl} className="rs-band" style={s(`opacity:${dim ? '.28' : '1'}`)}>
                  <span style={s(`position:absolute;left:8px;top:7px;${MONO}font-size:10.5px;font-weight:600;letter-spacing:.1em;color:${PIL[pl].col}`)}>{PIL[pl].verb.toUpperCase()}</span>
                  {grants.map((g, i) => g.pl !== pl ? null : (
                    <span key={'g' + i} title={`${g.t} · ${rm(g.amt)} · ${g.s0.slice(0, 4)}–${g.s1.slice(0, 4)}`}
                      style={s(`position:absolute;left:${X(g.y0)}%;width:${X(g.y1) - X(g.y0)}%;top:${7 + (lane++) * 7}px;height:${Math.round(2 + Math.min(3, g.amt / 150000))}px;border-radius:3px;background:${PIL[pl].col};opacity:${gm[i] ? '.95' : '.22'}`)}>
                      {g.pi ? <i style={s(`position:absolute;left:-4px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#0f0e14;border:2px solid ${PIL[pl].col};box-sizing:border-box`)} /> : null}
                    </span>
                  ))}
                  {yearList.map((y) => {
                    const c = count(pl, y)
                    return c ? (
                      <span key={y} style={s(`position:absolute;bottom:16px;left:${X(y + 0.2)}%;width:${(0.6 / N) * 100}%;height:${Math.max(3, (c / peak) * 46)}px;border-radius:3px 3px 0 0;background:${PIL[pl].col};opacity:${year == null || year === y ? '.92' : '.3'}`)}>
                        <b style={s(`position:absolute;left:0;right:0;top:-14px;text-align:center;${MONO}font-size:9.5px;font-weight:500;color:#9b96aa`)}>{c}</b>
                      </span>
                    ) : null
                  })}
                  {students.map((st, i) => {
                    if (st.pl !== pl) return null
                    const k = (seen[st.y0] = (seen[st.y0] || 0) + 1) - 1
                    return <span key={'s' + i} title={`${st.name} · ${st.degree} · from ${st.y0}`} style={s(`position:absolute;bottom:4px;left:calc(${X(st.y0 + 0.2)}% + ${k * 9}px);width:7px;height:7px;background:#ECEAF3;border:1.5px solid ${PIL[pl].col};box-sizing:border-box;opacity:${sm[i] ? '1' : '.25'}`)} />
                  })}
                </div>
              )
            })}
            <span aria-hidden="true" title="today" style={s(`position:absolute;top:0;bottom:22px;left:${X(today)}%;border-left:1px dashed rgba(236,234,243,.4);pointer-events:none`)} />
            <div className="rs-axis">
              {yearList.map((y) => (<span key={y} style={s(`color:${year === y ? '#ECEAF3' : '#6f6a82'};font-weight:${year === y ? '600' : '400'}`)}><i className="rs-yy">{String(y).slice(0, 2)}</i>{String(y).slice(2)}</span>))}
            </div>
            {/* one invisible button per year, laid over the whole chart */}
            {yearList.map((y) => (
              <button key={y} type="button" className="rs-col" aria-pressed={year === y} aria-label={`${y}: ${papers.filter((p, i) => pmAny[i] && p.y === y).length} papers`} onClick={() => toggleYear(y)}
                style={s(`left:${X(y)}%;width:${100 / N}%;${year === y ? 'background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22)' : ''}`)} />
            ))}
          </div>

          {/* 4. DETAIL PANEL */}
          <div ref={panelRef} id="detail" style={s('margin-top:30px;scroll-margin-top:84px')}>
            <div style={s('display:flex;gap:6px;flex-wrap:wrap;align-items:center;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:12px')} role="tablist">
              {([['papers', `Papers · ${shownP.length}`], ['grants', `Grants · ${shownG.length}`], ['people', `People · ${shownS.length}`], ['ideas', 'Ideas']] as [Tab, string][]).map(([t, text]) => (
                <button key={t} id={t} type="button" role="tab" aria-selected={tab === t} onClick={() => openTab(t)}
                  style={s(`${HEAD}font-weight:600;font-size:14.5px;padding:8px 15px;border-radius:9px;border:none;cursor:pointer;scroll-margin-top:90px;background:${tab === t ? '#ECEAF3' : 'rgba(255,255,255,.05)'};color:${tab === t ? '#0f0e14' : '#cfcad9'}`)}>{text}</button>
              ))}
              <span style={s(`${MONO}font-size:11px;color:#6f6a82;margin-left:auto`)}>
                {[pillar ? PIL[pillar].verb + ' stage' : 'All stages', year ?? `${Y0}–${Y1}`, query ? `“${query}”` : ''].filter(Boolean).join(' · ')}
              </span>
            </div>

            {/* PAPERS */}
            <div role="tabpanel" style={s('display:' + (tab === 'papers' ? 'block' : 'none'))}>
              <div style={s('display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:14px 0')}>
                <span style={s(label + ';margin-right:4px')}>JCR</span>
                {['Q1', 'Q2', 'Q3'].map((q) => (<button key={q} type="button" aria-pressed={quart.includes(q)} onClick={() => setQuart(flip(quart, q))} style={s(chip(quart.includes(q), QCOL[q]))}>{q}</button>))}
                <span style={s(label + ';margin:0 4px 0 12px')}>Type</span>
                {Object.keys(CATNAME).map((c) => (<button key={c} type="button" aria-pressed={cats.includes(c)} onClick={() => setCats(flip(cats, c))} style={s(chip(cats.includes(c)))}>{CATNAME[c]}</button>))}
              </div>
              {sel ? (
                <div style={s(`border:1px solid ${PIL[sel.pl].col}66;background:${PIL[sel.pl].col}14;border-radius:14px;padding:18px 20px;margin-bottom:14px`)}>
                  <div style={s('display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px')}>
                    <span style={s(`${MONO}font-size:11px;font-weight:600;padding:3px 9px;border-radius:6px;background:${PIL[sel.pl].col}33;color:${PIL[sel.pl].col}`)}>{PIL[sel.pl].verb}</span>
                    {sel.pills.map((c) => (<span key={c} style={s(`${MONO}font-size:11px;color:#9b96aa`)}>{PNAME[c]}</span>))}
                    {sel.q !== 'NA' ? <span style={s(`${MONO}font-size:11px;font-weight:600;padding:3px 9px;border-radius:6px;background:${QCOL[sel.q]}26;color:${QCOL[sel.q]}`)}>JCR {sel.q}</span> : null}
                    <button type="button" onClick={() => pick(null)} aria-label="Close" style={s('margin-left:auto;width:28px;height:28px;border:none;border-radius:8px;background:rgba(255,255,255,.08);color:#cfcad9;font-size:17px;cursor:pointer')}>×</button>
                  </div>
                  <h3 style={s(`${HEAD}font-weight:600;font-size:19px;line-height:1.3;color:#ECEAF3;margin:0 0 8px;text-wrap:pretty`)}>{sel.t}</h3>
                  <p style={s("font-family:Georgia,'Times New Roman',serif;font-size:13.5px;line-height:1.6;color:#c9c4d6;margin:0 0 14px;text-wrap:pretty")}>{sel.citation}</p>
                  <div style={s('display:flex;gap:8px;flex-wrap:wrap')}>
                    <a href={`/publications/${sel.slug}/`} style={s(`${MONO}font-size:12px;font-weight:600;text-decoration:none;color:#fff;background:${PIL[sel.pl].col};padding:9px 14px;border-radius:8px`)}>Open the paper's page →</a>
                    <a href={sel.scholar} target="_blank" rel="noopener noreferrer" style={s(`${MONO}font-size:12px;font-weight:600;text-decoration:none;color:#0f0e14;background:#ECEAF3;padding:9px 14px;border-radius:8px`)}>Google Scholar ↗</a>
                    <button type="button" onClick={copyCite} style={s(`${MONO}font-size:12px;font-weight:600;cursor:pointer;color:${copied ? '#21b3a0' : '#cfcad9'};background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);padding:9px 14px;border-radius:8px`)}>{copied ? 'Copied ✓' : 'Copy citation'}</button>
                  </div>
                </div>
              ) : null}
              <div data-pubscroll="1" className="rs-list">
                {shownP.length ? shownP.map(({ p, i }) => (
                  <div key={i} onClick={() => pick(i)} className="rs-row" style={s(i === selected ? 'background:rgba(255,255,255,.06)' : '')}>
                    <span style={s(`${MONO}font-size:11px;font-weight:600;flex-shrink:0;width:30px;text-align:center;padding:3px 0;border-radius:5px;align-self:center;background:${p.q === 'NA' ? 'rgba(255,255,255,.06)' : QCOL[p.q] + '26'};color:${p.q === 'NA' ? '#7d7890' : QCOL[p.q]}`)}>{p.q === 'NA' ? '·' : p.q}</span>
                    <div style={s('flex:1;min-width:0')}>
                      <a href={`/publications/${p.slug}/`} onClick={(e) => e.stopPropagation()} style={s('font-size:14.5px;color:#e4e0ec;line-height:1.4;text-decoration:none')}>{p.t}</a>
                      <div style={s(`${MONO}font-size:11.5px;color:#7d7890;margin-top:4px;font-style:italic`)}>{p.v}</div>
                    </div>
                    <span title={PIL[p.pl].verb} style={s(`width:9px;height:9px;border-radius:50%;flex-shrink:0;align-self:center;background:${PIL[p.pl].col}`)} />
                    <span style={s(`${MONO}font-size:12px;color:#6f6a82;flex-shrink:0;width:38px;text-align:right`)}>{p.y}</span>
                  </div>
                )) : <p style={s('padding:26px 20px;margin:0;color:#9b96aa;font-size:14px')}>No papers match this selection. <button type="button" onClick={clearAll} style={s('background:none;border:none;color:#ECEAF3;text-decoration:underline;cursor:pointer;font-size:14px;padding:0')}>Clear it</button></p>}
              </div>
            </div>

            {/* GRANTS */}
            <div role="tabpanel" className="rs-list" style={s('margin-top:14px;display:' + (tab === 'grants' ? 'block' : 'none'))}>
              {shownG.length ? shownG.map((g, i) => (
                <div key={i} className="rs-row" style={s('cursor:default')}>
                  <span style={s(`width:4px;align-self:stretch;border-radius:2px;flex-shrink:0;background:${PIL[g.pl].col}`)} />
                  <div style={s('flex:1;min-width:0')}>
                    <div style={s('font-size:14.5px;color:#e4e0ec;line-height:1.4')}>{g.t}</div>
                    <div style={s(`${MONO}font-size:11.5px;color:#7d7890;margin-top:4px`)}>{g.agency}{g.code ? ' · ' + g.code : ''}</div>
                  </div>
                  <div style={s('flex-shrink:0;text-align:right')}>
                    <div style={s(`${HEAD}font-weight:600;font-size:15px;color:#ECEAF3`)}>RM {g.amt.toLocaleString()}</div>
                    <div style={s(`${MONO}font-size:11px;color:#7d7890;margin-top:4px`)}>{g.pi ? 'PI' : 'Co-I'} · {g.s0.slice(0, 4)}–{g.s1.slice(0, 4)} · <span style={s(`color:${g.status === 'Active' ? '#21b3a0' : '#7d7890'}`)}>{g.status}</span></div>
                  </div>
                </div>
              )) : <p style={s('padding:26px 20px;margin:0;color:#9b96aa;font-size:14px')}>No grants were running in this selection.</p>}
            </div>

            {/* PEOPLE */}
            <div role="tabpanel" style={s('margin-top:14px;display:' + (tab === 'people' ? 'block' : 'none'))}>
              <p style={s(label + ';margin:0 0 10px')}>Open research positions</p>
              <div className="rs-three">
                {ORDER.filter((k) => !pillar || k === pillar).map((k) => (
                  <div key={k} style={s(`border:1px solid rgba(255,255,255,.1);border-top:3px solid ${PIL[k].col};border-radius:12px;padding:16px 18px;background:rgba(255,255,255,.03)`)}>
                    <div style={s(`${MONO}font-size:10.5px;color:${PIL[k].col};margin-bottom:8px`)}>{PIL[k].slot.level} · {PIL[k].slot.funding}</div>
                    <h3 style={s(`${HEAD}font-weight:600;font-size:15.5px;line-height:1.3;color:#ECEAF3;margin:0 0 8px`)}>{PIL[k].slot.title}</h3>
                    <p style={s('font-size:13px;line-height:1.55;color:#9b96aa;margin:0')}>{PIL[k].slot.desc}</p>
                  </div>
                ))}
              </div>
              <p style={s('font-size:13.5px;color:#9b96aa;margin:12px 0 22px')}>Interested? Start with the <a href="/postgraduate-guide/" style={s('color:#ECEAF3')}>postgraduate guide</a>, then <a href="/contact/" style={s('color:#ECEAF3')}>get in touch</a>.</p>
              <p style={s(label + ';margin:0 0 10px')}>Students supervised</p>
              <div className="rs-list">
                {shownS.length ? shownS.map((st, i) => (
                  <div key={i} className="rs-row" style={s('cursor:default')}>
                    <span style={s(`width:9px;height:9px;flex-shrink:0;align-self:center;background:#ECEAF3;border:2px solid ${PIL[st.pl].col};box-sizing:border-box`)} />
                    <div style={s('flex:1;min-width:0')}>
                      <div style={s('font-size:14.5px;color:#e4e0ec;line-height:1.4')}>{st.name} <span style={s(`${MONO}font-size:11px;color:#7d7890;margin-left:6px`)}>{st.degree}</span></div>
                      <div style={s('font-size:12.5px;color:#7d7890;margin-top:4px;line-height:1.45')}>{st.thesis}</div>
                    </div>
                    <div style={s(`flex-shrink:0;text-align:right;${MONO}font-size:11px;color:#7d7890`)}>{st.role}<br />{st.y0}–{st.y1 ?? 'now'} · <span style={s(`color:${st.status === 'Graduated' ? '#21b3a0' : '#9b96aa'}`)}>{st.status}</span></div>
                  </div>
                )) : <p style={s('padding:26px 20px;margin:0;color:#9b96aa;font-size:14px')}>No students in this selection.</p>}
              </div>
            </div>

            {/* IDEAS */}
            <div role="tabpanel" style={s('margin-top:20px;display:' + (tab === 'ideas' ? 'block' : 'none'))}>
              <p style={s(`${HEAD}font-weight:500;font-size:clamp(19px,2.2vw,25px);line-height:1.36;letter-spacing:-.012em;color:#ECEAF3;margin:0 0 14px;max-width:900px`)}>
                <strong style={s('font-weight:700')}>Generative Optimization</strong> treats creative design as a search problem: generative models <span style={s(`color:${PIL.gen.col}`)}>propose</span> candidate artefacts, models of human engagement <span style={s(`color:${PIL.eva.col}`)}>evaluate</span> them, and metaheuristic <span style={s(`color:${PIL.sea.col}`)}>search</span> steers what is generated next.
              </p>
              <p style={s('font-size:15px;line-height:1.7;color:#9b96aa;margin:0 0 22px;max-width:820px')}>The goal is not a single optimum but a set of artefacts that are good, diverse and genuinely engaging for the people who use them. What sets the programme apart is the middle stage: the objective comes from a theory of engagement developed and published over more than a decade, rather than from a generic quality metric.</p>
              <div className="rs-three">
                {ORDER.map((k, n) => (
                  <div key={k} style={s(`border:1px solid rgba(255,255,255,.1);border-top:3px solid ${PIL[k].col};border-radius:12px;padding:18px;background:rgba(255,255,255,.03)`)}>
                    <div style={s(`${MONO}font-size:10.5px;letter-spacing:.1em;color:${PIL[k].col}`)}>0{n + 1} · {PIL[k].verb.toUpperCase()}</div>
                    <h3 style={s(`${HEAD}font-weight:600;font-size:17px;color:#ECEAF3;margin:8px 0 2px`)}>{PIL[k].q}</h3>
                    <div style={s('font-size:12.5px;color:#7d7890;margin-bottom:10px')}>{PIL[k].name}</div>
                    <p style={s('font-size:13.5px;line-height:1.6;color:#b3aec2;margin:0 0 12px')}>{PIL[k].body}</p>
                    <div style={s('display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px')}>{PIL[k].methods.map((m) => (<span key={m} style={s(`${MONO}font-size:10.5px;padding:3px 8px;border-radius:5px;background:${PIL[k].col}1f;color:${PIL[k].col}`)}>{m}</span>))}</div>
                    <a href={PIL[k].demo.href} style={s(`${MONO}font-size:12px;color:#ECEAF3;text-decoration:none;border-bottom:1px solid ${PIL[k].col}`)}>▶ {PIL[k].demo.label}</a>
                  </div>
                ))}
              </div>

              {/* what each stage is for: pillar -> expected impact. The research stage is always
                  dark, so the cards are told to use the dark palette whatever the site theme is. */}
              <h3 style={s(`${HEAD}font-weight:600;font-size:17px;color:#ECEAF3;margin:28px 0 4px`)}>What each stage is for</h3>
              <p style={s('font-size:13.5px;color:#9b96aa;margin:0 0 14px')}>Generate ↔ ludogenist · Evaluate ↔ explainability · Search ↔ sustainability</p>
              <div data-theme="dark"><ImpactBridge stats={stats} /></div>

              <h3 style={s(`${HEAD}font-weight:600;font-size:17px;color:#ECEAF3;margin:28px 0 10px`)}>Next to neighbouring fields</h3>
              <div className="rs-list" style={s('max-height:none')}>
                {NEIGHBOURS.map((nb) => (
                  <div key={nb.field} className="rs-nb">
                    <strong style={s('font-size:14px;font-weight:600;color:#e4e0ec')}>{nb.field}</strong>
                    <span style={s('font-size:13.5px;color:#9b96aa;line-height:1.5')}><i style={s(label + ';font-style:normal;display:block;margin-bottom:3px')}>shares</i>{nb.shares}</span>
                    <span style={s('font-size:13.5px;color:#cfcad9;line-height:1.5')}><i style={s(label + ';font-style:normal;display:block;margin-bottom:3px')}>differs</i>{nb.differs}</span>
                  </div>
                ))}
              </div>

              <h3 style={s(`${HEAD}font-weight:600;font-size:17px;color:#ECEAF3;margin:28px 0 10px`)}>From optimizing designs to learning how to optimize</h3>
              <div className="rs-two">
                <div style={s('border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:18px;background:rgba(255,255,255,.03)')}>
                  <span style={s(`${MONO}font-size:10.5px;font-weight:600;letter-spacing:.08em;color:#84b53a`)}>NOW</span>
                  <h4 style={s(`${HEAD}font-weight:600;font-size:17px;color:#ECEAF3;margin:8px 0`)}>Generative Optimization</h4>
                  <p style={s('font-size:13.5px;line-height:1.6;color:#b3aec2;margin:0')}>Close the generate → evaluate → search loop for individual design problems: puzzles, levels, quests, learning activities and interactive systems, each optimized against human engagement.</p>
                </div>
                <div style={s('border:1px solid rgba(139,123,240,.45);border-radius:12px;padding:18px;background:rgba(139,123,240,.1)')}>
                  <span style={s(`${MONO}font-size:10.5px;font-weight:600;letter-spacing:.08em;color:#c9c1ff`)}>NEXT</span>
                  <h4 style={s(`${HEAD}font-weight:600;font-size:17px;color:#fff;margin:8px 0`)}>Generative Optinformatics</h4>
                  <p style={s('font-size:13.5px;line-height:1.6;color:#cfcad9;margin:0 0 8px')}>Make the loop learn from itself. Every run leaves knowledge behind: archives of elites, search trajectories, evaluator feedback. Generative models can mine that experience and reuse it, to seed new searches, propose better operators and transfer what worked from one design problem to the next.</p>
                  <p style={s('font-size:12.5px;line-height:1.55;color:#9b96aa;margin:0')}>Builds on <em>optinformatics</em>, the established idea of bringing informatics and learning into the optimization process (Lim et al. 2016; Feng, Hou &amp; Zhu 2021), extended here with generative models.</p>
                </div>
              </div>
              <details style={s('margin-top:18px')}>
                <summary style={s(`${MONO}font-size:12px;color:#cfcad9;cursor:pointer`)}>Key references ({REFS.length})</summary>
                <ol style={s('margin:12px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:8px')}>
                  {REFS.map((r) => (<li key={r.text} style={s('font-size:13px;line-height:1.55;color:#9b96aa')}>{r.text}{r.href ? <> <a href={r.href} target="_blank" rel="noopener noreferrer" style={s('color:#cfcad9')}>link ↗</a></> : null}</li>))}
                </ol>
              </details>
            </div>
          </div>

          {/* 5. THE PLAIN LIST: every paper, for committees, printing and search engines */}
          <details style={s('margin-top:30px;border-top:1px solid rgba(255,255,255,.1);padding-top:16px')}>
            <summary style={s(`${HEAD}font-weight:600;font-size:15px;color:#ECEAF3;cursor:pointer`)}>Full publication list, newest first ({papers.length})</summary>
            {yearList.slice().reverse().map((y) => {
              const list = papers.filter((p) => p.y === y)
              return list.length ? (
                <div key={y} style={s('margin-top:16px')}>
                  <h3 style={s(`${MONO}font-size:12px;font-weight:600;color:#9b96aa;margin:0 0 6px`)}>{y}</h3>
                  <ul style={s('margin:0;padding-left:18px;display:flex;flex-direction:column;gap:7px')}>
                    {list.map((p) => (<li key={p.slug} style={s('font-size:13.5px;line-height:1.55;color:#b3aec2')}><a href={`/publications/${p.slug}/`} style={s('color:#b3aec2;text-decoration:none')}>{p.citation}</a>{p.q !== 'NA' ? <span style={s(`${MONO}font-size:10.5px;color:${QCOL[p.q]};margin-left:6px`)}>JCR {p.q}</span> : null}</li>))}
                  </ul>
                </div>
              ) : null
            })}
          </details>

          <div style={s('margin-top:34px;background:#16142e;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:34px 32px;display:flex;gap:20px;flex-wrap:wrap;align-items:center')}>
            <div style={s('flex:1;min-width:260px')}>
              <h2 style={s(`${HEAD}font-weight:600;font-size:clamp(21px,2.6vw,28px);letter-spacing:-.02em;color:#fff;margin:0 0 8px`)}>Want to work on one of these?</h2>
              <p style={s('font-size:15px;line-height:1.6;color:#bdb8d6;margin:0;max-width:560px')}>Postgraduate supervision and research collaboration at every stage of the loop. Funded and scholarship-eligible positions are open.</p>
            </div>
            <a href="/contact/" style={s('font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 22px;border-radius:9px')}>Get in touch →</a>
            <a href="/postgraduate-guide/" style={s('font-size:14.5px;font-weight:500;text-decoration:none;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);padding:13px 22px;border-radius:9px')}>Postgraduate guide →</a>
          </div>
        </div>
      </section>
    </div>
  )
}
