import { readFileSync } from 'fs'
import path from 'path'
import { toSlug } from '@/lib/slugs'
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

// BUILD_SAMPLE=1 prerenders only a handful of profiles — a fast smoke test
// of build config changes before committing to the full ~85-minute build.
const SAMPLE = process.env.BUILD_SAMPLE ? 20 : Infinity

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
  return result.slice(0, SAMPLE === Infinity ? result.length : SAMPLE)
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
  return result.slice(0, SAMPLE === Infinity ? result.length : SAMPLE)
}

// Params for the prerendered SEO pages: /{state}/{area}, /{state}/{city} and
// /{state}/{area}/{city}, emitted only for combinations with ≥1 attorney or
// firm so no thin/empty pages get indexed. Computed once per build.
let _areaParams: { state: string; area: string }[] | null = null
let _cityParams: { state: string; city: string }[] | null = null
let _areaCityParams: { state: string; area: string; city: string }[] | null = null
// areaSlug → { name, per-state record counts } for the nationwide
// /attorneys/{area} hub pages.
let _areaStates: Map<string, AreaStates> | null = null

export interface AreaStates {
  name: string
  states: { state: string; attorneys: number; firms: number }[]
  attorneys: number
  firms: number
}

function computeSeoParams() {
  const areaSet = new Map<string, { state: string; area: string }>()
  const areaStates = new Map<string, AreaStates>()
  const cityOnlySet = new Map<string, { state: string; city: string }>()
  const citySet = new Map<string, { state: string; area: string; city: string }>()
  for (const stateSlug of getAllStateSlugs()) {
    const data = getStateData(stateSlug)
    if (!data) continue
    // Attorneys and firms walked separately so each record's kind is known
    // without scanning back into the arrays.
    for (const [recs, isAttorney] of [[data.attorneys, true], [data.firms, false]] as const) {
      for (const rec of recs) {
        const city = rec.location.city
        const citySlugged = city && !/^\d/.test(city) ? toSlug(city) : null
        // A record with no mapped practice area still anchors a city hub page.
        if (citySlugged) {
          cityOnlySet.set(`${stateSlug}/${citySlugged}`, { state: stateSlug, city: citySlugged })
        }
        for (const area of rec.official_practice_area) {
          const a = toSlug(area)
          areaSet.set(`${stateSlug}/${a}`, { state: stateSlug, area: a })
          let entry = areaStates.get(a)
          if (!entry) {
            entry = { name: area, states: [], attorneys: 0, firms: 0 }
            areaStates.set(a, entry)
          }
          let row = entry.states.at(-1)
          if (row?.state !== stateSlug) {
            row = { state: stateSlug, attorneys: 0, firms: 0 }
            entry.states.push(row)
          }
          if (isAttorney) { row.attorneys++; entry.attorneys++ } else { row.firms++; entry.firms++ }
          if (citySlugged) {
            citySet.set(`${stateSlug}/${a}/${citySlugged}`, { state: stateSlug, area: a, city: citySlugged })
          }
        }
      }
    }
  }
  for (const e of areaStates.values()) e.states.sort((a, b) => a.state.localeCompare(b.state))
  _areaStates = areaStates
  _areaParams = [...areaSet.values()]
  _cityParams = [...cityOnlySet.values()]
  _areaCityParams = [...citySet.values()]
}

export function getAreaParams(): { state: string; area: string }[] {
  if (!_areaParams) computeSeoParams()
  return _areaParams!.slice(0, SAMPLE === Infinity ? undefined : SAMPLE)
}

// Nationwide practice-area hubs: /attorneys/{area}. One per area that has at
// least one record somewhere in the country.
export function getNationalAreaParams(): { area: string }[] {
  if (!_areaStates) computeSeoParams()
  const all = [..._areaStates!.keys()].map(area => ({ area }))
  return all.slice(0, SAMPLE === Infinity ? undefined : SAMPLE)
}

export function getAreaStates(areaSlug: string): AreaStates | null {
  if (!_areaStates) computeSeoParams()
  return _areaStates!.get(areaSlug) ?? null
}

export function getCityParams(): { state: string; city: string }[] {
  if (!_cityParams) computeSeoParams()
  return _cityParams!.slice(0, SAMPLE === Infinity ? undefined : SAMPLE)
}

export function getAreaCityParams(): { state: string; area: string; city: string }[] {
  if (!_areaCityParams) computeSeoParams()
  return _areaCityParams!.slice(0, SAMPLE === Infinity ? undefined : SAMPLE)
}

// Resolve a city slug back to its display name within a state.
export function cityFromSlug(data: StateData, citySlug: string): string | null {
  for (const rec of [...data.attorneys, ...data.firms]) {
    const c = rec.location.city
    if (c && toSlug(c) === citySlug) return c
  }
  for (const f of data.firms) {
    for (const l of f.additional_locations ?? []) {
      if (l.city && toSlug(l.city) === citySlug) return l.city
    }
  }
  return null
}
