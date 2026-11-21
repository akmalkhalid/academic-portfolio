'use client'

// MovedTo — a tiny forwarding page for an address that has been folded into another page.
// GitHub Pages cannot send real redirects, so this does the next best thing:
//   1. JavaScript replaces the address at once (keeps the Back button clean);
//   2. a <meta refresh> does the same for visitors without JavaScript;
//   3. a plain link is shown in case both are blocked.
// The page using it should also set robots: noindex and a canonical link (see
// app/publications/page.tsx), so search engines index the new address only.

import { useEffect } from 'react'

export default function MovedTo({ to, label }: { to: string; label: string }) {
  useEffect(() => { window.location.replace(to) }, [to])
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '140px 28px 120px' }}>
      <meta httpEquiv="refresh" content={`0; url=${to}`} />
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a39a8f', margin: '0 0 12px' }}>This page has moved</p>
      <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize: 30, letterSpacing: '-.02em', margin: '0 0 14px' }}>{label}</h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: '#57514b', margin: 0 }}>Taking you there now. If nothing happens, <a href={to}>open it here</a>.</p>
    </main>
  )
}
