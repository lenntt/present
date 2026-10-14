// Text types itself in, terminal style: hard reveals (no easing) with a blinking block cursor.
// params: by (chars|words, default chars), at (start, default 0.5b), speed (units per beat, default 12 chars / 3 words),
// stagger (extra delay per matched element, default: wait until the previous one finished).
import { gsap, fromTimeline } from '@present/engine/effect'
import './type-in.css'

export default function typeIn(el, params, { t, beat, index }) {
  const original = el.innerHTML
  const byWords = params.by === 'words'
  const units = []
  // Wrap every char/word of every text node, keeping inline markup (em, code, strong) intact.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const texts = []
  while (walker.nextNode()) texts.push(walker.currentNode)
  for (const node of texts) {
    const frag = document.createDocumentFragment()
    for (const part of node.textContent.split(byWords ? /(\s+)/ : /(?:)/u)) {
      if (!part) continue
      if (/^\s+$/.test(part) && byWords) { frag.append(part); continue }
      const span = document.createElement('span')
      span.className = 'type-unit'
      span.textContent = part
      frag.append(span)
      units.push(span)
    }
    node.replaceWith(frag)
  }

  const speed = params.speed ?? (byWords ? 3 : 12)
  const each = beat / speed
  const length = units.length * each
  const at = t(params.at, t('0.5b'))
  // Without an explicit stagger, line n starts when line n-1 has (roughly) finished.
  const start = at + index * (params.stagger != null ? t(params.stagger) : length + t('0.5b'))

  const tl = gsap.timeline()
  tl.set(units, { visibility: 'hidden', attr: { 'data-caret': 0 } }, 0)
  // The caret rides on the newest unit (CSS ::after), so it follows the text through line breaks.
  units.forEach((u, i) => {
    tl.set(u, { visibility: 'visible', attr: { 'data-caret': 1 } }, start + i * each)
    if (i) tl.set(units[i - 1], { attr: { 'data-caret': 0 } }, start + i * each)
  })
  // Inline boxes (code chips, marks) appear with their first character, not as empty chips before it.
  for (const box of el.querySelectorAll('code, mark, kbd, a')) {
    const first = units.findIndex((u) => box.contains(u))
    if (first < 0) continue
    tl.set(box, { visibility: 'hidden' }, 0)
    tl.set(box, { visibility: 'visible' }, start + first * each)
  }
  if (units.length) tl.set(units.at(-1), { attr: { 'data-caret': 0 } }, start + length + t(params.linger, t('2b')))

  return fromTimeline(tl, { onDestroy: () => (el.innerHTML = original) })
}
