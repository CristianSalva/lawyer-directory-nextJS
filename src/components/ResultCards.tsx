import Link from 'next/link'
import type { SlimAttorney, SlimFirm } from '@/types'

// Shared by the client-side filter results (StateResults) and the
// prerendered /{state}/{area}[/{city}] SEO pages. Server-compatible.

const avatarClasses = ['llc-av-1','llc-av-2','llc-av-3','llc-av-4','llc-av-5','llc-av-6','llc-av-7','llc-av-8']
export function avatarClass(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return avatarClasses[h % avatarClasses.length]
}

export function FirmCard({ firm, stateSlug }: { firm: SlimFirm; stateSlug: string }) {
  return (
    <div className="lawyer-card">
      {firm.photo ? (
        <img src={firm.photo} alt={firm.name ?? ''} className="llc-photo" width="88" height="88" loading="lazy" />
      ) : (
        <div className={`llc-avatar ${avatarClass(firm.name ?? '')}`}>
          {(firm.name ?? '?').charAt(0)}
        </div>
      )}
      <div className="llc-body">
        <div className="llc-name-row">
          <Link prefetch={false} href={`/${stateSlug}/firms/${firm.slug}`} className="llc-name">
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
          {firm.city}{firm.state ? `, ${firm.state}` : ''}
        </p>
        {firm.areas.length > 0 && (
          <div className="llc-areas">
            {firm.areas.map(a => (
              <span key={a} className="llc-area-tag">{a}</span>
            ))}
          </div>
        )}
        <div className="llc-foot">
          {firm.phone && (
            <a href={`tel:${firm.phone}`} className="llc-phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#424A5B"/>
              </svg>
              {firm.phone}
            </a>
          )}
          <Link prefetch={false} href={`/${stateSlug}/firms/${firm.slug}`} className="llc-view-btn">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

export function AttorneyCard({ attorney, stateSlug }: { attorney: SlimAttorney; stateSlug: string }) {
  return (
    <div className="lawyer-card">
      {attorney.photo ? (
        <img src={attorney.photo} alt={attorney.name} className="llc-photo" width="88" height="88" loading="lazy" />
      ) : (
        <div className={`llc-avatar ${avatarClass(attorney.name)}`}>
          {attorney.name.charAt(0)}
        </div>
      )}
      <div className="llc-body">
        <div className="llc-name-row">
          <Link prefetch={false} href={`/${stateSlug}/attorneys/${attorney.slug}`} className="llc-name">
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
          {attorney.city}{attorney.state ? `, ${attorney.state}` : ''}
        </p>
        {attorney.areas.length > 0 && (
          <div className="llc-areas">
            {attorney.areas.map(a => (
              <span key={a} className="llc-area-tag">{a}</span>
            ))}
          </div>
        )}
        <div className="llc-foot">
          {attorney.phone && (
            <a href={`tel:${attorney.phone}`} className="llc-phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#424A5B"/>
              </svg>
              {attorney.phone}
            </a>
          )}
          <Link prefetch={false} href={`/${stateSlug}/attorneys/${attorney.slug}`} className="llc-view-btn">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
