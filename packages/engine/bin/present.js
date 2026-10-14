#!/usr/bin/env node
// present dev [deck]   — live-reloading local presentation (includes {.private} slides)
//   --public           — preview exactly what gets exported (private slides left out)
// present build [deck] — static, offline-capable site in dist/<deck>/ (never includes private slides)
// present check [deck] — effect harness: step through every slide, report errors and leaks
// present outline [deck] — JSON for tooling (/deck-spice): slides, fx status, presets, components
//   --mark             — record the current slides as spiced (in fx.yaml's sibling .fx-state.json)
//   --mark=id,id       — record only these slides
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, build } from 'vite'
import { deckPlugin } from '../src/vite-plugin.js'

const ENGINE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO_DIR = path.resolve(ENGINE_DIR, '../..')
const DECKS_DIR = path.join(REPO_DIR, 'decks')

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')).map((a) => a.split('=')[0]))
const flagValue = (name) => args.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1)
const [cmd = 'dev', deckArg] = args.filter((a) => !a.startsWith('--'))
const includePrivate = cmd !== 'build' && !flags.has('--public')
const deckDir = findDeck(deckArg)
const name = path.basename(deckDir)

const config = {
  configFile: false,
  root: ENGINE_DIR,
  base: './',
  publicDir: false,
  plugins: [deckPlugin(deckDir, { includePrivate })],
  server: { fs: { allow: [REPO_DIR] }, open: true },
  build: { outDir: path.join(REPO_DIR, 'dist', name), emptyOutDir: true, assetsInlineLimit: 0 },
  logLevel: 'info',
}

if (cmd === 'dev') {
  const server = await createServer(config)
  await server.listen()
  server.printUrls()
} else if (cmd === 'build') {
  await build(config)
} else if (cmd === 'check') {
  const { checkDeck } = await import('../src/check.js')
  const server = await createServer({ ...config, logLevel: 'warn', server: { ...config.server, open: false, port: 0 } })
  await server.listen()
  console.log(`checking ${name}…`)
  const { problems, warnings } = await checkDeck(server.resolvedUrls.local[0])
  await server.close()
  for (const w of warnings) console.log(`  ⚠ ${w}`)
  for (const p of problems) console.log(`  ✗ ${p}`)
  console.log(problems.length ? `${problems.length} problem(s)` : `ok${warnings.length ? ` with ${warnings.length} warning(s)` : ''}`)
  process.exit(problems.length ? 1 : 0)
} else if (cmd === 'outline') {
  const { outline } = await import('../src/outline.js')
  console.log(JSON.stringify(await outline(deckDir, { mark: flags.has('--mark') && (flagValue('--mark')?.split(',') ?? true) }), null, 2))
} else {
  console.error(`unknown command "${cmd}" — use dev, build, check or outline`)
  process.exit(1)
}

function findDeck(arg) {
  if (arg) {
    const candidates = [path.resolve(arg), path.join(DECKS_DIR, arg)]
    const found = candidates.find((p) => fs.existsSync(path.join(p, 'content.md')))
    if (!found) fail(`no content.md in ${candidates.join(' or ')}`)
    return found
  }
  const decks = fs.existsSync(DECKS_DIR) ? fs.readdirSync(DECKS_DIR).filter((d) => fs.existsSync(path.join(DECKS_DIR, d, 'content.md'))) : []
  if (decks.length === 1) return path.join(DECKS_DIR, decks[0])
  fail(`which deck? ${decks.join(', ') || '(none in decks/)'}`)
}

function fail(msg) {
  console.error(msg)
  process.exit(1)
}
