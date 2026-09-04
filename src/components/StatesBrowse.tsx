'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toSlug, areaFromSlug } from '@/lib/slugs'
import type { Index } from '@/types'

interface Props {
  index: Index
  kind: 'attorney' | 'firm'
}

// Client-side only so a retired ?area= link can be bounced in the browser on
// the statically exported site — no query param changes what this renders.
// The param-less variant below is what gets prerendered into the static HTML.
export default function StatesBrowseWithParams({ index, kind }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const area = searchParams.get('area') ?? undefined

  // ?area= is retired in favour of /attorneys/{area}. Bounce the old URLs
  // there when they name a real practice area; anything else just falls
  // through to the unfiltered browse page rather than a 404.
  const areaSlug = area && areaFromSlug(toSlug(area)) ? toSlug(area) : null
  useEffect(() => {
    if (areaSlug) router.replace(`/attorneys/${areaSlug}`)
  }, [areaSlug, router])

  return <StatesBrowse index={index} kind={kind} />
}

export function StatesBrowse({ index, kind }: Props) {
  const isAttorney = kind === 'attorney'
  const states = index.states

  return (
    <div>
      <div className="archive-header">
        <div className="container">
          <h1>{isAttorney ? 'Find an Attorney' : 'Find a Law Firm'}</h1>
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
            <p className="arc-count">Browse {isAttorney ? 'attorneys' : 'law firms'} by state — <strong>{states.length}</strong> states</p>
          </div>

          <div className="states-grid">
            {states.map(s => {
              const slug = s.file.replace('.json', '')
              return (
                <Link prefetch={false} key={slug} href={`/${slug}`} className="state-card">
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
        </div>
      </div>
    </div>
  )
}
