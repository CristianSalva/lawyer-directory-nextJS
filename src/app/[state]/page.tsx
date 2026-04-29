import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStateData, getAllStateSlugs } from '@/lib/data'
import StateLanding from '@/components/StateLanding'
import type { Firm, Attorney } from '@/types'

function resolveAttorneyPhoto(slug: string): string | null {
  const first = slug[0]?.toLowerCase() ?? ''
  const folder = /^\d/.test(slug) ? 'missing' : first
  const file = path.join(process.cwd(), 'photos_backup', folder, `${slug}.jpg`)
  return fs.existsSync(file) ? `/attorney-photos/${folder}/${slug}.jpg` : null
}

function resolveFirmPhoto(stateSlug: string, city: string | null, slug: string, name: string | null): string | null {
  const citySlug = (city || '').toLowerCase().replace(/\s+/g, '-').replace(/,/g, '')
  const dir = path.join(process.cwd(), 'firm_photos')
  const direct = `${stateSlug}-${citySlug}-${slug}.jpg`
  if (fs.existsSync(path.join(dir, direct))) return `/firm-photos/${direct}`
  if (name) {
    const ns = name.toLowerCase()
      .replace(/\s*&\s*/g, '--').replace(/\./g, '').replace(/,\s*/g, '-')
      .replace(/\s+/g, '-').replace(/-{3,}/g, '--').replace(/^-|-$/g, '')
    const named = `${stateSlug}-${citySlug}-${ns}.jpg`
    if (fs.existsSync(path.join(dir, named))) return `/firm-photos/${named}`
  }
  return null
}

interface Props {
  params: Promise<{ state: string }>
  searchParams: Promise<{ area?: string; city?: string; type?: string }>
}

export async function generateStaticParams() {
  return getAllStateSlugs().map((state) => ({ state }))
}

const RADIUS_MILES = 150

function haversinemiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const OFFICIAL_PRACTICE_AREAS = [
  'Administrative Law','Admiralty and Maritime','Adoption','ADR Arbitration and Mediation',
  'Agriculture','Airplane Bus and Helicopter Accidents','Animal and Dog Bites','Antitrust',
  'Asbestos Mesothelioma','Assault and Battery (Plaintiff)','Auto Dealer Fraud','Aviation',
  'Bad Faith Insurance','Banking and Finance Law','Bankruptcy','Birth Injury','Brain Injury',
  'Business and Commercial Law','Business Organizations','Cannabis Law','Car Accidents',
  'Child Custody','Child Support','Civil Rights','Class Actions','Collaborative Law',
  'Collections','Communications and Media Law','Constitutional Law','Construction',
  'Construction Accident','Consumer Protection','Contracts','Copyrights','Credit Repair',
  'Criminal Defense','Dangerous Products','Debtor and Creditor','Defamation',
  'Disability Insurance','Discrimination','Divorce and Separation','Domestic Violence',
  'Drug Crime','Drugs and Medical Devices','DUI and DWI','Education','Elder Law',
  'Election Campaign and Political Law','Eminent Domain','Employment Law (Employer)',
  'Employment Rights','Entertainment Sports and Leisure Law','Environmental Law','ERISA',
  'Estate Planning','Ethics and Professional Responsibility','Family Law',"Father's Rights",
  'Federal and White Collar Crimes','Foreclosure and Alternatives','Franchising','Gaming',
  'Government Agencies and Programs','Government Contracts','Health Care Law',
  'Housing and Construction Defects','Immigration','Insurance Defense','Insurance Law',
  'International Law','Internet','Labor Law','Land Use and Zoning','Landlord and Tenant',
  'Legal Malpractice','Lemon Law','Litigation and Appeals','Medical Malpractice',
  'Mergers and Acquisitions','Military','Military Divorce','Motor Vehicle Defects',
  'Native Peoples','Natural Resources','Nursing Home Abuse','Oil Gas and Energy','Patents',
  'Personal Injury','Personal Injury Defense','Premises Liability','Probate',
  'Professional Malpractice','Railroad Worker Injury and FELA','Real Estate','Same Sex',
  'Science and Technology Law','Securities','Sex Crime','Sexual Abuse','Sexual Harassment',
  'Social Security','Social Security Disability','State Local and Municipal Law',
  'Tax Increment Financing','Tax Law','Toxic Mold','Toxic Torts','Trademarks',
  'Traffic Ticket','Transportation','Truck Accident','Trusts',"Veteran's Benefits",
  'Wage and Hour','Whistleblower and Qui Tam','Wills',"Workers' Compensation",
  'Wrongful Death','Wrongful Termination',
]

const avatarClasses = ['llc-av-1','llc-av-2','llc-av-3','llc-av-4','llc-av-5','llc-av-6','llc-av-7','llc-av-8']
function avatarClass(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return avatarClasses[h % avatarClasses.length]
}

