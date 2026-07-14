// Generates sitemap index + chunked sitemaps into cloudflare/assets/ by
// walking the assembled out/ tree — every .html file is a live URL, so the
// sitemap always matches what's actually deployed. Run after assemble.sh.
import { readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = 'https://uslawyerlist.com'
const CHUNK = 45000 // protocol max is 50k URLs per sitemap
const OUT_DIR = 'cloudflare/assets'

const files = (await readdir('out', { recursive: true, withFileTypes: true }))
  .filter(e => e.isFile() && e.name.endsWith('.html'))
  .map(e => path.join(e.parentPath ?? e.path, e.name))

const urls = files
  .map(f => path.relative('out', f).split(path.sep).join('/'))
  .filter(rel => rel !== '404.html' && rel !== '_not-found.html')
  .map(rel => rel === 'index.html' ? `${BASE}/` : `${BASE}/${rel.replace(/\.html$/, '')}`)
  .sort()

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;')

const chunks = []
for (let i = 0; i < urls.length; i += CHUNK) chunks.push(urls.slice(i, i + CHUNK))

for (let i = 0; i < chunks.length; i++) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    chunks[i].map(u => `<url><loc>${esc(u)}</loc></url>`).join('\n') +
    `\n</urlset>\n`
  await writeFile(`${OUT_DIR}/sitemap-${i + 1}.xml`, body)
}

const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  chunks.map((_, i) => `<sitemap><loc>${BASE}/sitemap-${i + 1}.xml</loc></sitemap>`).join('\n') +
  `\n</sitemapindex>\n`
await writeFile(`${OUT_DIR}/sitemap.xml`, index)

console.log(`sitemap: ${urls.length} urls in ${chunks.length} files`)
