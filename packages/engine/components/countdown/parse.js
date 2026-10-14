// ::: countdown — a big clock counting down to the end of the session.
// Ends at `{until="16:30 Africa/Lusaka"}`, or the deck's `ends:` frontmatter. Content is the label.
import { h } from 'hastscript'
import { parseEnd } from './time.js'

export default function parse(el, { warn, slideId, meta }) {
  const until = el.properties.dataUntil ?? meta.ends
  if (!until) warn(`countdown on "${slideId}": no end time — add {until="16:30 Africa/Lusaka"} or \`ends:\` in the frontmatter`)
  else if (Number.isNaN(parseEnd(until))) warn(`countdown on "${slideId}": can't read end time "${until}"`)
  const clock = String(until ?? '').split(/\s+/)[0]
  const label = el.children.filter((c) => c.type === 'element')
  return h('div', { ...el.properties, dataUntil: until }, [
    h('span.cd-time', { role: 'timer', 'aria-live': 'off' }, clock || '--:--'),
    h('div.cd-label', label.length ? label : [h('p', `until ${clock}`)]),
  ])
}