function FirmCard({ firm, stateSlug, avatarClass }: { firm: Firm; stateSlug: string; avatarClass: (name: string) => string }) {
  const photoUrl = resolveFirmPhoto(stateSlug, firm.location.city, firm.slug, firm.name ?? null)
    ?? (firm.profile_image_url?.startsWith('http') ? firm.profile_image_url : null)
  return (
    <div className="lawyer-card">
      {photoUrl ? (
        <img src={photoUrl} alt={firm.name ?? ''} className="llc-photo" />
      ) : (
        <div className={`llc-avatar ${avatarClass(firm.name ?? '')}`}>
          {(firm.name ?? '?').charAt(0)}
        </div>
      )}
      <div className="llc-body">
        <div className="llc-name-row">
          <Link href={`/${stateSlug}/firms/${firm.slug}`} className="llc-name">
            {firm.name}
          </Link>
          {firm.free_consultation && <span className="llc-badge llc-badge--free">Free Consultation</span>}
          {!!firm.super_lawyers && <span className="llc-badge llc-badge--sl">Super Lawyers®</span>}
        </div>
        {firm.practice_type && <p className="llc-firm">{firm.practice_type}</p>}
        <p className="llc-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#777"/>
          </svg>
          {firm.location.city}{firm.location.state ? `, ${firm.location.state}` : ''}
        </p>
        {firm.practice_areas.length > 0 && (
          <div className="llc-areas">
            {firm.practice_areas.slice(0, 4).map(a => (
              <span key={a} className="llc-area-tag">{a}</span>
            ))}
          </div>
        )}
        <div className="llc-foot">
          {firm.contact.phone && (
            <a href={`tel:${firm.contact.phone}`} className="llc-phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#424A5B"/>
              </svg>
              {firm.contact.phone}
            </a>
          )}
          <Link href={`/${stateSlug}/firms/${firm.slug}`} className="llc-view-btn">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

function AttorneyCard({ attorney, stateSlug, avatarClass }: { attorney: Attorney; stateSlug: string; avatarClass: (name: string) => string }) {
  const photoUrl = resolveAttorneyPhoto(attorney.slug) ?? (attorney.photo?.startsWith('http') ? attorney.photo : null)
  return (
    <div className="lawyer-card">
      {photoUrl ? (
        <img src={photoUrl} alt={attorney.name} className="llc-photo" />
      ) : (
        <div className={`llc-avatar ${avatarClass(attorney.name)}`}>
          {attorney.name.charAt(0)}
        </div>
      )}
      <div className="llc-body">
        <div className="llc-name-row">
          <Link href={`/${stateSlug}/attorneys/${attorney.slug}`} className="llc-name">
            {attorney.name}
          </Link>
          {attorney.free_consultation && <span className="llc-badge llc-badge--free">Free Consultation</span>}
          {!!attorney.super_lawyers && <span className="llc-badge llc-badge--sl">Super Lawyers®</span>}
        </div>
        {attorney.firm_name && <p className="llc-firm">{attorney.firm_name}</p>}
        {attorney.practice_type && <p className="llc-firm">{attorney.practice_type}</p>}
        <p className="llc-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#777"/>
          </svg>
          {attorney.location.city}{attorney.location.state ? `, ${attorney.location.state}` : ''}
        </p>
        {attorney.practice_areas.length > 0 && (
          <div className="llc-areas">
            {attorney.practice_areas.slice(0, 4).map(a => (
              <span key={a} className="llc-area-tag">{a}</span>
            ))}
          </div>
        )}
        <div className="llc-foot">
          {attorney.contact.phones[0] && (
            <a href={`tel:${attorney.contact.phones[0]}`} className="llc-phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#424A5B"/>
              </svg>
              {attorney.contact.phones[0]}
            </a>
          )}
          <Link href={`/${stateSlug}/attorneys/${attorney.slug}`} className="llc-view-btn">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function StatePage({ params, searchParams }: Props) {
  const { state: stateSlug } = await params
  const { area, city, type } = await searchParams
  const isAttorneyFlow = type === 'attorney'
  const data = getStateData(stateSlug)
  if (!data) notFound()

  const allAreas = OFFICIAL_PRACTICE_AREAS

  // Only show cities that actually have attorney or firm records, skip malformed entries
  const citiesWithData = Array.from(new Set([
    ...data.attorneys.map(a => a.location.city).filter(Boolean),
    ...data.firms.map(f => f.location.city).filter(Boolean),
    ...data.firms.flatMap(f => f.additional_locations?.map(l => l.city) ?? []).filter(Boolean),
  ])).filter(c => !/^\d/.test(c as string)).sort() as string[]

  // Show landing until both area AND city are selected
  if (!area || !city) {
    return (
      <StateLanding
        stateSlug={stateSlug}
        stateName={data.state}
        stateAbbr={data.state_abbr}
        practiceAreas={allAreas}
        cities={citiesWithData}
        attorneyCount={data.attorneys.length}
        firmCount={data.firms.length}
        selectedArea={area}
        selectedCity={city}
        type={type}
      />
    )
  }

  // Both area + city selected → filter and show results
  const areaQ = area.toLowerCase()
  const cityQ = city.toLowerCase()

  // Resolve the selected city's coordinates from any firm that has an office there
  let refLat: number | null = null
  let refLng: number | null = null
  outer: for (const f of data.firms) {
    if (f.location.city?.toLowerCase() === cityQ && f.location.lat && f.location.lng) {
      refLat = f.location.lat; refLng = f.location.lng; break outer
    }
    for (const l of f.additional_locations ?? []) {
      if (l.city?.toLowerCase() === cityQ && l.lat && l.lng) {
        refLat = l.lat; refLng = l.lng; break outer
      }
    }
  }

  // Filter attorneys by official_practice_area (exact match) and city
  const exactAttorneys = data.attorneys.filter(a =>
    a.location.city?.toLowerCase() === cityQ &&
    a.official_practice_area.some(p => p.toLowerCase() === areaQ)
  )

  const practiceFiltered = data.firms.filter(f =>
    f.official_practice_area.some(p => p.toLowerCase() === areaQ)
  )

  const isExactMatch = (f: typeof practiceFiltered[0]) =>
    f.location.city?.toLowerCase() === cityQ ||
    (f.additional_locations ?? []).some(l => l.city?.toLowerCase() === cityQ)

  const isWithinRadius = (f: typeof practiceFiltered[0]) => {
    if (refLat === null || refLng === null) return false
    if (f.location.lat && f.location.lng &&
        haversinemiles(refLat, refLng, f.location.lat, f.location.lng) <= RADIUS_MILES)
      return true
    return (f.additional_locations ?? []).some(l =>
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

  const title = isAttorneyFlow
    ? `${area} Attorneys in ${city}, ${data.state_abbr}`
    : `${area} Law Firms in ${city}, ${data.state_abbr}`
  const typeParam = isAttorneyFlow ? '&type=attorney' : '&type=firm'
  const areaParam = `area=${encodeURIComponent(area)}`
  const cityParam = `city=${encodeURIComponent(city)}`

  return (
    <div>
      <div className="archive-header">
        <div className="container">
          <nav className="sl-breadcrumb sl-breadcrumb--light" aria-label="Breadcrumb">
            <Link href="/" className="sl-breadcrumb-link">Lawyer Directory</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <Link href={`/${stateSlug}`} className="sl-breadcrumb-link">{data.state}</Link>
            <span className="sl-breadcrumb-sep">/</span>
            <span>{area}</span>
            <span className="sl-breadcrumb-sep">/</span>
            <span>{city}</span>
          </nav>
          <h1>{title}</h1>
          <p className="archive-header-sub">
            {totalCount.toLocaleString()} {isAttorneyFlow ? 'attorneys' : 'law firms'}
          </p>

          <div className="sl-filter-bar">
            <span className="sl-filter-tag">
              {area}
              <Link href={`/${stateSlug}?${cityParam}${typeParam}`} className="sl-filter-remove" aria-label="Remove area filter">×</Link>
            </span>
            <span className="sl-filter-tag">
              {city}
              <Link href={`/${stateSlug}?${areaParam}${typeParam}`} className="sl-filter-remove" aria-label="Remove city filter">×</Link>
            </span>
            <Link href={`/${stateSlug}?${typeParam.slice(1)}`} className="sl-clear-all">Clear all</Link>
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
                  {allAreas.map(a => (
                    <li key={a} className="sidebar-list-item">
                      <Link
                        href={`/${stateSlug}?area=${encodeURIComponent(a)}&${cityParam}${typeParam}`}
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
                  {citiesWithData.map(c => (
                    <li key={c} className="sidebar-list-item">
                      <Link
                        href={`/${stateSlug}?${areaParam}&city=${encodeURIComponent(c)}${typeParam}`}
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
              {totalCount === 0 ? (
                <div className="attorneys-no-results">
                  <p>No {isAttorneyFlow ? 'attorneys' : 'law firms'} found for <strong>{area}</strong> in <strong>{city}</strong>.</p>
                  <br />
                  <Link href={`/${stateSlug}?${areaParam}${typeParam}`} className="btn-notfound-primary">Try a different city</Link>
                </div>
              ) : (
                <>
                  <div className="archive-results-header">
                    <p className="arc-count">
                      <strong>{totalCount.toLocaleString()}</strong> {isAttorneyFlow ? 'attorneys' : 'law firms'} · {area} · {city}, {data.state_abbr}
                    </p>
                  </div>

                  {isAttorneyFlow ? (
                    <div className="lawyer-list">
                      {exactAttorneys.slice(0, 20).map(attorney => (
                        <AttorneyCard key={attorney.slug} attorney={attorney} stateSlug={stateSlug} avatarClass={avatarClass} />
                      ))}
                    </div>
                  ) : (
                    <>
                      {exactFirms.length > 0 && (
                        <div className="lawyer-list">
                          {exactFirms.slice(0, 10).map(firm => (
                            <FirmCard key={firm.slug} firm={firm} stateSlug={stateSlug} avatarClass={avatarClass} />
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
                              <FirmCard key={firm.slug} firm={firm} stateSlug={stateSlug} avatarClass={avatarClass} />
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
                              <FirmCard key={firm.slug} firm={firm} stateSlug={stateSlug} avatarClass={avatarClass} />
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
