import { readFileSync } from 'fs'
import path from 'path'
import type { StateData, Index, Attorney, Firm } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'src/data')

export function getIndex(): Index {
  const raw = readFileSync(path.join(DATA_DIR, 'index.json'), 'utf-8')
  return JSON.parse(raw)
}

export function getStateData(stateSlug: string): StateData | null {
  try {
    const raw = readFileSync(path.join(DATA_DIR, `${stateSlug}.json`), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getAllStateSlugs(): string[] {
  const index = getIndex()
  return index.states.map((s) => s.file.replace('.json', ''))
}

export function getAttorney(stateSlug: string, attorneySlug: string): Attorney | null {
  const data = getStateData(stateSlug)
  if (!data) return null
  return data.attorneys.find((a) => a.slug === attorneySlug) ?? null
}

export function getFirm(stateSlug: string, firmSlug: string): Firm | null {
  const data = getStateData(stateSlug)
  if (!data) return null
  return data.firms.find((f) => f.slug === firmSlug) ?? null
}

export function stateNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

// Module-level cache: stateAbbr → firms from OTHER states that have an
// additional_location in that state. Populated lazily, persists for the
// lifetime of the Node.js process so each abbr is only scanned once.
const visitingFirmsCache = new Map<string, Firm[]>()

export function getVisitingFirms(stateAbbr: string): Firm[] {
  if (visitingFirmsCache.has(stateAbbr)) return visitingFirmsCache.get(stateAbbr)!

  const index = getIndex()
  const abbrUpper = stateAbbr.toUpperCase()
  const result: Firm[] = []

  for (const s of index.states) {
    const stateSlug = s.file.replace('.json', '')
    const data = getStateData(stateSlug)
    if (!data || data.state_abbr === abbrUpper) continue
    for (const firm of data.firms) {
      if (firm.additional_locations.some(l => l.state?.toUpperCase() === abbrUpper)) {
        result.push(firm)
      }
    }
  }

  visitingFirmsCache.set(stateAbbr, result)
  return result
}

export function getAllAttorneySlugs(): { state: string; slug: string }[] {
  const index = getIndex()
  const result: { state: string; slug: string }[] = []
  for (const s of index.states) {
    const stateSlug = s.file.replace('.json', '')
    const data = getStateData(stateSlug)
    if (data) {
      for (const a of data.attorneys) {
        result.push({ state: stateSlug, slug: a.slug })
      }
    }
  }
  return result
}

export function getAllFirmSlugs(): { state: string; slug: string }[] {
  const index = getIndex()
  const result: { state: string; slug: string }[] = []
  for (const s of index.states) {
    const stateSlug = s.file.replace('.json', '')
    const data = getStateData(stateSlug)
    if (data) {
      for (const f of data.firms) {
        result.push({ state: stateSlug, slug: f.slug })
      }
    }
  }
  return result
}
