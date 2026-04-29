import Link from 'next/link'
import { getIndex } from '@/lib/data'

interface Props { searchParams: Promise<{ location?: string; area?: string }> }

export default async function AttorneysPage({ searchParams }: Props) {
  const { location, area } = await searchParams
  const index = getIndex()

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

  const areaParam = areaQuery ? `?area=${encodeURIComponent(area!)}&type=attorney` : '?type=attorney'
  const hasFilters = Boolean(locQuery || areaQuery)

  return (
    <div>
      <div className="archive-header">
        <div className="container">
          <h1>{areaQuery ? `${area} Attorneys` : 'Find an Attorney'}</h1>
          <p className="archive-header-sub">
            {index.total_attorneys.toLocaleString()} attorneys · {index.total_firms.toLocaleString()} firms · {index.state_count} states
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
                <Link href="/attorneys" className="llc-view-btn">Clear filters</Link>
              </p>
            ) : (
              <p className="arc-count">Browse attorneys by state — <strong>{filtered.length}</strong> states</p>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="attorneys-no-results">
              <p>No states matched <strong>&ldquo;{location}&rdquo;</strong>. Try a full state name like <strong>California</strong> or <strong>New York</strong>.</p>
              <br />
              <Link href="/attorneys" className="btn-notfound-primary">Browse all states</Link>
            </div>
          ) : (
            <div className="states-grid">
              {filtered.map(s => {
                const slug = s.file.replace('.json', '')
                return (
                  <Link key={slug} href={`/${slug}${areaParam}`} className="state-card">
                    <p className="state-card-name">{s.state}</p>
                    <p className="state-card-count">
                      {s.attorney_count.toLocaleString()} attorneys · {s.firm_count.toLocaleString()} firms
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
