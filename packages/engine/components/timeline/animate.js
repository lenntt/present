// Default timeline animation: the line draws left → right; ticks, logos and labels
// arrive as the line passes them.
import { gsap, fromTimeline } from '../../src/runtime/effect.js'

export default function timelineDraw(el, params, { t }) {
  const duration = t(params.duration, t('6b'))
  const posOf = (node) => Number(getComputedStyle(node).getPropertyValue('--x')) || 0

  const tl = gsap.timeline()
  tl.from(el.querySelector('.tl-line'), { scaleX: 0, duration, ease: 'none' }, 0)

  for (const tick of el.querySelectorAll('.tl-tick')) {
    const at = posOf(tick) * duration
    tl.from(tick.querySelector('.tl-dot'), { scale: 0, duration: t('0.5b'), ease: 'back.out(3)' }, at)
    tl.from(tick.querySelector('.tl-year'), { opacity: 0, y: 12, duration: t('0.5b') }, at)
  }

  for (const item of el.querySelectorAll('.tl-item')) {
    const at = posOf(item) * duration
    const span = item.querySelector('.tl-span')
    if (span) tl.from(span, { scaleX: 0, transformOrigin: 'left center', duration: t('1b'), ease: 'power2.out' }, Math.max(0, at - t('0.5b')))
    const logo = item.querySelector('.tl-logo')
    if (logo) tl.from(logo, { opacity: 0, y: 24, scale: 0.6, duration: t('0.75b'), ease: 'back.out(2)' }, at)
    tl.from(item.querySelector('.tl-label'), { opacity: 0, x: -24, duration: t('0.75b'), ease: 'power2.out' }, at + t('0.25b'))
  }

  return fromTimeline(tl)
}
