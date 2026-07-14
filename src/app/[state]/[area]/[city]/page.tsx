import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStateData, getAreaCityParams, cityFromSlug } from '@/lib/data'
import { toSlug, areaFromSlug } from '@/lib/slugs'
import { toSlimAttorney, toSlimFirm } from '@/lib/slim'
import { AttorneyCard, FirmCard } from '@/components/ResultCards'
import { OFFICIAL_PRACTICE_AREAS } from '@/lib/practice-areas'
import type { SlimFirm } from '@/types'

interface Props { params: Promise<{ state: string; area: string; city: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  return getAreaCityParams()
}

const RADIUS_MILES = 150

function haversinemiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, area, city } = await params
  const areaName = areaFromSlug(area)
  const data = getStateData(state)
  if (!areaName || !data) return {}
  const cityName = cityFromSlug(data, city)
  if (!cityName) return {}
  return {
    title: `${areaName} Lawyers in ${cityName}, ${data.state_abbr} | US Lawyer List`,
    description: `Compare ${areaName.toLowerCase()} attorneys and law firms in ${cityName}, ${data.state}. Browse profiles and contact details on US Lawyer List.`,
  }
}

export default async function StateAreaCityPage({ params }: Props) {
  const { state: stateSlug, area: areaSlug, city: citySlug } = await params
  const areaName = areaFromSlug(areaSlug)
  const data = getStateData(stateSlug)
  if (!areaName || !data) notFound()
  const cityName = cityFromSlug(data, citySlug)
  if (!cityName) notFound()

  const cityQ = cityName.toLowerCase()

  const attorneys = data.attorneys
    .filter(a => a.official_practice_area.includes(areaName) &&
                 a.location.city?.toLowerCase() === cityQ)
    .map(toSlimAttorney)

  const practiceFirms = data.firms
    .filter(f => f.official_practice_area.includes(areaName))
    .map(f => toSlimFirm(f, stateSlug))

  // Same exact/nearby split the query-param results page uses.
  let refLat: number | null = null
  let refLng: number | null = null
  outer: for (const f of practiceFirms) {
    if (f.city?.toLowerCase() === cityQ && f.lat && f.lng) {
      refLat = f.lat; refLng = f.lng; break outer
    }
    for (const l of f.locs) {
      if (l.city?.toLowerCase() === cityQ && l.lat && l.lng) {
        refLat = l.lat; refLng = l.lng; break outer
      }
    }
  }
  const isExact = (f: SlimFirm) =>
    f.city?.toLowerCase() === cityQ || f.locs.some(l => l.city?.toLowerCase() === cityQ)
  const isNearby = (f: SlimFirm) => {
    if (refLat === null || refLng === null) return false
    if (f.lat && f.lng && haversinemiles(refLat, refLng, f.lat, f.lng) <= RADIUS_MILES) return true
    return f.locs.some(l => l.lat && l.lng && haversinemiles(refLat!, refLng!, l.lat, l.lng) <= RADIUS_MILES)
  }
  const exactFirms = practiceFirms.filter(isExact)
  const nearbyFirms = practiceFirms.filter(f => !isExact(f) && isNearby(f))

  const total = attorneys.length + exactFirms.length
  const otherAreas = OFFICIAL_PRACTICE_AREAS.filter(a => a !== areaName)

  return (
    <div>
      <div className="archive-header">
        <div className="container">
          <nav className="sl-breadcrumb sl-breadcrumb--light" aria-label="Breadcrumb">
            <Link prefetch={false} href="/" className="sl-breadcrumb-link">US Lawyer List</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <Link prefetch={false} href={`/${stateSlug}`} className="sl-breadcrumb-link">{data.state}</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <Link prefetch={false} href={`/${stateSlug}/${areaSlug}`} className="sl-breadcrumb-link">{areaName}</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <span>{cityName}</span>
          </nav>
          <h1>{areaName} Lawyers in {cityName}, {data.state_abbr}</h1>
          <p className="archive-header-sub">
            {total.toLocaleString()} results in {cityName}
          </p>
        </div>
      </div>

      <div className="archive-body">
        <div className="container">
          <div className="archive-layout">
            <aside className="archive-sidebar">
              <div className="sp-sidebar-card">
                <h3>Other Legal Issues in {cityName}</h3>
                <ul className="sidebar-scroll-list">
                  {otherAreas.map(a => (
                    <li key={a} className="sidebar-list-item">
                      <Link prefetch={false} href={`/${stateSlug}/${toSlug(a)}`} className="sidebar-filter-link">
                        {a}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div>
              {total === 0 && nearbyFirms.length === 0 ? (
                <div className="attorneys-no-results">
                  <p>No {areaName} lawyers found in {cityName}.</p>
                  <br />
                  <Link prefetch={false} href={`/${stateSlug}/${areaSlug}`} className="btn-notfound-primary">
                    All {areaName} lawyers in {data.state}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="archive-results-header">
                    <p className="arc-count">
                      <strong>{total.toLocaleString()}</strong> results · {areaName} · {cityName}, {data.state_abbr}
                    </p>
                  </div>

                  {attorneys.length > 0 && (
                    <div className="lawyer-list">
                      {attorneys.slice(0, 20).map(a => (
                        <AttorneyCard key={a.slug} attorney={a} stateSlug={stateSlug} />
                      ))}
                    </div>
                  )}

                  {exactFirms.length > 0 && (
                    <>
                      <div className="results-separator">
                        <span>{areaName} Law Firms in {cityName}</span>
                      </div>
                      <div className="lawyer-list">
                        {exactFirms.slice(0, 10).map(f => (
                          <FirmCard key={f.slug} firm={f} stateSlug={stateSlug} />
                        ))}
                      </div>
                    </>
                  )}

                  {nearbyFirms.length > 0 && (
                    <>
                      <div className="results-separator">
                        <span>Also within {RADIUS_MILES} miles of {cityName}</span>
                      </div>
                      <div className="lawyer-list">
                        {nearbyFirms.slice(0, 10).map(f => (
                          <FirmCard key={f.slug} firm={f} stateSlug={stateSlug} />
                        ))}
                      </div>
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
