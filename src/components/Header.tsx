'use client'

import Link from 'next/link'
import { useState } from 'react'

const navLinks = [
  ['/', 'Home'],
  ['/attorneys', 'Find Attorneys'],
  ['/firms', 'Law Firms'],
  ['/#how-it-works', 'How It Works'],
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="main-header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="#196AC8" fillOpacity="0.12"/>
            <path d="M18 7L7 13v10l11 6 11-6V13L18 7z" fill="#196AC8"/>
            <path d="M18 7v22M7 13l11 6 11-6" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">US Lawyer List</span>
        </Link>

        <nav className="main-nav">
          {navLinks.map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">{label}</Link>
          ))}
          <Link href="/list-your-practice" className="btn-header-cta">List Your Practice</Link>
        </nav>

        <button type="button" className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          {navLinks.map(([href, label]) => (
            <Link key={href} href={href} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>{label}</Link>
          ))}
          <Link href="/list-your-practice" className="mobile-menu-cta" onClick={() => setMobileOpen(false)}>
            List Your Practice
          </Link>
        </div>
      )}
    </header>
  )
}
