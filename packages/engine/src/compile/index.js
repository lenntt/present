// content.md (+ fx.yaml) → reveal.js slide HTML, deck metadata and fx config.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import { toString as mdToString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import { h } from 'hastscript'
import GithubSlugger from 'github-slugger'
import YAML from 'yaml'
import { createHash } from 'node:crypto'
import remarkAttributes from './attributes.js'
import remarkMark from './mark.js'
import { figureFor } from './media.js'

const ENGINE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const COMPONENTS_DIR = path.join(ENGINE_DIR, 'components')

const BUILTIN_BLOCKS = new Set(['notes', 'aside'])
const isPause = (node) => node.type === 'paragraph' && mdToString(node).trim() === '. . .'

// `{.private}` slides are shown when presenting locally and dropped (with their media,
// notes and fx entries) from anything that leaves the machine: pass includePrivate: false.
export async function compileDeck(deckDir, { includePrivate = true } = {}) {
  const warnings = []
  const warn = (msg) => warnings.push(msg)

  // Accept the Pandoc-style `::: name` as well as remark-directive's `:::name`.
  const src = fs.readFileSync(path.join(deckDir, 'content.md'), 'utf8').replace(/^(\s*:{3,})[ \t]+(?=[A-Za-z])/gm, '$1')
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkAttributes)
    .use(remarkMark)
  const tree = processor.runSync(processor.parse(src))

  const fm = tree.children.find((n) => n.type === 'yaml')
  const meta = fm ? YAML.parse(fm.value) ?? {} : {}
  tree.children = tree.children.filter((n) => n.type !== 'yaml')

  const components = await loadComponents()
  prepareDirectives(tree, components, warn)

  const slugger = new GithubSlugger()
  const slides = splitSlides(tree.children).map((slide, i) => {
    const attrs = slide.heading?.data?.attrs
    const title = slide.heading ? mdToString(slide.heading) : ''
    slide.id = attrs?.id ?? (title ? slugger.slug(title) : `slide-${i + 1}`)
    slide.classes = attrs?.classes ?? []
    slide.title = title
    // `<!-- fx: … -->` comments are ideas for /deck-spice; like all comments they never reach the output.
    slide.hints = slide.body
      .filter((n) => n.type === 'html')
      .map((n) => n.value.match(/^<!--\s*fx:\s*([\s\S]*?)\s*-->$/)?.[1])
      .filter(Boolean)
    // Fingerprint of the slide's own Markdown, so /deck-spice can tell which slides changed.
    const nodes = [slide.heading, ...slide.body].filter(Boolean)
    const from = nodes[0]?.position?.start.offset ?? 0
    const to = nodes.at(-1)?.position?.end.offset ?? from
    slide.hash = createHash('sha1').update(src.slice(from, to).trim()).digest('hex').slice(0, 10)
    return slide
  })
  const privateIds = new Set(slides.filter((s) => s.classes.includes('private')).map((s) => s.id))
  const shown = includePrivate ? slides : slides.filter((s) => !privateIds.has(s.id))

  const sections = []
  if (meta.title) sections.push(coverSection(meta))
  for (const slide of shown) sections.push(renderSlide(slide, components, warn))

  // Local media actually used by the rendered slides — the build ships only these.
  const media = new Set()
  for (const section of sections) {
    visit(section, 'element', (el) => {
      const src = (el.tagName === 'img' || el.tagName === 'video') && el.properties.src
      if (!src || /^(https?:|data:)/.test(src)) return
      if (fs.existsSync(path.join(deckDir, src))) media.add(path.normalize(src))
      else warn(`missing media "${src}" on slide "${section.properties.dataSlide}"`)
    })
  }

  const fx = loadFx(deckDir, warn)
  const ids = new Set(slides.map((s) => s.id).concat(meta.title ? ['cover'] : []))
  for (const id of Object.keys(fx.slides ?? {})) {
    if (!ids.has(id)) warn(`fx.yaml: slide "${id}" matches no slide in content.md`)
    else if (!includePrivate && privateIds.has(id)) delete fx.slides[id]
  }

  return {
    meta,
    html: sections.map((s) => toHtml(s)).join('\n'),
    slides: sections.map((section) => summarize(section, slides, meta)),
    fx,
    slideIds: shown.map((s) => s.id),
    privateIds: [...privateIds],
    media: [...media],
    warnings,
  }
}

