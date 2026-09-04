'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StateLanding from '@/components/StateLanding'
import { toSlug } from '@/lib/slugs'

interface Props {
  stateSlug: string
  stateName: string
  stateAbbr: string
  practiceAreas: string[]
  cities: string[]
  attorneyCount: number
  firmCount: number
}

// Every filter combination now has its own prerendered page, so this only
// reads the retired query params to bounce old URLs onto the right path.
export default function StateFlow(props: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const area = searchParams.get('area') ?? undefined
  const city = searchParams.get('city') ?? undefined

  // Nothing links to ?area=/?city= any more, but old indexed URLs and
  // bookmarks do — send them to the prerendered equivalent. The worker 301s
  // these at the edge too; this covers hosts serving the export directly.
  // Same shape as seoRedirect() in cloudflare/worker.js: area, city, or both.
  const legacyPath = area || city
    ? `/${props.stateSlug}/${[area && toSlug(area), city && toSlug(city)].filter(Boolean).join('/')}`
    : null
  useEffect(() => {
    if (legacyPath) router.replace(legacyPath)
  }, [legacyPath, router])

  return (
    <StateLanding
      stateSlug={props.stateSlug}
      stateName={props.stateName}
      stateAbbr={props.stateAbbr}
      practiceAreas={props.practiceAreas}
      cities={props.cities}
      attorneyCount={props.attorneyCount}
      firmCount={props.firmCount}
    />
  )
}
