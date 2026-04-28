import Link from 'next/link'
import { getIndex } from '@/lib/data'
import FaqSection from '@/components/FaqSection'
import HeroSearch from '@/components/HeroSearch'
import USMap from '@/components/USMap'

const practiceCards = [
  { label: 'Personal Injury', icon: '⚖️' },
  { label: 'Family Law', icon: '👨‍👩‍👧' },
  { label: 'Criminal Defense', icon: '🛡️' },
  { label: 'Business Law', icon: '💼' },
  { label: 'Real Estate', icon: '🏠' },
  { label: 'Bankruptcy', icon: '📋' },
]

const features = [
  { title: 'Verified Attorneys', desc: 'Every attorney in our directory is verified and licensed to practice in their state.' },
  { title: 'Find by Location', desc: 'Search attorneys by city, county, or state to find legal help close to home.' },
  { title: 'Free to Use', desc: 'Our directory is completely free to use. No hidden fees or subscriptions required.' },
]

const testimonials = [
  { name: 'Sarah M.', role: 'Personal Injury Client', text: 'Found an amazing attorney in minutes. The process was so easy and my case was handled professionally.', avatarClass: 'avatar--blue' },
  { name: 'James R.', role: 'Business Owner', text: 'Needed a business attorney urgently. This directory helped me find the perfect match for my needs.', avatarClass: 'avatar--orange' },
  { name: 'Linda T.', role: 'Family Law Client', text: 'The search filters made it easy to find attorneys specializing in family law in my area. Highly recommend!', avatarClass: 'avatar--green' },
  { name: 'David K.', role: 'Real Estate Investor', text: 'Excellent resource for finding real estate attorneys. Found three great options within my zip code.', avatarClass: 'avatar--purple' },
]

const steps = [
  { n: 1, title: 'Search', desc: 'Enter your location and practice area to find attorneys near you.' },
  { n: 2, title: 'Compare', desc: 'Review attorney profiles, experience, and practice areas.' },
  { n: 3, title: 'Contact', desc: 'Reach out directly to the attorney that best fits your needs.' },
  { n: 4, title: 'Get Help', desc: 'Get the legal representation you need with confidence.' },
]

const practiceRows = [
  { title: 'Personal\nInjury Law', desc: "Were you injured due to someone else's negligence? Our personal injury attorneys fight for the compensation you deserve — from car accidents to medical malpractice.", rowClass: 'category-row--pi', icon: '⚖️', alt: false },
  { title: 'Family\nLaw', desc: "Navigate life's most sensitive legal matters with compassion. Our family law attorneys handle divorce, custody, adoption, and more with care and expertise.", rowClass: 'category-row--fl', icon: '👨‍👩‍👧', alt: true },
  { title: 'Real Estate\nLaw', desc: 'Whether buying, selling, or disputing property, our real estate attorneys protect your interests and guide you through every transaction and dispute.', rowClass: 'category-row--re', icon: '🏠', alt: false },
  { title: 'Criminal\nDefense', desc: 'Facing criminal charges can be overwhelming. Our experienced criminal defense attorneys provide aggressive representation to protect your rights and freedom.', rowClass: 'category-row--cd', icon: '🛡️', alt: true },
]

const faqs = [
  { q: 'How do I find an attorney near me?', a: 'Use our search bar to enter your city or state along with the type of legal help you need. Our directory will show you licensed attorneys in your area.' },
  { q: 'Is it free to search for attorneys?', a: 'Yes, searching our directory is completely free. You can browse attorney profiles, read about their practice areas, and contact them without any charges.' },
  { q: 'What information do attorney profiles include?', a: 'Attorney profiles include their practice areas, location, contact information, office hours, education, bar admissions, and more.' },
  { q: 'How do I know if an attorney is licensed?', a: 'All attorneys in our directory are verified through their state bar associations. You can also find bar admission details directly on each attorney profile.' },
  { q: 'Can I get a free consultation?', a: 'Many attorneys in our directory offer free consultations. Look for the "Free Consultation" badge on attorney profiles.' },
]

export default function HomePage() {
  const index = getIndex()

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Simply Find<br />the Right Attorney</h1>
          <p className="hero-sub">
            Search {index.total_attorneys.toLocaleString()}+ attorneys and {index.total_firms.toLocaleString()}+ law firms across all 50 states.
          </p>

          <div className="hero-search-card">
            <p className="hero-search-card-label">Find an Attorney</p>
            <HeroSearch states={index.states.map(s => ({ state: s.state, state_abbr: s.state_abbr, slug: s.file.replace('.json','') }))} />
          </div>

          <div className="hero-cards">
            {practiceCards.map(card => (
              <Link key={card.label} href={`/attorneys?area=${encodeURIComponent(card.label)}`} className="hero-card-item">
                <span className="hero-card-icon">{card.icon}</span>
                <span className="hero-card-label">{card.label}</span>
              </Link>
            ))}
          </div>

          <div className="hero-trust">
            {[`${index.total_attorneys.toLocaleString()}+ Verified Attorneys`, `${index.state_count} States Covered`, 'Free to Search', 'Updated Daily'].map(t => (
              <span key={t} className="hero-trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#196AC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by State — state list */}
      <section className="browse-states">
        <div className="container">
          <h2>Search for Lawyers by State</h2>
          <nav className="map-module-state-list" aria-label="States">
            <ul className="map-module-state-list-inner">
              {index.states.map(s => (
                <li key={s.state} className="map-module-state-list-item">
                  <svg className="map-module-state-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                  <Link href={`/${s.file.replace('.json','')}`} className="map-module-state-list-link">{s.state}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* Browse by State — interactive US map */}
      <section className="ld-map-module-section">
        <div className="container">
          <h2>Browse Law Firms by State</h2>
          <p className="section-subtitle">Select your state to find lawyers and law firms near you.</p>
          <USMap />
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-heading">Why Use Lawyer Directory?</h2>
          <p className="section-subtitle">We make finding qualified legal help simple, fast, and completely free.</p>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-item">
                <div className="feature-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#196AC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-heading">What Our Users Say</h2>
          <div className="testimonials-grid">
            {testimonials.map(t => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-header">
                  <div className={`testimonial-avatar ${t.avatarClass}`}>{t.name.charAt(0)}</div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-stars">★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <h2 className="section-heading">How It Works</h2>
          <div className="steps-grid">
            {steps.map(s => (
              <div key={s.n} className="step-item">
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <h2 className="section-heading">Trusted by Thousands</h2>
          <p className="section-subtitle stats-subtitle">Our directory grows every day with verified attorneys ready to help.</p>
          <div className="stats-grid">
            {[
              { num: `${index.total_attorneys.toLocaleString()}+`, label: 'Verified Attorneys' },
              { num: `${index.total_firms.toLocaleString()}+`, label: 'Law Firms Listed' },
              { num: `${index.state_count}`, label: 'States Covered' },
            ].map(s => (
              <div key={s.label}>
                <div className="stat-number">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Area Rows */}
      <section className="categories-section">
        {practiceRows.map(row => (
          <div key={row.title} className={`category-row${row.alt ? ' alt' : ''} ${row.rowClass}`}>
            <div className="category-inner">
              <div className="category-placeholder">
                <span className="category-placeholder-icon">{row.icon}</span>
              </div>
              <div className="category-content">
                <h3>{row.title}</h3>
                <p>{row.desc}</p>
                <Link href={`/attorneys?area=${encodeURIComponent(row.title.replace('\n', ' '))}`} className="btn-cta">
                  Find an Attorney →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <FaqSection faqs={faqs} />
    </div>
  )
}
