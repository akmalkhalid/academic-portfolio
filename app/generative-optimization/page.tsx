// /generative-optimization — the research programme page. Defines the term in
// one sentence, draws the generate → evaluate → search loop, shows where each
// research stage comes from, positions the work against neighbouring fields,
// and sets out the horizon (Generative Optinformatics) with its lineage cited.
//
// Integrity rule for this page: "optinformatics" is an established term in
// evolutionary computation. Never imply it was coined here — cite it.
import type { Metadata } from 'next'
import { s } from '@/lib/style'
import PageBanner from '@/components/PageBanner'
import PuzzleLoop from '@/components/PuzzleLoop'

export const metadata: Metadata = {
  title: 'Generative Optimization — Mohd Nor Akmal Khalid',
  description:
    'Generative Optimization: generative AI proposes artefacts, models of human engagement evaluate them, and metaheuristic search steers generation toward designs that are good, diverse and engaging. Research programme of Dr. Mohd Nor Akmal Khalid, UKM.',
  keywords: [
    'Generative Optimization', 'Generative Optinformatics', 'Optinformatics', 'Evolutionary Computation',
    'Metaheuristics', 'Quality-Diversity', 'Procedural Content Generation', 'Game Refinement Theory',
    'Large Language Models', 'Computational Intelligence',
  ],
}

const stack = "'Space Grotesk', system-ui, sans-serif"
const mono = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

const C = { gen: '#8b7bf0', eva: '#f2683f', sea: '#21b3a0', ink: '#1c1917', mute: '#57514b', line: '#e7e3dd' }

const STAGES = [
  {
    n: '01', key: 'Generate', accent: C.gen, soft: '#eeedfe', from: 'Generative & Agentic AI',
    q: 'What could exist?',
    body: 'Generative models, LLMs and agent teams propose candidate artefacts: levels, quests, puzzles, layouts, schedules, even new search operators. Generation is cheap and plentiful; on its own it has no sense of what is worth keeping.',
    methods: ['LLMs & agentic generation', 'GANs & diffusion', 'Procedural generators', 'LLM-proposed operators'],
    demo: { href: '/demos/quest-generation/', label: 'Agentic quest generation' },
  },
  {
    n: '02', key: 'Evaluate', accent: C.eva, soft: '#faece7', from: 'Games Informatics & Engagement Modelling',
    q: 'Is it any good, for people?',
    body: 'Each candidate is scored by models of how people experience it. Game-refinement theory and the "motion in mind" model turn engagement into a measurable signal, so the objective is human experience, not only accuracy or cost.',
    methods: ['Game-refinement measure', 'Motion-in-mind model', 'Self-play & agent simulation', 'Player-experience models'],
    demo: { href: '/demos/game-refinement/', label: 'Game refinement, self-play' },
  },
  {
    n: '03', key: 'Search', accent: C.sea, soft: '#e1f5ee', from: 'Computational Intelligence & Optimization',
    q: 'How do we find better ones?',
    body: 'Metaheuristics decide what gets generated next: evolutionary, immune and swarm algorithms, and quality-diversity archives such as MAP-Elites that keep many different good solutions rather than one winner.',
    methods: ['Evolutionary & immune algorithms', 'Swarm intelligence', 'MAP-Elites / quality-diversity', 'Memetic hybrids'],
    demo: { href: '/demos/swarm-landscape/', label: 'Swarm on a fitness landscape' },
  },
]

const NEIGHBOURS = [
  { field: 'Search-based procedural content generation', shares: 'Search over generated game content.', differs: 'Adds modern generative models as the variation engine, and a theory of engagement as the objective.' },
  { field: 'Quality-diversity (e.g. MAP-Elites)', shares: 'Keeps an archive of diverse, high-performing solutions.', differs: 'Uses QD as one search strategy inside the loop, with engagement measures defining the behaviour space.' },
  { field: 'LLM-driven evolutionary algorithms', shares: 'Language models act as mutation, crossover or operator designers.', differs: 'Targets human-facing artefacts and human-centred fitness, not only benchmark functions.' },
  { field: 'Generative design (engineering)', shares: 'Machine-proposed designs refined by optimization.', differs: 'The designs are experiences — games, learning activities, interactive systems — judged by how people engage with them.' },
]

