// A skill file writes itself: a small SKILL.md card whose numbered steps appear one per half beat and
// get ticked off — a skill is just a .md recipe the agent follows. Entrance only.
// params: at (default 4b), title (default "SKILL.md"), lines (list of steps), right / bottom (CSS, default 110px / 130px), width (px, default 560).
import { gsap, fromTimeline } from '@present/engine/effect'
import './skill-file.css'

const DEFAULT_LINES = ['read the deck', 'pick the slides', 'direct each slide', 'write fx.yaml', 'run present check → ok']

export default function skillFile(el, params, { t, slide }) {
  const lines = params.lines ?? DEFAULT_LINES
  const box = document.createElement('div')
  box.className = 'skill-file'
  box.setAttribute('aria-hidden', 'true')
  Object.assign(box.style, { right: params.right ?? '110px', bottom: params.bottom ?? '130px', width: `${params.width ?? 560}px` })
  box.innerHTML = `<div class="sf-title">${params.title ?? 'SKILL.md'}</div><ol class="sf-steps">${lines
    .map((l, i) => `<li><span class="sf-n">${i + 1}.</span> <span class="sf-text">${l}</span><span class="sf-tick">✓</span></li>`)
    .join('')}</ol>`
  slide.querySelector('.frame').append(box)

  const at = t(params.at, t('4b'))
  const items = box.querySelectorAll('li')
  const tl = gsap.timeline()
  tl.fromTo(box, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: t('1b'), ease: 'back.out(2)' }, at)
  tl.fromTo(items, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: t('0.25b'), ease: 'power2.out', stagger: t('0.5b') }, at + t('1b'))
  tl.fromTo(box.querySelectorAll('.sf-tick'), { autoAlpha: 0, scale: 2 },
    { autoAlpha: 1, scale: 1, duration: t('0.25b'), ease: 'back.out(3)', stagger: t('0.5b') }, at + t('1.5b'))
  return fromTimeline(tl, { onDestroy: () => box.remove() })
}
