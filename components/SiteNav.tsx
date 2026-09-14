'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { s } from '@/lib/style'

// Postgraduate is intentionally NOT in the nav — it stays a quiet page reachable
// from Teaching and the Research CTA. Add a link by appending one entry here.
const NAV = [
  { href: '/about', label: 'About' },
  { href: '/research', label: 'Research' },
  { href: '/publications', label: 'Publications' },
  { href: '/playground', label: 'Playground' },
  { href: '/teaching', label: 'Teaching' },
  { href: '/cv', label: 'CV' },
  { href: '/contact', label: 'Contact' },
]

// Routes that open on a dark banner. The nav rides transparent over them until
// the user scrolls, then settles back into the cream bar. Derived from the
// pathname (not from DOM sniffing) so server and first client paint agree and
// there is no flash of the light bar over the dark fold.
const DARK_TOP = new Set([
  '', '/about', '/research', '/publications', '/playground',
  '/teaching', '/cv', '/contact', '/postgraduate-guide',
])

export default function SiteNav({ shortName }: { shortName: string }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const clean = (pathname || '/').replace(/\/+$/, '')
  const darkTop = DARK_TOP.has(clean)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28)
    onScroll() // a reload can restore scroll position mid-page
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Opening the mobile menu always needs the solid backdrop to stay readable.
  const solid = !darkTop || scrolled || open

  return (
    <header className="nav-shell" data-solid={solid ? '1' : '0'}>
      <nav style={s('max-width:1120px;margin:0 auto;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;gap:24px;position:relative')}>
        <Link href="/" onClick={() => setOpen(false)} className="nav-brand" style={s('display:flex;align-items:center;gap:10px;text-decoration:none;color:#1c1917')}>
          <span className="nav-brand-dot" style={s('width:11px;height:11px;border-radius:50%;background:#16142e;display:inline-block')} />
          <span style={s("font-family:'JetBrains Mono',monospace;font-weight:600;font-size:14px;letter-spacing:.02em")}>{shortName}</span>
        </Link>

        {/* Desktop links */}
        <ul className="nav-desktop" style={s('display:flex;gap:26px;list-style:none;margin:0;padding:0;font-size:13.5px;color:#57514b;align-items:center')}>
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                className="nav-link"
                data-on={isActive(n.href) ? '1' : '0'}
                style={s('text-decoration:none;' + (isActive(n.href) ? 'color:#16142e;font-weight:500' : 'color:#57514b'))}
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link className="nav-cta" href="/contact" style={s("font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:500;text-decoration:none;color:#fff;background:#16142e;padding:8px 15px;border-radius:7px;border:1px solid #16142e")}>
          Collaborate
        </Link>

        {/* Mobile burger */}
        <button
          type="button"
          className="nav-burger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={s('cursor:pointer;width:40px;height:40px;border:1px solid #e7e3dd;border-radius:9px;align-items:center;justify-content:center;flex-direction:column;gap:4px;background:#fff')}
        >
          <span style={s('width:18px;height:2px;background:#1c1917')} />
          <span style={s('width:18px;height:2px;background:#1c1917')} />
          <span style={s('width:18px;height:2px;background:#1c1917')} />
        </button>

        {/* Mobile dropdown */}
        {open && (
          <ul style={s('position:absolute;top:100%;left:0;right:0;display:flex;flex-direction:column;list-style:none;background:#faf9f7;border-bottom:1px solid #e7e3dd;padding:6px 0;margin:0;box-shadow:0 14px 26px -18px rgba(28,25,23,.5);z-index:50')}>
            {NAV.concat({ href: '/contact', label: 'Collaborate' }).map((n) => (
              <li key={n.href} style={s('padding:11px 28px')}>
                <Link href={n.href} onClick={() => setOpen(false)} style={s('text-decoration:none;font-size:14px;' + (isActive(n.href) ? 'color:#16142e;font-weight:500' : 'color:#57514b'))}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  )
}
