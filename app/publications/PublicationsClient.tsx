'use client'

import { useEffect, useRef, useState } from 'react'
import { s } from '@/lib/style'
import { PCOL, PNAME, QCOL, CATNAME, type Code } from '@/lib/view'

type PubNode = { t: string; y: number; pills: Code[]; q: string; cat: string; v: string; citation: string; scholar: string }

export default function PublicationsClient({
  pubs, quartileStats, minYearBound, maxYearBound,
}: { pubs: PubNode[]; quartileStats: { num: string; label: string; color: string }[]; minYearBound: number; maxYearBound: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<HTMLCanvasElement>(null)

  const [pillarFilter, setPillarFilter] = useState<string[]>([])
  const [catFilter, setCatFilter] = useState<string[]>([])
  const [quartileFilter, setQuartileFilter] = useState<string[]>([])
  const [mode, setMode] = useState<'graph' | 'list'>('graph')
  const [minYear, setMinYear] = useState(minYearBound)
  const [selected, setSelected] = useState<PubNode | null>(null)
  const [copied, setCopied] = useState(false)

  const stateRef = useRef({ pillarFilter, catFilter, quartileFilter, minYear, mode })
  stateRef.current = { pillarFilter, catFilter, quartileFilter, minYear, mode }
  const selectRef = useRef(setSelected)

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rafs: number[] = []; const ios: IntersectionObserver[] = []
    const root = () => wrapRef.current || document
    let trPoll: any = null, onTrScroll: any = null, fitFn: (() => void) | null = null
    const fit = (cv: HTMLCanvasElement, fh?: number) => { const dpr = Math.min(window.devicePixelRatio || 1, 2); const r = cv.getBoundingClientRect(); const w = r.width || cv.clientWidth, h = r.height || fh || 440; cv.width = w * dpr; cv.height = h * dpr; const ctx = cv.getContext('2d')!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return { w, h, ctx } }

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

    function setupGraph() {
      const cv = graphRef.current; if (!cv) return
      if (!cv.getBoundingClientRect().width) { requestAnimationFrame(setupGraph); return }
      let g = fit(cv, 480)
      const pillars: Code[] = ['gen', 'exp', 'evo', 'opt', 'gam', 'sim']
      let anchors: Record<string, { x: number; y: number }> = {}
      const setA = () => { anchors = {}; const R = Math.min(g.w, g.h) * 0.34; pillars.forEach((p, i) => { const a = (i / pillars.length) * Math.PI * 2 - Math.PI / 2; anchors[p] = { x: g.w / 2 + Math.cos(a) * R, y: g.h / 2 + Math.sin(a) * R } }) }
      setA()
      const rsize: Record<string, number> = { Q1: 7.5, Q2: 6.5, Q3: 5.5, Q4: 5, NA: 4 }
      const nodes = pubs.map((d, i) => ({ ...d, x: g.w / 2 + (Math.random() - .5) * g.w * 0.5, cy: g.h / 2 + (Math.random() - .5) * g.h * 0.5, vx: 0, vy: 0, r: (rsize[d.q] || 4) + (d.pills.length > 1 ? 1 : 0) }))
      const links: [number, number, string][] = []; const byP: Record<string, number[]> = {}
      nodes.forEach((n, i) => { n.pills.forEach((p) => { (byP[p] = byP[p] || []).push(i) }) })
      Object.keys(byP).forEach((p) => { const arr = byP[p]; for (let k = 0; k < arr.length; k++) links.push([arr[k], arr[(k + 1) % arr.length], p]) })
      let hover: any = null; const mouse = { x: -999, y: -999 }
      const visible = (n: any) => { const st = stateRef.current; return (st.pillarFilter.length === 0 || n.pills.some((p: string) => st.pillarFilter.includes(p))) && (st.catFilter.length === 0 || st.catFilter.includes(n.cat)) && (st.quartileFilter.length === 0 || st.quartileFilter.includes(n.q)) && n.y >= st.minYear }
      cv.addEventListener('pointermove', (e) => {
        const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top
        let h: any = null, hd = 16; for (const n of nodes) { if (!visible(n)) continue; const d = Math.hypot(n.x - mouse.x, n.cy - mouse.y); if (d < Math.max(hd, n.r + 8)) { hd = d; h = n } }
        hover = h; cv.style.cursor = h ? 'pointer' : 'default'; const tip = root().querySelector('[data-graph-tip]') as HTMLElement | null
        if (tip) { if (h) { tip.style.opacity = '1'; tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 320) + 'px'; tip.style.top = (e.clientY + 16) + 'px'; const tt = tip.querySelector('[data-tip-title]') as HTMLElement, tm = tip.querySelector('[data-tip-meta]') as HTMLElement; if (tt) tt.textContent = h.t; if (tm) tm.textContent = h.pills.map((p: Code) => PNAME[p]).join(' + ') + ' · ' + h.y + (h.q !== 'NA' ? ' · ' + h.q : '') } else tip.style.opacity = '0' }
      })
      cv.addEventListener('pointerleave', () => { hover = null; const tip = root().querySelector('[data-graph-tip]') as HTMLElement | null; if (tip) tip.style.opacity = '0' })
      cv.addEventListener('click', () => { if (hover) { setCopied(false); selectRef.current(hover) } })
      fitFn = () => { g = fit(cv, 480); setA() }
      const sim = () => {
        for (const n of nodes) { let ax = 0, ay = 0; for (const p of n.pills) { ax += anchors[p].x; ay += anchors[p].y } ax /= n.pills.length; ay /= n.pills.length; n.vx += (ax - n.x) * 0.008; n.vy += (ay - n.cy) * 0.008; n.vx += (g.w / 2 - n.x) * 0.0005; n.vy += (g.h / 2 - n.cy) * 0.0005 }
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j]; let dx = a.x - b.x, dy = a.cy - b.cy, d2 = dx * dx + dy * dy; if (d2 < 1) d2 = 1; if (d2 < 6500) { const d = Math.sqrt(d2), f = 150 / d2; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f } }
        for (const [i, j] of links) { const a = nodes[i], b = nodes[j], dx = b.x - a.x, dy = b.cy - a.cy, d = Math.hypot(dx, dy) || 1, f = (d - 48) * 0.01; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f }
        for (const n of nodes) { n.vx *= 0.84; n.vy *= 0.84; n.x += n.vx; n.cy += n.vy; n.x = Math.max(12, Math.min(g.w - 12, n.x)); n.cy = Math.max(12, Math.min(g.h - 12, n.cy)) }
      }
      const draw = () => {
        const ctx = g.ctx; const flt = stateRef.current.pillarFilter; ctx.clearRect(0, 0, g.w, g.h)
        for (const [i, j, lp] of links) { const a = nodes[i], b = nodes[j]; const fOn = flt.length === 0 || flt.includes(lp); const on = visible(a) && visible(b) && fOn; const bridge = a.pills.length > 1 || b.pills.length > 1; ctx.lineWidth = on && bridge ? 1.5 : 1; ctx.strokeStyle = on ? (bridge ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.09)') : 'rgba(255,255,255,.02)'; ctx.beginPath(); ctx.moveTo(a.x, a.cy); ctx.lineTo(b.x, b.cy); ctx.stroke() }
        for (const n of nodes) { const on = visible(n); ctx.globalAlpha = on ? 1 : 0.12
          if (n.pills.length === 1) { ctx.fillStyle = PCOL[n.pills[0]]; ctx.beginPath(); ctx.arc(n.x, n.cy, n.r, 0, 7); ctx.fill() }
          else { const seg = Math.PI * 2 / n.pills.length; n.pills.forEach((p, k) => { ctx.fillStyle = PCOL[p]; ctx.beginPath(); ctx.moveTo(n.x, n.cy); ctx.arc(n.x, n.cy, n.r, -Math.PI / 2 + k * seg, -Math.PI / 2 + (k + 1) * seg); ctx.closePath(); ctx.fill() }); ctx.strokeStyle = 'rgba(255,255,255,' + (on ? 0.6 : 0.14) + ')'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(n.x, n.cy, n.r, 0, 7); ctx.stroke() }
          if (hover === n) { ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x, n.cy, n.r + 1.5, 0, 7); ctx.stroke() } }
        ctx.globalAlpha = 1
      }
      if (reduce) { for (let st = 0; st < 300; st++) sim(); draw(); return }
      let vis = true; const io = new IntersectionObserver((en) => { en.forEach((x) => (vis = x.isIntersecting)) }, { threshold: .1 }); io.observe(cv); ios.push(io)
      const loop = () => { if (vis && stateRef.current.mode === 'graph') { sim(); draw() } rafs.push(requestAnimationFrame(loop)) }; loop()
    }

    const onResize = () => fitFn && fitFn()
    window.addEventListener('resize', onResize)
    setupTextReveal(); setupGraph()

    return () => {
      rafs.forEach((r) => cancelAnimationFrame(r)); ios.forEach((o) => o.disconnect())
      if (trPoll) clearInterval(trPoll); if (onTrScroll) { window.removeEventListener('scroll', onTrScroll); window.removeEventListener('resize', onTrScroll) }
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- derived ----
  const toggle = (arr: string[], key: string) => (arr.includes(key) ? arr.filter((x) => x !== key) : arr.concat(key))
  const chipStyle = (active: boolean) => "font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;cursor:pointer;padding:7px 13px;border-radius:8px;" + (active ? 'background:rgba(255,255,255,.14);color:#ECEAF3;border:1px solid rgba(255,255,255,.22)' : 'background:transparent;color:#9b96aa;border:1px solid rgba(255,255,255,.1)')

  const matchD = (d: PubNode) => (pillarFilter.length === 0 || d.pills.some((p) => pillarFilter.includes(p))) && (catFilter.length === 0 || catFilter.includes(d.cat)) && (quartileFilter.length === 0 || quartileFilter.includes(d.q)) && d.y >= minYear
  const filtered = pubs.filter(matchD)
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
      {/* PAGE HEADER */}
      <section style={s('max-width:1120px;margin:0 auto;padding:56px 28px 24px')}>
        <p style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#a39a8f;margin:0 0 16px")}>/ publications · {minYearBound} — {maxYearBound}</p>
        <h1 style={s(`font-family:${stack};font-weight:600;font-size:clamp(38px,5.6vw,68px);line-height:1.02;letter-spacing:-.02em;margin:0 0 18px;max-width:900px;text-wrap:balance`)}>A body of work, mapped.</h1>
        <p style={s('font-size:18px;line-height:1.6;color:#57514b;max-width:660px;margin:0')}>{pubs.length} peer-reviewed papers across six research pillars. Explore the connective tissue as a living constellation, or scan the full chronological list.</p>
      </section>

      {/* QUARTILE STAT STRIP */}
      <section style={s('max-width:1120px;margin:0 auto;padding:18px 28px 8px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px')}>
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
              <h2 style={s(`font-family:${stack};font-weight:600;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;margin:0;color:#ECEAF3`)}>Every paper, pulled toward its pillar.</h2>
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
              <canvas ref={graphRef} style={s('display:block;width:100%;height:480px')} />
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
          <p style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#56516a;margin:14px 0 0;letter-spacing:.04em")}>Split-colour nodes span more than one pillar — their links bridge clusters · node size ≈ journal quartile · hover for title</p>
        </div>
        <div data-graph-tip="1" style={s('position:fixed;z-index:90;pointer-events:none;opacity:0;transition:opacity .12s;background:#1c1b24;border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:9px 12px;max-width:300px;box-shadow:0 14px 40px -12px rgba(0,0,0,.7)')}>
          <div data-tip-title="1" style={s('font-size:13px;color:#ECEAF3;line-height:1.35;margin-bottom:4px')} />
          <div data-tip-meta="1" style={s("font-family:'JetBrains Mono',monospace;font-size:11px;color:#9b96aa")} />
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
