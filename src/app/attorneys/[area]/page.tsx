import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getIndex, getNationalAreaParams, getAreaStates } from '@/lib/data'
import { toSlug } from '@/lib/slugs'
import { OFFICIAL_PRACTICE_AREAS } from '@/lib/practice-areas'

interface Props { params: Promise<{ area: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  return getNationalAreaParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params
  const entry = getAreaStates(area)
  if (!entry) return {}
  return {
    title: `${entry.name} Attorneys & Law Firms | US Lawyer List`,
    description: `Browse ${entry.attorneys.toLocaleString()} ${entry.name.toLowerCase()} attorneys and ${entry.firms.toLocaleString()} law firms across ${entry.states.length} US states. Pick your state to see local results.`,
  }
}

export default async function NationalAreaPage({ params }: Props) {
  const { area: areaSlug } = await params
  const entry = getAreaStates(areaSlug)
  if (!entry) notFound()

  const index = getIndex()
  const nameBySlug = new Map(index.states.map(s => [s.file.replace('.json', ''), s]))
  const otherAreas = OFFICIAL_PRACTICE_AREAS.filter(a => a !== entry.name)

  return (
    <div>
      <div className="archive-header">
        <div className="container">
          <nav className="sl-breadcrumb sl-breadcrumb--light" aria-label="Breadcrumb">
            <Link prefetch={false} href="/" className="sl-breadcrumb-link">US Lawyer List</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <Link prefetch={false} href="/attorneys" className="sl-breadcrumb-link">Attorneys</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <span>{entry.name}</span>
          </nav>
          <h1>{entry.name} Attorneys</h1>
          <p className="archive-header-sub">
            {entry.attorneys.toLocaleString()} attorneys · {entry.firms.toLocaleString()} law firms · {entry.states.length} states
          </p>
        </div>
      </div>

      <div className="archive-body">
        <div className="container">
          <div className="archive-layout">
            <aside className="archive-sidebar">
              <div className="sp-sidebar-card">
                <h3>Other Legal Issues</h3>
                <ul className="sidebar-scroll-list">
                  {otherAreas.map(a => (
                    <li key={a} className="sidebar-list-item">
                      <Link prefetch={false} href={`/attorneys/${toSlug(a)}`} className="sidebar-filter-link">
                        {a}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div>
              <div className="archive-results-header">
                <p className="arc-count">
                  Choose a state to see {entry.name.toLowerCase()} lawyers near you
                </p>
              </div>
              <div className="states-grid">
                {entry.states.map(row => {
                  const s = nameBySlug.get(row.state)
                  if (!s) return null
                  return (
                    <Link prefetch={false} key={row.state} href={`/${row.state}/${areaSlug}`} className="state-card">
                      <p className="state-card-name">{entry.name} Lawyers in {s.state}</p>
                      <p className="state-card-count">
                        {row.attorneys.toLocaleString()} attorneys · {row.firms.toLocaleString()} firms
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
