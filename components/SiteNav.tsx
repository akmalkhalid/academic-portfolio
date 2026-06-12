// components/SiteNav.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Nav items now live here. Add a new link by appending one entry.
const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/research', label: 'Research' },
  { href: '/publications', label: 'Publications' },
  { href: '/projects', label: 'Projects' },
  { href: '/teaching', label: 'Teaching' },
  { href: '/tools', label: 'Tools' },
  { href: '/contact', label: 'Contact' },
]

export default function SiteNav({ shortName }: { shortName: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav className="relative max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
      <Link
        href="/"
        className="font-medium text-base"
        onClick={() => setOpen(false)}
      >
        {shortName}
      </Link>

      {/* Desktop links */}
      <ul className="hidden md:flex gap-6 text-sm text-stone-700">
        {NAV.map((n) => (
          <li key={n.href}>
            <Link
              href={n.href}
              className={`hover:text-indigo-600 transition ${
                isActive(n.href) ? 'text-indigo-600' : ''
              }`}
            >
              {n.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="md:hidden inline-flex items-center justify-center w-9 h-9 -mr-2 text-stone-700"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile dropdown */}
      {open && (
        <ul className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-stone-200 shadow-sm px-6 py-1 flex flex-col text-sm text-stone-700">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                onClick={() => setOpen(false)}
                className={`block py-2.5 hover:text-indigo-600 transition ${
                  isActive(n.href) ? 'text-indigo-600' : ''
                }`}
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
