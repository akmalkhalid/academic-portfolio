'use client'

// PanelFX — makes every card on the site respond to the pointer in 3D.
//
// It adds NO markup. One listener on the document watches the pointer; when it is over
// a panel (see the "3D PANELS" block in app/globals.css for what counts as one), four
// CSS variables are written on that element:
//     --rx, --ry   tilt, at most 5 degrees, towards the pointer
//     --mx, --my   pointer position inside the panel, for the moving highlight
// The CSS does the rest. Leaving the panel removes the variables, so it eases back flat.
//
// Skipped on touch screens (no hover) and for visitors who ask for reduced motion.

import { useEffect } from 'react'

const PANEL = "main [style*='var(--panel)'], .fx-panel, .pillar-card, .home-stage, .bt-tile, .tk-row"
const FLAT = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SPAN']   // fields and chips stay flat
const MAX_TILT = 5

export default function PanelFX() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let live: HTMLElement | null = null
    let frame = 0

    const release = () => {
      if (!live) return
      live.classList.remove('fx-live')
      for (const v of ['--rx', '--ry', '--mx', '--my']) live.style.removeProperty(v)
      live = null
    }
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const hit = (e.target as Element | null)?.closest?.(PANEL) as HTMLElement | null
        // too small to be a card (a chip or a button)? leave it alone
        const el = hit && !FLAT.includes(hit.tagName) && hit.offsetHeight >= 64 ? hit : null
        if (el !== live) release()
        if (!el) return
        const b = el.getBoundingClientRect()
        // very large blocks (whole sections) get the highlight but no tilt
        const tilt = b.width < 760 && b.height < 620 ? MAX_TILT : 0
        const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height
        el.style.setProperty('--ry', ((px - 0.5) * 2 * tilt).toFixed(2) + 'deg')
        el.style.setProperty('--rx', ((0.5 - py) * 2 * tilt).toFixed(2) + 'deg')
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%')
        el.classList.add('fx-live')
        live = el
      })
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', release)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', release); release() }
  }, [])
  return null
}
