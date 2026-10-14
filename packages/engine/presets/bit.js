// Bit, the robot-genie mascot (the AI), acting on the slide: placed in free space, entering, then
// playing motions — automatically or one per click. Motions/moods: see `present outline` → mascot.
// params: place (right | left | bottom-right | bottom-left, or CSS like { right: 320px, bottom: 90px }),
// size (px, default 300), mood (default happy), at (default 1b),
// enter (emerge | fade | none | bottled — corked in its flask, waiting to be uncorked by `emerge`; default fade),
// play: [motion, …] after the entrance (or from playAt, e.g. 6b), click: [motion, …] one per click, idle (default true).
// A motion is a name ("wave") or { motion: "writeCode", mood: "happy", args: { keep: true } }.
import { gsap, fromTimeline } from '../src/runtime/effect.js'
import { createBot } from '../mascot/index.js'

export const steps = (params) => [].concat(params.click ?? []).length

const PLACES = {
  right: { right: '110px', bottom: '96px' },
  left: { left: '110px', bottom: '96px' },
  'bottom-right': { right: '60px', bottom: '40px' },
  'bottom-left': { left: '60px', bottom: '40px' },
}

export default function bit(el, params, { t, slide, reduced }) {
  const frame = slide.querySelector('.frame') ?? slide
  const bot = createBot({ mood: params.mood ?? 'happy', size: params.size ?? 300 })
  const place = typeof params.place === 'object' ? params.place : PLACES[params.place ?? 'right']
  if (!place) throw new Error(`bit: unknown place "${params.place}"`)
  Object.assign(bot.el.style, { position: 'absolute', zIndex: 0, ...place })
  bot.el.setAttribute('aria-hidden', 'true')
  frame.append(bot.el)

  const run = (step) => {
    const { motion, mood, args } = typeof step === 'string' ? { motion: step } : step
    if (typeof bot[motion] !== 'function' || ['mood', 'face', 'idle', 'destroy'].includes(motion)) {
      throw new Error(`Bit has no motion "${motion}" — add it to packages/engine/mascot/bot.js`)
    }
    const tl = bot[motion](args)
    if (mood) tl.add(bot.face(mood))
    return tl
  }

  const tl = gsap.timeline()
  const at = t(params.at, t('1b'))
  const enter = params.enter ?? 'fade'
  tl.set(bot.el, { autoAlpha: enter === 'none' ? 1 : 0 }, 0)
  if (enter === 'bottled') tl.add(bot.retreat().duration(0.01), 0).set(bot.el, { autoAlpha: 1 }, 0.01)
  else if (enter === 'emerge') tl.set(bot.el, { autoAlpha: 1 }, at).add(bot.emerge(), at)
  else if (enter === 'fade') tl.fromTo(bot.el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: t('1b'), ease: 'back.out(2)' }, at)
  tl.addLabel('play', params.playAt != null ? Math.max(t(params.playAt), tl.duration()) : '>')
  ;[].concat(params.play ?? []).forEach((step, i) => tl.add(run(step), i ? '>' : 'play'))
  ;[].concat(params.click ?? []).forEach((step, i) => {
    tl.addLabel(`step${i + 1}`, '>')
    tl.add(run(step), `step${i + 1}`)
  })

  // Hover/blink between motions; not part of the seekable timeline.
  const idle = reduced || params.idle === false ? null : bot.idle()
  return fromTimeline(tl, {
    onDestroy() {
      idle?.kill()
      bot.destroy()
      bot.el.remove()
    },
  })
}
