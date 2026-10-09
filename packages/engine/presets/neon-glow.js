// Key word lights up: accent colour, bloom and a small pulse on the beat.
// Drives the theme's `--glow` (0 = plain text, 1 = lit), so colours follow light/dark mode.
import { gsap, fromTimeline } from '../src/runtime/effect.js'

export default function neonGlow(el, params, { t, index }) {
  const delay = t(params.delay, t('1b')) + index * t(params.stagger, t('0.5b'))
  const tl = gsap.timeline()
  tl.set(el, { display: 'inline-block' }, 0)
  tl.fromTo(el, { '--glow': 0 }, { '--glow': 1.6, duration: t('0.25b'), ease: 'power1.out' }, delay)
  tl.to(el, { scale: 1.06, duration: t('0.25b'), yoyo: true, repeat: 1, ease: 'power2.out' }, delay)
  tl.to(el, { '--glow': 1, duration: t('1b') })
  return fromTimeline(tl)
}
