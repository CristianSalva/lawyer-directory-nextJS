import Link from 'next/link'
import { toSlug, cityMatchesSlug } from '@/lib/slugs'
import { toSlimAttorney, toSlimFirm } from '@/lib/slim'
import { AttorneyCard, FirmCard } from '@/components/ResultCards'
import type { StateData } from '@/types'

// City hub at /{state}/{city} — the landing page for "lawyers in {city}".
// Rendered by [state]/[area]/page.tsx when the slug is a city, not an area.
export default function CityPage({
  stateSlug, data, citySlug, cityName,
}: { stateSlug: string; data: StateData; citySlug: string; cityName: string }) {
  const attorneys = data.attorneys
    .filter(a => cityMatchesSlug(a.location.city, citySlug))
    .map(toSlimAttorney)
  const firms = data.firms
    .filter(f => cityMatchesSlug(f.location.city, citySlug))
    .map(f => toSlimFirm(f, stateSlug))

  // Only areas with a record in this city, so every sidebar link lands on a
  // real /{state}/{area}/{city} page instead of an empty one.
  const areas = Array.from(new Set(
    [...attorneys, ...firms].flatMap(r => r.official)
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
            <span>{cityName}</span>
          </nav>
          <h1>Lawyers in {cityName}, {data.state_abbr}</h1>
          <p className="archive-header-sub">
            {attorneys.length.toLocaleString()} attorneys · {firms.length.toLocaleString()} law firms
          </p>
        </div>
      </div>

      <div className="archive-body">
        <div className="container">
          <div className="archive-layout">
            <aside className="archive-sidebar">
              {areas.length > 0 && (
                <div className="sp-sidebar-card">
                  <h3>Legal Issues in {cityName}</h3>
                  <ul className="sidebar-scroll-list">
                    {areas.map(a => (
                      <li key={a} className="sidebar-list-item">
                        <Link prefetch={false} href={`/${stateSlug}/${toSlug(a)}/${citySlug}`} className="sidebar-filter-link">
                          {a}
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
                  <p>No lawyers found in {cityName}.</p>
                  <br />
                  <Link prefetch={false} href={`/${stateSlug}`} className="btn-notfound-primary">
                    All {data.state} lawyers
                  </Link>
                </div>
              ) : (
                <>
                  <div className="archive-results-header">
                    <p className="arc-count">
                      <strong>{total.toLocaleString()}</strong> results · {cityName}, {data.state_abbr}
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
                        <span>Law Firms in {cityName}</span>
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
