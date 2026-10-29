// A verdict pair: the good line gets a green ✓, the bad one a red ✗, popping in as each line appears,
// so the two read as a pro/con pair instead of more running text. Target: the two lines (first = good, second = bad);
// params: kinds (default [good, bad]), at (default 0.25b).
import { gsap, fromTimeline } from '@present/engine/effect'
import './verdict-marks.css'

export default function verdictMarks(el, params, { t, index }) {
  const kind = (params.kinds ?? ['good', 'bad'])[index] ?? 'good'
  const mark = document.createElement('span')
  mark.className = `verdict-mark verdict-${kind}`
  mark.setAttribute('aria-hidden', 'true')
  mark.textContent = kind === 'bad' ? '✗' : '✓'
  el.classList.add('verdict-line', index === 0 && 'verdict-first')
  el.prepend(mark)
  const tl = gsap.timeline()
  tl.fromTo(mark, { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: t('0.5b'), ease: 'back.out(2)' }, t(params.at, t('0.25b')))
  return fromTimeline(tl, {
    onDestroy() {
      mark.remove()
      el.classList.remove('verdict-line', 'verdict-first')
    },
  })
}
