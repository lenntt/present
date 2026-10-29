// Contact details (a `::: more` block with a QR code and a few links) as a small strip at the bottom-right
// of the slide, rising in quietly after `at` (default 2b). Target: `.component.more`.
import { gsap, fromTimeline } from '@present/engine/effect'
import './contact-strip.css'

export default function contactStrip(el, params, { t }) {
  el.classList.add('contact-strip')
  const tl = gsap.timeline()
  tl.from(el, { opacity: 0, y: 20, duration: t('1b'), ease: 'power3.out' }, t(params.at, t('2b')))
  return fromTimeline(tl, { onDestroy: () => el.classList.remove('contact-strip') })
}
