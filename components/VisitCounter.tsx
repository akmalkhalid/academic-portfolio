'use client'

// Cookie-free visit ping. Client-only (runs in useEffect), so it never touches
// browser globals during the server build — fixes the `location is not defined`
// prerender crash. Fires on first load and on every client-side route change,
// and honours Do-Not-Track / Global Privacy Control.
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const COUNTER_ENDPOINT = 'https://akmal-counter.akmal-counter.workers.dev'

export default function VisitCounter() {
  const pathname = usePathname()
  useEffect(() => {
    if (!COUNTER_ENDPOINT) return
    const dnt =
      (navigator as any).doNotTrack === '1' ||
      (window as any).doNotTrack === '1' ||
      (navigator as any).globalPrivacyControl === true
    if (dnt) return
    fetch(COUNTER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname || location.pathname, referrer: document.referrer }),
    }).catch(() => {})
  }, [pathname])
  return null
}
