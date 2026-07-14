'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AttorneyCard, FirmCard } from '@/components/ResultCards'
import { toSlug } from '@/lib/slugs'
import type { SlimFirm, SlimStateData } from '@/types'

const RADIUS_MILES = 150

function haversinemiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// One slim state file per session is plenty; cache so sidebar pivots don't refetch.
const dataCache = new Map<string, SlimStateData>()

interface Props {
  stateSlug: string
  stateName: string
  stateAbbr: string
  practiceAreas: string[]
  cities: string[]
  area: string
  city: string
  type?: string
}

export default function StateResults({
  stateSlug, stateName, stateAbbr,
  practiceAreas, cities,
  area, city, type,
}: Props) {
  const isAttorneyFlow = type === 'attorney'
  const [data, setData] = useState<SlimStateData | null>(dataCache.get(stateSlug) ?? null)

  useEffect(() => {
    if (dataCache.has(stateSlug)) {
      setData(dataCache.get(stateSlug)!)
      return
    }
    let cancelled = false
    fetch(`/data/${stateSlug}.json`)
      .then(r => r.json())
      .then((d: SlimStateData) => {
        dataCache.set(stateSlug, d)
        if (!cancelled) setData(d)
      })
      .catch(() => { if (!cancelled) setData({ attorneys: [], firms: [] }) })
    return () => { cancelled = true }
  }, [stateSlug])

  const areaQ = area.toLowerCase()
  const cityQ = city.toLowerCase()

  const typeParam = isAttorneyFlow ? '&type=attorney' : '&type=firm'
  const areaParam = `area=${encodeURIComponent(area)}`
  const cityParam = `city=${encodeURIComponent(city)}`
  const title = isAttorneyFlow
    ? `${area} Attorneys in ${city}, ${stateAbbr}`
    : `${area} Law Firms in ${city}, ${stateAbbr}`

  // Filter (mirrors the original server-side logic)
  const attorneys = data?.attorneys ?? []
  const firms = data?.firms ?? []

  let refLat: number | null = null
  let refLng: number | null = null
  outer: for (const f of firms) {
    if (f.city?.toLowerCase() === cityQ && f.lat && f.lng) {
      refLat = f.lat; refLng = f.lng; break outer
    }
    for (const l of f.locs) {
      if (l.city?.toLowerCase() === cityQ && l.lat && l.lng) {
        refLat = l.lat; refLng = l.lng; break outer
      }
    }
  }

  const exactAttorneys = attorneys.filter(a =>
    a.city?.toLowerCase() === cityQ &&
    a.official.some(p => p.toLowerCase() === areaQ)
  )

  const practiceFiltered = firms.filter(f =>
    f.official.some(p => p.toLowerCase() === areaQ)
  )

  const isExactMatch = (f: SlimFirm) =>
    f.city?.toLowerCase() === cityQ ||
    f.locs.some(l => l.city?.toLowerCase() === cityQ)

  const isWithinRadius = (f: SlimFirm) => {
    if (refLat === null || refLng === null) return false
    if (f.lat && f.lng && haversinemiles(refLat, refLng, f.lat, f.lng) <= RADIUS_MILES)
      return true
    return f.locs.some(l =>
      l.lat && l.lng &&
      haversinemiles(refLat!, refLng!, l.lat, l.lng) <= RADIUS_MILES
    )
  }

  const exactFirms  = practiceFiltered.filter(f => isExactMatch(f))
  const nearbyFirms = practiceFiltered.filter(f => !isExactMatch(f) && isWithinRadius(f))
  const farFirms    = practiceFiltered.filter(f => !isExactMatch(f) && !isWithinRadius(f))
  const totalAttorneys = exactAttorneys.length
  const totalFirms  = exactFirms.length + nearbyFirms.length + farFirms.length
  const totalCount  = isAttorneyFlow ? totalAttorneys : totalFirms
  const loading = data === null

  return (
    <div>
      <div className="archive-header">
        <div className="container">
          <nav className="sl-breadcrumb sl-breadcrumb--light" aria-label="Breadcrumb">
            <Link prefetch={false} href="/" className="sl-breadcrumb-link">US Lawyer List</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <Link prefetch={false} href={`/${stateSlug}`} className="sl-breadcrumb-link">{stateName}</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <span>{area}</span>
            <span className="sl-breadcrumb-sep">/</span>
            <span>{city}</span>
          </nav>
          <h1>{title}</h1>
          <p className="archive-header-sub">
            {loading ? '…' : `${totalCount.toLocaleString()} ${isAttorneyFlow ? 'attorneys' : 'law firms'}`}
          </p>

          <div className="sl-filter-bar">
            <span className="sl-filter-tag">
              {area}
              <Link prefetch={false} href={`/${stateSlug}?${cityParam}${typeParam}`} className="sl-filter-remove" aria-label="Remove area filter">×</Link>
            </span>
            <span className="sl-filter-tag">
              {city}
              <Link prefetch={false} href={`/${stateSlug}/${toSlug(area)}`} className="sl-filter-remove" aria-label="Remove city filter">×</Link>
            </span>
            <Link prefetch={false} href={`/${stateSlug}?${typeParam.slice(1)}`} className="sl-clear-all">Clear all</Link>
          </div>
        </div>
      </div>

      <div className="archive-body">
        <div className="container">
          <div className="archive-layout">

            <aside className="archive-sidebar">
              <div className="sp-sidebar-card">
                <h3>Change Legal Issue</h3>
                <ul className="sidebar-scroll-list">
                  {practiceAreas.map(a => (
                    <li key={a} className="sidebar-list-item">
                      <Link prefetch={false}
                        href={`/${stateSlug}/${toSlug(a)}/${toSlug(city)}`}
                        className="sidebar-filter-link"
                      >
                        {a}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sp-sidebar-card">
                <h3>Change City</h3>
                <ul className="sidebar-scroll-list">
                  {cities.map(c => (
                    <li key={c} className="sidebar-list-item">
                      <Link prefetch={false}
                        href={`/${stateSlug}/${toSlug(area)}/${toSlug(c)}`}
                        className="sidebar-filter-link"
                      >
                        {c}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div>
              {loading ? (
                <div className="archive-results-header">
                  <p className="arc-count">Loading results…</p>
                </div>
              ) : totalCount === 0 ? (
                <div className="attorneys-no-results">
                  <p>No {isAttorneyFlow ? 'attorneys' : 'law firms'} found for <strong>{area}</strong> in <strong>{city}</strong>.</p>
                  <br />
                  <Link prefetch={false} href={`/${stateSlug}/${toSlug(area)}`} className="btn-notfound-primary">Try a different city</Link>
                </div>
              ) : (
                <>
                  <div className="archive-results-header">
                    <p className="arc-count">
                      <strong>{totalCount.toLocaleString()}</strong> {isAttorneyFlow ? 'attorneys' : 'law firms'} · {area} · {city}, {stateAbbr}
                    </p>
                  </div>

                  {isAttorneyFlow ? (
                    <div className="lawyer-list">
                      {exactAttorneys.slice(0, 20).map(attorney => (
                        <AttorneyCard key={attorney.slug} attorney={attorney} stateSlug={stateSlug} />
                      ))}
                    </div>
                  ) : (
                    <>
                      {exactFirms.length > 0 && (
                        <div className="lawyer-list">
                          {exactFirms.slice(0, 10).map(firm => (
                            <FirmCard key={firm.slug} firm={firm} stateSlug={stateSlug} />
                          ))}
                        </div>
                      )}

                      {nearbyFirms.length > 0 && (
                        <>
                          <div className="results-separator">
                            <span>Also within {RADIUS_MILES} miles of {city}</span>
                          </div>
                          <div className="lawyer-list">
                            {nearbyFirms.slice(0, 10).map(firm => (
                              <FirmCard key={firm.slug} firm={firm} stateSlug={stateSlug} />
                            ))}
                          </div>
                        </>
                      )}

                      {farFirms.length > 0 && (
                        <>
                          <div className="results-separator">
                            <span>Additional results over {RADIUS_MILES} miles away</span>
                          </div>
                          <div className="lawyer-list">
                            {farFirms.slice(0, 10).map(firm => (
                              <FirmCard key={firm.slug} firm={firm} stateSlug={stateSlug} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
