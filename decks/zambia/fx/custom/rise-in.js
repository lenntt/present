// Elements rise into place one after another (charts, cards, list items); credits follow quietly.
// params: at (default 0.5b), stagger (default 1b), y (px, default 60).
import { gsap, fromTimeline } from '@present/engine/effect'

export default function riseIn(el, params, { t, index }) {
  const at = t(params.at, t('0.5b')) + index * t(params.stagger, t('1b'))
  const credit = el.querySelector('.credit')
  const tl = gsap.timeline()
  tl.from(el, { opacity: 0, y: params.y ?? 60, duration: t('1b'), ease: 'power3.out' }, at)
  if (credit) tl.from(credit, { opacity: 0, duration: t('1b') }, at + t('1b'))
  return fromTimeline(tl)
}
