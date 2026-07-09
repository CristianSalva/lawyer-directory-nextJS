import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getStateData, getAllStateSlugs } from '@/lib/data'
import { OFFICIAL_PRACTICE_AREAS } from '@/lib/practice-areas'
import StateLanding from '@/components/StateLanding'
import StateFlow from '@/components/StateFlow'

interface Props {
  params: Promise<{ state: string }>
}

export async function generateStaticParams() {
  return getAllStateSlugs().map((state) => ({ state }))
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params
  const data = getStateData(stateSlug)
  if (!data) notFound()

  // Only show cities that actually have attorney or firm records, skip malformed entries
  const citiesWithData = Array.from(new Set([
    ...data.attorneys.map(a => a.location.city).filter(Boolean),
    ...data.firms.map(f => f.location.city).filter(Boolean),
    ...data.firms.flatMap(f => f.additional_locations?.map(l => l.city) ?? []).filter(Boolean),
  ])).filter(c => !/^\d/.test(c as string)).sort() as string[]

  const shared = {
    stateSlug,
    stateName: data.state,
    stateAbbr: data.state_abbr,
    practiceAreas: OFFICIAL_PRACTICE_AREAS,
    cities: citiesWithData,
    attorneyCount: data.attorneys.length,
    firmCount: data.firms.length,
  }

  // The fallback is what gets prerendered into the static HTML (step-1 landing);
  // StateFlow swaps in the param-driven view after hydration.
  return (
    <Suspense fallback={<StateLanding {...shared} />}>
      <StateFlow {...shared} />
    </Suspense>
  )
}
