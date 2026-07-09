import { Suspense } from 'react'
import { getIndex } from '@/lib/data'
import StatesBrowseWithParams, { StatesBrowse } from '@/components/StatesBrowse'

export default function FirmsPage() {
  const index = getIndex()
  return (
    <Suspense fallback={<StatesBrowse index={index} kind="firm" />}>
      <StatesBrowseWithParams index={index} kind="firm" />
    </Suspense>
  )
}
