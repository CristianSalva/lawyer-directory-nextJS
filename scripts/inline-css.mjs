// Replaces the render-blocking stylesheet <link> in every out/**/*.html with
// an inline <style>. Runs after out/ assembly (see deploy-cloudflare.sh) —
// Next's experimental.inlineCss does this too but bloats .next by ~16 GB
// because it also inlines into every RSC segment file.
import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'

// Turbopack emits static/chunks/*.css; webpack emits static/css/*.css.
const cssFiles = (await readdir('.next/static', { recursive: true }))
  .filter(f => f.endsWith('.css'))
if (cssFiles.length !== 1) throw new Error(`expected 1 css file, found: ${cssFiles}`)
const cssName = cssFiles[0].split(path.sep).join('/')
const css = await readFile(`.next/static/${cssName}`, 'utf-8')
const linkTag = `<link rel="stylesheet" href="/_next/static/${cssName}" data-precedence="next"/>`
const styleTag = `<style data-precedence="next">${css}</style>`

const files = (await readdir('out', { recursive: true, withFileTypes: true }))
  .filter(e => e.isFile() && e.name.endsWith('.html'))
  .map(e => path.join(e.parentPath ?? e.path, e.name))

let replaced = 0
for (const f of files) {
  const html = await readFile(f, 'utf-8')
  if (!html.includes(linkTag)) continue
  await writeFile(f, html.replace(linkTag, styleTag))
  replaced++
}
console.log(`inlined ${cssName} into ${replaced}/${files.length} pages`)
