'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Index } from '@/types'

interface Props {
  index: Index
  kind: 'attorney' | 'firm'
}

// Client-side because ?location= / ?area= must be read in the browser on the
// statically exported site. The param-less variant below doubles as the
// Suspense fallback (it's what gets prerendered into the static HTML).
export default function StatesBrowseWithParams({ index, kind }: Props) {
  const searchParams = useSearchParams()
  const location = searchParams.get('location') ?? undefined
  const area = searchParams.get('area') ?? undefined
  return <StatesBrowse index={index} kind={kind} location={location} area={area} />
}

export function StatesBrowse({ index, kind, location, area }: Props & { location?: string; area?: string }) {
  const isAttorney = kind === 'attorney'
  const basePath = isAttorney ? '/attorneys' : '/firms'
  const locQuery = (location ?? '').trim().toLowerCase()
  const areaQuery = (area ?? '').trim().toLowerCase()

  const filtered = index.states.filter(s => {
    const slug = s.file.replace('.json', '')
    const matchesLoc = !locQuery ||
      s.state.toLowerCase().includes(locQuery) ||
      slug.includes(locQuery.replace(/\s+/g, '-')) ||
      s.state_abbr.toLowerCase() === locQuery
    return matchesLoc
  })

  const areaParam = areaQuery
    ? `?area=${encodeURIComponent(area!)}&type=${kind}`
    : `?type=${kind}`
  const hasFilters = Boolean(locQuery || areaQuery)

  return (
    <div>
      <div className="archive-header">
        <div className="container">
          <h1>
            {areaQuery
              ? `${area} ${isAttorney ? 'Attorneys' : 'Law Firms'}`
              : isAttorney ? 'Find an Attorney' : 'Find a Law Firm'}
          </h1>
          <p className="archive-header-sub">
            {isAttorney
              ? `${index.total_attorneys.toLocaleString()} attorneys · ${index.total_firms.toLocaleString()} firms · ${index.state_count} states`
              : `${index.total_firms.toLocaleString()} law firms · ${index.total_attorneys.toLocaleString()} attorneys · ${index.state_count} states`}
          </p>
        </div>
      </div>

      <div className="archive-body">
        <div className="container">
          <div className="archive-results-header">
            {hasFilters ? (
              <p className="arc-count">
                {locQuery && <span>Showing results for <strong>{location}</strong>{areaQuery ? ` · ` : ''}</span>}
                {areaQuery && <span>Practice area: <strong>{area}</strong></span>}
                {' — '}
                <Link prefetch={false} href={basePath} className="llc-view-btn">Clear filters</Link>
              </p>
            ) : (
              <p className="arc-count">Browse {isAttorney ? 'attorneys' : 'law firms'} by state — <strong>{filtered.length}</strong> states</p>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="attorneys-no-results">
              <p>No states matched <strong>&ldquo;{location}&rdquo;</strong>. Try a full state name like <strong>California</strong> or <strong>New York</strong>.</p>
              <br />
              <Link prefetch={false} href={basePath} className="btn-notfound-primary">Browse all states</Link>
            </div>
          ) : (
            <div className="states-grid">
              {filtered.map(s => {
                const slug = s.file.replace('.json', '')
                return (
                  <Link prefetch={false} key={slug} href={`/${slug}${areaParam}`} className="state-card">
                    <p className="state-card-name">{s.state}</p>
                    <p className="state-card-count">
                      {isAttorney
                        ? `${s.attorney_count.toLocaleString()} attorneys · ${s.firm_count.toLocaleString()} firms`
                        : `${s.firm_count.toLocaleString()} firms · ${s.attorney_count.toLocaleString()} attorneys`}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
