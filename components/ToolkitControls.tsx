'use client'

// Small helper for the /toolkit accordion. The sections themselves are native
// <details> elements, so the page works without JavaScript; this only adds:
//   - "Expand all" / "Collapse all" buttons
//   - opening a collapsed section when you arrive via its #anchor
//     (banner jump links, or a shared link such as /toolkit/#search)
import { useEffect } from 'react'

const SELECTOR = 'details.tk-section'

function openFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1))
  if (!id) return
  const el = document.getElementById(id)
  if (el instanceof HTMLDetailsElement && el.matches(SELECTOR)) {
    el.open = true
    // Re-scroll after opening so the heading lands below the sticky nav.
    requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }))
  }
}

function setAll(open: boolean) {
  document.querySelectorAll<HTMLDetailsElement>(SELECTOR).forEach((d) => {
    d.open = open
  })
}

export default function ToolkitControls() {
  useEffect(() => {
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  return (
    <div className="tk-controls">
      <button type="button" className="tk-btn" onClick={() => setAll(true)}>
        Expand all
      </button>
      <button type="button" className="tk-btn" onClick={() => setAll(false)}>
        Collapse all
      </button>
    </div>
  )
}
