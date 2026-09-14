'use client'

// ---------------------------------------------------------------------------
// ProcLandscape — the animated 2.5D procedural terrain behind every dark band.
//
// Architecture, and why it is split this way:
//
//   CPU owns the LARGE-SCALE terrain. `terrainAt()` in lib/landscape.ts fills a
//   small heightmap (≈160×90) which is uploaded as a texture. The swarm in
//   HeroSim samples that exact same function, so the agents provably climb the
//   ridges you can see. Duplicating the field in GLSL instead would have meant
//   reproducing a hash function bit-for-bit across CPU and GPU — which is not
//   reliably possible, and any drift would put the swarm on invisible hills.
//
//   GPU owns EVERYTHING ELSE at full resolution: three octaves of fine detail on
//   top of the sampled base, analytic-ish normals, directional shading, contour
//   banding, click ripples, the cursor's deformation, and the theme cross-fade.
//
//   Base surface normals come from a gradient the CPU computes from the float
//   heightmap and packs into the texture's G/B channels. Differencing the 8-bit
//   height on the GPU instead would give faceted, blocky lighting.
//
// Interaction:
//   • pointer SPEED (smoothed) raises turbulence, detail amplitude, animation
//     rate and chroma — the terrain visibly roughens as you move faster
//   • CLICK re-seeds the generator and sweeps a new theme outward from the click
//     point, and fires a ripple through the elevation
//
// Perf: renders at 0.6× backing scale (0.5× on small screens) and CSS-upscales;
// the heightmap is regenerated every 3rd frame, not every frame; the loop pauses
// when offscreen or the tab is hidden. prefers-reduced-motion draws one frame.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import { s } from '@/lib/style'
import { THEMES, landscape, terrainAt, lerpRGB, rgbCss } from '@/lib/landscape'

type Variant = 'hero' | 'banner'

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uField;
uniform vec2  uRes;
uniform float uAspect;
uniform float uTime;
uniform vec2  uMouse;
uniform float uVel;
uniform float uMix;
uniform vec2  uMixOrigin;
uniform float uDim;
uniform float uDetailAmp;
uniform vec2  uDetailOffset;
uniform vec3  uPalA[4];
uniform vec3  uPalB[4];
uniform vec4  uParA;   // x unused, y unused, z contour frequency, w light angle
uniform vec4  uParB;
uniform vec3  uWaves[3];  // xy origin in uv, z age 0..1 (>=1 = spent)