const REFS = [
  { key: 'Lim et al. 2016', text: 'Lim, D., Ong, Y.-S., Gupta, A., Goh, C. K. & Dutta, P. S. “Towards a new Praxis in optinformatics targeting knowledge re-use in evolutionary computation: simultaneous problem learning and optimization.” Evolutionary Intelligence 9(4): 203–220 (2016).' },
  { key: 'Feng et al. 2021', text: 'Feng, L., Hou, Y. & Zhu, Z. Optinformatics in Evolutionary Learning and Optimization. Adaptation, Learning, and Optimization, vol. 25. Springer (2021).', href: 'https://doi.org/10.1007/978-3-030-70920-4' },
  { key: 'Togelius et al. 2011', text: 'Togelius, J., Yannakakis, G. N., Stanley, K. O. & Browne, C. “Search-based procedural content generation: A taxonomy and survey.” IEEE Transactions on Computational Intelligence and AI in Games 3(3): 172–186 (2011).' },
  { key: 'Mouret & Clune 2015', text: 'Mouret, J.-B. & Clune, J. “Illuminating search spaces by mapping elites.” arXiv:1504.04909 (2015).', href: 'https://arxiv.org/abs/1504.04909' },
  { key: 'Liu et al. 2024', text: 'Liu, S., Chen, C., Qu, X., Tang, K. & Ong, Y.-S. “Large language models as evolutionary optimizers.” arXiv:2310.19046 (2023, rev. 2024).', href: 'https://arxiv.org/abs/2310.19046' },
]

/** The loop, drawn as three nodes on a ring with arrowed arcs between them. */
function LoopDiagram() {
  // Node centres on a circle (cx 300, cy 210, r 150), starting at the top.
  const R = 150, cx = 300, cy = 210
  const at = (deg: number) => ({ x: cx + R * Math.cos((deg * Math.PI) / 180), y: cy + R * Math.sin((deg * Math.PI) / 180) })
  const nodes = [
    { ...at(-90), label: 'GENERATE', sub: 'propose', col: C.gen },
    { ...at(30), label: 'EVALUATE', sub: 'score', col: C.eva },
    { ...at(150), label: 'SEARCH', sub: 'steer', col: C.sea },
  ]
  // Arcs run clockwise between nodes, trimmed so they stop short of each node.
  const arc = (a: number, b: number) => {
    const p = at(a + 26), q = at(b - 26)
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} A ${R} ${R} 0 0 1 ${q.x.toFixed(1)} ${q.y.toFixed(1)}`
  }
  return (
    <svg viewBox="0 0 600 430" role="img" aria-labelledby="loop-title loop-desc" style={s('width:100%;height:auto;display:block')}>
      <title id="loop-title">The Generative Optimization loop</title>
      <desc id="loop-desc">Generate proposes artefacts, Evaluate scores them by human engagement, Search steers what is generated next, and the cycle repeats.</desc>
      <defs>
        {nodes.map((n, i) => (
          <marker key={i} id={`ah${i}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={nodes[(i + 1) % 3].col} />
          </marker>
        ))}
      </defs>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#efe9e1" strokeWidth="18" />
      <path d={arc(-90, 30)} fill="none" stroke={C.eva} strokeWidth="2.5" markerEnd="url(#ah0)" />
      <path d={arc(30, 150)} fill="none" stroke={C.sea} strokeWidth="2.5" markerEnd="url(#ah1)" />
      <path d={arc(150, 270)} fill="none" stroke={C.gen} strokeWidth="2.5" markerEnd="url(#ah2)" />
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ font: "600 15px 'Space Grotesk', system-ui, sans-serif", fill: C.ink }}>artefacts that are</text>
      <text x={cx} y={cy + 14} textAnchor="middle" style={{ font: "600 15px 'Space Grotesk', system-ui, sans-serif", fill: C.ink }}>good, diverse, engaging</text>
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="44" fill="#fff" stroke={n.col} strokeWidth="2.5" />
          <text x={n.x} y={n.y - 2} textAnchor="middle" style={{ font: "600 11.5px 'JetBrains Mono', monospace", fill: n.col, letterSpacing: '.06em' }}>{n.label}</text>
          <text x={n.x} y={n.y + 14} textAnchor="middle" style={{ font: "400 9.5px 'JetBrains Mono', monospace", fill: C.mute }}>{n.sub}</text>
        </g>
      ))}
    </svg>
  )
}

