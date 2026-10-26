// ```diff blocks → one <span class="line add|del|hunk|meta"> per line, so the theme can colour them like a code review.
import { visit } from 'unist-util-visit'

const kind = (line) =>
  line.startsWith('+') ? 'add'
  : line.startsWith('-') ? 'del'
  : line.startsWith('@@') ? 'hunk'
  : line === '' || line.startsWith(' ') ? 'context'
  : 'meta' // commit message, `diff --git …` headers

export default function remarkDiff() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'diff' || !parent) return
      const lines = node.value.split('\n').map((line) => ({
        type: 'diffLine',
        data: { hName: 'span', hProperties: { className: ['line', kind(line)] } },
        // a lone space keeps empty lines one line tall
        children: [{ type: 'text', value: line || ' ' }],
      }))
      parent.children[index] = {
        type: 'diff',
        data: { hName: 'pre', hProperties: { className: ['diff'] } },
        children: [{ type: 'diffCode', data: { hName: 'code' }, children: lines }],
      }
    })
  }
}
