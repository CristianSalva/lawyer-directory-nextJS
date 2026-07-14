import { OFFICIAL_PRACTICE_AREAS } from '@/lib/practice-areas'

// "Assault and Battery (Plaintiff)" → "assault-and-battery-plaintiff"
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const AREA_BY_SLUG = new Map(OFFICIAL_PRACTICE_AREAS.map(a => [toSlug(a), a]))

export function areaFromSlug(slug: string): string | null {
  return AREA_BY_SLUG.get(slug) ?? null
}