float h21(vec2 p){
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = h21(i), b = h21(i + vec2(1.0, 0.0));
  float c = h21(i + vec2(0.0, 1.0)), d = h21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
// fine structure the low-res base texture cannot carry
float detail(vec2 p){
  float v = 0.5 * vnoise(p * 9.0);
  v += 0.25 * vnoise(p * 19.0);
  v += 0.125 * vnoise(p * 37.0);
  return v / 0.875;
}

float waveAt(vec2 q){
  float acc = 0.0;
  for(int i = 0; i < 3; i++){
    vec3 w = uWaves[i];
    if(w.z >= 1.0) continue;
    float r = distance(q, vec2(w.x * uAspect, w.y));
    float front = w.z * 1.15;
    float band = exp(-pow((r - front) * 7.5, 2.0));
    acc += band * (1.0 - w.z) * 0.16;
  }
  return acc;
}

vec3 ramp(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float e){
  e = clamp(e, 0.0, 1.0);
  vec3 c = mix(p0, p1, smoothstep(0.0, 0.34, e));
  c = mix(c, p2, smoothstep(0.32, 0.67, e));
  c = mix(c, p3, smoothstep(0.65, 1.0, e));
  return c;
}

void main(){
  vec2 uv = vUv;
  vec2 q  = vec2(uv.x * uAspect, uv.y);

  vec4 t = texture2D(uField, uv);
  float base = t.r;
  vec2 gBase = (t.gb - 0.5) * 2.0;

  vec2 dp = vec2(1.6 / uRes.x, 1.6 / uRes.y);
  vec2 dq = vec2(uAspect, 1.0);
  float dt0 = detail(q + uDetailOffset);
  float dtx = detail(q + vec2(dp.x * uAspect, 0.0) + uDetailOffset);
  float dty = detail(q + vec2(0.0, dp.y) + uDetailOffset);

  // the pointer pushes the surface up and ripples around itself
  float md = distance(q, vec2(uMouse.x * uAspect, uMouse.y));
  float bulge = exp(-md * md * 14.0) * uVel * 0.22;
  float ripple = sin(md * 34.0 - uTime * 5.0) * exp(-md * md * 9.0) * uVel * 0.05;

  float wv = waveAt(q);

  float h  = base + (dt0 - 0.5) * uDetailAmp + bulge + ripple + wv;
  float hx = base + (dtx - 0.5) * uDetailAmp;
  float hy = base + (dty - 0.5) * uDetailAmp;

  vec2 gDetail = vec2(hx - h, hy - h) / max(dp.x, 1e-5);
  vec2 grad = gBase * 1.0 + gDetail * 0.06;

  vec3 N = normalize(vec3(-grad * 1.9, 1.0));

  // theme transition sweeps outward from wherever the visitor clicked
  float d = distance(q, vec2(uMixOrigin.x * uAspect, uMixOrigin.y));
  float m = clamp(smoothstep(0.0, 0.42, uMix * 1.85 - d * 0.55), 0.0, 1.0);

  float e = clamp(h, 0.0, 1.0);
  vec3 colA = ramp(uPalA[0], uPalA[1], uPalA[2], uPalA[3], e);
  vec3 colB = ramp(uPalB[0], uPalB[1], uPalB[2], uPalB[3], e);
  vec3 base3 = mix(colA, colB, m) / 255.0;

  float la = mix(uParA.w, uParB.w, m);
  vec3 L = normalize(vec3(cos(la), sin(la), 0.82));
  float lam = clamp(dot(N, L), 0.0, 1.0);
  float sp = pow(clamp(dot(N, normalize(L + vec3(0.0, 0.0, 1.6))), 0.0, 1.0), 26.0);

  vec3 peak = mix(uPalA[3], uPalB[3], m) / 255.0;
  vec3 col = base3 * (0.14 + 0.92 * lam) + peak * sp * 0.34;

  // Contour bands — constant thickness in ELEVATION, so they crowd on steep
  // ground exactly like a relief map. This is the single strongest cue that the
  // thing on screen is terrain and not fog, so it is drawn assertively: a dark
  // groove with a bright rim on its uphill side.
  float cf = mix(uParA.z, uParB.z, m);
  float band = fract(e * cf);
  float groove = 1.0 - smoothstep(0.0, 0.10, band) * smoothstep(0.0, 0.10, 1.0 - band);
  float rim = smoothstep(0.0, 0.055, band) * (1.0 - smoothstep(0.055, 0.13, band));
  col *= 1.0 - groove * 0.34;
  col += peak * rim * (0.16 + 0.26 * e);

  // a faint presence under the cursor, and the ripple crests catch the light
  col += peak * exp(-md * md * 30.0) * (0.03 + 0.16 * uVel);
  col += peak * clamp(wv, 0.0, 1.0) * 1.6;

  // chroma lifts slightly with pointer speed — the landscape "wakes up"
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 1.0 + uVel * 0.5);

  gl_FragColor = vec4(max(col, 0.0) * uDim, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error('shader: ' + log)
  }
  return sh
}

