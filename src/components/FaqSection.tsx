'use client'

import { useState } from 'react'

interface Faq { q: string; a: string }

export default function FaqSection({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <h2 className="section-heading" style={{ marginBottom: 40 }}>Frequently Asked Questions</h2>
        <ul className="faq-list">
          {faqs.map((faq, i) => (
            <li key={i} className={`faq-item${open === i ? ' open' : ''}`}>
              <button type="button" className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
                {faq.q}
                <svg className="faq-chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </button>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
