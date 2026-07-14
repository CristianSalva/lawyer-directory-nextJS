import { resolveAttorneyPhoto, resolveFirmPhoto } from '@/lib/photos'
import type { Attorney, Firm, SlimAttorney, SlimFirm } from '@/types'

// Card-level projections shared by the /data/{state}.json route (client-side
// filtering) and the prerendered /{state}/{area}[/{city}] SEO pages.

export function toSlimAttorney(a: Attorney): SlimAttorney {
  return {
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
  }
}

export function toSlimFirm(f: Firm, stateSlug: string): SlimFirm {
  return {
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
  }
}
