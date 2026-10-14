// "Bit" — the Fontys Venlo Informatics robot genie (prototype): an AI that lives in a lab flask of
// Fontys-purple liquid and rises out of it on a swirl of smoke. Careful what you wish (prompt) for.
// createBot() returns an inline SVG whose parts are named, so effects can animate them:
//   const bot = createBot({ mood: 'happy' }); el.append(bot.el); bot.parts.armR …
// Moods swap the face; every other method is a motion that returns a GSAP timeline.
// Bit evolves: add motions/moods here as decks need them. Give each motion a one-line /** doc */ —
// `present outline` lists them for /deck-spice — and keep it within Bit's look (grey-blue shell,
// Fontys-purple screen and accents, white glow). The smoke tail redraws itself every frame; call bot.destroy() when done.
import gsap from 'gsap'
import './bot.css'

const SVG = `
<svg class="bot" viewBox="0 0 200 264" role="img" aria-label="Robot genie mascot">
  <ellipse class="bot-shadow" cx="100" cy="259" rx="32" ry="3.5"/>
  <g class="bot-bottle" transform="translate(100 214) scale(0.8) translate(-100 -214)">
    <path class="bot-liquid" d="M 78.5 244 L 66 260 Q 62 267 70 268 L 130 268 Q 138 267 134 260 L 121.5 244 Z"/>
    <path class="bot-surface" d="M 78.5 244 L 121.5 244"/>
    <circle class="bot-bubble" cx="92" cy="258" r="2.2"/><circle class="bot-bubble" cx="106" cy="262" r="1.6"/><circle class="bot-bubble" cx="114" cy="254" r="1.8"/>
    <path class="bot-glass" d="M 91 214 L 91 228 L 66 260 Q 62 267 70 268 L 130 268 Q 138 267 134 260 L 109 228 L 109 214 Z"/>
    <path class="bot-marks" d="M 106 236 h 6 M 112 244 h 6 M 117 252 h 6"/>
    <path class="bot-shine" d="M 86 238 L 74 254"/>
    <rect class="bot-lip" x="87" y="210" width="26" height="6" rx="3"/>
  </g>
  <defs>
    <linearGradient id="ID-smoke-fill" gradientUnits="userSpaceOnUse" x1="0" y1="216" x2="0" y2="176">
      <stop offset="0" class="bot-smoke-fill" stop-opacity="0"/>
      <stop offset="0.45" class="bot-smoke-fill" stop-opacity="0.55"/>
      <stop offset="1" class="bot-smoke-fill" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="ID-smoke-line" gradientUnits="userSpaceOnUse" x1="0" y1="216" x2="0" y2="176">
      <stop offset="0" class="bot-smoke-line" stop-opacity="0"/>
      <stop offset="0.6" class="bot-smoke-line" stop-opacity="0.35"/>
      <stop offset="1" class="bot-smoke-line" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="ID-waist-line" gradientUnits="userSpaceOnUse" x1="0" y1="156" x2="0" y2="178">
      <stop offset="0" class="bot-smoke-line" stop-opacity="1"/>
      <stop offset="1" class="bot-smoke-line" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <use class="bot-clone" href="#ID-all"/>
  <use class="bot-clone" href="#ID-all"/>
  <path class="bot-shell bot-smoke" style="fill: url(#ID-smoke-fill); stroke: url(#ID-smoke-line)"/>
  <g class="bot-all" id="ID-all">
    <rect class="bot-shell" x="68" y="136" width="64" height="42" rx="18" style="stroke: url(#ID-waist-line)"/>
    <g class="bot-head">
      <line class="bot-antenna" x1="100" y1="46" x2="100" y2="28"/>
      <circle class="bot-bulb" cx="100" cy="22" r="7"/>
      <rect class="bot-shell" x="44" y="46" width="112" height="84" rx="28"/>
      <rect class="bot-screen" x="56" y="58" width="88" height="60" rx="18"/>
      <g class="bot-face" data-mood="neutral">
        <rect class="bot-eye" x="75" y="76" width="14" height="20" rx="7"/>
        <rect class="bot-eye" x="111" y="76" width="14" height="20" rx="7"/>
        <rect class="bot-mouth" x="93" y="104" width="14" height="4" rx="2"/>
      </g>
      <g class="bot-face" data-mood="happy">
        <path class="bot-line" d="M73 92 q9 -14 18 0 M109 92 q9 -14 18 0"/>
        <path class="bot-line" d="M89 102 q11 9 22 0"/>
      </g>
      <g class="bot-face" data-mood="think">
        <rect class="bot-eye" x="75" y="84" width="14" height="6" rx="3"/>
        <rect class="bot-eye" x="111" y="76" width="14" height="20" rx="7"/>
        <circle class="bot-dot" cx="89" cy="107" r="2.5"/><circle class="bot-dot" cx="100" cy="107" r="2.5"/><circle class="bot-dot" cx="111" cy="107" r="2.5"/>
      </g>
      <g class="bot-face" data-mood="error">
        <path class="bot-line bot-err" d="M75 78 l14 16 M89 78 l-14 16 M111 78 l14 16 M125 78 l-14 16"/>
        <path class="bot-line bot-err" d="M89 108 q11 -8 22 0"/>
      </g>
      <g class="bot-face" data-mood="dizzy">
        <path class="bot-line bot-thin" d="M82 86 m0 -2 a2 2 0 1 1 -2 2 a4 4 0 1 1 4 4 a6 6 0 1 1 -6 -6 a8 8 0 1 1 8 8"/>
        <path class="bot-line bot-thin" d="M118 86 m0 -2 a2 2 0 1 1 -2 2 a4 4 0 1 1 4 4 a6 6 0 1 1 -6 -6 a8 8 0 1 1 8 8"/>
        <path class="bot-line bot-thin" d="M86 108 q3.5 -4 7 0 q3.5 4 7 0 q3.5 -4 7 0 q3.5 4 7 0"/>
      </g>
      <g class="bot-face" data-mood="wow">
        <circle class="bot-eye" cx="82" cy="86" r="9"/><circle class="bot-eye" cx="118" cy="86" r="9"/>
        <ellipse class="bot-eye" cx="100" cy="107" rx="4" ry="4.5"/>
      </g>
    </g>
    <g class="bot-sparkles">
      <path class="bot-spark" d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" transform="translate(34 50)"/>
      <path class="bot-spark" d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" transform="translate(170 40)"/>
      <path class="bot-spark" d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" transform="translate(160 118)"/>
      <path class="bot-spark" d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" transform="translate(40 120)"/>
    </g>
    <g class="bot-code">
      <rect class="bot-panel" x="42" y="168" width="116" height="40" rx="9"/>
      <rect class="bot-panel-screen" x="47" y="172" width="106" height="32" rx="6"/>
      <rect class="bot-code-line" x="54" y="178" width="46" height="5" rx="2.5"/>
      <rect class="bot-code-line alt" x="64" y="186" width="62" height="5" rx="2.5"/>
      <rect class="bot-code-line" x="54" y="194" width="28" height="5" rx="2.5"/>
      <rect class="bot-code-cursor" x="86" y="193" width="5" height="7" rx="1"/>
      <path class="bot-check" d="M124 188 l6 6 l12 -12"/>
    </g>
    <g class="bot-speech">
      <path class="bot-speech-shape" d="M150 4 h44 a14 14 0 0 1 14 14 v20 a14 14 0 0 1 -14 14 h-30 l-14 12 l2 -12 a14 14 0 0 1 -12 -14 v-20 a14 14 0 0 1 14 -14 z"/>
      <text class="bot-speech-text" x="172" y="38">?</text>
    </g>
    <g class="bot-meter">
      <rect class="bot-meter-frame" x="166" y="50" width="13" height="78" rx="6.5"/>
      <rect class="bot-meter-fill" x="169" y="53" width="7" height="72" rx="3.5"/>
    </g>
    <line class="bot-arm bot-arm-l" x1="72" y1="150" x2="62" y2="177"/>
    <line class="bot-arm bot-arm-r" x1="128" y1="150" x2="138" y2="177"/>
    <g class="bot-lens"><line class="bot-lens-handle" x1="7" y1="7" x2="16" y2="16"/><circle class="bot-lens-glass" r="9.5"/></g>
    <g class="bot-fold">
      <polyline class="bot-fold-edge" points="72,150 66,165 121,160"/>
      <polyline class="bot-fold-arm" points="72,150 66,165 121,160"/>
      <polyline class="bot-fold-edge" points="128,150 134,167 79,164"/>
      <polyline class="bot-fold-arm" points="128,150 134,167 79,164"/>
    </g>
  </g>
  <g transform="translate(100 214) scale(0.8) translate(-100 -214)"><rect class="bot-cork" x="91" y="202" width="18" height="12" rx="3"/></g>
</svg>`


