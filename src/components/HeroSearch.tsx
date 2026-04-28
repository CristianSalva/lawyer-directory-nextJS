'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StateEntry { state: string; state_abbr: string; slug: string }

export default function HeroSearch({ states }: { states: StateEntry[] }) {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const loc = location.trim().toLowerCase()
    const areaParam = area.trim() ? `?area=${encodeURIComponent(area.trim())}` : ''

    const match = states.find(s =>
      s.state.toLowerCase() === loc ||
      s.slug === loc.replace(/\s+/g, '-') ||
      s.state_abbr.toLowerCase() === loc
    )

    if (match) {
      router.push(`/${match.slug}${areaParam}`)
    } else {
      const params = new URLSearchParams()
      if (location.trim()) params.set('location', location.trim())
      if (area.trim()) params.set('area', area.trim())
      router.push(`/attorneys?${params.toString()}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="hero-search-form">
      <div className="hsf-field">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#AAAAAA"/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg>
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="City or State"
          aria-label="City or State"
        />
      </div>
      <div className="hsf-field">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6h-2.18c.07-.44.18-.87.18-1.32C18 3.19 16.81 2 15.32 2c-.98 0-1.75.67-2.48 1.36L12 4.19l-.84-.84C10.44 2.67 9.67 2 8.68 2 7.19 2 6 3.19 6 4.68c0 .45.1.88.18 1.32H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" fill="#AAAAAA"/></svg>
        <input
          value={area}
          onChange={e => setArea(e.target.value)}
          placeholder="Practice Area (e.g. Family Law)"
          aria-label="Practice Area"
        />
      </div>
      <button type="submit" className="hsf-btn">Find Attorney</button>
    </form>
  )
}
