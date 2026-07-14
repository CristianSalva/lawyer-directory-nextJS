'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  selectedArea?: string
  selectedCity?: string
  type?: string
}

export default function StateLanding({
  stateSlug, stateName, stateAbbr,
  practiceAreas, cities,
  attorneyCount, firmCount,
  selectedArea, selectedCity,
  type,
}: Props) {
  const typeParam = type ? `&type=${type}` : ''
  const router = useRouter()

  const isPickingLocation = Boolean(selectedArea && !selectedCity)
  const isPickingArea     = Boolean(selectedCity && !selectedArea)
  const isStep1           = !isPickingLocation && !isPickingArea

  const [activeTab, setActiveTab] = useState<'issues' | 'cities'>('issues')
  const effectiveTab: 'issues' | 'cities' = isPickingLocation ? 'cities' : isPickingArea ? 'issues' : activeTab
  const [showAllAreas, setShowAllAreas] = useState(false)

  const sorted = [
    ...COMMON_AREAS.filter(a => practiceAreas.includes(a)),
    ...practiceAreas.filter(a => !COMMON_AREAS.includes(a)).sort(),
  ]
  const displayAreas = showAllAreas ? sorted : sorted.slice(0, 12)

  // Final destinations use the prerendered SEO paths (/state/area[/city]);
  // only the intermediate city-first step still uses a query param.
  function pickCity(city: string) {
    if (selectedArea) return router.push(`/${stateSlug}/${toSlug(selectedArea)}/${toSlug(city)}`)
    router.push(`/${stateSlug}?city=${encodeURIComponent(city)}${typeParam}`)
  }

  function areaHref(area: string) {
    return selectedCity
      ? `/${stateSlug}/${toSlug(area)}/${toSlug(selectedCity)}`
      : `/${stateSlug}/${toSlug(area)}`
  }

  return (
    <div className="sl-page">
      <div className="sl-hero">
        <div className="container">
          <nav className="sl-breadcrumb" aria-label="Breadcrumb">
            <a href="/" className="sl-breadcrumb-link">US Lawyer List</a>
            <span className="sl-breadcrumb-sep">/</span>
            <a href={`/${stateSlug}`} className="sl-breadcrumb-link">{stateName}</a>
            {selectedArea && <><span className="sl-breadcrumb-sep">/</span><span>{selectedArea}</span></>}
            {selectedCity && <><span className="sl-breadcrumb-sep">/</span><span>{selectedCity}</span></>}
          </nav>

          <div className="sl-hero-card">
            <div className="sl-state-abbr">{stateAbbr}</div>
            <div className="sl-hero-text">
              <h1 className="sl-hero-title">Find a {stateName} Lawyer</h1>
              <p className="sl-hero-sub">
                {isStep1
                  ? `Search for lawyers in ${stateName} by legal issue and city.`
                  : isPickingLocation
                  ? `You selected "${selectedArea}". Now choose a city to see results.`
                  : `You selected "${selectedCity}". Now choose a legal issue to see results.`
                }
              </p>
              {isStep1 && (
                <p className="sl-hero-counts">
                  {attorneyCount.toLocaleString()} attorneys · {firmCount.toLocaleString()} firms · {cities.length} cities
                </p>
              )}
            </div>
          </div>

          <div className="sl-steps">
            <div className={`sl-step ${!isStep1 ? 'sl-step--done' : 'sl-step--active'}`}>
              <div className="sl-step-num">{!isStep1 ? '✓' : '1'}</div>
              <div className="sl-step-body">
                <span className="sl-step-label">Legal Issue</span>
                {selectedArea
                  ? <span className="sl-step-value">{selectedArea}</span>
                  : <span className="sl-step-hint">Select a practice area</span>
                }
              </div>
            </div>
            <div className="sl-step-line" />
            <div className={`sl-step ${isPickingLocation ? 'sl-step--active' : selectedCity ? 'sl-step--done' : ''}`}>
              <div className="sl-step-num">{selectedCity ? '✓' : '2'}</div>
              <div className="sl-step-body">
                <span className="sl-step-label">City</span>
                {selectedCity
                  ? <span className="sl-step-value">{selectedCity}</span>
                  : <span className="sl-step-hint">Select a city</span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sl-body">
        <div className="container">
          <div className="sl-tab-card">
            <div className="sl-tab-bar">
              {(isStep1 || isPickingArea) && (
                <button
                  type="button"
                  className={`sl-tab-btn${effectiveTab === 'issues' ? ' sl-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('issues')}
                >
                  Legal Issues
                </button>
              )}
              {(isStep1 || isPickingLocation) && (
                <button
                  type="button"
                  className={`sl-tab-btn${effectiveTab === 'cities' ? ' sl-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('cities')}
                >
                  {stateName} Cities
                </button>
              )}
            </div>

            {effectiveTab === 'issues' && (
              <div className="sl-tab-content">
                {selectedCity && (
                  <div className="sl-selected-notice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#196AC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    City selected: <strong>{selectedCity}</strong> —
                    <a href={`/${stateSlug}${type ? `?type=${type}` : ''}`} className="sl-change-link">Change</a>
                  </div>
                )}
                <p className="sl-section-label">
                  {isPickingArea ? 'NOW SELECT A LEGAL ISSUE' : 'FREQUENTLY VIEWED LEGAL ISSUES'}
                </p>
                <div className="sl-issues-grid">
                  {displayAreas.map(area => (
                    <Link
                      key={area}
                      prefetch={false}
                      href={areaHref(area)}
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
            )}

            {effectiveTab === 'cities' && (
              <div className="sl-tab-content">
                {selectedArea && (
                  <div className="sl-selected-notice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#196AC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Legal issue selected: <strong>{selectedArea}</strong> —
                    <a href={`/${stateSlug}${type ? `?type=${type}` : ''}`} className="sl-change-link">Change</a>
                  </div>
                )}
                <p className="sl-section-label">
                  {isPickingLocation ? 'NOW SELECT A CITY' : `${stateName.toUpperCase()} CITIES`}
                </p>
                <div className="sl-location-grid">
                  {cities.map(city => selectedArea ? (
                    <Link
                      key={city}
                      prefetch={false}
                      href={`/${stateSlug}/${toSlug(selectedArea)}/${toSlug(city)}`}
                      className="sl-location-item"
                    >
                      <svg className="sl-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" stroke="#196AC8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {city}
                    </Link>
                  ) : (
                    <button
                      key={city}
                      type="button"
                      className="sl-location-item"
                      onClick={() => pickCity(city)}
                    >
                      <svg className="sl-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 18l6-6-6-6" stroke="#196AC8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
