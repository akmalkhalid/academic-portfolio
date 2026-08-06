'use client'

import type { JSX } from 'react'
import { s } from '@/lib/style'
import DemoTile from '@/components/DemoTile'
import DemoThumb from '@/components/pillar-demos/DemoThumb'
import DemoDisclaimer from '@/components/DemoDisclaimer'
import { PILLAR_DEMOS, PILLAR_ORDER } from '@/lib/demos/registry'
import CrowdEvacuation from '@/components/paper-demos/CrowdEvacuation'
import AssemblyLineBalancing from '@/components/paper-demos/AssemblyLineBalancing'
import ProductionScheduling from '@/components/paper-demos/ProductionScheduling'
import GameRefinement from '@/components/paper-demos/GameRefinement'
import QuestGeneration from '@/components/paper-demos/QuestGeneration'

const stack = "'Space Grotesk', system-ui, sans-serif"
const mono = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)
// The paper-demo sims lay themselves out with pixel offsets tuned for their
// natural embed height, so squeezing them much below ~200px makes the header,
// node labels and difficulty arc collide. 200 is also the pillar demos' own
// compact height, so one value keeps every tile on the page the same size.
const TILE_H = 200

const TOOLS = [
  {
    href: '/tools/gaya-ukm-formatter/',
    accent: '#21409A',
    kicker: 'Reference formatter',
    status: 'Live',
    title: 'Gaya UKM Reference Formatter',
    blurb:
      'Turn a form, raw BibTeX, a .bib file or a DOI into a clean Gaya UKM reference list — author–date, hanging indents, italics preserved. Bahasa Melayu or English, live preview, one-click copy.',
    chips: ['Fields · BibTeX · DOI', 'Crossref lookup', 'BM / EN', 'Copy & export'],
  },
  {
    href: '/tools/human-voice-check/',
    accent: '#d99320',
    kicker: 'Revision checker',
    status: 'Live',
    title: 'Human Voice — academic revision checker',
    blurb:
      'Paste a draft and see the paragraph-level patterns that read as machine-generated. Nine tells, each surfaced with the question only you can answer — it flags and asks, it never rewrites. Nothing is uploaded.',
    chips: ['9 voice patterns', 'Flag & ask · no rewrite', 'Offline POS parser', 'Runs locally'],
  },
]

type PaperDemo = {
  slug: string
  accent: string
  kicker: string
  years: string
  title: string
  blurb: string
  chips: string[]
  bg: string
  render: (accent: string, height: number) => JSX.Element
}

// Newest research first, matching the home-page showreel ordering.
const PAPER_DEMOS: PaperDemo[] = [
  {
    slug: 'quest-generation',
    accent: '#8b7bf0',
    kicker: 'Agentic content generation',
    years: '2025–2026',
    title: 'Agentic procedural content generation',
    blurb:
      'A generator and a critic agent evolve a random draft into a well-formed role-playing quest — an intro, a rising difficulty arc, a boss, a reward. Tune length, difficulty and variety, and watch quality climb.',
    chips: ['Generator + critic', 'Genetic loop', 'Difficulty arc'],
    bg: 'radial-gradient(120% 120% at 50% 0%,#1b1830 0%,#100e1a 72%)',
    render: (a, h) => <QuestGeneration accent={a} height={h} />,
  },
  {
    slug: 'game-refinement',
    accent: '#f2683f',
    kicker: 'Game refinement & engagement',
    years: '2019–2025',
    title: 'Game refinement & the engagement zone',
    blurb:
      'An abstract game plays itself; its refinement value GR = √B ⁄ D drifts across the comfortable zone (~0.07–0.08) where chess, Go and soccer cluster, with live thrill and addiction readouts.',
    chips: ['Self-play', 'Comfortable zone', 'Motion in mind'],
    bg: 'radial-gradient(120% 120% at 50% 0%,#241410 0%,#160c0a 72%)',
    render: (a, h) => <GameRefinement accent={a} height={h} />,
  },
  {
    slug: 'assembly-line-balancing',
    accent: '#4d8df0',
    kicker: 'Assembly line balancing',
    years: '2016–2025',
    title: 'Assembly line balancing',
    blurb:
      'An artificial immune system assigns precedence-constrained tasks to workstations under a cycle-time limit, rebalancing the line to raise efficiency and shrink the bottleneck.',
    chips: ['Precedence graph', 'Immune optimizer', 'Bottleneck tracking'],
    bg: 'radial-gradient(120% 120% at 50% 0%,#141d2c 0%,#0c1119 72%)',
    render: (a, h) => <AssemblyLineBalancing accent={a} height={h} />,
  },
  {
    slug: 'crowd-evacuation',
    accent: '#4d8df0',
    kicker: 'Emergency route planning',
    years: '2014–2018',
    title: 'Crowd evacuation',
    blurb:
      'A shopping-mall concourse clears through adjustable exits. A navigation field routes the crowd while congestion and panic reshape the flow — the “faster-is-slower” effect.',
    chips: ['Navigation field', 'Congestion + panic', 'Editable floor plan'],
    bg: 'radial-gradient(120% 120% at 50% 0%,#141d2c 0%,#0c1119 72%)',
    render: (a, h) => <CrowdEvacuation accent={a} height={h} />,
  },
  {
    slug: 'production-scheduling',
    accent: '#21b3a0',
    kicker: 'Production scheduling',
    years: '2012–2015',
    title: 'Production scheduling',
    blurb:
      'Jobs flow across machines in a flexible manufacturing system, working around maintenance windows. An immune optimizer reorders operations to compact the Gantt chart and cut the makespan.',
    chips: ['Gantt schedule', 'Machine maintenance', 'Makespan'],
    bg: 'radial-gradient(120% 120% at 50% 0%,#142420 0%,#0c1614 72%)',
    render: (a, h) => <ProductionScheduling accent={a} height={h} />,
  },
]

