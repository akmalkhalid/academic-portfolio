// Dedicated page for the full game-refinement self-play tuner. The compact
// embeds on individual game-refinement / motion-in-mind paper pages link here
// via "Open the full simulation →".
import type { Metadata } from 'next'
import { getAllPublications } from '@/lib/content'
import { s } from '@/lib/style'
import GameRefinementFull from '@/components/paper-demos/GameRefinementFull'
import DemoDisclaimer from '@/components/DemoDisclaimer'

const ACCENT = '#f2683f'
const stack = "'Space Grotesk', system-ui, sans-serif"
const clean = (sl: string) => sl.replace(/^md_files_/, '')

export const metadata: Metadata = {
  title: 'Game refinement — interactive self-play tuner — Mohd Nor Akmal Khalid',
  description:
    'An interactive game-refinement / “motion in mind” tuner: an abstract game plays itself, and its refinement value GR = √B ⁄ D drifts across the comfortable zone where engaging games cluster, with thrill (acceleration) and addiction (jerk) readouts.',
}

export default function GameRefinementDemoPage() {
  const papers = getAllPublications()
    .filter((p) => p.demo === 'game-refinement')
    .sort((a, b) => (b.year || 0) - (a.year || 0))

  const label = (css: string) => s(`font-family:'JetBrains Mono',monospace;${css}`)

  return (
    <div data-screen-label="Demo" style={s('min-height:100vh')}>
      <article style={s('max-width:900px;margin:0 auto;padding:44px 28px 80px')}>
        <a href="/playground/" style={label('font-size:12.5px;font-weight:500;text-decoration:none;color:#8a8279;display:inline-block;margin-bottom:22px')}>← Back to the Playground</a>

        <p style={label(`font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${ACCENT};margin:0 0 10px`)}>Interactive self-play tuner</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(28px,4.4vw,44px);line-height:1.1;letter-spacing:-.02em;margin:0 0 16px;text-wrap:balance`)}>
          Game refinement &amp; the engagement zone
        </h1>
        <p style={s('font-size:17px;line-height:1.65;color:#3f3a34;margin:0 0 14px;max-width:680px')}>
          What makes a game <i>engaging</i>? Game-refinement theory gives a surprising answer: it’s measurable. Model
          any game as a contest whose outcome stays uncertain over time, and you can compute a single number — the
          <b> game-refinement value</b>, GR = √B ⁄ D, from its branching factor B and its length D. Sophisticated,
          enduring games — chess, Go, soccer, table tennis — all cluster in a narrow <b>comfortable zone</b> around
          0.07–0.08. Too far below and a game feels flat; too far above and it feels chaotic.
        </p>
        <p style={s('font-size:16px;line-height:1.65;color:#57514b;margin:0 0 24px;max-width:680px')}>
          Here an abstract game plays itself hundreds of times. From the games it generates, the demo measures the
          average branching and length, computes GR, and places it on the spectrum beside real games. It also reads the
          shape of the game-progress curve — its <b>acceleration</b> (the “thrill”) and its <b>jerk</b> (the addiction
          signature). Tune the game and watch its value drift toward the zone — or past it.
        </p>

        <div style={s('margin-bottom:20px')}>
          <DemoDisclaimer tone="light" />
        </div>

        <div style={s('background:#0f0e14;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px')}>
          <div style={label('font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8b8798;margin:0 0 12px')}>
            Game refinement · motion in mind · self-play
          </div>
          <GameRefinementFull accent={ACCENT} />
        </div>

        <section style={s('margin-top:44px')}>
          <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 14px`)}>How the model works</h2>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            Each self-play game is a tug-of-war: an advantage drifts toward one side at a rate set by the <b>pace</b>,
            while <b>balance</b> adds see-saw wobble that keeps the contest close and can force late swings. The game
            ends when one side is decisively ahead. As it plays, the number of meaningful choices (the effective
            branching) shrinks the more decided the outcome becomes. Averaging the branching B and the length D over
            many games gives the refinement value GR = √B ⁄ D — so a game is engaging not because it is simply long or
            short, but because its complexity and its length are in the right ratio.
          </p>
          <p style={s('font-size:15.5px;line-height:1.7;color:#3f3a34;margin:0 0 12px;max-width:680px')}>
            The “motion in mind” view treats the game’s outcome certainty as a moving object. Its speed is the pace of
            resolution, its acceleration is the <b>thrill</b>, and the rate of change of acceleration — the <b>jerk</b>
            — is the signature of an <b>addictive</b> experience, where late, sudden swings keep players hooked. A game
            can sit in the engaging zone yet still be highly addictive if its jerk runs hot. This mirrors the
            game-refinement and motion-in-mind work in the papers below, spanning board games, sports, arcade games,
            and the engagement-versus-addiction distinction.
          </p>
        </section>

        {papers.length > 0 && (
          <section style={s('margin-top:40px;padding-top:28px;border-top:1px solid #e7e3dd')}>
            <h2 style={s(`font-family:${stack};font-weight:600;font-size:22px;letter-spacing:-.01em;margin:0 0 6px`)}>The research behind it</h2>
            <p style={s('font-size:14.5px;line-height:1.6;color:#6b6560;margin:0 0 20px;max-width:640px')}>
              This demo is a teaching stand-in for a body of work on game-refinement theory and the “motion in mind”
              model — measuring engagement, sophistication, and addiction across games and sports.
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
          Landmark values (chess, Go, soccer, table tennis) are representative figures from the game-refinement
          literature and vary by dataset. See also the <a href="/playground/" style={s('color:#16142e;font-weight:500')}>Playground</a>.
        </p>
      </article>
    </div>
  )
}
