'use client'
import { useEffect, useState } from 'react'

// The 146 KB map SVG lives in /us-map.svg (cached static asset) and is
// injected after hydration — shipping it inline doubled the homepage HTML
// (once as markup, once in the RSC payload) and tanked mobile PageSpeed.
// .map-module-img reserves the aspect ratio so injection causes no CLS.
export default function USMap() {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    fetch('/us-map.svg')
      .then(r => (r.ok ? r.text() : ''))
      .then(setSvg)
      .catch(() => {})
  }, [])

  return (
    <div className="map-module-img" dangerouslySetInnerHTML={{ __html: svg }} />
  )
}
