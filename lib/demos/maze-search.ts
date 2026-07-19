// Breadth-first search over a perfect maze — floods outward from the start
// (teal) until it reaches the exit (coral), then traces the shortest path.
// Ported from the home optimization-pillar canvas. A stand-in for search.
import type { DemoFactory } from './types'

export const createMazeSearch: DemoFactory = () => {
  let W = 0
  let H = 0
  let cs = 0
  let cols = 0
  let rows = 0
  type Cell = { n: boolean; e: boolean; s: boolean; w: boolean; v: boolean; bfs: boolean }
  let cells: Cell[] = []
  let queue: number[] = []
  let parent: number[] = []
  let path: number[] | null = null
  let phase: 'search' | 'path' = 'search'
  let exitIdx = 0
  let visitedOrder: number[] = []
  let pathDraw = 0
  let holdT = 0
  const idx = (x: number, y: number) => y * cols + x

  const build = () => {
    cs = Math.max(13, Math.floor(W / 22))
    cols = Math.max(4, Math.floor((W - 2) / cs))
    rows = Math.max(3, Math.floor((H - 2) / cs))
    cells = []
    for (let i = 0; i < cols * rows; i++) cells.push({ n: true, e: true, s: true, w: true, v: false, bfs: false })
    const stack = [0]
    cells[0].v = true
    let count = 1
    const total = cols * rows
    while (count < total) {
      const cur = stack[stack.length - 1]
      const cx = cur % cols
      const cy = (cur / cols) | 0
      const nb: [number, 'n' | 'e' | 's' | 'w', 'n' | 'e' | 's' | 'w'][] = []
      if (cy > 0 && !cells[idx(cx, cy - 1)].v) nb.push([idx(cx, cy - 1), 'n', 's'])
      if (cx < cols - 1 && !cells[idx(cx + 1, cy)].v) nb.push([idx(cx + 1, cy), 'e', 'w'])
      if (cy < rows - 1 && !cells[idx(cx, cy + 1)].v) nb.push([idx(cx, cy + 1), 's', 'n'])
      if (cx > 0 && !cells[idx(cx - 1, cy)].v) nb.push([idx(cx - 1, cy), 'w', 'e'])
      if (nb.length) {
        const [ni, wa, wb] = nb[(Math.random() * nb.length) | 0]
        cells[cur][wa] = false
        cells[ni][wb] = false
        cells[ni].v = true
        stack.push(ni)
        count++
      } else stack.pop()
    }
    queue = [0]
    cells[0].bfs = true
    parent = new Array(cols * rows).fill(-1)
    exitIdx = cols * rows - 1
    path = null
    phase = 'search'
    visitedOrder = []
    pathDraw = 0
    holdT = 0
  }

  const openNb = (i: number) => {
    const x = i % cols
    const y = (i / cols) | 0
    const c = cells[i]
    const r: number[] = []
    if (!c.n) r.push(idx(x, y - 1))
    if (!c.e) r.push(idx(x + 1, y))
    if (!c.s) r.push(idx(x, y + 1))
    if (!c.w) r.push(idx(x - 1, y))
    return r
  }

  const stepBFS = (k: number) => {
    for (let st = 0; st < k && queue.length; st++) {
      const cur = queue.shift()!
      if (cur === exitIdx) {
        path = []
        let p = cur
        while (p !== -1) {
          path.push(p)
          p = parent[p]
        }
        phase = 'path'
        return
      }
      for (const nb of openNb(cur)) {
        if (!cells[nb].bfs) {
          cells[nb].bfs = true
          parent[nb] = cur
          queue.push(nb)
          visitedOrder.push(nb)
        }
      }
    }
  }

  return {
    resize(w, h) {
      W = w
      H = h
      build()
    },
    step() {
      if (phase === 'search') stepBFS(2)
      else if (phase === 'path') {
        if (pathDraw < path!.length) pathDraw += 1
        else {
          holdT++
          if (holdT > 150) build()
        }
      }
    },
    draw(ctx) {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0c1614'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(77,141,240,0.13)'
      for (const i of visitedOrder) {
        const x = i % cols
        const y = (i / cols) | 0
        ctx.fillRect(1 + x * cs, 1 + y * cs, cs, cs)
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'
      ctx.lineWidth = 1.4
      for (let i = 0; i < cells.length; i++) {
        const x = i % cols
        const y = (i / cols) | 0
        const px = 1 + x * cs
        const py = 1 + y * cs
        const c = cells[i]
        ctx.beginPath()
        if (c.n) { ctx.moveTo(px, py); ctx.lineTo(px + cs, py) }
        if (c.w) { ctx.moveTo(px, py); ctx.lineTo(px, py + cs) }
        if (c.e) { ctx.moveTo(px + cs, py); ctx.lineTo(px + cs, py + cs) }
        if (c.s) { ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py + cs) }
        ctx.stroke()
      }
      ctx.fillStyle = '#21b3a0'
      ctx.fillRect(1 + cs * 0.28, 1 + cs * 0.28, cs * 0.44, cs * 0.44)
      const ex = exitIdx % cols
      const ey = (exitIdx / cols) | 0
      ctx.fillStyle = '#f2683f'
      ctx.fillRect(1 + ex * cs + cs * 0.28, 1 + ey * cs + cs * 0.28, cs * 0.44, cs * 0.44)
      if (path) {
        ctx.strokeStyle = '#4d8df0'
        ctx.lineWidth = Math.max(2.4, cs * 0.2)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        const n = Math.min(pathDraw, path.length)
        for (let k = 0; k < n; k++) {
          const i = path[path.length - 1 - k]
          const x = i % cols
          const y = (i / cols) | 0
          const cxp = 1 + x * cs + cs / 2
          const cyp = 1 + y * cs + cs / 2
          if (k === 0) ctx.moveTo(cxp, cyp)
          else ctx.lineTo(cxp, cyp)
        }
        ctx.stroke()
      }
    },
    reset: build,
    resetLabel: 'New maze',
    stats() {
      return [
        { label: 'FRONTIER', value: String(queue.length) },
        { label: 'VISITED', value: String(visitedOrder.length) },
      ]
    },
    settle() {
      let guard = 0
      while (phase === 'search' && guard++ < 99999) stepBFS(50)
      pathDraw = path ? path.length : 0
    },
  }
}
