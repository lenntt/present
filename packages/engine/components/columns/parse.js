// ::: columns — content split into columns by `---` (blank line before it).
import { h } from 'hastscript'

export default function parse(el) {
  const cols = [[]]
  for (const child of el.children) {
    if (child.tagName === 'hr') cols.push([])
    else if (child.type === 'element') cols.at(-1).push(child)
  }
  return h('div', { ...el.properties, style: `--cols:${cols.length}` }, cols.map((c) => h('div.col', c)))
}
