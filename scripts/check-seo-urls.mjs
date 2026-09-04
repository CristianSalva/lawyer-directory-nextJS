// Self-check for the query-param-free URL scheme (SEO audit fixes).
// Needs a running server:  npm run dev  then  node scripts/check-seo-urls.mjs
// Override the target with BASE=https://uslawyerlist.com
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { seoRedirect } from '../cloudflare/worker.js'

const BASE = process.env.BASE ?? 'http://localhost:3000'
const get = async (p) => {
  const r = await fetch(BASE + p, { redirect: 'manual' })
  return { status: r.status, body: r.ok ? await r.text() : '' }
}
const slug = (s) => s.toLowerCase().replace(/['‘’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// 1. The edge 301s that retire every filter query param
const R = (u) => seoRedirect(new URL(u))
assert.equal(R('https://x/virgin-islands?city=Christiansted'), 'https://x/virgin-islands/christiansted')
assert.equal(R('https://x/virgin-islands?city=Christiansted&type=attorney'), 'https://x/virgin-islands/christiansted')
assert.equal(R('https://x/alaska?area=Criminal%20Defense&city=Fairbanks'), 'https://x/alaska/criminal-defense/fairbanks')
assert.equal(R('https://x/alaska?area=Criminal%20Defense&city=Fairbanks&type=attorney'), 'https://x/alaska/criminal-defense/fairbanks')
assert.equal(R('https://x/alaska?area=Criminal%20Defense'), 'https://x/alaska/criminal-defense')
assert.equal(R('https://x/alabama?type=attorney'), 'https://x/alabama')
assert.equal(R('https://x/alabama?type=firm'), 'https://x/alabama')
// /attorneys and /firms are section paths — their ?area= is resolved in the
// page, which is the only place that knows the 120 real practice areas.
assert.equal(R('https://x/attorneys?area=Business%20Law'), null)
assert.equal(R('https://x/firms?area=Criminal%20Defense'), null)
// untouched: clean paths, and cache-busting params the worker must not eat
assert.equal(R('https://x/alaska'), null)
assert.equal(R('https://x/alaska/criminal-defense'), null)
assert.equal(R('https://x/?city=Fairbanks'), null)
assert.equal(R('https://x/alabama?v=123'), null)

// 2. The [area] segment dispatches to the right page, and rejects neither-of-both
for (const [path, status] of [
  ['/virgin-islands/christiansted', 200],              // city hub
  ['/virgin-islands/admiralty-and-maritime', 200],     // practice area
  ['/virgin-islands/admiralty-and-maritime/christiansted', 200],
  ['/virgin-islands/not-a-real-place', 404],
]) {
  const r = await get(path)
  assert.equal(r.status, status, `${path} → ${r.status}, expected ${status}`)
}

const city = await get('/virgin-islands/christiansted')
assert.match(city.body, /Lawyers in <!-- -->Christiansted<!-- -->, <!-- -->VI/, 'city hub h1')
assert.match(city.body, /href="\/virgin-islands\/[a-z-]+\/christiansted"/, 'city hub links to area+city pages')

// 3. City pages must be reachable from the prerendered state page, or the
//    2.5k of them are sitemap-only orphans.
const state = await get('/virgin-islands')
assert.match(state.body, /href="\/virgin-islands\/christiansted"/, 'state page links to city hub')

// 4. No page may emit an internal query-param URL again
for (const p of ['/', '/attorneys', '/firms', '/virgin-islands', '/virgin-islands/christiansted',
                 '/virgin-islands/admiralty-and-maritime',
                 '/virgin-islands/admiralty-and-maritime/christiansted',
                 '/attorneys/criminal-defense']) {
  const r = await get(p)
  const bad = [...r.body.matchAll(/href="(\/[^"]*\?[^"]*)"/g)]
    .map(m => m[1])
    .filter(h => !h.startsWith('/favicon') && !h.startsWith('/_next'))
  assert.deepEqual(bad, [], `${p} emits query-param links: ${bad}`)
}

// 5. The nationwide practice-area hub the homepage now links to
const nat = await get('/attorneys/criminal-defense')
assert.equal(nat.status, 200)
assert.match(nat.body, /href="\/alabama\/criminal-defense"/, 'hub links to state+area pages')

// 6. Every practice area named on the homepage must resolve — three of them
//    used to be invented ("Business Law") and linked 53 states to 404s.
const home = readFileSync('src/app/page.tsx', 'utf8')
const areas = [...home.matchAll(/area: '([^']+)'/g)].map(m => m[1])
assert.ok(areas.length >= 10, `expected the card+row areas, found ${areas.length}`)
for (const a of areas) {
  const s = a.toLowerCase().replace(/['\u2018\u2019]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const r = await get(`/attorneys/${s}`)
  assert.equal(r.status, 200, `homepage links to /attorneys/${s} (${a}) → ${r.status}`)
}

// 7. No component may turn a query param into rendered output. Only `area`
//    and `city` may be read at all, and a read may only feed router.replace()
//    — it must never reach the JSX. (An earlier version of this check only
//    asserted the file called router.replace somewhere, which let params
//    still flow into the markup alongside the redirect.)
const clientFiles = ['src/components/StateFlow.tsx', 'src/components/StatesBrowse.tsx',
                     'src/components/StateLanding.tsx', 'src/components/HeroSearch.tsx',
                     'src/components/CityPage.tsx']
const readParams = []
for (const f of clientFiles) {
  const src = readFileSync(f, 'utf8')
  const reads = [...src.matchAll(/const (\w+) = searchParams\.get\('([^']+)'\)/g)]
  if (!reads.length) {
    assert.ok(!src.includes('searchParams.get'), `${f}: unrecognised searchParams read`)
    continue
  }
  assert.match(src, /router\.replace\(/, `${f} reads a query param but never redirects on it`)
  // Everything from the component's `return (` onward is rendered output.
  const jsx = src.slice(src.indexOf('\n  return '))
  for (const [, name, param] of reads) {
    readParams.push(param)
    assert.doesNotMatch(jsx, new RegExp(`\\b${name}\\b`),
      `${f}: query param '${param}' reaches rendered output via \`${name}\``)
  }
}
assert.deepEqual([...new Set(readParams)].sort(), ['area', 'city'],
  `only area/city may be read (for redirects); found ${[...new Set(readParams)].sort()}`)

// 8. The pages that used to vary by param must now render identically. The
//    dev server stamps a per-request ?v= on its own assets and inlines the
//    request URL in the RSC payload, so compare only the visible markup.
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/\?v=\d+/g, '')
for (const [path, params] of [
  ['/attorneys', ['?location=texas', '?area=Criminal%20Defense', '?type=firm']],
  ['/firms', ['?location=texas', '?type=attorney']],
  ['/alabama', ['?area=Criminal%20Defense', '?city=Mobile', '?type=attorney']],
]) {
  const base = visible((await get(path)).body)
  for (const q of params) {
    const got = visible((await get(path + q)).body)
    assert.equal(got, base, `${path}${q} renders differently from ${path}`)
  }
}

// 9. Cities are matched by slug, not display name: Missouri spells it both
//    "St. Louis" and "St Louis", and both must land on /missouri/st-louis.
const slim = await (await fetch(`${BASE}/data/missouri.json`)).json()
const inStl = slim.attorneys.filter(a => a.city && slug(a.city) === 'st-louis')
const spellings = [...new Set(inStl.map(a => a.city))]
assert.ok(spellings.length > 1, `expected >1 spelling of St Louis in the data, got ${spellings}`)
const stl = await get('/missouri/st-louis')
assert.equal(stl.status, 200)
const shown = Number(stl.body.match(/archive-header-sub">([\d,]+)<!-- --> attorneys/)?.[1]?.replace(/,/g, ''))
assert.equal(shown, inStl.length,
  `/missouri/st-louis shows ${shown} attorneys, expected ${inStl.length} across spellings ${spellings}`)

console.log("seo urls: all checks pass")
