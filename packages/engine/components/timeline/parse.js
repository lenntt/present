// ::: timeline — a list of `**YEAR** ![logo](…) label` items.
// `**2014–2021**` (or `2024–`) is a period: placed between its years, which become ticks.
// `**2026+**` is a point that looks ahead: its tick reads "2026+" and the line ends in an arrow.
// A nested list item under an entry becomes a smaller, muted subline below its label.
import { h } from 'hastscript'
import { toString } from 'hast-util-to-string'

const YEARS = /^(\d{4})\s*(?:\+|[–-]\s*(\d{4})?)?$/

export default function parse(el, { warn, slideId }) {
  const list = el.children.find((c) => c.tagName === 'ul' || c.tagName === 'ol')
  if (!list) {
    warn(`timeline on "${slideId}": expected a list`)
    return el
  }

  const now = new Date().getFullYear()
  const items = list.children.filter((c) => c.tagName === 'li').map((li) => {
    const parts = flatten(li)
    const strong = parts.find((c) => c.tagName === 'strong')
    const m = strong && toString(strong).trim().match(YEARS)
    if (!m) warn(`timeline on "${slideId}": item without **year** — "${toString(li).slice(0, 40)}"`)
    const start = m ? Number(m[1]) : null
    const isPeriod = !!m && /[–-]/.test(toString(strong))
    const end = isPeriod ? (m[2] ? Number(m[2]) : null) : start
    const logo = parts.find((c) => c.tagName === 'figure' || c.tagName === 'img')
    const sublists = parts.filter((c) => c.tagName === 'ul' || c.tagName === 'ol')
    const subs = sublists.flatMap((l) => l.children.filter((c) => c.tagName === 'li').map((c) => trim(flatten(c))))
    const label = trim(parts.filter((c) => c !== strong && c !== logo && !sublists.includes(c)))
    const onward = !!m && toString(strong).trim().endsWith('+')
    return { start, end, open: isPeriod && !m[2], isPeriod, onward, logo, label, subs, year: strong ? toString(strong).trim() : '' }
  }).filter((i) => i.start != null)

  const ticks = [...new Set(items.flatMap((i) => (i.isPeriod ? [i.start, i.end] : [i.start])).filter((y) => y != null))].sort((a, b) => a - b)
  const max = Math.max(...ticks, ...items.filter((i) => i.open).map(() => now))
  // Periods get their own slot at their midpoint, so their logos don't collide with tick logos.
  const mids = items.filter((i) => i.isPeriod).map((i) => (i.start + (i.open ? max : i.end)) / 2)
  const onward = new Set(items.filter((i) => i.onward).map((i) => i.start))
  const x = scale([...new Set([...ticks, ...mids, max])].sort((a, b) => a - b))

  const ahead = onward.has(max)
  return h('div', { ...el.properties, className: [...el.properties.className, 'tl', ahead ? 'tl-ahead' : null] }, [
    h('div.tl-line'),
    h('div.tl-ticks', ticks.map((y) => h('div.tl-tick', { className: onward.has(y) ? ['tl-onward'] : [], style: `--x:${x(y)}` }, [h('span.tl-year', onward.has(y) ? `${y}+` : String(y)), h('span.tl-dot')]))),
    h('ol.tl-items', items.map((i) => {
      const x0 = x(i.start)
      const x1 = x(i.open ? max : i.end)
      const mid = x((i.start + (i.open ? max : i.end)) / 2)
      return h('li', {
        className: ['tl-item', i.isPeriod ? 'tl-period' : 'tl-point'],
        style: `--x:${i.isPeriod ? mid : x0};--x0:${x0};--x1:${x1}`,
        dataYear: i.year,
      }, [
        i.isPeriod ? h('span.tl-span') : null,
        i.logo ? h('div.tl-logo', [i.logo]) : null,
        h('div.tl-label', [...i.label, ...i.subs.map((sub) => h('span.tl-sub', sub))]),
      ])
    })),
  ])
}

// Mostly evenly spaced slots, partly linear in time: dense years stay readable, long gaps still look long.
function scale(anchors) {
  const min = anchors[0]
  const span = Math.max(1, anchors.at(-1) - min)
  const last = Math.max(1, anchors.length - 1)
  const pos = anchors.map((y, i) => 0.3 * ((y - min) / span) + 0.7 * (i / last))
  return (y) => {
    let i = anchors.findIndex((a) => a >= y)
    if (i <= 0) i = 1
    const [a0, a1, p0, p1] = [anchors[i - 1], anchors[i] ?? anchors[i - 1], pos[i - 1], pos[i] ?? pos[i - 1]]
    const p = a1 === a0 ? p0 : p0 + ((y - a0) / (a1 - a0)) * (p1 - p0)
    return (0.02 + 0.74 * p).toFixed(4)
  }
}

// Tight lists put inline content directly in <li>, loose lists wrap it in <p>.
function flatten(li) {
  return li.children.flatMap((c) => (c.tagName === 'p' ? c.children : [c]))
}

function trim(nodes) {
  const out = nodes.filter((n) => !(n.type === 'text' && !n.value.trim()))
  if (out[0]?.type === 'text') out[0] = { ...out[0], value: out[0].value.replace(/^[\s—–-]+/, '') }
  return out
}
