'use client'

// ---------------------------------------------------------------------------
// LatentField — the living latent space behind every dark band.
//
// What it depicts: the inside of a generative model. Each point is an
// embedding (a vector, not a word); points gather into drifting semantic
// clusters that slowly swirl. A "thought" is a walk through that space, like
// autoregressive generation: a spark travels from embedding to nearby
// embedding, and at every step it ignites the point and fires faint attention
// lines to that point's nearest neighbours. Now and then a thought leaps to
// another cluster, the way an association crosses topics. A few ignited points
// show a fragment of their vector, a reminder that the model never sees
// English, only coordinates.
//
// Ever-evolving: cluster centres wander, every cluster spins at its own rate,
// and individual points keep migrating from one cluster to another (concept
// drift), so the space never repeats.
//
// Interaction (listened on the whole band, so text stays selectable):
//   • the pointer acts as a QUERY: nearby embeddings brighten and attention
//     lines reach toward it; moving faster sparks more thoughts
//   • a click (anywhere that is not a link or button) starts a thought at the
//     nearest embedding
//
// Plain canvas 2D, additive blending, pre-rendered glow sprites. Pauses when
// off-screen or the tab is hidden; prefers-reduced-motion draws a still frame.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import { landscape } from '@/lib/landscape'

type Variant = 'hero' | 'banner'

const HUES = ['#8b7bf0', '#f2683f', '#21b3a0', '#4d8df0', '#e8a33d', '#8fbf4a', '#d46fb0']
const BG = '#07060f'

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }

/** A soft round glow, pre-rendered once per colour and stamped with drawImage. */
function sprite(hex: string, core = '#ffffff') {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d')!
  const [r, gg, b] = hexRgb(hex)
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, core); gr.addColorStop(0.18, `rgba(${r},${gg},${b},.85)`); gr.addColorStop(0.5, `rgba(${r},${gg},${b},.22)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`)
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64)
  return c
}

