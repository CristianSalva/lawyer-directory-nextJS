'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toSlug } from '@/lib/slugs'

const COMMON_AREAS = [
  'Car Accidents', 'Criminal Defense', 'Personal Injury', 'Family Law', 'DUI and DWI',
  'Bankruptcy', 'Divorce and Separation', 'Estate Planning', 'Immigration', "Workers' Compensation",
  'Real Estate', 'Child Custody',
]

interface Props {
  stateSlug: string
  stateName: string
  stateAbbr: string
  practiceAreas: string[]
  cities: string[]
  attorneyCount: number
  firmCount: number
}

// Nothing here reads a query string. Picking a legal issue or a city is a
// plain link to its prerendered page (/{state}/{area} or /{state}/{city}),
// so this renders identically for every visitor and every crawler.
export default function StateLanding({
  stateSlug, stateName, stateAbbr,
  practiceAreas, cities,
  attorneyCount, firmCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<'issues' | 'cities'>('issues')
  const [showAllAreas, setShowAllAreas] = useState(false)

  const sorted = [
    ...COMMON_AREAS.filter(a => practiceAreas.includes(a)),
    ...practiceAreas.filter(a => !COMMON_AREAS.includes(a)).sort(),
  ]
  const displayAreas = showAllAreas ? sorted : sorted.slice(0, 12)

  return (
    <div className="sl-page">
      <div className="sl-hero">
        <div className="container">
          <nav className="sl-breadcrumb" aria-label="Breadcrumb">
            <Link prefetch={false} href="/" className="sl-breadcrumb-link">US Lawyer List</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <span>{stateName}</span>
          </nav>

          <div className="sl-hero-card">
            <div className="sl-state-abbr">{stateAbbr}</div>
            <div className="sl-hero-text">
              <h1 className="sl-hero-title">Find a {stateName} Lawyer</h1>
              <p className="sl-hero-sub">
                Search for lawyers in {stateName} by legal issue and city.
              </p>
              <p className="sl-hero-counts">
                {attorneyCount.toLocaleString()} attorneys · {firmCount.toLocaleString()} firms · {cities.length} cities
              </p>
            </div>
          </div>

          <div className="sl-steps">
            <div className="sl-step sl-step--active">
              <div className="sl-step-num">1</div>
              <div className="sl-step-body">
                <span className="sl-step-label">Legal Issue</span>
                <span className="sl-step-hint">Select a practice area</span>
              </div>
            </div>
            <div className="sl-step-line" />
            <div className="sl-step">
              <div className="sl-step-num">2</div>
              <div className="sl-step-body">
                <span className="sl-step-label">City</span>
                <span className="sl-step-hint">Select a city</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sl-body">
        <div className="container">
          <div className="sl-tab-card">
            <div className="sl-tab-bar">
              <button
                type="button"
                className={`sl-tab-btn${activeTab === 'issues' ? ' sl-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('issues')}
              >
                Legal Issues
              </button>
              <button
                type="button"
                className={`sl-tab-btn${activeTab === 'cities' ? ' sl-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('cities')}
              >
                {stateName} Cities
              </button>
            </div>

            {/* Both tab panels stay in the HTML — the inactive one is hidden
                rather than unmounted, so the city links are crawlable on the
                prerendered page instead of orphaning /{state}/{city}. */}
            <div className="sl-tab-content" hidden={activeTab !== 'issues'}>
              <p className="sl-section-label">FREQUENTLY VIEWED LEGAL ISSUES</p>
              <div className="sl-issues-grid">
                {displayAreas.map(area => (
                  <Link
                    key={area}
                    prefetch={false}
                    href={`/${stateSlug}/${toSlug(area)}`}
                    className="sl-issue-card"
                  >
                    <svg className="sl-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" stroke="#196AC8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {area}
                  </Link>
                ))}
              </div>
              {!showAllAreas && sorted.length > 12 && (
                <button type="button" className="sl-view-all-btn" onClick={() => setShowAllAreas(true)}>
                  View All Legal Issues
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="sl-tab-content" hidden={activeTab !== 'cities'}>
              <p className="sl-section-label">{stateName.toUpperCase()} CITIES</p>
              <div className="sl-location-grid">
                {cities.map(city => (
                  <Link
                    key={city}
                    prefetch={false}
                    href={`/${stateSlug}/${toSlug(city)}`}
                    className="sl-location-item"
                  >
                    <svg className="sl-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" stroke="#196AC8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {city}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
