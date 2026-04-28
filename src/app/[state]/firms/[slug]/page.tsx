import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFirm, getStateData, getAllFirmSlugs } from '@/lib/data'
import ContactForm from '@/components/ContactForm'

interface Props { params: Promise<{ state: string; slug: string }> }

export async function generateStaticParams() {
  return getAllFirmSlugs()
}

const avatarClasses = ['llc-av-1','llc-av-2','llc-av-3','llc-av-4','llc-av-5','llc-av-6','llc-av-7','llc-av-8']
function avatarClass(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return avatarClasses[h % avatarClasses.length]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const awards = [
  ['Super Lawyers 2024', '2024'],
  ['Top Rated Law Firm', 'Martindale'],
  ['Best Law Firms', 'U.S. News'],
  ['Client Champion', '2023'],
  ['AV Preeminent Rated', 'Martindale'],
]

export default async function FirmPage({ params }: Props) {
  const { state: stateSlug, slug } = await params
  const firm = getFirm(stateSlug, slug)
  if (!firm) notFound()

  const stateData = getStateData(stateSlug)
  const similar = stateData?.firms
    .filter(f => f.slug !== slug && f.practice_areas.some(pa => firm.practice_areas.includes(pa)))
    .slice(0, 3) ?? []

  const { name, practice_type, years_experience, free_consultation, super_lawyers,
          photo, profile_image_url, location, contact, practice_areas, attorneys } = firm

  const firmName = name ?? 'Law Firm'
  const locationStr = [location.city, location.state].filter(Boolean).join(', ')
  const addressParts = [
    location.address, location.address2, location.city,
    location.state ? `${location.state} ${location.zip ?? ''}`.trim() : location.zip,
  ].filter(Boolean) as string[]
  const fullAddress = addressParts.join(', ')

  const hasPhoto = Boolean((profile_image_url || photo) && (profile_image_url || photo)?.startsWith('http'))
  const photoUrl = profile_image_url || photo

  const displayFeatures = [...contact.features]
  if (free_consultation && !displayFeatures.includes('Free Consultations')) {
    displayFeatures.unshift('Free Consultations')
  }
  displayFeatures.push('Available 24/7 for Emergencies', 'Virtual Meetings Available')
  const uniqueFeatures = [...new Set(displayFeatures)]

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">Home</Link>
          <span className="bc-sep">/</span>
          <Link href={`/${stateSlug}`}>{location.state || stateSlug}</Link>
          <span className="bc-sep">/</span>
          <span className="bc-current">{firmName}</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="sp-hero">
        <div className="container sp-hero-inner">
          {hasPhoto ? (
            <img src={photoUrl!} alt={firmName} className="sp-photo" />
          ) : (
            <div className={`sp-avatar ${avatarClass(firmName)}`}>{initials(firmName)}</div>
          )}

          <div className="sp-hero-info">
            <div className="sp-hero-top">
              <h1>{firmName}</h1>
              {super_lawyers && <span className="sp-badge sp-badge--sl">Super Lawyers®</span>}
              {free_consultation && <span className="sp-badge">Free Consultation</span>}
            </div>

            {practice_type && <p className="sp-title">{practice_type}</p>}

            <div className="sp-hero-meta">
              {locationStr && (
                <span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {locationStr}
                </span>
              )}
              {years_experience && (
                <span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
                  {years_experience} yrs experience
                </span>
              )}
              {contact.phone && (
                <span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  {contact.phone}
                </span>
              )}
            </div>

            {practice_areas.length > 0 && (
              <div className="sp-hero-tags">
                {practice_areas.slice(0, 6).map(area => (
                  <span key={area} className="sp-tag">{area}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="sp-body">
        <div className="container sp-layout">

          {/* Main column */}
          <div className="sp-main">
            {/* Firm details table */}
            <div className="sp-card">
              <h2>Firm Details</h2>
              <div className="sp-card-body">
                <table className="sp-details-table">
                  <tbody>
                    <tr><td className="sp-dt-label">Firm Name</td><td>{firmName}</td></tr>
                    {practice_type && <tr><td className="sp-dt-label">Type</td><td>{practice_type}</td></tr>}
                    {years_experience && <tr><td className="sp-dt-label">Experience</td><td>{years_experience} years</td></tr>}
                    {fullAddress && <tr><td className="sp-dt-label">Address</td><td>{fullAddress}</td></tr>}
                    {contact.phone && (
                      <tr><td className="sp-dt-label">Phone</td><td><a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}>{contact.phone}</a></td></tr>
                    )}
                    {contact.fax && <tr><td className="sp-dt-label">Fax</td><td>{contact.fax}</td></tr>}
                    {contact.websites.map((w, i) => (
                      <tr key={i}><td className="sp-dt-label">Website</td><td><a href={w} target="_blank" rel="noopener noreferrer">{w.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></td></tr>
                    ))}
                    <tr><td className="sp-dt-label">New Clients</td><td>✓ Currently accepting</td></tr>
                    {free_consultation && <tr><td className="sp-dt-label">Consultation</td><td>✓ Free initial consultation</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attorneys at this firm */}
            {attorneys.length > 0 && (
              <div className="sp-card">
                <h2>Attorneys at this Firm</h2>
                <div className="sp-card-body">
                  <div className="sp-similar">
                    {attorneys.map((attyName, i) => (
                      <div key={i} className="sp-sim-item">
                        <div className={`sp-sim-avatar ${avatarClass(attyName)}`}>{initials(attyName)}</div>
                        <div className="sp-sim-info">
                          <strong className="sp-sim-name">{attyName}</strong>
                          <span className="sp-sim-loc">{locationStr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="sp-sidebar">
            <div className="sp-sidebar-card sp-contact" id="contact">
              <h3>Get a Free Consultation</h3>
              <p className="sp-contact-sub">Fill out the form and our team will get back to you shortly.</p>
              <ContactForm areas={practice_areas} phone={contact.phone ?? null} />
            </div>

            <div className="sp-sidebar-card">
              <h3>Services &amp; Features</h3>
              <ul className="sp-checklist">
                {uniqueFeatures.map((feat, i) => (
                  <li key={i}><span className="sp-cl-icon">✓</span> {feat}</li>
                ))}
              </ul>
            </div>

            {practice_areas.length > 0 && (
              <div className="sp-sidebar-card">
                <h3>Practice Areas</h3>
                <div className="sp-area-tags">
                  {practice_areas.map(area => (
                    <span key={area} className="sp-area-tag">{area}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="sp-sidebar-card">
              <h3>Awards &amp; Recognition</h3>
              <div className="sp-badges">
                {awards.map(([badge, org]) => (
                  <div key={badge} className="sp-badge-item">
                    <span className="sp-badge-icon">★</span>
                    <div>
                      <strong>{badge}</strong>
                      <span>{org}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {similar.length > 0 && (
              <div className="sp-sidebar-card">
                <h3>Similar Firms</h3>
                <div className="sp-similar">
                  {similar.map(f => (
                    <Link key={f.slug} href={`/${stateSlug}/firms/${f.slug}`} className="sp-sim-item">
                      <div className={`sp-sim-avatar ${avatarClass(f.name ?? '')}`}>{initials(f.name ?? '?')}</div>
                      <div className="sp-sim-info">
                        <strong className="sp-sim-name">{f.name}</strong>
                        {f.practice_type && <span className="sp-sim-firm">{f.practice_type}</span>}
                        {f.location.city && <span className="sp-sim-loc">{f.location.city}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}