export default function Page() {
  return (
    <div data-screen-label="Generative Optimization" style={s('min-height:100vh;overflow-x:hidden')}>
      <PageBanner
        eyebrow="/ research programme"
        title="Generative Optimization"
        kicker="Generating designs, judging them by how people experience them, and searching for better ones."
        lede={<>The organising idea behind my work since 2012. Generative AI, games informatics and metaheuristics are not three separate interests: they are the three stages of one loop. <a href="#horizon" className="banner-link">Where it goes next</a> is Generative Optinformatics.</>}
      >
        <a href="#definition" className="banner-jump">Definition</a>
        <a href="#loop" className="banner-jump">The loop</a>
        <a href="#neighbours" className="banner-jump">Related fields</a>
        <a href="#horizon" className="banner-jump">↓ Horizon</a>
      </PageBanner>

      {/* DEFINITION */}
      <section id="definition" style={s('max-width:920px;margin:0 auto;padding:62px 28px 20px;scroll-margin-top:90px')}>
        <p style={mono('font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 14px')}>/ working definition</p>
        <p style={s(`font-family:${stack};font-weight:500;font-size:clamp(22px,2.7vw,30px);line-height:1.32;letter-spacing:-.015em;color:${C.ink};margin:0 0 22px`)}>
          <strong style={s('font-weight:700')}>Generative Optimization</strong> treats creative design as a search problem:
          generative models <span style={s(`color:${C.gen}`)}>propose</span> candidate artefacts, models of human engagement{' '}
          <span style={s(`color:${C.eva}`)}>evaluate</span> them, and metaheuristic <span style={s(`color:${C.sea}`)}>search</span>{' '}
          steers what is generated next.
        </p>
        <p style={s(`font-size:16px;line-height:1.75;color:${C.mute};margin:0`)}>
          The goal is not a single optimum but a set of artefacts that are good, diverse and genuinely engaging for the
          people who use them. What sets the programme apart is the middle stage: the objective comes from a theory of
          engagement developed and published over more than a decade, rather than from a generic quality metric.
        </p>
      </section>

      {/* SEE IT RUN */}
      <section id="demo" style={s('max-width:1120px;margin:0 auto;padding:30px 28px 10px;scroll-margin-top:90px')}>
        <div style={s('background:#0f0e14;border-radius:18px;padding:26px')}>
          <PuzzleLoop />
        </div>
        <p style={s('font-size:12.5px;line-height:1.6;color:#8a8279;margin:12px 0 0')}>Illustrative teaching model: random edits stand in for the AI generator, and GR = √G / T is a simplified game-refinement measure.</p>
      </section>

      {/* THE LOOP */}
      <section id="loop" style={s('max-width:1120px;margin:0 auto;padding:44px 28px 30px;scroll-margin-top:90px')}>
        <div className="gopt-loop">
          <div style={s('max-width:520px;width:100%;margin:0 auto')}><LoopDiagram /></div>
          <div>
            <p style={mono('font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px')}>/ one loop, three stages</p>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(26px,3.2vw,36px);line-height:1.1;letter-spacing:-.02em;margin:0 0 14px`)}>Each research line is one stage.</h2>
            <p style={s(`font-size:15.5px;line-height:1.7;color:${C.mute};margin:0`)}>
              The three pillars on this site map directly onto the loop. Generation without evaluation produces
              volume, not quality. Evaluation without search only ranks what already exists. Search without a
              human-centred objective optimizes the wrong thing. The contribution is in closing the loop.
            </p>
          </div>
        </div>

        <div className="pillar-grid" style={s('margin-top:34px')}>
          {STAGES.map((st) => (
            <div key={st.n} className="pillar-card" style={s(`border-top:3px solid ${st.accent}`)}>
              <div style={s('display:flex;align-items:center;gap:10px;margin-bottom:12px')}>
                <span style={mono(`font-size:11px;font-weight:600;color:${st.accent};letter-spacing:.08em`)}>STAGE {st.n} · {st.key.toUpperCase()}</span>
                <span style={s(`flex:1;height:1px;background:linear-gradient(90deg,${st.accent}55,transparent)`)} />
              </div>
              <h3 style={s(`font-family:${stack};font-weight:600;font-size:20px;line-height:1.18;letter-spacing:-.01em;margin:0 0 4px`)}>{st.q}</h3>
              <p style={mono('font-size:11px;color:#a39a8f;margin:0 0 12px')}>from: {st.from}</p>
              <p style={s(`font-size:13.5px;line-height:1.62;color:${C.mute};margin:0 0 14px`)}>{st.body}</p>
              <div style={s('display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px')}>
                {st.methods.map((m) => (
                  <span key={m} style={mono(`font-size:10.5px;font-weight:500;padding:3px 8px;border-radius:5px;background:${st.soft};color:${C.ink}`)}>{m}</span>
                ))}
              </div>
              <a href={st.demo.href} style={mono(`margin-top:auto;font-size:11.5px;font-weight:500;text-decoration:none;color:${st.accent}`)}>▶ {st.demo.label} →</a>
            </div>
          ))}
        </div>
      </section>

      {/* NEIGHBOURING FIELDS */}
      <section id="neighbours" style={s('max-width:1120px;margin:0 auto;padding:46px 28px 20px;scroll-margin-top:90px')}>
        <p style={mono('font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px')}>/ how it relates</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;margin:0 0 8px`)}>Built on established fields.</h2>
        <p style={s(`font-size:15px;line-height:1.7;color:${C.mute};margin:0 0 22px;max-width:720px`)}>
          Generative Optimization draws on several active research communities. It shares their methods and is precise
          about what it adds.
        </p>
        <div style={s(`background:#fff;border:1px solid ${C.line};border-radius:16px;overflow:hidden`)}>
          {NEIGHBOURS.map((n, i) => (
            <div key={n.field} className="gopt-row" style={s(i ? `border-top:1px solid #f0ece5` : '')}>
              <div style={s(`font-family:${stack};font-weight:600;font-size:15px;line-height:1.3;color:${C.ink}`)}>{n.field}</div>
              <div><span style={mono('font-size:10px;letter-spacing:.08em;color:#a39a8f;display:block;margin-bottom:3px')}>SHARES</span><span style={s(`font-size:13.5px;line-height:1.55;color:${C.mute}`)}>{n.shares}</span></div>
              <div><span style={mono(`font-size:10px;letter-spacing:.08em;color:${C.gen};display:block;margin-bottom:3px`)}>ADDS</span><span style={s(`font-size:13.5px;line-height:1.55;color:${C.ink}`)}>{n.differs}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* HORIZON */}
      <section id="horizon" style={s('max-width:1120px;margin:0 auto;padding:56px 28px 20px;scroll-margin-top:90px')}>
        <p style={mono('font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 10px')}>/ research horizon</p>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;margin:0 0 22px`)}>From optimizing designs to learning how to optimize.</h2>
        <div className="gopt-horizon">
          <div style={s(`background:#fff;border:1px solid ${C.line};border-radius:16px;padding:26px`)}>
            <span style={mono('font-size:10.5px;font-weight:600;letter-spacing:.08em;color:#27500a;background:#eaf3de;padding:3px 8px;border-radius:5px')}>NOW</span>
            <h3 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:14px 0 10px`)}>Generative Optimization</h3>
            <p style={s(`font-size:14px;line-height:1.65;color:${C.mute};margin:0`)}>
              Close the generate → evaluate → search loop for individual design problems: puzzles, levels, quests,
              learning activities and interactive systems, each optimized against human engagement.
            </p>
          </div>
          <div className="gopt-arrow" aria-hidden="true">→</div>
          <div style={s('background:#16142e;border-radius:16px;padding:26px;color:#ECEAF3')}>
            <span style={mono('font-size:10.5px;font-weight:600;letter-spacing:.08em;color:#c9c1ff;background:rgba(139,123,240,.18);padding:3px 8px;border-radius:5px')}>NEXT</span>
            <h3 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:14px 0 10px;color:#fff`)}>Generative Optinformatics</h3>
            <p style={s('font-size:14px;line-height:1.65;color:#bdb8d6;margin:0 0 12px')}>
              Make the loop learn from itself. Every run leaves knowledge behind: archives of elites, search
              trajectories, evaluator feedback. Generative models can mine that experience and reuse it, to seed new
              searches, propose better operators and transfer what worked from one design problem to the next.
            </p>
            <p style={s('font-size:12.5px;line-height:1.6;color:#8f8aa6;margin:0')}>
              Builds on <em>optinformatics</em>, the established idea of bringing informatics and learning into the
              optimization process (Lim et al. 2016; Feng, Hou &amp; Zhu 2021), extended here with generative models.
            </p>
          </div>
        </div>
      </section>

      {/* REFERENCES */}
      <section style={s('max-width:920px;margin:0 auto;padding:44px 28px 10px')}>
        <h2 style={s(`font-family:${stack};font-weight:600;font-size:20px;letter-spacing:-.01em;margin:0 0 14px`)}>Key references</h2>
        <ol style={s(`margin:0;padding-left:20px;font-size:13px;line-height:1.6;color:${C.mute}`)}>
          {REFS.map((r) => (
            <li key={r.key} style={s('margin-bottom:8px')}>
              {r.text}{r.href ? <> <a href={r.href} rel="noopener" style={s('color:#4d8df0')}>Link</a></> : null}
            </li>
          ))}
        </ol>
        <p style={s('font-size:13px;line-height:1.6;color:#8a8279;margin:16px 0 0')}>
          My own work across all three stages is on the <a href="/publications" style={s('color:#4d8df0')}>publications page</a>.
        </p>
      </section>

      {/* CTA */}
      <section style={s('max-width:1120px;margin:30px auto 0;padding:30px 28px 70px')}>
        <div style={s('background:#16142e;border-radius:18px;padding:48px 44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;color:#fff;margin:0 0 12px`)}>Work on the loop with me.</h2>
          <p style={s('font-size:16px;line-height:1.6;color:#bdb8d6;margin:0 0 24px;max-width:580px')}>PhD and Master&apos;s projects are open at every stage: new generators, new engagement measures, and new search methods. Industry partners with a design problem worth optimizing are welcome too.</p>
          <div style={s('display:flex;flex-wrap:wrap;gap:12px;align-items:center')}>
            <a href="/research" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#16142e;background:#fff;padding:13px 24px;border-radius:9px')}>Open positions →</a>
            <a href="/contact" style={s('display:inline-block;font-size:14.5px;font-weight:500;text-decoration:none;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);padding:13px 24px;border-radius:9px')}>Get in touch →</a>
          </div>
        </div>
      </section>
    </div>
  )
}
