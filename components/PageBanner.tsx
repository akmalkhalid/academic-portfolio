'use client'

// Compact dark banner used at the head of every top-level page, so the whole
// site opens in the same register as the home hero rather than only the landing
// page feeling redesigned. Same simulation engine as the hero, dimmed and
// without the telemetry readout.
//
// Deliberately NOT applied to detail routes (/publications/<slug>, /demos/<x>):
// those are reading surfaces and keep the quiet cream header. SiteNav's DARK_TOP
// set must stay in step with wherever this component is used.

import type { ReactNode } from 'react'
import HeroSim from './HeroSim'

export default function PageBanner({
  eyebrow,
  title,
  kicker,
  lede,
  aside,
  children,
}: {
  eyebrow: ReactNode
  title: ReactNode
  /** Optional second line under the title — a role, a subtitle, a qualifier. */
  kicker?: ReactNode
  lede?: ReactNode
  /** Optional right-hand column (a portrait, a card). Stacks under 940px. */
  aside?: ReactNode
  /** Optional action row rendered under the lede (links, anchor nav, buttons). */
  children?: ReactNode
}) {
  return (
    <section className="dark-band" data-dark-band="1">
      <HeroSim variant="banner" hud={false} />
      <div className={'band-inner banner-inner' + (aside ? ' banner-split' : '')}>
        <div className="hero-in" style={{ minWidth: 0 }}>
          <p className="banner-eyebrow">{eyebrow}</p>
          <h1 className="banner-title">{title}</h1>
          {kicker ? <p className="banner-kicker">{kicker}</p> : null}
          {lede ? <p className="banner-lede">{lede}</p> : null}
          {children ? <div className="banner-actions">{children}</div> : null}
        </div>
        {aside ? <div className="banner-aside">{aside}</div> : null}
      </div>
    </section>
  )
}
