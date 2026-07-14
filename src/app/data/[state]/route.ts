import { getStateData, getAllStateSlugs } from '@/lib/data'
import { toSlimAttorney, toSlimFirm } from '@/lib/slim'
import type { SlimStateData } from '@/types'

// Emitted at build time as static /data/{state}.json files consumed by the
// client-side filter flow (StateResults). The full per-state JSON is far too
// large to ship to browsers; this carries card-level fields only.
export const dynamic = 'force-static'

export async function generateStaticParams() {
  return getAllStateSlugs().map((state) => ({ state: `${state}.json` }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state } = await params
  const stateSlug = state.replace(/\.json$/, '')
  const data = getStateData(stateSlug)
  if (!data) return new Response('Not found', { status: 404 })

  const slim: SlimStateData = {
    attorneys: data.attorneys.map(toSlimAttorney),
    firms: data.firms.map(f => toSlimFirm(f, stateSlug)),
  }

  return Response.json(slim)
}
