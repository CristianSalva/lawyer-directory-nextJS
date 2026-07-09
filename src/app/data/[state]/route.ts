import { getStateData, getAllStateSlugs } from '@/lib/data'
import { resolveAttorneyPhoto, resolveFirmPhoto } from '@/lib/photos'
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
    attorneys: data.attorneys.map(a => ({
      slug: a.slug,
      name: a.name,
      firm_name: a.firm_name,
      practice_type: a.practice_type,
      free_consultation: a.free_consultation,
      super_lawyers: a.super_lawyers,
      city: a.location.city,
      state: a.location.state,
      areas: a.practice_areas.slice(0, 4),
      official: a.official_practice_area,
      phone: a.contact.phones[0] ?? null,
      photo: resolveAttorneyPhoto(a.slug)
        ?? (a.photo?.startsWith('http') ? a.photo : null),
    })),
    firms: data.firms.map(f => ({
      slug: f.slug,
      name: f.name,
      practice_type: f.practice_type,
      free_consultation: f.free_consultation,
      super_lawyers: f.super_lawyers,
      city: f.location.city,
      state: f.location.state,
      lat: f.location.lat,
      lng: f.location.lng,
      locs: (f.additional_locations ?? []).map(l => ({
        city: l.city, lat: l.lat, lng: l.lng,
      })),
      areas: f.practice_areas.slice(0, 4),
      official: f.official_practice_area,
      phone: f.contact.phone,
      photo: resolveFirmPhoto(stateSlug, f.location.city, f.slug, f.name ?? null)
        ?? (f.profile_image_url?.startsWith('http') ? f.profile_image_url : null),
    })),
  }

  return Response.json(slim)
}