// What a slide contains, for tooling (`present outline`) — not used for rendering.
function summarize(section, slides, meta) {
  const id = section.properties.dataSlide
  const source = slides.find((s) => s.id === id)
  const out = {
    id,
    title: source?.title ?? '(cover)',
    layout: [].concat(section.properties.className).find((c) => c.startsWith('layout-')),
    private: !!source?.classes.includes('private'),
    steps: Number(section.properties.dataFragments ?? 0),
    components: [],
    emphasis: [],
    media: [],
    hasNotes: false,
    hints: source?.hints ?? [],
    hash: source?.hash ?? createHash('sha1').update(JSON.stringify(meta)).digest('hex').slice(0, 10),
  }
  visit(section, 'element', (el) => {
    if (el.properties?.dataComponent) out.components.push(el.properties.dataComponent)
    if (el.tagName === 'mark') out.emphasis.push(hastText(el))
    if ((el.tagName === 'img' || el.tagName === 'video') && el.properties.src) out.media.push(el.properties.src)
    if (el.tagName === 'a' && (el.properties.dataYoutube || el.properties.dataMap)) out.media.push(el.properties.href)
    if (isClass(el, 'notes')) out.hasNotes = true
  })
  return out
}

const hastText = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(hastText).join(''))

async function loadComponents() {
  const components = {}
  if (!fs.existsSync(COMPONENTS_DIR)) return components
  for (const name of fs.readdirSync(COMPONENTS_DIR)) {
    const dir = path.join(COMPONENTS_DIR, name)
    if (!fs.statSync(dir).isDirectory()) continue
    const parseFile = path.join(dir, 'parse.js')
    const mod = fs.existsSync(parseFile) ? await import(pathToFileURL(parseFile).href + `?t=${fs.statSync(parseFile).mtimeMs}`) : null
    components[name] = { parse: mod?.default }
  }
  return components
}

function prepareDirectives(tree, components, warn) {
  visit(tree, (node, index, parent) => {
    if (node.type === 'textDirective' || node.type === 'leafDirective') {
      // Not a block we know: give the colon back so prose like "Note:this" survives.
      const text = { type: 'text', value: `:${node.name}` }
      parent.children.splice(index, 1, text, ...node.children)
      return index
    }
    if (node.type !== 'containerDirective') return
    const data = (node.data ??= {})
    const attrs = node.attributes ?? {}
    const extra = attrs.class ? attrs.class.split(/\s+/) : []
    if (node.name === 'notes') {
      data.hName = 'aside'
      data.hProperties = { className: ['notes'] }
    } else if (node.name === 'aside') {
      data.hName = 'div'
      data.hProperties = { className: ['aside', ...extra] }
    } else {
      if (!components[node.name]) warn(`unknown component "${node.name}" — rendered as plain markdown in <div class="${node.name}">`)
      data.hName = 'div'
      data.hProperties = { className: [node.name, 'component', ...extra], dataComponent: node.name, ...(attrs.id ? { id: attrs.id } : {}) }
    }
  })
}

function splitSlides(nodes) {
  const slides = []
  let current = null
  for (const node of nodes) {
    if (node.type === 'heading' && node.depth <= 2) {
      current = { kind: node.depth === 1 ? 'section' : 'slide', heading: node, body: [] }
      slides.push(current)
    } else if (node.type === 'thematicBreak') {
      current = { kind: 'slide', heading: null, body: [] }
      slides.push(current)
    } else {
      if (!current) slides.push((current = { kind: 'slide', heading: null, body: [] }))
      current.body.push(node)
    }
  }
  return slides
}

function coverSection(meta) {
  const affiliation = [].concat(meta.affiliation ?? [])
  return h('section', { id: 'cover', className: ['slide', 'layout-cover'], dataSlide: 'cover' }, [
    h('div.frame.cover-inner', [
      meta.subtitle ? h('p.cover-kicker', meta.subtitle) : null,
      h('h1.cover-title', meta.title),
      h('div.cover-meta', [
        meta.author ? h('p.cover-author', meta.author) : null,
        ...affiliation.map((a) => h('p.cover-affiliation', a)),
      ]),
    ]),
  ])
}

