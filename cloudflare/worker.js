// Serves the static-exported site from R2. Hashed build assets (/_next/*,
// icons) are served by Workers static assets before this code runs; only
// HTML pages, /data/*.json, and photos reach the worker.

const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css',
  js: 'application/javascript',
  mjs: 'application/javascript',
  json: 'application/json',
  txt: 'text/plain',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  wasm: 'application/wasm',
}

function contentType(key) {
  const ext = key.split('.').pop()?.toLowerCase()
  return TYPES[ext] ?? 'application/octet-stream'
}

function cacheControl(key) {
  // Photos and hashed assets never change; HTML/data change on redeploy.
  // Long edge TTL keeps PageSpeed's test regions warm — pages go stale for
  // up to a day after a redeploy, which is fine for this content.
  if (key.endsWith('.html') || key.endsWith('.json')) {
    return 'public, max-age=0, s-maxage=86400'
  }
  return 'public, max-age=31536000, immutable'
}

// Graded by WebPageTest/securityheaders.com and friends. script/style need
// 'unsafe-inline' (Next inlines RSC bootstrap scripts and we inline the CSS);
// img-src allows https: for the remote photo fallbacks. No includeSubDomains
// on HSTS — the zone may host unrelated subdomains.
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

async function lookup(bucket, pathname) {
  let key = decodeURIComponent(pathname).replace(/^\/+/, '').replace(/\/+$/, '')
  if (key === '') key = 'index.html'
  const candidates = key.includes('.') ? [key] : [`${key}.html`, key, `${key}/index.html`]
  for (const k of candidates) {
    const obj = await bucket.get(k)
    if (obj) return { key: k, obj }
  }
  return null
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }

    const cache = caches.default
    // The site is fully static — query strings never change the response
    // (?area=&city= filtering is client-side). Cache on the bare path so
    // cache-busting params (e.g. PageSpeed's) still hit the edge cache.
    const keyUrl = new URL(request.url)
    keyUrl.search = ''
    const cacheKey = new Request(keyUrl.toString())
    const cached = await cache.match(cacheKey)
    if (cached) {
      // Re-apply on hits too: entries stored before a header change would
      // otherwise serve stale headers for up to their full TTL.
      const headers = new Headers(cached.headers)
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v)
      return request.method === 'HEAD'
        ? new Response(null, { status: cached.status, headers })
        : new Response(cached.body, { status: cached.status, headers })
    }

    const url = new URL(request.url)
    const found = await lookup(env.SITE, url.pathname)

    let response
    if (found) {
      const { key, obj } = found
      response = new Response(obj.body, {
        headers: {
          'Content-Type': obj.httpMetadata?.contentType ?? contentType(key),
          'Cache-Control': cacheControl(key),
          'ETag': obj.httpEtag,
          ...SECURITY_HEADERS,
        },
      })
    } else {
      const nf = await env.SITE.get('404.html')
      response = new Response(nf ? nf.body : 'Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300', ...SECURITY_HEADERS },
      })
    }

    ctx.waitUntil(cache.put(cacheKey, response.clone()))
    return request.method === 'HEAD'
      ? new Response(null, { status: response.status, headers: response.headers })
      : response
  },
}
