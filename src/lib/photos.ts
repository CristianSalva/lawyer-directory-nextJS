import fs from 'fs'
import path from 'path'

interface PhotoIndex {
  attorney_photos: string[]
  attorney_maps: string[]
  firm_photos: string[]
}

let _index: PhotoIndex | null = null

function getIndex(): PhotoIndex {
  if (_index) return _index
  const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/photo-index.json'), 'utf-8')
  _index = JSON.parse(raw)
  return _index!
}

const CDN = process.env.CDN_URL ?? ''

function attorneyFolder(slug: string): string {
  if (/^\d/.test(slug)) return 'missing'
  const parts = slug.split('-')
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  return lastName[0].toLowerCase()
}

export function resolveAttorneyPhoto(slug: string): string | null {
  const { attorney_photos } = getIndex()
  if (!attorney_photos.includes(slug)) return null
  const folder = attorneyFolder(slug)
  return CDN
    ? `${CDN}/attorney-photos/${folder}/${slug}.jpg`
    : `/attorney-photos/${folder}/${slug}.jpg`
}

export function resolveAttorneyMap(slug: string): string | null {
  const { attorney_maps } = getIndex()
  if (!attorney_maps.includes(slug)) return null
  const folder = attorneyFolder(slug)
  return CDN
    ? `${CDN}/attorney-photos/${folder}/${slug}-map.jpg`
    : `/attorney-photos/${folder}/${slug}-map.jpg`
}

export function resolveFirmPhoto(stateSlug: string, city: string | null, slug: string, name: string | null): string | null {
  const { firm_photos } = getIndex()
  const citySlug = (city || '').toLowerCase().replace(/\s+/g, '-').replace(/,/g, '')

  const direct = `${stateSlug}-${citySlug}-${slug}`
  if (firm_photos.includes(direct)) {
    return CDN ? `${CDN}/firm-photos/${direct}.jpg` : `/firm-photos/${direct}.jpg`
  }

  if (name) {
    const ns = name.toLowerCase()
      .replace(/\s*&\s*/g, '--').replace(/\./g, '').replace(/,\s*/g, '-')
      .replace(/\s+/g, '-').replace(/-{3,}/g, '--').replace(/^-|-$/g, '')
    const named = `${stateSlug}-${citySlug}-${ns}`
    if (firm_photos.includes(named)) {
      return CDN ? `${CDN}/firm-photos/${named}.jpg` : `/firm-photos/${named}.jpg`
    }
  }
  return null
}
