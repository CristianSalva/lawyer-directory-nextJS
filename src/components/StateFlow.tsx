'use client'
import { useSearchParams } from 'next/navigation'
import StateLanding from '@/components/StateLanding'
import StateResults from '@/components/StateResults'

interface Props {
  stateSlug: string
  stateName: string
  stateAbbr: string
  practiceAreas: string[]
  cities: string[]
  attorneyCount: number
  firmCount: number
}

// The exported site has no server, so the ?area=&city= flow is resolved
// client-side: landing until both are picked, then fetch-and-filter results.
export default function StateFlow(props: Props) {
  const searchParams = useSearchParams()
  const area = searchParams.get('area') ?? undefined
  const city = searchParams.get('city') ?? undefined
  const type = searchParams.get('type') ?? undefined

  if (!area || !city) {
    return (
      <StateLanding
        stateSlug={props.stateSlug}
        stateName={props.stateName}
        stateAbbr={props.stateAbbr}
        practiceAreas={props.practiceAreas}
        cities={props.cities}
        attorneyCount={props.attorneyCount}
        firmCount={props.firmCount}
        selectedArea={area}
        selectedCity={city}
        type={type}
      />
    )
  }

  return (
    <StateResults
      stateSlug={props.stateSlug}
      stateName={props.stateName}
      stateAbbr={props.stateAbbr}
      practiceAreas={props.practiceAreas}
      cities={props.cities}
      area={area}
      city={city}
      type={type}
    />
  )
}
