import { getStateData, getAllStateSlugs } from '@/lib/data'
import { toSlimAttorney, toSlimFirm } from '@/lib/slim'
import type { SlimStateData } from '@/types'

// Emitted at build time as static /data/{state}.json files consumed by the
// retired client-side filter flow. Now unused: every filter combination has
// a prerendered page instead. Kept only because scripts/assemble.sh and
// deploy-cloudflare.sh copy out/data/*.json — delete all three together.
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