export default function LatentField({ variant = 'banner' }: { variant?: Variant }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = hostRef.current!, cv = cvRef.current!
    const ctx = cv.getContext('2d', { alpha: false })!
    const band = (host.closest('.dark-band') as HTMLElement | null) || host
    const hero = variant === 'hero'
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const small = window.innerWidth < 760
    const r = rng((Date.now() & 0xffff) + (hero ? 1 : 7))
    const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r())

    // The page transition paints in these colours (it used to read the terrain's).
    landscape.low = 'rgb(18,15,36)'
    landscape.high = 'rgb(139,123,240)'

    // ---------- the space ----------
    const N = hero ? (small ? 700 : 1500) : (small ? 380 : 820)
    const K = hero ? 7 : 5
    const SPAN = { x: 430, y: 190, z: 280 }
    const cls = Array.from({ length: K }, (_, k) => {
      const hex = HUES[(k + (hero ? 0 : 2)) % HUES.length]
      return {
        hex, glow: sprite(hex),
        bx: ((k + 0.5) / K * 2 - 1) * SPAN.x * 0.9 + gauss() * 40, by: (r() * 2 - 1) * SPAN.y * 0.7, bz: (r() * 2 - 1) * SPAN.z,
        ax: 40 + r() * 70, ay: 20 + r() * 35, az: 40 + r() * 80,
        w: 0.00005 + r() * 0.00006, ph: r() * Math.PI * 2,
        spin: (r() < 0.5 ? -1 : 1) * (0.00005 + r() * 0.00008),
        sx: 30 + r() * 34, sy: 18 + r() * 20, sz: 30 + r() * 34,
        cx: 0, cy: 0, cz: 0, cos: 1, sin: 0,
      }
    })
    const headSprite = sprite('#ffd9a8', '#fffaf2')

    const cl = new Uint8Array(N)
    const ox = new Float32Array(N), oy = new Float32Array(N), oz = new Float32Array(N)
    const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N)
    const sz = new Float32Array(N), base = new Float32Array(N), en = new Float32Array(N), wob = new Float32Array(N), mig = new Float32Array(N)
    const SX = new Float32Array(N), SY = new Float32Array(N), SK = new Float32Array(N), SD = new Float32Array(N)

    const place = (i: number, k: number) => {
      const c = cls[k], spread = r() < 0.07 ? 2.6 : 1 // a few outliers bridge clusters
      cl[i] = k; ox[i] = gauss() * c.sx * spread; oy[i] = gauss() * c.sy * spread; oz[i] = gauss() * c.sz * spread
    }
    for (let i = 0; i < N; i++) {
      place(i, (r() * K) | 0)
      const c = cls[cl[i]]
      px[i] = c.bx + ox[i]; py[i] = c.by + oy[i]; pz[i] = c.bz + oz[i]
      sz[i] = 1.2 + r() * 1.6; base[i] = 0.4 + r() * 0.45; wob[i] = r() * 6.28; mig[i] = 1
    }

    // ---------- camera ----------
    let W = 0, H = 0, F = 1, CX = 0, CY = 0, T = 0
    const D = 860
    const cam = { yaw: r() * 6.28, pitch: -0.26, par: 0, parGoal: 0 }
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, hero ? 1.5 : 1.25)
      const b = host.getBoundingClientRect(); W = b.width; H = b.height
      cv.width = Math.max(1, W * dpr); cv.height = Math.max(1, H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      F = Math.max(W * 0.95, H * 1.5); CX = W * (small ? 0.5 : hero ? 0.6 : 0.62); CY = H * 0.5
    }
    const project = () => {
      const cyw = Math.cos(cam.yaw + cam.par), syw = Math.sin(cam.yaw + cam.par), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch)
      for (let i = 0; i < N; i++) {
        const x1 = px[i] * cyw + pz[i] * syw, z1 = -px[i] * syw + pz[i] * cyw
        const y2 = py[i] * cp - z1 * sp, z2 = py[i] * sp + z1 * cp
        const depth = z2 + D, f = depth > 60 ? F / depth : 0
        SX[i] = CX + x1 * f; SY[i] = CY + y2 * f; SK[i] = (f * D) / F; SD[i] = depth
      }
    }

    // ---------- nearest neighbours (3D, brute force: N is small) ----------
    const knn = (i: number, k: number, skip?: Set<number>) => {
      const best: number[] = [], bd: number[] = []
      for (let j = 0; j < N; j++) {
        if (j === i || skip?.has(j)) continue
        const d = (px[j] - px[i]) ** 2 + (py[j] - py[i]) ** 2 + (pz[j] - pz[i]) ** 2
        if (best.length < k || d < bd[bd.length - 1]) {
          let p = bd.length; while (p > 0 && bd[p - 1] > d) p--
          bd.splice(p, 0, d); best.splice(p, 0, j)
          if (best.length > k) { best.pop(); bd.pop() }
        }
      }
      return best
    }

    // ---------- thoughts ----------
    type Thought = { path: number[]; seen: Set<number>; t: number; dur: number; len: number; done: boolean; fade: number; hot: boolean }
    type Fan = { i: number; nb: number[]; born: number }
    type Label = { i: number; text: string; hex: string; born: number }
    type Ring = { i: number; born: number; hex: string }
    const thoughts: Thought[] = [], fans: Fan[] = [], labels: Label[] = [], rings: Ring[] = []
    const MAX = hero ? 7 : 4

    const vecText = () => {
      const f = () => { const v = gauss() * 0.8; return (v < 0 ? '−' : '') + Math.abs(v).toFixed(2) }
      return `[${f()} ${f()} ${f()} ${f()} …]`
    }
    const arrive = (i: number, hot: boolean) => {
      en[i] = hot ? 1.6 : 1.15
      const nb = knn(i, 5)
      nb.forEach((j) => { en[j] = Math.max(en[j], 0.5) })
      fans.push({ i, nb, born: T })
      // vector read-outs only on the open side of the band, never under the copy
      const okSide = small ? SY[i] > H * 0.62 : SX[i] > W * (hero ? 0.5 : 0.58)
      const fits = SX[i] < W - 180 && SY[i] > 24 && SY[i] < H - 12
      const clear = labels.every((l) => Math.abs(SY[l.i] - SY[i]) > 36 || Math.abs(SX[l.i] - SX[i]) > 190)
      if (okSide && fits && clear && labels.length < (hero ? 4 : 2) && r() < (hero ? 0.3 : 0.22)) labels.push({ i, text: vecText(), hex: cls[cl[i]].hex, born: T })
    }
    const nextHop = (th: Thought) => {
      const i = th.path[th.path.length - 1]
      if (r() < 0.14) { // associative leap into another cluster
        let best = -1, bd = Infinity
        for (let s = 0; s < 40; s++) {
          const j = (r() * N) | 0
          if (cl[j] === cl[i] || th.seen.has(j)) continue
          const d = (px[j] - px[i]) ** 2 + (py[j] - py[i]) ** 2 + (pz[j] - pz[i]) ** 2
          if (d < bd) { bd = d; best = j }
        }
        if (best >= 0) return best
      }
      const nb = knn(i, 6, th.seen)
      return nb[Math.min(nb.length - 1, (r() ** 1.7 * 5) | 0)]
    }
    const spawn = (start?: number, hot = false) => {
      if (!hot && thoughts.filter((t) => !t.done).length >= MAX) return
      if (start == null) {
        // start where it can be seen: on screen, and mostly on the open side
        for (let s = 0; s < 30; s++) {
          const j = (r() * N) | 0
          if (SX[j] > W * (small ? 0.05 : 0.32) && SX[j] < W * 0.97 && SY[j] > H * 0.08 && SY[j] < H * 0.92) { start = j; break }
        }
        if (start == null) start = (r() * N) | 0
      }
      const th: Thought = { path: [start], seen: new Set([start]), t: 0, dur: hot ? 170 : 230 + r() * 120, len: hot ? 16 + ((r() * 8) | 0) : 7 + ((r() * 10) | 0), done: false, fade: 1, hot }
      arrive(start, hot)
      const n = nextHop(th); th.path.push(n); th.seen.add(n)
      thoughts.push(th)
    }

    // ---------- pointer ----------
    const ptr = { x: 0, y: 0, in: false, speed: 0 }
    const onMove = (e: PointerEvent) => {
      const b = host.getBoundingClientRect()
      const x = e.clientX - b.left, y = e.clientY - b.top
      if (ptr.in) ptr.speed = ptr.speed * 0.85 + Math.hypot(x - ptr.x, y - ptr.y) * 0.15
      ptr.x = x; ptr.y = y; ptr.in = true
      cam.parGoal = ((x / W) - 0.5) * 0.35
    }
    const onLeave = () => { ptr.in = false; cam.parGoal = 0 }
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a,button,input,textarea,select,label,summary,[role="button"]')) return
      const b = host.getBoundingClientRect()
      const x = e.clientX - b.left, y = e.clientY - b.top
      let best = 0, bd = Infinity
      for (let i = 0; i < N; i++) { if (!SK[i]) continue; const d = (SX[i] - x) ** 2 + (SY[i] - y) ** 2; if (d < bd) { bd = d; best = i } }
      spawn(best, true)
    }

    // ---------- simulation ----------
    let spawnIn = 400, driftIn = 1200
    const step = (dt: number) => {
      T += dt
      cam.yaw += dt * 0.000032
      cam.pitch = -0.26 + Math.sin(T * 0.00004) * 0.07
      cam.par += (cam.parGoal - cam.par) * Math.min(1, dt * 0.003)
      for (const c of cls) {
        c.cx = c.bx + c.ax * Math.sin(T * c.w + c.ph)
        c.cy = c.by + c.ay * Math.sin(T * c.w * 1.3 + c.ph * 2)
        c.cz = c.bz + c.az * Math.cos(T * c.w * 0.9 + c.ph)
        const a = T * c.spin; c.cos = Math.cos(a); c.sin = Math.sin(a)
      }
      const ease = 1 - Math.exp(-dt * 0.0022), decay = Math.exp(-dt / 420)
      for (let i = 0; i < N; i++) {
        const c = cls[cl[i]]
        const tx = c.cx + ox[i] * c.cos - oz[i] * c.sin
        const ty = c.cy + oy[i] + Math.sin(T * 0.0008 + wob[i]) * 5
        const tz = c.cz + ox[i] * c.sin + oz[i] * c.cos
        const k = ease * mig[i]
        px[i] += (tx - px[i]) * k; py[i] += (ty - py[i]) * k; pz[i] += (tz - pz[i]) * k
        if (mig[i] < 1) mig[i] = Math.min(1, mig[i] + dt * 0.00014)
        en[i] *= decay
      }
      // concept drift: an embedding wanders over to a different cluster
      driftIn -= dt
      if (driftIn <= 0) {
        driftIn = (hero ? 380 : 700) + r() * 600
        const i = (r() * N) | 0
        place(i, (cl[i] + 1 + ((r() * (K - 1)) | 0)) % K)
        mig[i] = 0.06
      }
      // thoughts
      spawnIn -= dt * (1 + Math.min(4, ptr.speed * 0.05))
      if (spawnIn <= 0) { spawn(); spawnIn = (hero ? 260 : 600) + r() * (hero ? 700 : 900) }
      ptr.speed *= Math.exp(-dt / 300)
      for (const th of thoughts) {
        if (th.done) { th.fade -= dt / 1400; continue }
        th.t += dt / th.dur
        while (th.t >= 1 && !th.done) {
          th.t -= 1
          const at = th.path[th.path.length - 1]
          arrive(at, th.hot)
          if (th.path.length >= th.len) { th.done = true; rings.push({ i: at, born: T, hex: cls[cl[at]].hex }) }
          else { const n = nextHop(th); th.path.push(n); th.seen.add(n) }
        }
      }
      for (let k = thoughts.length - 1; k >= 0; k--) if (thoughts[k].fade <= 0) thoughts.splice(k, 1)
      for (let k = fans.length - 1; k >= 0; k--) if (T - fans[k].born > 1000) fans.splice(k, 1)
      for (let k = labels.length - 1; k >= 0; k--) if (T - labels[k].born > 2800) labels.splice(k, 1)
      for (let k = rings.length - 1; k >= 0; k--) if (T - rings[k].born > 1300) rings.splice(k, 1)
    }

    // ---------- drawing ----------
    const draw = () => {
      project()
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'

      // nebula behind each cluster
      for (const c of cls) {
        const cyw = Math.cos(cam.yaw + cam.par), syw = Math.sin(cam.yaw + cam.par)
        const x1 = c.cx * cyw + c.cz * syw, z1 = -c.cx * syw + c.cz * cyw
        const y2 = c.cy * Math.cos(cam.pitch) - z1 * Math.sin(cam.pitch), z2 = c.cy * Math.sin(cam.pitch) + z1 * Math.cos(cam.pitch)
        const f = F / (z2 + D)
        const rad = (c.sx + c.sz) * 1.5 * f
        ctx.globalAlpha = 0.3
        ctx.drawImage(c.glow, CX + x1 * f - rad, CY + y2 * f - rad, rad * 2, rad * 2)
      }

      // embeddings
      for (let k = 0; k < K; k++) {
        ctx.fillStyle = cls[k].hex
        for (let i = 0; i < N; i++) {
          if (cl[i] !== k || !SK[i]) continue
          const fade = Math.max(0.3, Math.min(1, 1.45 - SD[i] / 1400))
          const e = Math.min(1.6, en[i])
          const s = sz[i] * SK[i] * (1 + e * 0.9)
          ctx.globalAlpha = Math.min(1, base[i] * fade + e * 0.55)
          ctx.fillRect(SX[i] - s / 2, SY[i] - s / 2, s, s)
          if (e > 0.12) {
            const g = s * (4 + e * 5)
            ctx.globalAlpha = Math.min(0.9, e * 0.55)
            ctx.drawImage(cls[k].glow, SX[i] - g / 2, SY[i] - g / 2, g, g)
          }
        }
      }

      // attention fans
      ctx.lineWidth = 0.7
      for (const f of fans) {
        const a = 1 - (T - f.born) / 1000
        ctx.strokeStyle = cls[cl[f.i]].hex
        ctx.globalAlpha = a * 0.6
        ctx.beginPath()
        for (const j of f.nb) { ctx.moveTo(SX[f.i], SY[f.i]); ctx.lineTo(SX[j], SY[j]) }
        ctx.stroke()
      }

      // thoughts: a fading trail through the last few hops, and a bright head
      for (const th of thoughts) {
        const n = th.path.length
        const hops = th.done ? n - 1 : n - 2 // completed segments
        for (let s = 0; s <= hops; s++) {
          const a = th.path[hops - s], b = th.path[hops - s + 1]
          if (b == null) continue
          const partial = !th.done && s === 0
          const ex = partial ? SX[a] + (SX[b] - SX[a]) * th.t : SX[b]
          const ey = partial ? SY[a] + (SY[b] - SY[a]) * th.t : SY[b]
          const age = s / 7
          if (age > 1) break
          ctx.globalAlpha = (1 - age) ** 1.4 * th.fade
          ctx.strokeStyle = cls[cl[a]].hex
          ctx.lineWidth = (th.hot ? 2.2 : 1.6) * (1 - age * 0.5)
          ctx.beginPath(); ctx.moveTo(SX[a], SY[a]); ctx.lineTo(ex, ey); ctx.stroke()
        }
        if (!th.done) {
          const a = th.path[n - 2], b = th.path[n - 1]
          const hx = SX[a] + (SX[b] - SX[a]) * th.t, hy = SY[a] + (SY[b] - SY[a]) * th.t
          const g = th.hot ? 34 : 24
          ctx.globalAlpha = 0.95
          ctx.drawImage(headSprite, hx - g / 2, hy - g / 2, g, g)
        }
      }

      // a thought completing: an expanding ring
      for (const rg of rings) {
        const age = (T - rg.born) / 1300
        ctx.globalAlpha = (1 - age) * 0.7
        ctx.strokeStyle = rg.hex; ctx.lineWidth = 1.2
        ctx.beginPath(); ctx.arc(SX[rg.i], SY[rg.i], 3 + age * 34, 0, Math.PI * 2); ctx.stroke()
      }

      // the pointer as a query attending to nearby keys
      if (ptr.in) {
        const R = 150, near: { i: number; d: number }[] = []
        for (let i = 0; i < N; i++) {
          const d = Math.hypot(SX[i] - ptr.x, SY[i] - ptr.y)
          if (d < R) { near.push({ i, d }); en[i] = Math.max(en[i], 0.35 * (1 - d / R)) }
        }
        near.sort((a, b) => a.d - b.d)
        ctx.lineWidth = 0.6
        for (const { i, d } of near.slice(0, 7)) {
          ctx.globalAlpha = (1 - d / R) * 0.4
          ctx.strokeStyle = cls[cl[i]].hex
          ctx.beginPath(); ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(SX[i], SY[i]); ctx.stroke()
        }
      }

      // vector read-outs
      ctx.globalCompositeOperation = 'source-over'
      ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace"
      for (const lb of labels) {
        const age = T - lb.born
        ctx.globalAlpha = Math.min(1, age / 320) * Math.min(1, (2800 - age) / 800) * 0.8
        ctx.fillStyle = lb.hex
        ctx.fillText(lb.text, SX[lb.i] + 9, SY[lb.i] - 7)
      }
      ctx.globalAlpha = 1
    }

    // ---------- loop ----------
    let raf = 0, last = 0, visible = true, running = false
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(50, now - (last || now)); last = now
      step(dt); draw()
    }
    const start = () => { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(frame) }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    fit(); project()
    if (reduce) { for (let k = 0; k < 260; k++) step(16); draw() }
    else { for (let k = 0; k < 30; k++) step(16); start() }

    const ro = new ResizeObserver(() => { fit(); if (reduce) draw() }); ro.observe(host)
    const io = new IntersectionObserver((en2) => { visible = en2.some((x) => x.isIntersecting); if (visible && !document.hidden) start(); else stop() }, { threshold: 0.01 })
    io.observe(host)
    const onVis = () => { if (document.hidden) stop(); else if (visible) start() }
    document.addEventListener('visibilitychange', onVis)
    band.addEventListener('pointermove', onMove)
    band.addEventListener('pointerleave', onLeave)
    band.addEventListener('pointerdown', onDown)

    return () => {
      stop(); ro.disconnect(); io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      band.removeEventListener('pointermove', onMove)
      band.removeEventListener('pointerleave', onLeave)
      band.removeEventListener('pointerdown', onDown)
    }
  }, [variant])

  return (
    <div ref={hostRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG }}>
      <canvas ref={cvRef} style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}
