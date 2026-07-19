// Dedicated page for the full agentic procedural-content-generation demo (a
// quest generator). Compact embeds on the related generative-AI paper pages link
// here via "Open the full simulation →".
import type { Metadata } from 'next'
import { getAllPublications } from '@/lib/content'
import { s } from '@/lib/style'
import QuestGenerationFull from '@/components/paper-demos/QuestGenerationFull'
import DemoDisclaimer from '@/components/DemoDisclaimer'

const ACCENT = '#8b7bf0'
const stack = "'Space Grotesk', system-ui, sans-serif"
const clean = (sl: string) => sl.replace(/^md_files_/, '')

export const metadata: Metadata = {
  title: 'Agentic procedural content generation — interactive demo — Mohd Nor Akmal Khalid',
  description:
    'An interactive agentic content generator: a genetic loop with generator and critic agents evolves a rough draft into a well-formed role-playing-game quest, matching design objectives — structure, difficulty arc, variety, pacing, and branching.',
}

export default function QuestGenerationDemoPage() {
  const papers = getAllPublications()
    .filter((p) => p.demo === 'quest-generation')
    .sort((a, b) => (b.year || 0) - (a.year || 0))

  const label = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

  return (
    <div data-screen-label="Demo" style={s('min-height:100vh')}>
      <article style={s('max-width:900px;margin:0 auto;padding:44px 28px 80px')}>
        <a href="/demos" style={label('font-size:12.5px;font-weight:500;text-decoration:none;color:#8a8279;display:inline-block;margin-bottom:22px')}>← All demos</a>

        <p style={label(`font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};margin:0 0 10px`)}>Interactive generator · quest generation</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,4.4vw,44px);line-height:1.1;letter-spacing:-.02em;margin:0 0 16px;text-wrap:balance`)}>
          Agentic procedural content generation
        </h1>
        <p style={s('font-size:17px;line-height:1.65;color:#3f3a34;margin:0 0 14px;max-width:680px')}>
          Can an AI design a good <i>quest</i>? A role-playing-game quest is a chain of <b>beats</b> — travel, gather,
          talk, solve a puzzle, fight, a climactic boss, a reward — sometimes with optional side-quests branching off.
          A good quest isn’t random: it opens gently, builds difficulty to a climax, varies its activities, runs to a
          satisfying length, and offers a little optional content. That makes “design a quest” an optimization problem
          with several competing objectives.
        </p>
        <p style={s('font-size:16px;line-height:1.65;color:#57514b;margin:0 0 24px;max-width:680px')}>
          Here two agents collaborate. A <b>generator</b> proposes and rewrites candidate quests; a <b>critic</b> scores
          each one against the design objectives. A genetic loop keeps the best and lets the generator focus its edits
          on whichever objective is currently weakest — so a random first draft self-assembles into a well-formed quest.
          Tune the target length, difficulty, and variety, and watch the quality climb.
        </p>

        <div style={s('margin-bottom:20px')}>
          <DemoDisclaimer tone="light" />
        </div>

        <div style={s('background:#0f0e14;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px')}>
          <div style={label('font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b8798;margin:0 0 12px')}>
            Agentic content generation · genetic loop · generator + critic
          </div>
          <QuestGenerationFull accent={ACCENT} />
        </div>

        <section style={s('margin-top:44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 14px`)}>How the model works</h2>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            Each candidate quest is a sequence of typed beats, each with a difficulty. The critic agent turns “good
            design” into five measurable scores: <b>structure</b> (a proper intro, a single boss, a reward at the end),
            <b> difficulty arc</b> (how closely the beats follow an ideal curve rising to a late climax), <b>variety</b>
            (few repeated activities, many distinct ones), <b>pacing</b> (matching the target length), and <b>branching</b>
            (a healthy amount of optional side content). Their weighted sum is the quest’s quality.
          </p>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            The generator agent evolves a population of quests: it clones the best, then hypermutates the clones — but
            instead of mutating blindly, it reads the critic’s scores and directs its edits at the weakest objective
            (fixing a broken ending, nudging a beat’s difficulty toward the ideal arc, breaking up a repeated activity).
            That targeted, feedback-driven rewriting is the “agentic” step, echoing the generate-and-critique loops in
            the collaborative and generative-AI content-generation work below. Over a few dozen generations the quest
            converges on a coherent, playable design.
          </p>
        </section>

        {papers.length > 0 && (
          <section style={s('margin-top:40px;padding-top:28px;border-top:1px solid #e7e3dd')}>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 6px`)}>The research behind it</h2>
            <p style={s('font-size:14.5px;line-height:1.6;color:#6b6560;margin:0 0 20px;max-width:640px')}>
              This demo is a teaching stand-in for a body of work on generative and agentic AI for content generation —
              AI-human collaborative puzzle design, generative models, and LLM-assisted frameworks.
            </p>
            <div style={s('display:flex;flex-direction:column;gap:10px')}>
              {papers.map((p) => (
                <a
                  key={p._slug}
                  href={`/publications/${clean(p._slug)}/`}
                  style={s('display:block;text-decoration:none;background:#fff;border:1px solid #e7e3dd;border-radius:12px;padding:16px 18px;color:#1c1917')}
                >
                  <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:7px')}>
                    <span style={label(`font-size:11px;font-weight:600;padding:3px 9px;border-radius:6px;background:${ACCENT}1a;color:${ACCENT}`)}>{p.category}</span>
                    <span style={label('font-size:12px;color:#8a8279')}>{p.year}{p.venue ? ` · ${p.venue}` : ''}</span>
                  </div>
                  <div style={s(`font-family:${stack};font-weight:600;font-size:16.5px;line-height:1.3;color:#16142e`)}>
                    {(p.title || '').replace(/\.\s*$/, '')} <span style={s(`color:${ACCENT}`)}>→</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <p style={s('font-size:13.5px;line-height:1.6;color:#6b6560;margin:26px 0 0')}>
          Quests here are illustrative — the demo shows the agentic generate-and-critique loop, not a specific published
          system. See also the <a href="/demos" style={s('color:#16142e;font-weight:500')}>full demo gallery</a>.
        </p>
      </article>
    </div>
  )
}
