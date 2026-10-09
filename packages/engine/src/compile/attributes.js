// `{#id .class key=value}` attribute blocks after headings and images.
import { visit } from 'unist-util-visit'

const TRAILING = /\s*\{([^{}]*)\}\s*$/
const LEADING = /^\{([^{}]*)\}/

export function parseAttrs(src) {
  const attrs = { id: undefined, classes: [], props: {} }
  for (const tok of src.trim().split(/\s+/).filter(Boolean)) {
    if (tok.startsWith('#')) attrs.id = tok.slice(1)
    else if (tok.startsWith('.')) attrs.classes.push(tok.slice(1))
    else if (tok.includes('=')) {
      const [k, ...v] = tok.split('=')
      attrs.props[k] = v.join('=').replace(/^["']|["']$/g, '')
    }
  }
  return attrs
}

function apply(node, attrs) {
  const data = (node.data ??= {})
  const hp = (data.hProperties ??= {})
  if (attrs.id) hp.id = attrs.id
  if (attrs.classes.length) hp.className = [...(hp.className ?? []), ...attrs.classes]
  Object.assign(hp, attrs.props)
  data.attrs = attrs
}

export default function remarkAttributes() {
  return (tree) => {
    visit(tree, 'heading', (node) => {
      const last = node.children.at(-1)
      if (last?.type !== 'text') return
      const m = last.value.match(TRAILING)
      if (!m) return
      last.value = last.value.slice(0, m.index)
      apply(node, parseAttrs(m[1]))
    })
    visit(tree, 'image', (node, index, parent) => {
      const next = parent?.children[index + 1]
      if (next?.type !== 'text') return
      const m = next.value.match(LEADING)
      if (!m) return
      next.value = next.value.slice(m[0].length)
      apply(node, parseAttrs(m[1]))
    })
  }
}
