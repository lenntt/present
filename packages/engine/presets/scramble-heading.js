// Heading decodes from random characters, terminal style.
import { gsap, fromTimeline } from '../src/runtime/effect.js'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'

gsap.registerPlugin(ScrambleTextPlugin)

export default function scrambleHeading(el, params, { t }) {
  const tl = gsap.timeline()
  // Scrambling replaces markup, so headings with inline elements only fade in.
  if (el.children.length) {
    tl.from(el, { opacity: 0, y: 16, duration: t('1b'), ease: 'power2.out' })
    return fromTimeline(tl)
  }
  const text = el.textContent
  tl.to(el, {
    duration: t(params.duration, t('2b')),
    scrambleText: { text, chars: params.chars ?? '01<>/{}[]_$#', revealDelay: 0.3, speed: 0.6 },
    ease: 'none',
  })
  return fromTimeline(tl, { onDestroy: () => (el.textContent = text) })
}
