// Exports Bloomi's poses as standalone SVG files into src/assets/bloomi/ (bloomi-welcome.svg, ...).
// Run:  npm run export:bloomi
import { mkdirSync, writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BLOOMI_POSES, BLOOMI_VIEWBOX, BloomiArt } from '../src/components/mascot/BloomiArt'

const out = new URL('../src/assets/bloomi/', import.meta.url)
mkdirSync(out, { recursive: true })
for (const pose of BLOOMI_POSES) {
  const body = renderToStaticMarkup(createElement(BloomiArt, { pose, animate: 'none' }))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BLOOMI_VIEWBOX}" width="400" height="504">${body}</svg>\n`
  writeFileSync(new URL(`bloomi-${pose}.svg`, out), svg)
  console.log('wrote', `bloomi-${pose}.svg`)
}
