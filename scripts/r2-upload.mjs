// Bulk-uploads a directory tree to the lawyer-directory R2 bucket by POSTing
// multipart batches to the temporary uploader worker (data plane), because
// the Cloudflare REST API rate limit (~1200 req/5min) breaks per-file uploads.
//
//   node scripts/r2-upload.mjs <localDir> [keyPrefix]
//
// Requires: cloudflare/uploader deployed (see scripts/deploy-cloudflare.sh
// comments) and .upload-token present.
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const UPLOAD_URL = process.env.UPLOAD_URL ?? 'https://lawyer-directory-uploader.noel-a02.workers.dev'
const MAX_BATCH_FILES = 25
const MAX_BATCH_BYTES = 8 * 1024 * 1024
const CONCURRENCY = 6

const TYPES = {
  html: 'text/html; charset=utf-8', css: 'text/css', js: 'application/javascript',
  mjs: 'application/javascript', json: 'application/json', txt: 'text/plain',
  xml: 'application/xml', svg: 'image/svg+xml', ico: 'image/x-icon',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', woff: 'font/woff', woff2: 'font/woff2',
  ttf: 'font/ttf', wasm: 'application/wasm', map: 'application/json',
}
const contentType = (k) => TYPES[k.split('.').pop()?.toLowerCase()] ?? 'application/octet-stream'

const [, , localDir, keyPrefix = ''] = process.argv
if (!localDir) {
  console.error('Usage: node scripts/r2-upload.mjs <localDir> [keyPrefix]')
  process.exit(1)
}

const token = (await readFile(new URL('../.upload-token', import.meta.url), 'utf-8')).trim()

const root = path.resolve(localDir)
const files = (await readdir(root, { recursive: true, withFileTypes: true }))
  .filter(e => e.isFile() && !e.name.startsWith('.'))
  .map(e => path.join(e.parentPath ?? e.path, e.name))

// Pack into batches capped by count and bytes.
const batches = []
let current = []
let currentBytes = 0
for (const file of files) {
  const size = (await stat(file)).size
  if (current.length >= MAX_BATCH_FILES || (currentBytes + size > MAX_BATCH_BYTES && current.length > 0)) {
    batches.push(current)
    current = []
    currentBytes = 0
  }
  current.push(file)
  currentBytes += size
}
if (current.length) batches.push(current)

console.log(`Uploading ${files.length} files in ${batches.length} batches from ${root} → r2://lawyer-directory/${keyPrefix}`)

let done = 0
let failedFiles = 0
const queue = [...batches]

async function sendBatch(batch) {
  const form = new FormData()
  for (const file of batch) {
    const rel = path.relative(root, file).split(path.sep).join('/')
    const key = keyPrefix ? `${keyPrefix}/${rel}` : rel
    const buf = await readFile(file)
    form.append(key, new Blob([buf], { type: contentType(key) }))
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { 'x-upload-token': token },
        body: form,
      })
      if (res.ok) return
      if (attempt === 4) throw new Error(`status ${res.status}: ${await res.text()}`)
    } catch (err) {
      if (attempt === 4) throw err
    }
    await new Promise(r => setTimeout(r, 1500 * attempt))
  }
}

async function worker() {
  for (;;) {
    const batch = queue.shift()
    if (!batch) return
    try {
      await sendBatch(batch)
    } catch (err) {
      failedFiles += batch.length
      console.error(`FAILED batch (${batch.length} files, first: ${batch[0]}): ${err.message}`)
    }
    done++
    if (done % 50 === 0) console.log(`  batch ${done}/${batches.length}`)
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))
console.log(`Done: ${batches.length - Math.ceil(failedFiles / MAX_BATCH_FILES)} batches ok, ${failedFiles} files failed.`)
if (failedFiles > 0) process.exit(1)
