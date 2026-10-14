// A deck as data, for tooling such as /deck-spice: which slides exist, what they contain,
// which ones changed since they were last spiced, and which presets/components are available.
import fs from 'node:fs'
import path from 'node:path'
import { compileDeck, COMPONENTS_DIR } from './compile/index.js'

const ENGINE_DIR = path.dirname(COMPONENTS_DIR)
const STATE_FILE = '.fx-state.json'

export async function outline(deckDir, { mark = false } = {}) {
  const deck = await compileDeck(deckDir)
  const fxSlides = deck.fx.slides ?? {}
  const statePath = path.join(deckDir, STATE_FILE)
  const state = readJson(statePath) ?? {}

  const slides = deck.slides.map((s) => {
    const entry = fxSlides[s.id]
    const locked = entry?.locked === true || (entry?.effects ?? []).some((e) => e.locked)
    let fx = 'new'
    if (state[s.id] && state[s.id] === s.hash) fx = 'spiced'
    else if (state[s.id]) fx = 'changed'
    else if (entry) fx = 'unknown' // has fx but was never recorded: spiced by hand or before tracking
    return { ...s, fx, locked, intent: entry?.intent ?? null }
  })

  if (mark) {
    // mark: true = every slide; an array of ids = only those (the rest keep their previous state).
    const chosen = slides.filter((s) => s.hash && (mark === true || mark.includes(s.id)))
    const next = { ...(mark === true ? {} : state), ...Object.fromEntries(chosen.map((s) => [s.id, s.hash])) }
    fs.writeFileSync(statePath, JSON.stringify(next, null, 2) + '\n')
  }

  const ids = new Set(slides.map((s) => s.id))
  return {
    deck: path.basename(deckDir),
    tempo: deck.fx.tempo ?? deck.meta.tempo ?? 120,
    defaults: deck.fx.defaults ?? {},
    slides,
    orphans: Object.keys(fxSlides).filter((id) => !ids.has(id)),
    warnings: deck.warnings,
    presets: describe(path.join(ENGINE_DIR, 'presets'), (f) => f.endsWith('.js')),
    components: describe(COMPONENTS_DIR, (f) => fs.statSync(path.join(COMPONENTS_DIR, f)).isDirectory(), 'parse.js', 'animate.js', 'style.css'),
    custom: describe(path.join(deckDir, 'fx', 'custom'), (f) => f.endsWith('.js')),
    mascot: mascot(),
  }
}

// Name + leading comment block of each preset/component/custom effect.
function describe(dir, include, ...files) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(include).map((f) => {
    const name = f.replace(/\.js$/, '')
    const paths = files.length ? files.map((x) => path.join(dir, f, x)).filter((x) => fs.existsSync(x)) : [path.join(dir, f)]
    const about = []
    for (const file of paths) {
      for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^\s*(?:\/\/|\/\*|\*)\s?(.*?)(?:\*\/)?$/)
        if (!m) break
        if (m[1].trim()) about.push(m[1].trim())
      }
    }
    return { name, about: [...new Set(about)].join(' ') }
  })
}

// Bit's repertoire, read from the source so new motions show up as soon as they're added.
function mascot() {
  const file = path.join(ENGINE_DIR, 'mascot', 'bot.js')
  if (!fs.existsSync(file)) return null
  const src = fs.readFileSync(file, 'utf8')
  const moods = JSON.parse((src.match(/export const MOODS = (\[[^\]]*\])/)?.[1] ?? '[]').replace(/'/g, '"'))
  const motions = [...src.matchAll(/\/\*\*\s*(.*?)\s*\*\/\s*\n\s*(\w+)\(([^)]*)\)\s*\{/g)]
    .map(([, about, name, args]) => ({ name, about, ...(args.trim() ? { args: args.trim() } : {}) }))
    .filter((m) => !['idle', 'mood', 'face'].includes(m.name))
  return { preset: 'bit', moods, motions }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}
