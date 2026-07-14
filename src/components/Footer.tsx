import Link from 'next/link'

const cols = [
  { heading: 'Practice Areas', links: [['#','Personal Injury'],['#','Family Law'],['#','Criminal Defense'],['#','Business Law'],['#','Real Estate'],['#','Bankruptcy']] },
  { heading: 'For Attorneys', links: [['#','List Your Practice'],['#','Attorney Login'],['#','Update Profile'],['#','Advertising'],['#','Partners']] },
  { heading: 'Resources', links: [['#','Legal Guides'],['#','State Laws'],['#','Bar Associations'],['#','Legal Blog'],['#','FAQ']] },
  { heading: 'Company', links: [['#','About Us'],['#','Contact'],['#','Privacy Policy'],['#','Terms of Use'],['#','Sitemap']] },
]

export default function Footer() {
  return (
    <footer>
      <div className="cta-banner">
        <div className="container">
          <h2>Ready to Find the Right<br />Attorney for You?</h2>
          <Link href="/attorneys" className="btn-cta-banner">Find an Attorney Now</Link>
        </div>
      </div>

      <div className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="8" fill="#196AC8" fillOpacity="0.12"/>
                  <path d="M18 7L7 13v10l11 6 11-6V13L18 7z" fill="#196AC8"/>
                  <path d="M18 7v22M7 13l11 6 11-6" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                <span className="footer-brand-text">US Lawyer List</span>
              </div>
              <p className="footer-brand-desc">
                Connecting people with qualified attorneys across the United States. Find the right legal help for your needs.
              </p>
            </div>

            {cols.map(col => (
              <div key={col.heading} className="footer-col">
                <h4>{col.heading}</h4>
                <ul>
                  {col.links.map(([href, label]) => (
                    <li key={label}><Link href={href}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="footer-bottom">
            {[['#','Privacy Policy'],['#','Terms of Use'],['#','Cookie Policy'],['#','Accessibility'],['#','Sitemap']].map(([href, label]) => (
              <Link key={label} href={href}>{label}</Link>
            ))}
          </div>
        </div>
      </div>

      <div className="copyright-bar">
        <p>© {new Date().getFullYear()} US Lawyer List. All rights reserved.</p>
      </div>
    </footer>
  )
}