const PILLAR_BG: Record<string, string> = {
  'flow-field': 'radial-gradient(120% 120% at 50% 0%,#1b1830 0%,#100e1a 72%)',
  'maze-search': 'radial-gradient(120% 120% at 50% 0%,#141d2c 0%,#0c1119 72%)',
  'swarm-landscape': 'radial-gradient(120% 120% at 50% 0%,#142420 0%,#0c1614 72%)',
  boids: 'radial-gradient(120% 120% at 50% 0%,#241410 0%,#160c0a 72%)',
  'procedural-dungeon': 'radial-gradient(120% 120% at 50% 0%,#241410 0%,#160c0a 72%)',
  'game-of-life': 'radial-gradient(120% 120% at 50% 0%,#1b2314 0%,#10160c 72%)',
}

export default function PlaygroundClient({ counts }: { counts: Record<string, number> }) {
  return (
    <div data-screen-label="Playground" style={s('min-height:100vh;overflow-x:hidden')}>
      {/* HEADER */}
      <section style={s('max-width:1120px;margin:0 auto;padding:56px 28px 22px')}>
        <p style={mono('font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px')}>
          / playground · tools + live demos
        </p>
        <h1
          style={s(
            `font-family:${stack};font-weight:600;font-size:clamp(38px,5.6vw,68px);line-height:1.02;letter-spacing:-.02em;margin:0 0 18px;max-width:900px;text-wrap:balance`,
          )}
        >
          Things you can actually run.
        </h1>
        <p style={s('font-size:18px;line-height:1.6;color:#57514b;max-width:700px;margin:0 0 22px')}>
          Free browser-based utilities I built for my own research and teaching, plus the research itself —
          simulations and optimizers rebuilt from the published papers, and a stand-in for each research pillar.
          Everything runs locally in your browser; nothing is uploaded. Click any preview for the full interactive
          version.
        </p>
        <div style={mono('display:flex;flex-wrap:wrap;gap:18px;font-size:12px;color:#8a8279')}>
          <a href="#tools" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>
            ↓ Tools
          </a>
          <a href="#from-research" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>
            ↓ Built from published research
          </a>
          <a href="#pillar-demos" style={s('text-decoration:none;color:inherit;border-bottom:1px solid #e0dbd2;padding-bottom:2px')}>
            ↓ Research-pillar demos
          </a>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" style={s('max-width:1120px;margin:0 auto;padding:18px 28px 10px;scroll-margin-top:80px')}>
        <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(22px,2.8vw,30px);letter-spacing:-.02em;margin:0`)}>
            The toolkit
          </h2>
          <span style={mono('font-size:12px;color:#a39a8f')}>{TOOLS.length} tools · free · no sign-up</span>
        </div>
        <div className="pillar-grid">
          {TOOLS.map((t) => (
            <a
              key={t.href}
              className="pillar-card"
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              style={s(`border-top:3px solid ${t.accent};text-decoration:none;color:#1c1917`)}
            >
              <div style={s('display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px')}>
                <span style={mono(`font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${t.accent}`)}>
                  {t.kicker}
                </span>
                <span style={mono('font-size:10.5px;color:#10b07f;background:#e6f6ef;padding:3px 9px;border-radius:5px')}>{t.status}</span>
              </div>
              <h3
                style={s(
                  `font-family:${stack};font-weight:600;font-size:19px;line-height:1.2;letter-spacing:-.01em;margin:0 0 10px;text-wrap:pretty`,
                )}
              >
                {t.title}
              </h3>
              <p style={s('font-size:13.5px;line-height:1.58;color:#57514b;margin:0 0 16px')}>{t.blurb}</p>
              <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px')}>
                {t.chips.map((c) => (
                  <span key={c} style={mono('font-size:10.5px;font-weight:500;color:#57514b;background:#f3f0ea;border:1px solid #e7e3dd;padding:3px 8px;border-radius:5px')}>
                    {c}
                  </span>
                ))}
              </div>
              <span style={mono(`margin-top:auto;font-size:12.5px;font-weight:600;color:${t.accent}`)}>Open tool →</span>
            </a>
          ))}
          <div
            className="pillar-card"
            style={s('background:transparent;border:1.5px dashed #ddd6cc;justify-content:center')}
          >
            <p style={mono('font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#b4ab9f;margin:0 0 10px')}>More on the way</p>
            <p style={s('font-size:13.5px;line-height:1.58;color:#8a8279;margin:0')}>
              New utilities land here as research throws up problems worth solving once and sharing. Have a request?{' '}
              <a href="/contact" style={s('color:#16142e;font-weight:500;text-decoration:none;border-bottom:1px solid #d9d3ca')}>
                Get in touch →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* BUILT FROM PUBLISHED RESEARCH */}
      <section id="from-research" style={s('max-width:1120px;margin:0 auto;padding:44px 28px 10px;scroll-margin-top:80px')}>
        <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:6px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(22px,2.8vw,30px);letter-spacing:-.02em;margin:0`)}>
            Built from published research
          </h2>
          <span style={mono('font-size:12px;color:#a39a8f')}>{PAPER_DEMOS.length} simulations</span>
        </div>
        <p style={s('font-size:15px;line-height:1.6;color:#57514b;max-width:660px;margin:0 0 20px')}>
          Simulations and optimizers re-implemented directly from my papers. Each one is steerable — change the
          parameters and watch the result move.
        </p>
        <div className="pillar-grid">
          {PAPER_DEMOS.map((d) => {
            const papers = counts[d.slug] || 0
            return (
              <div key={d.slug} className="pillar-card" style={s(`border-top:3px solid ${d.accent}`)}>
                <DemoTile
                  href={`/demos/${d.slug}/`}
                  accent={d.accent}
                  eyebrow={d.kicker}
                  ariaLabel={`Open the full interactive demo: ${d.title}`}
                  bg={d.bg}
                >
                  {d.render(d.accent, TILE_H)}
                </DemoTile>
                <div style={s('display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:14px 0 8px')}>
                  {papers > 0 && <span style={mono('font-size:10.5px;color:#8a8279')}>{papers} linked papers</span>}
                  <span style={mono('font-size:10.5px;color:#a39a8f')}>{d.years}</span>
                </div>
                <h3
                  style={s(
                    `font-family:${stack};font-weight:600;font-size:18px;line-height:1.2;letter-spacing:-.01em;margin:0 0 9px;text-wrap:pretty`,
                  )}
                >
                  {d.title}
                </h3>
                <p style={s('font-size:13.5px;line-height:1.58;color:#57514b;margin:0 0 14px')}>{d.blurb}</p>
                <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:auto')}>
                  {d.chips.map((c) => (
                    <span key={c} style={mono('font-size:10.5px;color:#6b6560;background:#f4f1ec;border:1px solid #e7e3dd;padding:3px 8px;border-radius:5px')}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* RESEARCH-PILLAR DEMOS */}
      <section id="pillar-demos" style={s('max-width:1120px;margin:0 auto;padding:44px 28px 70px;scroll-margin-top:80px')}>
        <div style={s('display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:6px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(22px,2.8vw,30px);letter-spacing:-.02em;margin:0`)}>
            Research-pillar demos
          </h2>
          <span style={mono('font-size:12px;color:#a39a8f')}>{PILLAR_ORDER.length} sketches</span>
        </div>
        <p style={s('font-size:15px;line-height:1.6;color:#57514b;max-width:660px;margin:0 0 16px')}>
          Small, self-contained sketches of the ideas behind each pillar — a search solving a maze, a swarm climbing a
          landscape, a world running on four rules. The same demos that run on the home and research pages, here in
          full.
        </p>
        <div style={s('margin-bottom:20px')}>
          <DemoDisclaimer tone="light" variant="illustrative" />
        </div>
        <div className="pillar-grid">
          {PILLAR_ORDER.map((k) => {
            const m = PILLAR_DEMOS[k]
            return (
              <div key={k} className="pillar-card" style={s(`border-top:3px solid ${m.accent}`)}>
                <DemoThumb demoKey={k} accent={m.accent} height={TILE_H} bg={PILLAR_BG[k]} />
                <p style={mono(`font-size:10.5px;color:${m.accent};margin:14px 0 8px`)}>{m.pillar}</p>
                <h3
                  style={s(
                    `font-family:${stack};font-weight:600;font-size:18px;line-height:1.2;letter-spacing:-.01em;margin:0 0 9px;text-wrap:pretty`,
                  )}
                >
                  {m.title}
                </h3>
                <p style={s('font-size:13.5px;line-height:1.58;color:#57514b;margin:0 0 14px')}>{m.caption}</p>
                <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-top:auto')}>
                  {m.chips.map((c) => (
                    <span key={c} style={mono('font-size:10.5px;color:#6b6560;background:#f4f1ec;border:1px solid #e7e3dd;padding:3px 8px;border-radius:5px')}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
