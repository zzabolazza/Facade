import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const chars = require('@iconify-json/twemoji/chars.json')
const iconSet = require('@iconify-json/twemoji/icons.json')
const outputDir = resolve(scriptDir, '../public/twemoji/flags')

function regionalIndicatorCodePoint(letter) {
  return 0x1f1e6 + letter.charCodeAt(0) - 'A'.charCodeAt(0)
}

function codePointKey(countryCode) {
  return [...countryCode]
    .map((letter) => regionalIndicatorCodePoint(letter).toString(16))
    .join('-')
}

function renderSvg(icon) {
  const left = icon.left ?? iconSet.left ?? 0
  const top = icon.top ?? iconSet.top ?? 0
  const width = icon.width ?? iconSet.width ?? 36
  const height = icon.height ?? iconSet.height ?? 36
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}">${icon.body}</svg>\n`
}

await rm(outputDir, { recursive: true, force: true })
await mkdir(outputDir, { recursive: true })

let generatedCount = 0
for (let first = 0; first < 26; first += 1) {
  for (let second = 0; second < 26; second += 1) {
    const countryCode = String.fromCharCode(65 + first, 65 + second)
    const iconName = chars[codePointKey(countryCode)]
    const icon = iconName ? iconSet.icons[iconName] : undefined
    if (!icon) continue

    await writeFile(
      resolve(outputDir, `${countryCode.toLowerCase()}.svg`),
      renderSvg(icon),
      'utf8',
    )
    generatedCount += 1
  }
}

if (generatedCount < 200) {
  throw new Error(`Expected at least 200 Twemoji flags, generated ${generatedCount}`)
}

const generatedFiles = await readdir(outputDir)
console.log(`Prepared ${generatedFiles.length} local Twemoji flag SVGs.`)