export default function ProcLandscape({
  variant = 'hero',
  className,
  style,
}: {
  variant?: Variant
  className?: string
  style?: React.CSSProperties
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const cv = cvRef.current
    if (!host || !cv) return

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const isBanner = variant === 'banner'
    const DIM = isBanner ? 0.8 : 1
    let quality = 0.55

    // ---- heightmap (CPU) --------------------------------------------------
    let HW = 160, HH = 90
    let heights = new Float32Array(HW * HH)
    let texels = new Uint8Array(HW * HH * 4)

    // Theme state. A = what we are leaving, B = what we are moving to.
    let themeA = Math.floor(Math.random() * THEMES.length)
    let themeB = themeA
    let seedA = Math.random() * 40
    let seedB = seedA
    let mix = 1 // 1 = fully settled on B
    let mixOrigin: [number, number] = [0.5, 0.5]

    const waves: { x: number; y: number; age: number }[] = [
      { x: 0, y: 0, age: 1 }, { x: 0, y: 0, age: 1 }, { x: 0, y: 0, age: 1 },
    ]

    const ptr = { x: 0.5, y: 0.5, vel: 0, raw: 0, lx: 0, ly: 0, lt: 0, inside: false }
    let phase = 0

    function currentTheme() {
      const a = THEMES[themeA], b = THEMES[themeB]
      const t = mix
      return {
        warp: a.warp + (b.warp - a.warp) * t,
        ridge: a.ridge + (b.ridge - a.ridge) * t,
        seed: seedA + (seedB - seedA) * t,
      }
    }

    function buildHeights() {
      const c = currentTheme()
      landscape.seed = c.seed + phase * 0.004
      landscape.warp = c.warp
      landscape.ridge = c.ridge
      landscape.turbulence = ptr.vel
      landscape.themeIndex = themeB
      landscape.transitioning = mix < 1

      const a = THEMES[themeA], b = THEMES[themeB]
      landscape.low = rgbCss(lerpRGB(a.palette[0], b.palette[0], mix))
      landscape.mid = rgbCss(lerpRGB(a.palette[2], b.palette[2], mix))
      landscape.high = rgbCss(lerpRGB(a.palette[3], b.palette[3], mix))

      for (let j = 0; j < HH; j++) {
        for (let i = 0; i < HW; i++) {
          heights[j * HW + i] = terrainAt(i / (HW - 1), j / (HH - 1))
        }
      }
      // central-difference gradient, packed into G/B so the GPU gets smooth normals
      for (let j = 0; j < HH; j++) {
        for (let i = 0; i < HW; i++) {
          const k = j * HW + i
          const xm = heights[j * HW + Math.max(0, i - 1)]
          const xp = heights[j * HW + Math.min(HW - 1, i + 1)]
          const ym = heights[Math.max(0, j - 1) * HW + i]
          const yp = heights[Math.min(HH - 1, j + 1) * HW + i]
          // Scale so a typical slope lands near |g| ~ 0.6 once encoded into a
          // byte. Too small and the surface normals are all straight up, which
          // renders as flat fog rather than lit terrain.
          const gx = (xp - xm) * 0.5 * HW * 0.30
          const gy = (yp - ym) * 0.5 * HH * 0.30
          const o = k * 4
          texels[o] = Math.max(0, Math.min(255, Math.round(heights[k] * 255)))
          texels[o + 1] = Math.max(0, Math.min(255, Math.round((gx * 0.5 + 0.5) * 255)))
          texels[o + 2] = Math.max(0, Math.min(255, Math.round((gy * 0.5 + 0.5) * 255)))
          texels[o + 3] = 255
        }
      }
    }

    // ---- GL setup ---------------------------------------------------------
    const gl = (cv.getContext('webgl', { alpha: false, antialias: false, depth: false }) ||
      cv.getContext('experimental-webgl', { alpha: false })) as WebGLRenderingContext | null

    let W = 0, H = 0, SCALE = 0.6
    let texW = -1, texH = -1
    let prog: WebGLProgram | null = null
    let tex: WebGLTexture | null = null
    const U: Record<string, WebGLUniformLocation | null> = {}
    let ctx2d: CanvasRenderingContext2D | null = null

    function measure() {
      const r = host!.getBoundingClientRect()
      W = Math.max(1, Math.round(r.width))
      H = Math.max(1, Math.round(r.height))
      SCALE = W < 760 ? 0.45 : quality
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      cv!.width = Math.max(1, Math.round(W * dpr * SCALE))
      cv!.height = Math.max(1, Math.round(H * dpr * SCALE))
      cv!.style.width = W + 'px'
      cv!.style.height = H + 'px'

      HW = W < 760 ? 110 : 168
      HH = Math.max(48, Math.round(HW * (H / Math.max(1, W))))
      HH = Math.min(HH, 140)
      heights = new Float32Array(HW * HH)
      texels = new Uint8Array(HW * HH * 4)
      texW = -1; texH = -1
      if (gl) gl.viewport(0, 0, cv!.width, cv!.height)
    }

    if (gl) {
      try {
        prog = gl.createProgram()!
        gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link')
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, 'aPos')
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        for (const n of ['uField', 'uRes', 'uAspect', 'uTime', 'uMouse', 'uVel', 'uMix', 'uMixOrigin',
          'uDim', 'uDetailAmp', 'uDetailOffset', 'uParA', 'uParB']) U[n] = gl.getUniformLocation(prog, n)
        for (let i = 0; i < 4; i++) {
          U['uPalA' + i] = gl.getUniformLocation(prog, `uPalA[${i}]`)
          U['uPalB' + i] = gl.getUniformLocation(prog, `uPalB[${i}]`)
        }
        for (let i = 0; i < 3; i++) U['uWaves' + i] = gl.getUniformLocation(prog, `uWaves[${i}]`)

        tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.uniform1i(U.uField!, 0)
      } catch (err) {
        prog = null
      }
    }
    if (!prog) ctx2d = cv.getContext('2d')

    measure()
    buildHeights()

    // ---- 2D fallback: same heightmap, simple shading ----------------------
    function draw2D() {
      if (!ctx2d) return
      const img = ctx2d.createImageData(HW, HH)
      const a = THEMES[themeA], b = THEMES[themeB]
      const pal = [0, 1, 2, 3].map((i) => lerpRGB(a.palette[i], b.palette[i], mix))
      for (let k = 0; k < HW * HH; k++) {
        const e = heights[k]
        let c: number[]
        if (e < 0.34) c = lerpRGB(pal[0], pal[1], e / 0.34)
        else if (e < 0.67) c = lerpRGB(pal[1], pal[2], (e - 0.34) / 0.33)
        else c = lerpRGB(pal[2], pal[3], (e - 0.67) / 0.33)
        const gx = (texels[k * 4 + 1] / 255 - 0.5) * 2
        const sh = 0.55 + 0.75 * Math.max(0, 0.6 - gx)
        const o = k * 4
        img.data[o] = Math.min(255, c[0] * sh * DIM)
        img.data[o + 1] = Math.min(255, c[1] * sh * DIM)
        img.data[o + 2] = Math.min(255, c[2] * sh * DIM)
        img.data[o + 3] = 255
      }
      const off = document.createElement('canvas')
      off.width = HW; off.height = HH
      off.getContext('2d')!.putImageData(img, 0, 0)
      ctx2d.imageSmoothingEnabled = true
      ctx2d.drawImage(off, 0, 0, cv!.width, cv!.height)
    }

    function drawGL() {
      if (!gl || !prog) return
      const a = THEMES[themeA], b = THEMES[themeB]
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      // allocate once per size, then stream — texImage2D every frame reallocates
      if (texW !== HW || texH !== HH) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, HW, HH, 0, gl.RGBA, gl.UNSIGNED_BYTE, texels)
        texW = HW; texH = HH
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, HW, HH, gl.RGBA, gl.UNSIGNED_BYTE, texels)
      }

      gl.uniform2f(U.uRes!, cv!.width, cv!.height)
      gl.uniform1f(U.uAspect!, W / Math.max(1, H))
      gl.uniform1f(U.uTime!, phase)
      gl.uniform2f(U.uMouse!, ptr.x, 1 - ptr.y)
      gl.uniform1f(U.uVel!, ptr.vel)
      gl.uniform1f(U.uMix!, mix)
      gl.uniform2f(U.uMixOrigin!, mixOrigin[0], 1 - mixOrigin[1])
      gl.uniform1f(U.uDim!, DIM)
      gl.uniform1f(U.uDetailAmp!, 0.085 + ptr.vel * 0.12)
      gl.uniform2f(U.uDetailOffset!, phase * 0.012, phase * 0.008)
      for (let i = 0; i < 4; i++) {
        gl.uniform3f(U['uPalA' + i]!, a.palette[i][0], a.palette[i][1], a.palette[i][2])
        gl.uniform3f(U['uPalB' + i]!, b.palette[i][0], b.palette[i][1], b.palette[i][2])
      }
      gl.uniform4f(U.uParA!, a.warp, a.ridge, a.contour, a.light)
      gl.uniform4f(U.uParB!, b.warp, b.ridge, b.contour, b.light)
      for (let i = 0; i < 3; i++) {
        const w = waves[i]
        gl.uniform3f(U['uWaves' + i]!, w.x, 1 - w.y, w.age)
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const render = () => { if (prog) drawGL(); else draw2D() }

    // ---- theme change -----------------------------------------------------
    function changeTheme(ox: number, oy: number) {
      // commit whatever we were mid-way to, then pick a different destination
      themeA = themeB
      seedA = seedB
      let next = themeB
      for (let i = 0; i < 8 && next === themeB; i++) next = Math.floor(Math.random() * THEMES.length)
      themeB = next
      seedB = seedA + 6 + Math.random() * 20
      mix = 0
      mixOrigin = [ox, oy]
      landscape.epoch++
      const free = waves.find((w) => w.age >= 1) || waves[0]
      free.x = ox; free.y = oy; free.age = 0
    }

    // ---- events -----------------------------------------------------------
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      const x = (e.clientX - r.left) / Math.max(1, r.width)
      const y = (e.clientY - r.top) / Math.max(1, r.height)
      const now = performance.now()
      if (ptr.lt) {
        const dt = Math.max(8, now - ptr.lt)
        const dist = Math.hypot(x - ptr.lx, y - ptr.ly)
        ptr.raw = Math.min(1, (dist / dt) * 900)
      }
      ptr.lx = x; ptr.ly = y; ptr.lt = now
      ptr.x = x; ptr.y = y; ptr.inside = true
    }
    const onLeave = () => { ptr.inside = false; ptr.raw = 0 }
    const onDown = (e: PointerEvent) => {
      // A click on a link or button is navigation, not a request to re-generate
      // the terrain — the page transition would swallow the new theme anyway.
      if ((e.target as HTMLElement)?.closest?.('a,button,input,select,textarea,[role="button"]')) return
      const r = cv.getBoundingClientRect()
      changeTheme((e.clientX - r.left) / Math.max(1, r.width), (e.clientY - r.top) / Math.max(1, r.height))
    }

    // The band's content wrapper sits above this canvas, so pointer events over
    // the headline never reach the host. Listen on the band and let them bubble.
    const band = (host.closest('.dark-band') as HTMLElement) || host
    if (!reduce) {
      band.addEventListener('pointermove', onMove)
      band.addEventListener('pointerleave', onLeave)
      band.addEventListener('pointerdown', onDown)
    }

    // ---- loop -------------------------------------------------------------
    let raf = 0, running = false, visible = true, frame = 0, idle = 0
    // Adaptive quality. The terrain is a backdrop: if a device cannot hold a
    // reasonable frame rate, drop resolution rather than stuttering the page.
    let lastT = 0, avgMs = 16, slow = 0

    function tick() {
      if (!running) return
      frame++

      const now = performance.now()
      if (lastT) avgMs += ((now - lastT) - avgMs) * 0.05
      lastT = now
      if (avgMs > 30 && quality > 0.28) {
        if (++slow > 25) {
          slow = 0
          quality = Math.max(0.28, quality - (avgMs > 80 ? 0.2 : 0.1))
          measure(); buildHeights()
        }
      } else slow = 0
      // pointer speed decays; everything downstream reads the smoothed value
      ptr.raw *= 0.92
      ptr.vel += (ptr.raw - ptr.vel) * 0.12
      if (ptr.vel < 0.001) ptr.vel = 0
      phase += 0.016 * (1 + ptr.vel * 2.2)

      if (mix < 1) mix = Math.min(1, mix + 0.014)
      for (const w of waves) if (w.age < 1) w.age = Math.min(1, w.age + 0.012)

      // Drift to a new theme on its own every ~24s, so a visitor who never moves
      // the pointer still sees the landscape evolve (and the swarm re-search).
      idle = mix < 1 ? 0 : idle + 1
      if (idle > 1450) { idle = 0; changeTheme(0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7) }

      // during a transition the shape is actually changing, so rebuild more often
      if (frame % 3 === 0 || (mix < 1 && frame % 2 === 0)) buildHeights()
      render()
      raf = requestAnimationFrame(tick)
    }
    function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(tick) } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0 }

    render()

    let rt = 0
    const onResize = () => {
      clearTimeout(rt)
      rt = window.setTimeout(() => { measure(); buildHeights(); render() }, 150) as unknown as number
    }
    window.addEventListener('resize', onResize)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(host)

    const io = new IntersectionObserver((en) => {
      visible = en.some((x) => x.isIntersecting)
      if (visible && !document.hidden) start(); else stop()
    }, { threshold: 0.01 })
    io.observe(host)

    const onVis = () => { if (document.hidden) stop(); else if (visible) start() }
    document.addEventListener('visibilitychange', onVis)

    const onLost = (e: Event) => { e.preventDefault(); stop() }
    cv.addEventListener('webglcontextlost', onLost)

    return () => {
      stop()
      clearTimeout(rt)
      io.disconnect(); ro?.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      cv.removeEventListener('webglcontextlost', onLost)
      band.removeEventListener('pointermove', onMove)
      band.removeEventListener('pointerleave', onLeave)
      band.removeEventListener('pointerdown', onDown)
    }
  }, [variant])

  return (
    <div
      ref={hostRef}
      className={className}
      aria-hidden="true"
      style={{ ...s('position:absolute;inset:0;overflow:hidden;background:#07060f'), ...(style || {}) }}
    >
      <canvas ref={cvRef} style={s('position:absolute;inset:0;display:block')} />
    </div>
  )
}
