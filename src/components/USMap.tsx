'use client'
import { useEffect, useRef, useState } from 'react'

// The 146 KB map SVG lives in /us-map.svg (cached static asset) and is
// fetched + injected only when the map scrolls near the viewport — parsing
// that much SVG during page load showed up as long tasks/forced reflow in
// PageSpeed traces. .map-module-img reserves the aspect ratio (no CLS).
export default function USMap() {
  const [svg, setSvg] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      fetch('/us-map.svg')
        .then(r => (r.ok ? r.text() : ''))
        .then(setSvg)
        .catch(() => {})
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="map-module-img" dangerouslySetInnerHTML={{ __html: svg }} />
  )
}
