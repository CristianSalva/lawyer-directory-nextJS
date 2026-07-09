// Temporary bulk-upload endpoint: accepts multipart batches and writes each
// part to R2 via the binding (data plane — not subject to the ~1200/5min
// Cloudflare REST API rate limit that breaks bulk uploads).
// Deployed only during uploads, then removed with `wrangler delete`.

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('POST only', { status: 405 })
    if (request.headers.get('x-upload-token') !== env.UPLOAD_TOKEN) {
      return new Response('Forbidden', { status: 403 })
    }

    const form = await request.formData()
    const results = []
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') continue
      await env.SITE.put(key, value.stream(), {
        httpMetadata: { contentType: value.type || 'application/octet-stream' },
      })
      results.push(key)
    }
    return Response.json({ uploaded: results.length })
  },
}