export const MOODS = ['neutral', 'happy', 'think', 'error', 'wow', 'dizzy']

export function createBot({ mood = 'neutral', size } = {}) {
  const wrap = document.createElement('div')
  // Ids (gradients, the clones' <use>) must be unique per bot on the page — even if this module is loaded twice.
  wrap.innerHTML = SVG.trim().replaceAll('ID-', `bot${Math.random().toString(36).slice(2, 9)}-`)
  const el = wrap.firstChild
  if (size) el.style.width = typeof size === 'number' ? `${size}px` : size
  const q = (s) => el.querySelector(s)
  const parts = {
    all: q('.bot-all'), head: q('.bot-head'), bulb: q('.bot-bulb'), armL: q('.bot-arm-l'), armR: q('.bot-arm-r'),
    smoke: q('.bot-smoke'), bubbles: el.querySelectorAll('.bot-bubble'), cork: q('.bot-cork'), fold: q('.bot-fold'), lens: q('.bot-lens'), check: q('.bot-check'),
    meter: q('.bot-meter'), meterFill: q('.bot-meter-fill'), clones: el.querySelectorAll('.bot-clone'), speech: q('.bot-speech'), speechText: q('.bot-speech-text'), sparks: el.querySelectorAll('.bot-spark'), eyes: el.querySelectorAll('[data-mood="neutral"] .bot-eye'),
    code: q('.bot-code'), codeLines: el.querySelectorAll('.bot-code-line'), cursor: q('.bot-code-cursor'),
  }
  gsap.set(parts.armL, { svgOrigin: '72 150' })
  gsap.set(parts.armR, { svgOrigin: '128 150' })
  gsap.set(parts.head, { svgOrigin: '100 130' })
  gsap.set(parts.code, { autoAlpha: 0 })
  gsap.set(parts.cork, { autoAlpha: 0 })
  gsap.set(parts.fold, { autoAlpha: 0, svgOrigin: '100 160' })
  gsap.set([parts.lens, parts.meter, parts.clones, parts.speech], { autoAlpha: 0 })
  gsap.set(parts.check, { autoAlpha: 0 })
  let folded = false
  gsap.set(parts.sparks, { scale: 0, transformOrigin: '50% 50%' })

  // Smoke tail: a tapered S-curve from the bottle neck up to Bit's waist, swaying, following Bit
  // when it moves. `grow` (0..1) lets it pour out of the bottle in emerge().
  const smoke = { phase: 0, grow: 1 }
  const drawSmoke = () => {
    const bx = gsap.getProperty(parts.all, 'x')
    const by = gsap.getProperty(parts.all, 'y')
    const sc = gsap.getProperty(parts.all, 'scale')
    const g = smoke.grow
    const P0 = [100, 214]
    const top = [100 + bx, 214 + (164 - 214) * sc + by]
    const P1 = [100 - 14 + bx * 0.3 + Math.sin(smoke.phase) * 9, 200 + by * 0.3]
    // P2 sits straight below the top, so the strip ends vertically and its flat end hides inside the torso.
    const P2 = [top[0], 182 + by * 0.8]
    const pts = [P0, P1, P2, top].map(([x, y]) => [P0[0] + (x - P0[0]) * g, P0[1] + (y - P0[1]) * g])
    const N = 16
    const left = []
    const right = []
    for (let i = 0; i <= N; i++) {
      const u = i / N
      const m = 1 - u
      const pt = [0, 1].map((k) => m * m * m * pts[0][k] + 3 * m * m * u * pts[1][k] + 3 * m * u * u * pts[2][k] + u * u * u * pts[3][k])
      const d = [0, 1].map((k) => 3 * m * m * (pts[1][k] - pts[0][k]) + 6 * m * u * (pts[2][k] - pts[1][k]) + 3 * u * u * (pts[3][k] - pts[2][k]))
      const len = Math.hypot(d[0], d[1]) || 1
      const w = (3.2 + 17.8 * u ** 1.3) * (0.4 + 0.6 * g) * Math.max(sc, 0.3)
      left.push(`${(pt[0] - (d[1] / len) * w).toFixed(1)} ${(pt[1] + (d[0] / len) * w).toFixed(1)}`)
      right.push(`${(pt[0] + (d[1] / len) * w).toFixed(1)} ${(pt[1] - (d[0] / len) * w).toFixed(1)}`)
    }
    parts.smoke.setAttribute('d', g < 0.02 ? '' : `M${left.join(' L')} L${right.reverse().join(' L')} Z`)
  }
  // Bubbles rise in the flask.
  const tick = (_t, dtMs) => {
    const dt = Math.min(dtMs, 50) / 1000
    smoke.phase += dt * 2.6
    drawSmoke()
    parts.bubbles.forEach((bub, i) => {
      const u = ((smoke.phase * 0.25 + i * 0.37) % 1)
      bub.setAttribute('transform', `translate(0 ${(-u * 14).toFixed(1)})`)
      bub.setAttribute('opacity', (1 - u).toFixed(2))
    })
  }
  gsap.ticker.add(tick)
  drawSmoke()

  // Mood changes inside motions are timeline sets, so seeking back and forth shows the right face.
  const faces = el.querySelectorAll('.bot-face')
  // Motions are often built long before they play (queued on a slide's timeline), so their from/set
  // states must not render on creation.
  const timeline = () => gsap.timeline({ defaults: { immediateRender: false } })
  const face = (name) => gsap.timeline().set(faces, { display: (i, f) => (f.dataset.mood === name ? 'inline' : 'none'), immediateRender: false }, 0.001)

  const bot = {
    el,
    parts,
    /** Timeline that switches the face (use inside timelines instead of mood()). */
    face,
    /** Switch the face now (outside timelines). */
    mood(name) {
      gsap.set(faces, { display: (i, f) => (f.dataset.mood === name ? 'inline' : 'none') })
      return bot
    },
    /** Hover + blink + bulb pulse, forever. */
    idle() {
      const tl = gsap.timeline({ repeat: -1 })
      tl.to(parts.all, { y: -8, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
      tl.to(parts.bulb, { opacity: 0.35, duration: 0.6, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0)
      tl.to(parts.eyes, { scaleY: 0.1, svgOrigin: '100 86', duration: 0.08, yoyo: true, repeat: 1 }, 1.9)
      return tl
    },
    /** Arms cross over the chest: the genie's "your wish is my command" pose. */
    fold() {
      folded = true
      return timeline()
        .to([parts.armL, parts.armR], { rotate: (i) => (i ? 35 : -35), autoAlpha: 0, duration: 0.2, ease: 'power2.in' })
        .fromTo(parts.fold, { autoAlpha: 0, scaleX: 0.7 }, { autoAlpha: 1, scaleX: 1, duration: 0.25, ease: 'back.out(2)' }, 0.12)
    },
    /** Crossed arms open back to hanging arms. */
    unfold() {
      folded = false
      return timeline()
        .to(parts.fold, { autoAlpha: 0, scaleX: 0.7, duration: 0.15, ease: 'power2.in' })
        .fromTo([parts.armL, parts.armR], { rotate: (i) => (i ? 35 : -35), autoAlpha: 0 }, { rotate: 0, autoAlpha: 1, duration: 0.25, ease: 'back.out(2)' }, 0.08)
    },
    /** Cork wobbles and pops, smoke pours out, Bit swells up out of the bottle. */
    emerge() {
      return timeline()
        .add(face('happy'))
        .set(parts.all, { scale: 0, autoAlpha: 0, svgOrigin: '100 214' })
        .set(smoke, { grow: 0 })
        .set(parts.cork, { autoAlpha: 1, x: 0, y: 0, rotate: 0, svgOrigin: '100 208' })
        .to(parts.cork, { rotate: 10, duration: 0.07, yoyo: true, repeat: 5, ease: 'none' })
        .to(parts.cork, { y: -90, x: 46, rotate: 220, duration: 0.55, ease: 'power2.out' })
        .to(parts.cork, { autoAlpha: 0, duration: 0.2 }, '-=0.15')
        .to(smoke, { grow: 1, duration: 0.6, ease: 'power2.out' }, '<-0.3')
        .to(parts.all, { scale: 1, autoAlpha: 1, duration: 0.7, ease: 'back.out(1.6)' }, '<0.15')
        .add(bot.wave(), '-=0.1')
    },
    /** Bit shrinks back into the bottle and the cork goes back on. */
    retreat() {
      return timeline()
        .to(parts.all, { scale: 0, autoAlpha: 0, svgOrigin: '100 214', duration: 0.6, ease: 'back.in(1.4)' })
        .to(smoke, { grow: 0, duration: 0.5, ease: 'power2.in' }, 0.2)
        // Every property in a fromTo's start needs an end value too, or it isn't re-applied on a replay.
        .fromTo(parts.cork, { autoAlpha: 1, x: 0, y: -40, rotate: -20 }, { autoAlpha: 1, x: 0, y: 0, rotate: 0, duration: 0.3, ease: 'bounce.out' })
    },
    /** Arms up, sparkles burst around the head: wish granted. */
    grantWish() {
      return timeline()
        .add(face('wow'))
        .to(parts.armL, { rotate: 105, duration: 0.3, ease: 'back.out(2)' })
        .to(parts.armR, { rotate: -105, duration: 0.3, ease: 'back.out(2)' }, 0)
        .to(parts.bulb, { scale: 1.8, svgOrigin: '100 22', duration: 0.15, yoyo: true, repeat: 1 }, 0.25)
        .fromTo(parts.sparks, { scale: 0, rotate: 0 }, { scale: 1.2, rotate: 90, duration: 0.35, stagger: 0.08, ease: 'back.out(3)' }, 0.25)
        .to(parts.sparks, { scale: 0, duration: 0.3, stagger: 0.08 }, '+=0.3')
        .add(face('happy'), '<')
        .to([parts.armL, parts.armR], { rotate: 0, duration: 0.4 }, '<')
    },
    /** Raises the right arm and waves: hello, goodbye, look here. */
    wave() {
      return timeline()
        .to(parts.armR, { rotate: -150, duration: 0.35, ease: 'back.out(2)' })
        .to(parts.armR, { rotate: -115, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        .to(parts.armR, { rotate: 0, duration: 0.4, ease: 'power2.inOut' })
    },
    /** Quick nods: agreement, approval, "LGTM". */
    nod() {
      return timeline().to(parts.head, { rotate: 6, y: 4, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' })
    },
    /** Tilts its head, hand to chin, dots pulse on the screen: pondering a question. */
    think() {
      return timeline()
        .add(face('think'))
        .to(parts.head, { rotate: -8, duration: 0.4, ease: 'power2.out' })
        .to(parts.armL, { rotate: 140, duration: 0.4, ease: 'power2.out' }, 0)
        .to(el.querySelectorAll('[data-mood="think"] .bot-dot'), { opacity: 0.2, duration: 0.25, stagger: 0.15, yoyo: true, repeat: 5 }, 0.3)
        .to([parts.head, parts.armL], { rotate: 0, duration: 0.4 }, '+=0.2')
    },
    /** Jumps up with both arms raised, happy face: success, payoff, shipped. */
    celebrate() {
      return timeline()
        .add(face('happy'))
        .to(parts.all, { y: -40, duration: 0.3, ease: 'power2.out' })
        .to([parts.armL, parts.armR], { rotate: (i) => (i ? -105 : 105), duration: 0.3, ease: 'back.out(2)' }, 0)
        .to(parts.all, { y: 0, duration: 0.45, ease: 'bounce.out' })
        .to([parts.armL, parts.armR], { rotate: 0, duration: 0.4 }, '-=0.1')
    },
    /** A laptop pops up in front; Bit looks down and types code line by line, then beams. keep: leave the laptop up. */
    writeCode({ keep = false } = {}) {
      const lines = [...parts.codeLines]
      const tl = timeline().add(face('neutral'))
      tl.set(lines, { scaleX: 0, transformOrigin: '0% 50%' })
      tl.set(parts.cursor, { opacity: 0 })
      tl.fromTo(parts.code, { autoAlpha: 0, y: 14, scale: 0.9, svgOrigin: '100 188' }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' })
      tl.to(parts.eyes, { y: 6, duration: 0.2 }, '<')
      tl.to(parts.armL, { rotate: -16, duration: 0.25, ease: 'power2.out' }, '<')
      tl.to(parts.armR, { rotate: 16, duration: 0.25, ease: 'power2.out' }, '<')
      const typing = tl.duration()
      lines.forEach((line, i) => {
        const w = Number(line.getAttribute('width'))
        tl.to(line, { scaleX: 1, duration: w / 60, ease: `steps(${Math.max(2, Math.round(w / 8))})` }, i ? '>+0.12' : typing + 0.1)
      })
      const done = tl.duration()
      // Hands tap alternately for as long as lines are being typed.
      for (let t = typing; t < done; t += 0.16) {
        tl.to(Math.round((t - typing) / 0.16) % 2 ? parts.armR : parts.armL, { rotate: (i, a) => (a === parts.armL ? -24 : 24), duration: 0.08, yoyo: true, repeat: 1, ease: 'none' }, t)
      }
      tl.set(parts.cursor, { opacity: 1 }, done)
      tl.to(parts.cursor, { opacity: 0, duration: 0.01, yoyo: true, repeat: 3, repeatDelay: 0.25 }, done + 0.25)
      tl.to(parts.bulb, { scale: 1.5, svgOrigin: '100 22', duration: 0.15, yoyo: true, repeat: 1 }, done)
      tl.to(parts.eyes, { y: 0, duration: 0.2 }, done)
      tl.add(face('happy'), done + 0.2)
      tl.to([parts.armL, parts.armR], { rotate: 0, duration: 0.3 }, done + 0.3)
      if (!keep) tl.to(parts.code, { autoAlpha: 0, y: 10, duration: 0.3 }, done + 1.4)
      return tl
    },
    /** A laptop with finished code; Bit squints and sweeps a magnifying glass over every line, then ticks it off: reading > writing. keep: leave the laptop up. */
    review({ keep = false } = {}) {
      const lines = [...parts.codeLines]
      const tl = timeline().add(face('think'))
      tl.set(lines, { scaleX: 1 })
      tl.set([parts.cursor, parts.check], { autoAlpha: 0 })
      tl.fromTo(parts.code, { autoAlpha: 0, y: 14, scale: 0.9, svgOrigin: '100 188' }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' })
      tl.to(parts.eyes, { y: 6, duration: 0.2 }, '<')
      tl.to(parts.armL, { rotate: -16, duration: 0.25, ease: 'power2.out' }, '<')
      tl.fromTo(parts.lens, { autoAlpha: 0, x: 58, y: 180, scale: 0.6 }, { autoAlpha: 1, x: 58, y: 180, scale: 1, duration: 0.2 })
      for (const [x, y] of [[98, 180], [68, 188], [124, 188], [58, 196], [82, 196]]) {
        tl.to(parts.lens, { x, y, duration: 0.32, ease: 'sine.inOut' })
      }
      tl.to(parts.lens, { autoAlpha: 0, scale: 0.6, duration: 0.2 })
      tl.fromTo(parts.check, { autoAlpha: 0, scale: 0, svgOrigin: '130 188' }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' })
      tl.add(face('happy'), '<')
      tl.to(parts.eyes, { y: 0, duration: 0.2 }, '<')
      tl.to(parts.head, { rotate: 6, y: 4, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut' }, '<0.1')
      tl.to(parts.armL, { rotate: 0, duration: 0.3 }, '<')
      if (!keep) tl.to(parts.code, { autoAlpha: 0, y: 10, duration: 0.3 }, '+=0.9')
      return tl
    },
    /** A context meter beside its head fills up while Bit strains, turns red, and Bit ends up dizzy: too much context, "dumber" answers. */
    overload() {
      return timeline()
        .add(face('neutral'))
        .set(parts.meterFill, { scaleY: 0, svgOrigin: '172.5 125', fill: 'var(--bot-accent)' })
        .to(parts.meter, { autoAlpha: 1, duration: 0.25 })
        .to(parts.meterFill, { scaleY: 1, duration: 1.8, ease: 'power1.in' })
        .to(parts.meterFill, { fill: '#ff5d55', duration: 0.3 }, '-=0.5')
        .to(parts.head, { x: () => gsap.utils.random(-2, 2), duration: 0.05, repeat: 15, yoyo: true, ease: 'none' }, '-=0.9')
        .add(face('dizzy'))
        .set(parts.head, { x: 0 })
        .to(parts.head, { rotate: 7, duration: 0.3, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        .to(parts.bulb, { opacity: 0.2, duration: 0.08, yoyo: true, repeat: 5 }, '<')
    },
    /** A speech bubble with a question mark pops up, twice, while Bit tilts its head: the AI asks before it builds (/plan, /grill-me). keep: leave the bubble up. */
    ask({ keep = false } = {}) {
      const tl = timeline()
        .add(face('wow'))
        .fromTo(parts.speech, { autoAlpha: 0, scale: 0.4, svgOrigin: '160 60' }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)' })
        .to(parts.head, { rotate: 8, duration: 0.3, ease: 'power2.out' }, '<')
        .fromTo(parts.speechText, { y: 0 }, { y: -5, duration: 0.18, yoyo: true, repeat: 3, ease: 'power1.out' })
        .add(face('neutral'))
        .to(parts.head, { rotate: -6, duration: 0.3 })
        .fromTo(parts.speechText, { scale: 1, svgOrigin: '178 30' }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1 })
        .to(parts.head, { rotate: 0, duration: 0.3 })
        .add(face('happy'))
      if (!keep) tl.to(parts.speech, { autoAlpha: 0, scale: 0.6, duration: 0.25 }, '+=0.6')
      return tl
    },
    /** Back into the flask and straight out again, fresh: a cleared session (resets dizziness and the context meter). */
    restart() {
      return timeline()
        .add(bot.retreat())
        .set(parts.meter, { autoAlpha: 0 })
        .set(parts.head, { rotate: 0, x: 0 })
        .add(bot.emerge(), '+=0.3')
    },
    /** Two translucent copies of Bit slide out to either side and work along: running tasks in parallel, each with a fresh context (clears the overload meter). */
    multiply() {
      return timeline()
        .add(face('happy'))
        .to(parts.meter, { autoAlpha: 0, duration: 0.2 })
        .to(parts.head, { rotate: 0, duration: 0.2 }, '<')
        .set(parts.clones, { x: 0, scale: 0.8, svgOrigin: '100 178' })
        .to(parts.clones, { autoAlpha: 0.45, x: (i) => (i ? 64 : -64), duration: 0.5, stagger: 0.15, ease: 'back.out(1.6)' })
        .to(parts.clones, { y: -6, duration: 0.4, yoyo: true, repeat: 3, stagger: 0.2, ease: 'sine.inOut' })
    },
    /** Shakes and flickers with an error face: failures, bugs, "works on my machine". */
    glitch() {
      return timeline()
        .add(face('error'))
        .to(parts.all, { x: () => gsap.utils.random(-6, 6), duration: 0.04, repeat: 9, yoyo: true, ease: 'none' })
        .to(el, { filter: 'hue-rotate(90deg) saturate(2)', duration: 0.05, yoyo: true, repeat: 5 }, 0)
        .set(parts.all, { x: 0 })
    },
  }
  // Motions that use the arms unfold them first when Bit stands with crossed arms.
  for (const name of ['wave', 'think', 'celebrate', 'grantWish', 'writeCode']) {
    const motion = bot[name]
    bot[name] = (...args) => {
      if (!folded) return motion(...args)
      const tl = timeline().add(bot.unfold())
      return tl.add(motion(...args))
    }
  }
  bot.destroy = () => gsap.ticker.remove(tick)
  return bot.mood(mood)
}
