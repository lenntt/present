// The context window as a tank: system prompt, AGENTS.md, files, tool output and chat pile up while the
// "answer quality" gauge drains; from about 70% full the early instructions blur and the model gets "dumber",
// though there's still room left in the window.
// With clear: true (target the `. . .` that says to start over) a fresh session covers it: only the
// system prompt and AGENTS.md, quality back to sharp. Entrance only.
// params: at (default 2.5b), dumbAt (fullness where it turns, default 0.7), clear, right / bottom (CSS, default
// 120px / 130px), width (px, default 300).
import { gsap, fromTimeline } from '@present/engine/effect'
import './context-window.css'

const SEGMENTS = [
  ['system prompt', 28, 'cw-sys'],
  ['AGENTS.md', 28, 'cw-agents'],
  ['files read', 66, 'cw-files'],
  ['tool output', 56, 'cw-tools'],
  ['chat history …', 84, 'cw-chat'],
]
const TANK = 350

export default function contextWindow(el, params, { t, slide }) {
  const clear = !!params.clear
  const segments = clear ? SEGMENTS.slice(0, 2) : SEGMENTS
  const box = document.createElement('div')
  box.className = `context-window${clear ? ' cw-fresh' : ''}`
  box.setAttribute('aria-hidden', 'true')
  Object.assign(box.style, { right: params.right ?? '120px', bottom: params.bottom ?? '130px', width: `${params.width ?? 300}px` })
  box.innerHTML = `
    <div class="cw-head"><span>${clear ? '<b class="cw-cmd">/clear</b>' : 'context window'}</span><span class="cw-pct">0%</span></div>
    <div class="cw-tank" style="height:${TANK}px">${segments.map(([label, h, cls]) =>
      `<div class="cw-seg ${cls}" style="height:${h}px">${label}</div>`).join('')}</div>
    <div class="cw-gauge"><span>answer quality</span><b class="cw-verdict">sharp</b></div>
    <div class="cw-bar"><i></i></div>`
  slide.querySelector('.frame').append(box)

  const q = (s) => box.querySelector(s)
  const segs = [...box.querySelectorAll('.cw-seg')]
  const [tank, pct, verdict, bar] = [q('.cw-tank'), q('.cw-pct'), q('.cw-verdict'), q('.cw-bar i')]
  const fullness = segments.reduce((sum, [, h]) => sum + h, 0) / TANK
  const css = getComputedStyle(box)
  const [accent, danger, line] = ['--accent', '--danger', '--line'].map((v) => css.getPropertyValue(v).trim())
  const counter = { v: 0 }
  const showPct = () => { pct.textContent = `${Math.round(counter.v * 100)}%` }

  const tl = gsap.timeline()
  const at = t(params.at, clear ? t('0.5b') : t('2.5b'))
  const fill = t('0.75b')
  tl.fromTo(box, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: t('0.5b'), ease: 'back.out(2)' }, Math.max(0, at - t('1b')))
  segs.forEach((seg, i) => {
    tl.fromTo(seg, { autoAlpha: 0, y: -TANK }, { autoAlpha: 1, y: 0, duration: fill, ease: 'bounce.out' }, at + i * fill)
  })
  const end = at + segs.length * fill
  tl.fromTo(counter, { v: 0 }, { v: fullness, duration: end - at, ease: 'none', onUpdate: showPct }, at)
  if (clear) {
    tl.fromTo(bar, { width: '100%', backgroundColor: accent }, { width: '100%', backgroundColor: accent, duration: end - at }, at)
  } else {
    // Long before it's full (default 70%): the first instructions get lost, the tank flashes red, the verdict flips.
    const dumb = at + (end - at) * Math.min(1, (params.dumbAt ?? 0.7) / fullness)
    tl.fromTo(bar, { width: '100%', backgroundColor: accent }, { width: '30%', backgroundColor: danger, duration: dumb - at, ease: 'none' }, at)
    tl.to(bar, { width: '18%', duration: end - dumb, ease: 'none' }, dumb)
    tl.fromTo(segs.slice(0, 2), { opacity: 1, filter: 'blur(0px)' }, { opacity: 0.35, filter: 'blur(2px)', duration: t('1b') }, dumb - t('0.5b'))
    tl.fromTo(tank, { borderColor: line }, { borderColor: danger, duration: t('0.25b') }, dumb)
    tl.fromTo(tank, { x: 0 }, { x: 4, duration: 0.04, yoyo: true, repeat: 5, ease: 'none', immediateRender: false }, dumb)
    tl.set(verdict, { textContent: 'dumber' }, dumb)
    tl.fromTo(verdict, { color: accent, scale: 1 }, { color: danger, scale: 1.25, duration: t('0.5b'), ease: 'back.out(3)' }, dumb)
  }
  return fromTimeline(tl, { onDestroy: () => box.remove() })
}
