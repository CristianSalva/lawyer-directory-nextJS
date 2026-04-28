import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAttorney, getStateData, getAllAttorneySlugs } from '@/lib/data'
import type { AttorneySection } from '@/types'
import ContactForm from '@/components/ContactForm'

interface Props { params: Promise<{ state: string; slug: string }> }

export async function generateStaticParams() {
  return getAllAttorneySlugs()
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

function SectionCard({ sec }: { sec: AttorneySection }) {
  const { title, type, content } = sec
  return (
    <div className="sp-card">
      <h2>{title}</h2>
      <div className="sp-card-body">
        {type === 'text' && typeof content === 'string' && (
          <p className="sp-about-text">{content}</p>
        )}
        {type === 'list' && Array.isArray(content) && (
          <ul className="sp-info-list">
            {(content as string[]).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )}
        {type === 'grouped_list' && Array.isArray(content) && (
          (content as { label: string; items: string[] }[]).map((group, i) => (
            <div key={i} className="sp-info-group">
              {group.label && <h4 className="sp-group-label">{group.label}</h4>}
              <ul className="sp-info-list">
                {group.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const awards = [
  ['Super Lawyers 2024', '2024'],
  ['Top 100 Trial Lawyers', 'National'],
  ['AV Preeminent Rated', 'Martindale'],
  ['Client Choice Award', '2023'],
  ['10.0 Superb Rating', 'Avvo'],
]

export default async function AttorneyPage({ params }: Props) {
  const { state: stateSlug, slug } = await params
  const attorney = getAttorney(stateSlug, slug)
  if (!attorney) notFound()

  const stateData = getStateData(stateSlug)
  const similar = stateData?.attorneys
    .filter(a => a.slug !== slug && a.practice_areas.some(pa => attorney.practice_areas.includes(pa)))
    .slice(0, 3) ?? []

  const { name, firm_name, practice_type, years_experience, free_consultation,
          super_lawyers, photo, bio, location, contact, practice_areas, sections } = attorney

  const overviewSection = sections.find(s => s.title === 'Overview' && s.type === 'text')
  const otherSections = sections.filter(s => s.title !== 'Overview')

  const locationStr = [location.city, location.state_abbr || location.state].filter(Boolean).join(', ')
  const addressParts = [
    location.address, location.address2, location.city,
    location.state_abbr ? `${location.state_abbr} ${location.zip ?? ''}`.trim() : location.zip,
  ].filter(Boolean) as string[]
  const fullAddress = addressParts.join(', ')

  const hasPhoto = Boolean(photo && photo.startsWith('http'))
  const firstName = name.trim().split(/\s+/)[0]

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
          <span className="bc-current">{name}</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="sp-hero">
        <div className="container sp-hero-inner">
          {hasPhoto ? (
            <img src={photo} alt={name} className="sp-photo" />
          ) : (
            <div className={`sp-avatar ${avatarClass(name)}`}>{initials(name)}</div>
          )}

          <div className="sp-hero-info">
            <div className="sp-hero-top">
              <h1>{name}</h1>
              {super_lawyers > 0 && <span className="sp-badge sp-badge--sl">Super Lawyers®</span>}
              {free_consultation && <span className="sp-badge">Free Consultation</span>}
            </div>

            {firm_name && <p className="sp-title">{firm_name}</p>}
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
              {contact.phones[0] && (
                <span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  {contact.phones[0]}
                </span>
              )}
              {contact.hours && (
                <span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
                  {contact.hours}
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
            {(overviewSection || bio) && (
              <div className="sp-card">
                <h2>About {name}</h2>
                <div className="sp-card-body">
                  <p className="sp-about-text">
                    {overviewSection ? (overviewSection.content as string) : bio}
                  </p>
                </div>
              </div>
            )}

            {otherSections.map((sec, i) => <SectionCard key={i} sec={sec} />)}

            <div className="sp-card">
              <h2>Attorney Details</h2>
              <div className="sp-card-body">
                <table className="sp-details-table">
                  <tbody>
                    <tr><td className="sp-dt-label">Full Name</td><td>{name}</td></tr>
                    {firm_name && <tr><td className="sp-dt-label">Firm</td><td>{firm_name}</td></tr>}
                    {years_experience && <tr><td className="sp-dt-label">Experience</td><td>{years_experience} years</td></tr>}
                    {fullAddress && <tr><td className="sp-dt-label">Address</td><td>{fullAddress}</td></tr>}
                    {contact.phones.map((p, i) => (
                      <tr key={`ph-${i}`}><td className="sp-dt-label">Phone</td><td><a href={`tel:${p.replace(/[^0-9+]/g, '')}`}>{p}</a></td></tr>
                    ))}
                    {contact.websites.map((w, i) => (
                      <tr key={`web-${i}`}><td className="sp-dt-label">Website</td><td><a href={w} target="_blank" rel="noopener noreferrer">{w.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></td></tr>
                    ))}
                    {contact.hours && <tr><td className="sp-dt-label">Hours</td><td>{contact.hours}</td></tr>}
                    <tr><td className="sp-dt-label">New Clients</td><td>✓ Currently accepting</td></tr>
                    {free_consultation && <tr><td className="sp-dt-label">Consultation</td><td>✓ Free initial consultation</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sp-sidebar">
            <div className="sp-sidebar-card sp-contact" id="contact">
              <h3>Get a Free Consultation</h3>
              <p className="sp-contact-sub">Fill out the form and {firstName} will get back to you shortly.</p>
              <ContactForm areas={practice_areas} phone={contact.phones[0] ?? null} />
            </div>

            <div className="sp-sidebar-card">
              <h3>Services &amp; Features</h3>
              <ul className="sp-checklist">
                {uniqueFeatures.map((feat, i) => (
                  <li key={i}><span className="sp-cl-icon">✓</span> {feat}</li>
                ))}
              </ul>
            </div>

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
                <h3>Similar Attorneys</h3>
                <div className="sp-similar">
                  {similar.map(a => (
                    <Link key={a.slug} href={`/${stateSlug}/attorneys/${a.slug}`} className="sp-sim-item">
                      <div className={`sp-sim-avatar ${avatarClass(a.name)}`}>{initials(a.name)}</div>
                      <div className="sp-sim-info">
                        <strong className="sp-sim-name">{a.name}</strong>
                        {a.firm_name && <span className="sp-sim-firm">{a.firm_name}</span>}
                        {a.location.city && <span className="sp-sim-loc">{a.location.city}</span>}
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
