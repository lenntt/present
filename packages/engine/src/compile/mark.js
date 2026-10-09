// `==word==` → <mark>, the deck's key-word emphasis.
import { visit, SKIP } from 'unist-util-visit'

const MARK = /==([^=\n]+?)==/g

export default function remarkMark() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || !MARK.test(node.value)) return
      MARK.lastIndex = 0
      const out = []
      let last = 0
      for (const m of node.value.matchAll(MARK)) {
        if (m.index > last) out.push({ type: 'text', value: node.value.slice(last, m.index) })
        out.push({ type: 'mark', data: { hName: 'mark' }, children: [{ type: 'text', value: m[1] }] })
        last = m.index + m[0].length
      }
      if (last < node.value.length) out.push({ type: 'text', value: node.value.slice(last) })
      parent.children.splice(index, 1, ...out)
      return [SKIP, index + out.length]
    })
  }
}
