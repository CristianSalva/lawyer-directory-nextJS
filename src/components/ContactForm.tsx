'use client'

import { useState } from 'react'

interface Props { areas: string[]; phone: string | null }

export default function ContactForm({ areas, phone }: Props) {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return <div className="sp-form-success"><p>Thanks! Your message has been sent. You will receive a response shortly.</p></div>
  }

  return (
    <>
      <form className="sp-form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}>
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email Address" required />
        <input type="tel" placeholder="Phone Number" />
        <select aria-label="Legal issue type">
          <option value="">Select Legal Issue</option>
          {areas.map(a => <option key={a}>{a}</option>)}
          <option>Other</option>
        </select>
        <textarea placeholder="Briefly describe your legal situation…" rows={4} />
        <button type="submit" className="sp-form-btn">Send Message</button>
      </form>
      {phone && (
        <div className="sp-contact-phone">
          <span>Or call directly</span>
          <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`}>{phone}</a>
        </div>
      )}
    </>
  )
}
