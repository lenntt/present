// Story slicing: one big block — the whole app, layered UI / logic / data — gets cut into thin
// vertical slices, they drift apart, and the first slice lights up: small enough to validate.
// Entrance only. params: at (default 3b), slices (default 6), left / bottom (CSS, default 120px / 130px),
// width (px, default 900), label (on the first slice, default "validate").
import { gsap, fromTimeline } from '@present/engine/effect'
import './story-slices.css'

const LAYERS = ['UI', 'logic', 'data']

export default function storySlices(el, params, { t, slide }) {
  const n = params.slices ?? 6
  const width = params.width ?? 900
  const gap = 18
  const box = document.createElement('div')
  box.className = 'story-slices'
  box.setAttribute('aria-hidden', 'true')
  Object.assign(box.style, { left: params.left ?? '120px', bottom: params.bottom ?? '130px', width: `${width}px` })
  const colW = (width - 110 - gap * (n - 1)) / n
  box.innerHTML = `<div class="ss-layers">${LAYERS.map((l) => `<span>${l}</span>`).join('')}</div>
    <div class="ss-block" style="width:${colW * n}px">${Array.from({ length: n }, (_, i) =>
      `<div class="ss-slice" style="left:${i * colW}px;width:${colW}px">${LAYERS.map(() => '<i></i>').join('')}</div>`).join('')}
      ${Array.from({ length: n - 1 }, (_, i) => `<b class="ss-cut" style="left:${(i + 1) * colW}px"></b>`).join('')}
      <div class="ss-tag" style="width:${colW}px">✓ ${params.label ?? 'validate'}</div>
    </div>`
  slide.querySelector('.frame').append(box)

  const at = t(params.at, t('3b'))
  const slices = [...box.querySelectorAll('.ss-slice')]
  const cuts = box.querySelectorAll('.ss-cut')
  const css = getComputedStyle(box)
  const [line, accent] = ['--line', '--accent'].map((v) => css.getPropertyValue(v).trim())
  const tl = gsap.timeline()
  tl.fromTo(box, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: t('1b'), ease: 'back.out(2)' }, at)
  tl.fromTo(cuts, { scaleY: 0, autoAlpha: 1 }, { scaleY: 1, autoAlpha: 1, duration: t('0.25b'), ease: 'power2.in', stagger: t('0.5b') }, at + t('1.5b'))
  const split = at + t('1.5b') + t('0.5b') * (n - 1) + t('0.5b')
  tl.to(cuts, { autoAlpha: 0, duration: t('0.25b') }, split)
  tl.fromTo(slices, { x: 0 }, { x: (i) => i * gap, duration: t('1b'), ease: 'back.out(1.6)' }, split)
  tl.fromTo(slices[0], { y: 0 }, { y: -18, duration: t('0.5b'), ease: 'back.out(3)' }, split + t('1.5b'))
  tl.fromTo(slices[0].children, { backgroundColor: line }, { backgroundColor: accent, duration: t('0.25b'), stagger: t('0.125b') }, '<')
  tl.fromTo(box.querySelector('.ss-tag'), { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: t('0.5b'), ease: 'back.out(3)' }, '<+=0.25')
  return fromTimeline(tl, { onDestroy: () => box.remove() })
}
