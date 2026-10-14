// A slider from "vibe coding" to "stay in control", with Bit riding it as the handle.
// Entrance: the slider appears and Bit emerges at the vibe-coding end. Click: Bit glides over to
// "stay in control" and folds its arms. params: at (default 6b), from / to (labels), width (px, default 560).
import { gsap, fromTimeline } from '@present/engine/effect'
import { createBot } from '@present/engine/mascot'
import './control-slider.css'

export const steps = 1

export default function controlSlider(el, params, { t, slide, reduced }) {
  const width = params.width ?? 560
  const pad = 70 // room for Bit at either end
  const box = document.createElement('div')
  box.className = 'control-slider'
  box.setAttribute('aria-hidden', 'true')
  box.style.width = `${width}px`
  box.innerHTML = `
    <div class="cs-track"><div class="cs-fill"></div></div>
    <div class="cs-knob"></div>
    <span class="cs-label cs-from">${params.from ?? 'vibe coding'}</span>
    <span class="cs-label cs-to">${params.to ?? 'stay in control'}</span>`
  slide.querySelector('.frame').append(box)

  const q = (s) => box.querySelector(s)
  const [fill, knob, from, to] = [q('.cs-fill'), q('.cs-knob'), q('.cs-from'), q('.cs-to')]
  const bot = createBot({ mood: 'happy', size: 200 })
  box.append(bot.el)
  const x0 = pad
  const x1 = width - pad

  const tl = gsap.timeline()
  const at = t(params.at, t('6b'))
  gsap.set([bot.el, knob], { x: x0 })
  gsap.set(fill, { width: x0 })
  tl.set(box, { autoAlpha: 0 }, 0)
  tl.to(box, { autoAlpha: 1, duration: t('0.5b') }, at)
  tl.add(bot.emerge(), at + t('0.25b'))
  tl.to(from, { color: 'var(--accent)', duration: t('0.5b') }, '<')

  // Click: from vibes to control.
  tl.addLabel('step1')
  tl.add(bot.face('think'), 'step1')
  tl.to([bot.el, knob], { x: x1, duration: t('4b'), ease: 'power2.inOut' }, 'step1')
  tl.to(fill, { width: x1, backgroundColor: 'var(--brand-fill)', duration: t('4b'), ease: 'power2.inOut' }, 'step1')
  tl.to(from, { color: 'var(--muted)', duration: t('1b') }, 'step1')
  tl.to(to, { color: 'var(--brand)', duration: t('1b') }, `step1+=${t('3b')}`)
  tl.add(bot.fold(), `step1+=${t('4b')}`)
  tl.add(bot.face('neutral'), '<')

  const idle = reduced ? null : bot.idle()
  return fromTimeline(tl, {
    onDestroy() {
      idle?.kill()
      bot.destroy()
      box.remove()
    },
  })
}
