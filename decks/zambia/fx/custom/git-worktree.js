// A small git graph draws itself: main runs along, two worktree branches fork off on their own
// lanes and merge back — parallel agents that don't trip over each other. Drawn on a click — or, with
// onEntrance: true, `at` (default 1b) after its target (e.g. a `. . .` fragment) appears.
// params: left / bottom (CSS, default 120px / 130px), width (px, default 860), onEntrance, at.
import { gsap, fromTimeline } from '@present/engine/effect'
import './git-worktree.css'

export const steps = (params) => (params.onEntrance ? 0 : 1)

const SVG = `<svg viewBox="0 0 860 220" aria-hidden="true">
  <path class="gw-line gw-main" d="M20 110 H840"/>
  <path class="gw-line gw-a" d="M150 110 C200 110 200 40 250 40 H620 C670 40 670 110 720 110"/>
  <path class="gw-line gw-b" d="M260 110 C310 110 310 180 360 180 H540 C590 180 590 110 640 110"/>
  <g class="gw-commits">
    <circle class="gw-dot gw-main" cx="60" cy="110" r="9"/><circle class="gw-dot gw-main" cx="150" cy="110" r="9"/>
    <circle class="gw-dot gw-main" cx="260" cy="110" r="9"/><circle class="gw-dot gw-a" cx="330" cy="40" r="9"/>
    <circle class="gw-dot gw-b" cx="420" cy="180" r="9"/><circle class="gw-dot gw-a" cx="470" cy="40" r="9"/>
    <circle class="gw-dot gw-b" cx="500" cy="180" r="9"/><circle class="gw-dot gw-a" cx="580" cy="40" r="9"/>
    <circle class="gw-dot gw-main" cx="640" cy="110" r="9"/><circle class="gw-dot gw-main" cx="720" cy="110" r="9"/>
  </g>
  <text class="gw-label" x="790" y="96">main</text>
  <text class="gw-label gw-a-label" x="330" y="18">worktree-a · agent 1</text>
  <text class="gw-label gw-b-label" x="380" y="214">worktree-b · agent 2</text>
</svg>`

export default function gitWorktree(el, params, { t, slide }) {
  const box = document.createElement('div')
  box.className = 'git-worktree'
  Object.assign(box.style, { left: params.left ?? '120px', bottom: params.bottom ?? '130px', width: `${params.width ?? 860}px` })
  box.innerHTML = SVG
  slide.querySelector('.frame').append(box)
  const q = (s) => box.querySelectorAll(s)
  const lines = [...q('.gw-line')]
  lines.forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.dataset.len = len })

  const tl = gsap.timeline()
  tl.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 0, duration: 0.001 }, 0)
  // A "step1" label marks a click for fromTimeline, so the entrance variant uses its own label.
  const step = params.onEntrance ? 'draw' : 'step1'
  tl.addLabel(step, params.onEntrance ? t(params.at, t('1b')) : undefined)
  tl.set(box, { autoAlpha: 1 }, step)
  tl.fromTo(lines[0], { strokeDashoffset: lines[0].dataset.len }, { strokeDashoffset: 0, duration: t('3b'), ease: 'none' }, step)
  tl.fromTo(lines[1], { strokeDashoffset: lines[1].dataset.len }, { strokeDashoffset: 0, duration: t('2.5b'), ease: 'none' }, `${step}+=${t('0.5b')}`)
  tl.fromTo(lines[2], { strokeDashoffset: lines[2].dataset.len }, { strokeDashoffset: 0, duration: t('2b'), ease: 'none' }, `${step}+=${t('0.9b')}`)
  // Commits pop roughly as the lines pass them (left to right).
  q('.gw-dot').forEach((dot) => {
    const x = Number(dot.getAttribute('cx'))
    tl.fromTo(dot, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: t('0.5b'), ease: 'back.out(3)' }, `${step}+=${t('3b') * (x / 860)}`)
  })
  tl.fromTo(q('.gw-label'), { autoAlpha: 0 }, { autoAlpha: 1, duration: t('0.5b'), stagger: t('0.5b') }, `${step}+=${t('1.5b')}`)

  return fromTimeline(tl, { onDestroy: () => box.remove() })
}
