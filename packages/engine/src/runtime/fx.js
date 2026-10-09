// Runs fx.yaml effects in step with reveal.js: plans effects per slide, gives click-consuming
// effects placeholder fragments, and drives controllers via play()/seek() as you navigate.
import gsap from 'gsap'
import { timeParser } from './effect.js'

const WINDOW = 1 // keep controllers alive for this many slides around the current one

export function createFx({ Reveal, fx = {}, meta = {}, modules, still = false }) {
  const warn = (msg) => { console.warn(`[fx] ${msg}`); (window.__fxWarnings ??= []).push(msg) }
  const tempo = fx.tempo ?? meta.tempo ?? 120
  const beat = 60 / tempo
  const t = timeParser(beat)
  const reduced = still || matchMedia('(prefers-reduced-motion: reduce)').matches
  const defaults = { emphasis: 'neon-glow', heading: 'none', transition: 'fade', ...fx.defaults }
  const sections = () => [...document.querySelectorAll('.reveal .slides > section')]

  // --- planning (before Reveal.initialize, so step fragments exist when it counts them)

  function resolve(entry, slideId) {
    if (entry.custom) {
      const mod = modules.custom[entry.custom]
      if (!mod) warn(`${slideId}: custom effect "${entry.custom}" not found in fx/custom/`)
      return mod
    }
    const mod = modules.presets[entry.preset]
    if (!mod) warn(`${slideId}: unknown preset "${entry.preset}"`)
    return mod
  }

  function plan(section) {
    const id = section.dataset.slide
    const conf = fx.slides?.[id] ?? {}
    const specs = []
    const claimed = new Set()
    const add = (el, mod, params, index, count) => specs.push({ el, mod, params: params ?? {}, index, count })

    for (const entry of conf.effects ?? []) {
      const els = entry.target ? [...section.querySelectorAll(entry.target)] : [section.querySelector('.slide-body')]
      if (!els.length) warn(`${id}: target "${entry.target}" matches nothing`)
      els.forEach((el) => claimed.add(el))
      if (entry.preset === 'none') continue
      const mod = resolve(entry, id)
      if (mod) els.forEach((el, i) => add(el, mod, entry.params, i, els.length))
    }

    for (const el of section.querySelectorAll('[data-component]')) {
      const mod = modules.components[el.dataset.component]
      if (mod && !claimed.has(el)) add(el, mod, conf.components?.[el.dataset.component], 0, 1)
    }

    const emphasis = conf.emphasis ?? defaults.emphasis
    const marks = [...section.querySelectorAll('mark')].filter((m) => !claimed.has(m))
    if (emphasis !== 'none') {
      const mod = modules.presets[emphasis]
      if (mod) marks.forEach((m, i) => add(m, mod, conf.emphasisParams, i, marks.length))
    }

    const heading = conf.heading ?? defaults.heading
    const h = section.querySelector('.slide-head h2, .cover-title, .layout-section h1')
    if (heading !== 'none' && h && !claimed.has(h)) {
      const mod = modules.presets[heading]
      if (mod) add(h, mod, conf.headingParams, 0, 1)
    }

    // Entrance = the pause fragment the element sits in; clicks get fresh fragment indices after the pauses.
    let next = Number(section.dataset.fragments ?? 0)
    const frame = section.querySelector('.frame') ?? section
    for (const spec of specs) {
      const host = spec.el.closest('.fragment')
      spec.entrance = host ? Number(host.dataset.fragmentIndex) : -1
      const steps = typeof spec.mod.steps === 'function' ? spec.mod.steps(spec.params) : spec.mod.steps ?? 0
      spec.stepIndices = Array.from({ length: steps }, () => {
        const span = document.createElement('span')
        span.className = 'fragment fx-step'
        span.dataset.fragmentIndex = String(next++)
        frame.appendChild(span)
        return next - 1
      })
      spec.state = -1
    }

    const transition = conf.transition ?? defaults.transition
    if (transition) section.dataset.transition = transition
    return specs
  }

  const plans = new Map()
  for (const s of sections()) plans.set(s, plan(s))

  // --- controllers

  function create(spec, section) {
    if (spec.ctrl) return
    const ctx = { gsap, beat, t, index: spec.index, count: spec.count, slide: section, reduced }
    let ctrl
    try {
      spec.gsapCtx = gsap.context(() => {
        ctrl = spec.mod.default(spec.el, spec.params, ctx)
      }, spec.el)
      ctrl.seek(-1)
    } catch (e) {
      // A broken effect must never break the lecture: show the content, report the effect.
      warn(`${section.dataset.slide}: effect failed — ${e.message}`)
      spec.gsapCtx?.revert()
      ctrl = { play() {}, seek() {}, destroy() {} }
    }
    spec.ctrl = ctrl
    spec.state = -1
  }

  function destroy(spec) {
    if (!spec.ctrl) return
    spec.ctrl.destroy?.()
    spec.gsapCtx?.revert()
    spec.ctrl = null
    spec.state = -1
  }

  function shownFragment(section) {
    let f = -1
    for (const el of section.querySelectorAll('.fragment.visible')) f = Math.max(f, Number(el.dataset.fragmentIndex))
    return f
  }

  function desired(spec, section) {
    const full = spec.stepIndices.length
    if (still) return full
    if (section.classList.contains('future')) return -1
    if (section.classList.contains('past')) return full
    const f = shownFragment(section)
    if (spec.entrance > f) return -1
    return spec.stepIndices.filter((i) => i <= f).length
  }

  function sync(section, animate) {
    for (const spec of plans.get(section) ?? []) {
      create(spec, section)
      const target = desired(spec, section)
      if (target === spec.state) continue
      if (animate && !reduced && target === spec.state + 1) spec.ctrl.play(target)
      else spec.ctrl.seek(target)
      spec.state = target
    }
  }

  function update(animate) {
    const all = sections()
    const current = Reveal.getCurrentSlide()
    const ci = all.indexOf(current)
    all.forEach((s, i) => {
      if (still || Math.abs(i - ci) <= WINDOW) sync(s, animate && s === current)
      else (plans.get(s) ?? []).forEach(destroy)
    })
  }

  return {
    attach() {
      Reveal.on('ready', () => update(true))
      Reveal.on('slidechanged', () => update(true))
      Reveal.on('fragmentshown', () => update(true))
      Reveal.on('fragmenthidden', () => update(true))
    },
    plans,
    // live controllers, for the harness's leak check
    alive: () => [...plans.values()].flat().filter((s) => s.ctrl).length,
  }
}