function renderSlide(slide, components, warn) {
  // Split the body into pause segments; segment n > 0 becomes fragment n - 1.
  const segments = [[]]
  for (const node of slide.body) {
    if (isPause(node)) segments.push([])
    else segments.at(-1).push(node)
  }

  const notes = []
  const main = []
  const media = []
  const backgrounds = []
  const ctx = { warn, slideId: slide.id }

  segments.forEach((nodes, seg) => {
    for (const node of nodes) {
      for (let el of toElements(node)) {
        if (isClass(el, 'notes')) { notes.push(el); continue }
        el = transformMedia(el)
        markTips(el)
        el = runComponents(el, components, ctx)
        if (seg > 0) {
          el.properties.className = [...(el.properties.className ?? []), 'fragment']
          el.properties.dataFragmentIndex = String(seg - 1)
        }
        if (isClass(el, 'aside')) main.push(el)
        else if (el.tagName === 'figure' && isClass(el, 'bg')) backgrounds.push(el)
        else if (el.tagName === 'figure' || isClass(el, 'media-row')) media.push(el)
        else main.push(el)
      }
    }
  })

  const layout = inferLayout(slide, main, media)
  const head = slide.heading ? toHast(slide.heading) : null
  if (head && head.properties) delete head.properties.id
  if (head) {
    const cls = [].concat(head.properties.className ?? []).filter((c) => !c.startsWith('layout-') && c !== 'cover')
    if (cls.length) head.properties.className = cls
    else delete head.properties.className
  }

  // Media sits in its own column for split layouts; otherwise inline in reading order.
  const split = layout === 'layout-split' || layout === 'layout-split-left'
  const body = split
    ? [h('div.col-main', main), h('div.col-media', media)]
    : [...main, ...media]

  return h('section', {
    id: slide.id,
    className: ['slide', layout, ...slide.classes.filter((c) => c !== 'cover')],
    dataSlide: slide.id,
    dataFragments: String(segments.length - 1),
  }, [
    h('div.frame', [
      ...backgrounds,
      head ? h('header.slide-head', [head]) : null,
      h('div.slide-body', body),
    ]),
    ...notes,
  ])
}

function inferLayout(slide, main, media) {
  if (slide.kind === 'section') return 'layout-section'
  if (slide.classes.includes('cover')) return 'layout-cover'
  const explicit = slide.classes.find((c) => c.startsWith('layout-'))
  if (explicit) return explicit
  const text = main.filter((el) => !isClass(el, 'aside'))
  if (!media.length) return 'layout-text'
  if (!text.length) return media.length === 1 && isClass(media[0], 'full') ? 'layout-full' : 'layout-picture'
  if (media.some((f) => isClass(f, 'left'))) return 'layout-split-left'
  if (media.some((f) => isClass(f, 'full'))) return 'layout-stack'
  return 'layout-split'
}

function toElements(mdNode) {
  const root = toHast({ type: 'root', children: [mdNode] })
  return root.children.filter((c) => c.type === 'element')
}

// A paragraph holding only images becomes the images themselves, as <figure>s.
function transformMedia(el) {
  if (el.tagName === 'p') {
    const kids = el.children.filter((c) => !(c.type === 'text' && !c.value.trim()))
    if (kids.length && kids.every((c) => c.type === 'element' && c.tagName === 'img')) {
      return kids.length === 1 ? figureFor(kids[0]) : h('div.media-row', kids.map(figureFor))
    }
  }
  visit(el, 'element', (node, index, parent) => {
    if (node.tagName === 'img' && parent && parent.tagName !== 'figure') {
      parent.children[index] = figureFor(node, { inline: true })
    }
  })
  return el
}

// A paragraph or list item starting with "Tip:" becomes a tip: the label turns into a badge.
const TIP = /^\s*tip:\s*/i
function markTips(el) {
  visit(el, 'element', (node) => {
    if (node.tagName !== 'p' && node.tagName !== 'li') return
    // Loose list items wrap their text in <p>; style the item, not the paragraph.
    const host = node.tagName === 'li' && node.children.find((c) => c.type === 'element')?.tagName === 'p' ? node.children.find((c) => c.type === 'element') : node
    const first = host.children[0]
    if (first?.type !== 'text' || !TIP.test(first.value)) return
    first.value = first.value.replace(TIP, '')
    host.children.unshift(h('span.tip-label', 'Tip'))
    node.properties.className = [...(node.properties.className ?? []), 'tip']
    return 'skip'
  })
}

function runComponents(el, components, ctx) {
  const name = el.properties?.dataComponent
  if (name && components[name]?.parse) return components[name].parse(el, ctx) ?? el
  return el
}

function loadFx(deckDir, warn) {
  const file = path.join(deckDir, 'fx.yaml')
  if (!fs.existsSync(file)) return {}
  try {
    return YAML.parse(fs.readFileSync(file, 'utf8')) ?? {}
  } catch (e) {
    warn(`fx.yaml: ${e.message}`)
    return {}
  }
}

export function isClass(el, cls) {
  return el?.type === 'element' && [].concat(el.properties?.className ?? []).includes(cls)
}
