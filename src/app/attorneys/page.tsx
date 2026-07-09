import { Suspense } from 'react'
import { getIndex } from '@/lib/data'
import StatesBrowseWithParams, { StatesBrowse } from '@/components/StatesBrowse'

export default function AttorneysPage() {
  const index = getIndex()
  return (
    <Suspense fallback={<StatesBrowse index={index} kind="attorney" />}>
      <StatesBrowseWithParams index={index} kind="attorney" />
    </Suspense>
  )
}
