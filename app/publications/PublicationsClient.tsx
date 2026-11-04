'use client'

import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import PageBanner from '@/components/PageBanner'
import Constellation3D, { type CLink } from '@/components/Constellation3D'
import { PCOL, PNAME, QCOL, CATNAME, type Code } from '@/lib/view'

type PubNode = { t: string; y: number; pills: Code[]; q: string; cat: string; v: string; citation: string; scholar: string; slug: string }

export default function PublicationsClient({
  pubs, links, linkCounts, citeUpdated, quartileStats, minYearBound, maxYearBound,
}: {
  pubs: PubNode[]; links: CLink[]; linkCounts: Record<CLink['kind'], number>; citeUpdated: string | null
  quartileStats: { num: string; label: string; color: string }[]; minYearBound: number; maxYearBound: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)

  const [pillarFilter, setPillarFilter] = useState<string[]>([])
  const [catFilter, setCatFilter] = useState<string[]>([])
  const [quartileFilter, setQuartileFilter] = useState<string[]>([])
  const [mode, setMode] = useState<'graph' | 'list'>('graph')
  const [minYear, setMinYear] = useState(minYearBound)
  const [selected, setSelected] = useState<PubNode | null>(null)
  const [copied, setCopied] = useState(false)


  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rafs: number[] = []; const ios: IntersectionObserver[] = []
    const root = () => wrapRef.current || document
    let trPoll: any = null, onTrScroll: any = null

    function setupTextReveal(tries = 0) {
      const r = wrapRef.current
      if (!r) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      let els = ([...r.querySelectorAll('section h1, section h2, section h3, section p')] as HTMLElement[]).filter((el) => !el.closest('header,footer,nav') && el.textContent!.trim().length)
      if (!els.length || !els[0].offsetHeight) { if (tries < 300) requestAnimationFrame(() => setupTextReveal(tries + 1)); return }
      if (reduce) return
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

    return () => {
      rafs.forEach((r) => cancelAnimationFrame(r)); ios.forEach((o) => o.disconnect())
      if (trPoll) clearInterval(trPoll); if (onTrScroll) { window.removeEventListener('scroll', onTrScroll); window.removeEventListener('resize', onTrScroll) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- derived ----
  const toggle = (arr: string[], key: string) => (arr.includes(key) ? arr.filter((x) => x !== key) : arr.concat(key))
  const chipStyle = (active: boolean) => "font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;cursor:pointer;padding:7px 13px;border-radius:8px;" + (active ? 'background:rgba(255,255,255,.14);color:#ECEAF3;border:1px solid rgba(255,255,255,.22)' : 'background:transparent;color:#9b96aa;border:1px solid rgba(255,255,255,.1)')

  const matchD = (d: PubNode) => (pillarFilter.length === 0 || d.pills.some((p) => pillarFilter.includes(p))) && (catFilter.length === 0 || catFilter.includes(d.cat)) && (quartileFilter.length === 0 || quartileFilter.includes(d.q)) && d.y >= minYear
  const filtered = pubs.filter(matchD)
  const matchedAll = pubs.map(matchD)
  const selectedIdx = selected ? pubs.indexOf(selected) : null
  const filteredPubs = filtered.slice().sort((a, b) => b.y - a.y)

  const pillarDefs = [{ key: 'all', label: 'All', dot: '#cfcad9' } as any].concat((['gen', 'opt', 'evo', 'gam', 'sim', 'exp'] as Code[]).map((k) => ({ key: k, label: PNAME[k], dot: PCOL[k] })))
  const pillarChips = pillarDefs.map((c) => { const active = c.key === 'all' ? pillarFilter.length === 0 : pillarFilter.includes(c.key); return { label: c.label, dot: c.dot, active, onClick: () => (c.key === 'all' ? setPillarFilter([]) : setPillarFilter((f) => toggle(f, c.key))) } })
  const catKeys = ['j', 'c', 'b'].filter((k) => pubs.some((d) => d.cat === k))
  const catChips = [{ key: 'all', label: 'All', dot: '#cfcad9' } as any].concat(catKeys.map((k) => ({ key: k, label: CATNAME[k], dot: k === 'j' ? '#7d8fb3' : k === 'c' ? '#b39a7d' : '#9a7db3' }))).map((c) => { const active = c.key === 'all' ? catFilter.length === 0 : catFilter.includes(c.key); return { label: c.label, dot: c.dot, active, onClick: () => (c.key === 'all' ? setCatFilter([]) : setCatFilter((f) => toggle(f, c.key))) } })
  const qKeys = ['Q1', 'Q2', 'Q3', 'Q4', 'NA'].filter((k) => pubs.some((d) => d.q === k))
  const quartileChips = [{ key: 'all', label: 'All', dot: '#cfcad9' } as any].concat(qKeys.map((k) => ({ key: k, label: k === 'NA' ? 'Non-indexed' : k, dot: QCOL[k] }))).map((c) => { const active = c.key === 'all' ? quartileFilter.length === 0 : quartileFilter.includes(c.key); return { label: c.label, dot: c.dot, active, onClick: () => (c.key === 'all' ? setQuartileFilter([]) : setQuartileFilter((f) => toggle(f, c.key))) } })

  const tabOn = "font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;cursor:pointer;padding:7px 15px;border-radius:6px;border:none;background:#ECEAF3;color:#0f0e14"
  const tabOff = "font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:500;cursor:pointer;padding:7px 15px;border-radius:6px;border:none;background:transparent;color:#9b96aa"
  const yrBtn = (on: boolean) => `font-family:'JetBrains Mono',monospace;font-size:17px;line-height:1;font-weight:600;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:none;border-radius:7px;background:${on ? 'rgba(255,255,255,.08)' : 'transparent'};color:${on ? '#ECEAF3' : '#46435a'};cursor:${on ? 'pointer' : 'default'};transition:background .15s`
  const stack = "'Space Grotesk', system-ui, sans-serif"

  const sp = selected
  const spills = sp ? sp.pills : []
  const pc = sp ? PCOL[spills[0]] : '#6f6a82'
  const qc = sp ? (QCOL[sp.q] || '#6f6a82') : '#6f6a82'
  const panelOpen = !!sp
  const copyCite = () => { if (!sp) return; try { navigator.clipboard.writeText(sp.citation) } catch {} setCopied(true); setTimeout(() => setCopied(false), 1800) }

  return (
    <div ref={wrapRef} data-screen-label="Publications" style={s('min-height:100vh;overflow-x:hidden')}>
      <PageBanner
        eyebrow={`/ publications · ${minYearBound} — ${maxYearBound}`}
        title="A body of work, mapped."
        lede={`${pubs.length} peer-reviewed papers in a 3D space of six research fields. Orbit and zoom through the constellation, follow the citation streams between papers, or scan the full chronological list.`}
      />

      {/* QUARTILE STAT STRIP */}
      <section style={s('max-width:1120px;margin:0 auto;padding:48px 28px 8px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px')}>
        {quartileStats.map((q, i) => (
          <div key={i} style={s(`border-top:2px solid ${q.color};padding-top:12px`)}>
            <div style={s(`font-family:${stack};font-weight:600;font-size:30px;line-height:1;letter-spacing:-.02em`)}>{q.num}</div>
            <div style={s('font-size:12.5px;color:#57514b;margin-top:6px')}>{q.label}</div>
          </div>
        ))}
      </section>

      {/* LIVING GRAPH */}
      <section style={s('background:#0f0e14;padding:46px 0 60px;margin-top:34px')}>
        <div style={s('max-width:1120px;margin:0 auto;padding:0 28px')}>
          <div style={s('display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:22px')}>
            <div>
              <p style={s("font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6f6a82;margin:0 0 9px")}>/ the body of work · alive</p>
              <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;margin:0;color:#ECEAF3`)}>Every paper in its field, every citation a living link.</h2>
            </div>
            <div style={s('display:flex;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:4px;flex-shrink:0')}>
              <button type="button" onClick={() => setMode('graph')} style={s(mode === 'graph' ? tabOn : tabOff)}>Constellation</button>
              <button type="button" onClick={() => setMode('list')} style={s(mode === 'list' ? tabOn : tabOff)}>List</button>
            </div>
          </div>

          <div style={s('display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px')}>
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;color:#6f6a82;margin-right:4px")}>HIGHLIGHT ·</span>
            {pillarChips.map((c, i) => (<button key={i} type="button" onClick={c.onClick} style={s(chipStyle(c.active))}><span style={s(`width:8px;height:8px;border-radius:50%;background:${c.dot};display:inline-block;margin-right:7px;vertical-align:middle`)} />{c.label}</button>))}
          </div>
          <div style={s('display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px')}>
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;color:#6f6a82;margin-right:4px")}>TYPE ·</span>
            {catChips.map((c, i) => (<button key={i} type="button" onClick={c.onClick} style={s(chipStyle(c.active))}><span style={s(`width:8px;height:8px;border-radius:50%;background:${c.dot};display:inline-block;margin-right:7px;vertical-align:middle`)} />{c.label}</button>))}
            <span style={s('width:1px;height:18px;background:rgba(255,255,255,.12);margin:0 6px')} />
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;color:#6f6a82;margin-right:4px")}>QUARTILE ·</span>
            {quartileChips.map((c, i) => (<button key={i} type="button" onClick={c.onClick} style={s(chipStyle(c.active))}><span style={s(`width:8px;height:8px;border-radius:50%;background:${c.dot};display:inline-block;margin-right:7px;vertical-align:middle`)} />{c.label}</button>))}
          </div>
          <div style={s('display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap')}>
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#6f6a82;letter-spacing:.08em")}>FROM YEAR</span>
            <div style={s('display:flex;align-items:center;gap:2px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:3px')}>
              <button type="button" onClick={() => setMinYear((y) => Math.max(minYearBound, y - 1))} aria-label="Earlier start year" style={s(yrBtn(minYear > minYearBound))}>‹</button>
              <span style={s("font-family:'JetBrains Mono',monospace;font-size:14px;color:#ECEAF3;font-weight:600;min-width:50px;text-align:center")}>{minYear}</span>
              <button type="button" onClick={() => setMinYear((y) => Math.min(maxYearBound, y + 1))} aria-label="Later start year" style={s(yrBtn(minYear < maxYearBound))}>›</button>
            </div>
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:13px;color:#9b96aa;font-weight:500")}>— {maxYearBound}</span>
            <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56516a;margin-left:auto")}>{filtered.length} of {pubs.length} shown</span>
          </div>

          <div style={s('position:relative;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:radial-gradient(130% 130% at 50% 40%,#16151d 0%,#0c0b11 75%)')}>
            <div style={s('display:' + (mode === 'graph' ? 'block' : 'none'))}>
              <Constellation3D
                nodes={pubs}
                links={links}
                matched={matchedAll}
                selected={selectedIdx}
                onSelect={(i) => { setCopied(false); setSelected(i == null ? null : pubs[i]) }}
                active={mode === 'graph'}
                height={580}
              />
            </div>
            <div data-pubscroll="1" style={s('display:' + (mode === 'list' ? 'block' : 'none') + ';max-height:520px;overflow-y:auto')}>
              {filteredPubs.map((pub, i) => {
                const qLabel = pub.q === 'NA' ? '·' : pub.q
                const qStyle = `font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;flex-shrink:0;width:30px;text-align:center;padding:3px 0;border-radius:5px;align-self:center;background:${pub.q === 'NA' ? 'rgba(255,255,255,.06)' : QCOL[pub.q] + '26'};color:${pub.q === 'NA' ? '#7d7890' : QCOL[pub.q]}`
                return (
                  <div key={i} onClick={() => { setCopied(false); setSelected(pub) }} style={s('display:flex;gap:14px;align-items:baseline;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer')}>
                    <span style={s(qStyle)}>{qLabel}</span>
                    <div style={s('flex:1;min-width:0')}>
                      <div style={s('font-size:14.5px;color:#e4e0ec;line-height:1.4')}>{pub.t}</div>
                      <div style={s("font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#7d7890;margin-top:4px")}><em style={s('font-style:italic')}>{pub.v}</em></div>
                    </div>
                    <span style={s('display:flex;gap:3px;flex-shrink:0;align-self:center')}>{pub.pills.map((p, k) => (<span key={k} style={s(`width:9px;height:9px;border-radius:50%;background:${PCOL[p]}`)} />))}</span>
                    <span style={s("font-family:'JetBrains Mono',monospace;font-size:12px;color:#6f6a82;flex-shrink:0;width:38px;text-align:right")}>{pub.y}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56516a;margin:14px 0 0;letter-spacing:.04em")}>{linkCounts.cite} citation streams (particles flow from citing to cited paper{citeUpdated ? `, OpenAlex · ${citeUpdated}` : ', refreshed at each deploy'}) · {linkCounts.coauthor} shared co-author lines · {linkCounts.similar} dotted similar-topic threads · ringed spheres span two fields · size ≈ quartile</p>
        </div>
      </section>

      {/* PUBLICATION PREVIEW PANEL */}
      <div onClick={() => setSelected(null)} style={s(`position:fixed;inset:0;z-index:99;background:rgba(8,7,12,.55);transition:opacity .3s;opacity:${panelOpen ? '1' : '0'};pointer-events:${panelOpen ? 'auto' : 'none'}`)} />
      <aside style={s(`position:fixed;top:0;right:0;height:100%;width:min(400px,90vw);z-index:100;background:#141019;border-left:1px solid rgba(255,255,255,.1);box-shadow:-30px 0 60px -20px rgba(0,0,0,.6);display:flex;flex-direction:column;transform:translateX(${panelOpen ? '0' : '101%'});transition:transform .34s cubic-bezier(.4,0,.2,1)`)}>
        {sp && (
          <>
            <div style={s(`height:5px;flex-shrink:0;background:${pc}`)} />
            <div data-darkscroll="1" style={s('padding:22px 24px 28px;display:flex;flex-direction:column;gap:16px;overflow-y:auto')}>
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6f6a82")}>Publication</span>
                <button type="button" onClick={() => setSelected(null)} aria-label="Close preview" style={s('width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:none;border-radius:8px;background:rgba(255,255,255,.06);color:#9b96aa;font-size:19px;line-height:1;cursor:pointer')}>×</button>
              </div>
              <div style={s('display:flex;gap:8px;align-items:center;flex-wrap:wrap')}>
                {spills.map((p) => (<span key={p} style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;background:${PCOL[p]}22;color:${PCOL[p]}`)}>{PNAME[p]}</span>))}
                {sp.q !== 'NA' && (<span style={s(`font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;background:${qc}22;color:${qc}`)}>{sp.q}</span>)}
              </div>
              <h3 style={s("font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:22px;line-height:1.26;letter-spacing:-.01em;color:#ECEAF3;margin:0;text-wrap:pretty")}>{sp.t}</h3>
              <p style={s("font-family:'JetBrains Mono',monospace;font-size:13px;color:#9b96aa;line-height:1.5;margin:0;font-style:italic")}>{sp.v}</p>
              <div style={s('display:flex;gap:34px;padding:15px 0;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)')}>
                <div>
                  <div style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;color:#6f6a82;margin-bottom:6px")}>YEAR</div>
                  <div style={s("font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:600;color:#ECEAF3;line-height:1")}>{sp.y}</div>
                </div>
                <div>
                  <div style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;color:#6f6a82;margin-bottom:6px")}>RESEARCH AREA</div>
                  <div style={s('font-size:15px;font-weight:500;color:#ECEAF3;line-height:1.2')}>{spills.map((p) => PNAME[p]).join(' + ')}</div>
                </div>
              </div>
              <a href={`/publications/${sp.slug}`} style={s(`display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;text-decoration:none;color:#fff;background:${pc};padding:11px 17px;border-radius:8px;align-self:flex-start`)}>View full page →</a>
              <a href={sp.scholar} target="_blank" rel="noopener noreferrer" style={s("display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600;text-decoration:none;color:#0f0e14;background:#ECEAF3;padding:11px 17px;border-radius:8px;align-self:flex-start")}>Find on Google Scholar →</a>
              <div style={s('display:flex;flex-direction:column;gap:10px;padding-top:16px;border-top:1px solid rgba(255,255,255,.08)')}>
                <span style={s("font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#6f6a82")}>Chicago citation</span>
                <p style={s("font-family:Georgia,'Times New Roman',serif;font-size:13.5px;line-height:1.6;color:#c9c4d6;margin:0;text-wrap:pretty")}>{sp.citation}</p>
                <button type="button" onClick={copyCite} style={s(`display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;color:${copied ? '#21b3a0' : '#cfcad9'};background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);padding:10px 15px;border-radius:8px;align-self:flex-start;transition:color .2s`)}>{copied ? '✓ Citation copied' : 'Copy Chicago citation'}</button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
