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
