// Serves a deck as `virtual:deck` and reloads the browser when its sources change.
import fs from 'node:fs'
import path from 'node:path'
import { compileDeck, COMPONENTS_DIR } from './compile/index.js'

const VIRTUAL = 'virtual:deck'
const RESOLVED = '\0' + VIRTUAL
const MEDIA_DIRS = ['img', 'media']

// includePrivate: false strips `{.private}` slides and ships only media the remaining slides use.
export function deckPlugin(deckDir, { includePrivate = true } = {}) {
  let last = { meta: {} }
  const watched = (file) =>
    (file.startsWith(deckDir) && /\.(md|ya?ml|js)$/.test(file)) ||
    (file.startsWith(COMPONENTS_DIR) && file.endsWith('parse.js'))

  return {
    name: 'present-deck',

    resolveId(id) {
      if (id === VIRTUAL) return RESOLVED
    },

    async load(id) {
      if (id !== RESOLVED) return
      last = await compileDeck(deckDir, { includePrivate })
      for (const w of last.warnings) this.warn(w)
      const custom = customEffects(deckDir, last.fx)
      const imports = custom.map(({ file }, i) => `import * as custom${i} from ${JSON.stringify(file)}`)
      const map = custom.map(({ name }, i) => `${JSON.stringify(name)}: custom${i}`)
      return [
        ...imports,
        `export default {`,
        `  meta: ${JSON.stringify({ slug: path.basename(deckDir), ...last.meta })},`,
        `  html: ${JSON.stringify(last.html)},`,
        `  fx: ${JSON.stringify(last.fx)},`,
        `  warnings: ${JSON.stringify(last.warnings)},`,
        `  custom: { ${map.join(', ')} },`,
        `}`,
      ].join('\n')
    },

    async transformIndexHtml(html) {
      last = await compileDeck(deckDir, { includePrivate })
      const { title = path.basename(deckDir), lang = 'en', mode = 'light' } = last.meta
      return html
        .replace('<html>', `<html lang="${lang}" class="mode-${mode}">`)
        .replace('<title></title>', `<title>${escape(title)}</title>`)
    },

    configureServer(server) {
      server.watcher.add([deckDir, COMPONENTS_DIR])
      const reload = (file) => {
        if (!watched(file)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('change', reload)
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
      // Deck media is served from the deck folder as-is.
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0])
        const file = path.join(deckDir, url)
        if (MEDIA_DIRS.some((d) => url.startsWith(`/${d}/`)) && file.startsWith(deckDir) && fs.existsSync(file)) {
          return fs.createReadStream(file).pipe(res)
        }
        next()
      })
    },

    generateBundle() {
      // Only referenced media: unused or private-only files never leave the machine.
      for (const file of last.media) {
        this.emitFile({ type: 'asset', fileName: file, source: fs.readFileSync(path.join(deckDir, file)) })
      }
      if (last.privateIds.length) this.info?.(`left out private slide(s): ${last.privateIds.join(', ')}`)
    },
  }
}

function customEffects(deckDir, fx) {
  const names = new Set()
  for (const slide of Object.values(fx.slides ?? {})) {
    for (const e of slide?.effects ?? []) if (e.custom) names.add(e.custom)
  }
  return [...names]
    .map((name) => ({ name, file: path.join(deckDir, 'fx', 'custom', `${name}.js`) }))
    .filter(({ file }) => fs.existsSync(file))
}


const escape = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
