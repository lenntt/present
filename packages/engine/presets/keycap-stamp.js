// Letters land as keycap tiles, one per beat, with an overshoot (LGTM style).
// Targets short elements, e.g. the bold first letters of an acronym list: `ul strong`.
// The rest of the parent's text follows once the tile has landed.
import { gsap, fromTimeline } from '../src/runtime/effect.js'
import './keycap-stamp.css'

export default function keycapStamp(el, params, { t, index }) {
  const at = t(params.delay, t('0.5b')) + index * t(params.stagger, t('1b'))
  const tilt = (index % 2 ? 1 : -1) * (params.tilt ?? 8)
  el.classList.add('keycap')

  // Wrap the parent's remaining text so it can follow the tile.
  const rest = []
  if (params.withParent !== false && el.parentElement) {
    for (const node of [...el.parentElement.childNodes]) {
      if (node === el || (node.nodeType === Node.TEXT_NODE && !node.textContent.trim())) continue
      const span = document.createElement('span')
      span.className = 'keycap-rest'
      node.replaceWith(span)
      span.appendChild(node)
      rest.push(span)
    }
  }

  const tl = gsap.timeline()
  tl.from(el, { opacity: 0, scale: 1.8, rotation: tilt, duration: t('0.5b'), ease: 'back.out(2)' }, at)
  tl.to(el, { rotation: tilt / 4, duration: t('0.25b') })
  if (rest.length) tl.from(rest, { opacity: 0, x: -12, duration: t('0.5b'), ease: 'power2.out' }, at + t('0.25b'))

  return fromTimeline(tl, {
    onDestroy() {
      el.classList.remove('keycap')
      for (const span of rest) span.replaceWith(...span.childNodes)
    },
  })
}
