// A verdict slams onto the slide on the next click: scale 2.5 → 1 fast, a tilt, a 2px shake of the slide.
// Hidden until the click, so the line before it can hang — or, with onEntrance: true, it slams down `at` (default 1b)
// after its line appears. params: rotate (deg, default -4), color (CSS, default danger), onEntrance, at.
import { gsap, fromTimeline } from '@present/engine/effect'
import './rubber-stamp.css'

export const steps = (params) => (params.onEntrance ? 0 : 1)

export default function rubberStamp(el, params, { t, slide }) {
  el.classList.add('stamp')
  if (params.color) el.style.setProperty('--stamp', params.color)
  const frame = slide.querySelector('.frame')
  const tl = gsap.timeline()
  // Hidden until the click (fromTo renders its start state immediately; a set at 0 can be skipped).
  tl.fromTo(el, { opacity: 0 }, { opacity: 0, duration: 0.001 }, 0)
  // A "step1" label marks a click for fromTimeline, so the entrance variant uses its own label.
  const at = params.onEntrance ? 'stamp' : 'step1'
  tl.addLabel(at, params.onEntrance ? t(params.at, t('1b')) : undefined)
  tl.fromTo(el, { opacity: 0, scale: 2.5, rotate: 0 }, { opacity: 1, scale: 1, rotate: params.rotate ?? -4, duration: 0.14, ease: 'expo.in', immediateRender: false }, at)
  tl.to(frame, { x: 2, y: -2, duration: 0.04, yoyo: true, repeat: 3, ease: 'none' }, '>')
  tl.set(frame, { x: 0, y: 0 })
  return fromTimeline(tl, {
    onDestroy() {
      el.classList.remove('stamp')
      el.style.removeProperty('--stamp')
      gsap.set(frame, { clearProps: 'transform' })
    },
  })
}
