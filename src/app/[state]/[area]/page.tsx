import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStateData, getAreaParams } from '@/lib/data'
import { toSlug, areaFromSlug } from '@/lib/slugs'
import { toSlimAttorney, toSlimFirm } from '@/lib/slim'
import { AttorneyCard, FirmCard } from '@/components/ResultCards'

interface Props { params: Promise<{ state: string; area: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  return getAreaParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, area } = await params
  const areaName = areaFromSlug(area)
  const data = getStateData(state)
  if (!areaName || !data) return {}
  return {
    title: `${areaName} Lawyers in ${data.state} | US Lawyer List`,
    description: `Find ${areaName.toLowerCase()} attorneys and law firms in ${data.state}. Browse profiles, contact details, and reviews on US Lawyer List.`,
  }
}

export default async function StateAreaPage({ params }: Props) {
  const { state: stateSlug, area: areaSlug } = await params
  const areaName = areaFromSlug(areaSlug)
  const data = getStateData(stateSlug)
  if (!areaName || !data) notFound()

  const attorneys = data.attorneys
    .filter(a => a.official_practice_area.includes(areaName))
    .map(toSlimAttorney)
  const firms = data.firms
    .filter(f => f.official_practice_area.includes(areaName))
    .map(f => toSlimFirm(f, stateSlug))

  // Cities with results for this area — crawlable links to the city pages.
  const cities = Array.from(new Set(
    [...attorneys, ...firms].map(r => r.city).filter((c): c is string => Boolean(c) && !/^\d/.test(c!))
  )).sort()

  const total = attorneys.length + firms.length

  return (
    <div>
      <div className="archive-header">
        <div className="container">
          <nav className="sl-breadcrumb sl-breadcrumb--light" aria-label="Breadcrumb">
            <Link prefetch={false} href="/" className="sl-breadcrumb-link">US Lawyer List</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <Link prefetch={false} href={`/${stateSlug}`} className="sl-breadcrumb-link">{data.state}</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <span>{areaName}</span>
          </nav>
          <h1>{areaName} Lawyers in {data.state}</h1>
          <p className="archive-header-sub">
            {attorneys.length.toLocaleString()} attorneys · {firms.length.toLocaleString()} law firms
          </p>
        </div>
      </div>

      <div className="archive-body">
        <div className="container">
          <div className="archive-layout">
            <aside className="archive-sidebar">
              {cities.length > 0 && (
                <div className="sp-sidebar-card">
                  <h3>By City</h3>
                  <ul className="sidebar-scroll-list">
                    {cities.map(c => (
                      <li key={c} className="sidebar-list-item">
                        <Link prefetch={false} href={`/${stateSlug}/${areaSlug}/${toSlug(c)}`} className="sidebar-filter-link">
                          {c}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            <div>
              {total === 0 ? (
                <div className="attorneys-no-results">
                  <p>No {areaName} lawyers found in {data.state}.</p>
                </div>
              ) : (
                <>
                  <div className="archive-results-header">
                    <p className="arc-count">
                      <strong>{total.toLocaleString()}</strong> results · {areaName} · {data.state}
                    </p>
                  </div>

                  {attorneys.length > 0 && (
                    <div className="lawyer-list">
                      {attorneys.slice(0, 20).map(a => (
                        <AttorneyCard key={a.slug} attorney={a} stateSlug={stateSlug} />
                      ))}
                    </div>
                  )}

                  {firms.length > 0 && (
                    <>
                      <div className="results-separator">
                        <span>{areaName} Law Firms in {data.state}</span>
                      </div>
                      <div className="lawyer-list">
                        {firms.slice(0, 10).map(f => (
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
