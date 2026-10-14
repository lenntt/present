# deck-spice reference

## fx.yaml

```yaml
# How the deck moves. Content lives in content.md; this file only adds motion.
tempo: 120                         # beats per minute; all times below are in beats

defaults:                          # apply to every slide unless overridden
  transition: fade                 # none | fade | slide | convex | concave | zoom
  emphasis: neon-glow              # preset for every ==word==   (none = plain accent colour)
  heading: scramble-heading        # preset for every slide heading (none = static)

slides:
  <slide-id>:                      # id from `present outline` (heading slug or {#id})
    intent: One sentence — what the motion should make the audience notice.
    transition: zoom               # overrides defaults
    heading: none
    headingParams: {}
    emphasis: keycap-stamp
    emphasisParams: {}
    components:                    # params for a component's own animation (animate.js)
      timeline: { duration: 8b }
    effects:                       # applied in order
      - target: ul strong          # CSS selector inside the slide; omitted = the slide body
        preset: keycap-stamp       # packages/engine/presets/<name>.js — or `none` to disable
        params: {}
      - target: .media-row
        custom: map-zoom           # decks/<deck>/fx/custom/<name>.js
        params: { points: ["38% 17%", "71% 85%"] }
        locked: true               # /deck-spice leaves this effect alone
    locked: true                   # …or the whole slide entry
```

An effect on a component element replaces the component's default animation.
Useful selectors (rendered HTML): `.slide-head h2`, `.slide-body`, `.col-main`, `.col-media`, `figure.media`, `.media-row`,
`mark` (==emphasis==), `ul > li`, `.fragment` (content after a `. . .`), `.component.<name>`; timeline: `.tl-line`, `.tl-item`, `.tl-logo`, `.tl-label`.
Check the real markup in the browser or with `npx present build <deck>` → `dist/<deck>/index.html` when unsure.

## Effect contract

```js
// decks/<deck>/fx/custom/<name>.js — first comment lines are the description `present outline` shows.
import { gsap, fromTimeline } from '@present/engine/effect'

export const steps = 1                 // clicks this effect consumes; or (params) => n

export default (el, params, { t, beat, index, count, slide, reduced }) => {
  // t('2b') → seconds; index/count: position among elements matched by `target`
  const tl = gsap.timeline()
  tl.from(el, { opacity: 0, y: 40, duration: t('1b'), delay: index * t('0.5b') })  // stage 0: entrance
  tl.addLabel('step1')
  tl.to(el, { scale: 1.1, duration: t('0.5b') })                                    // stage 1: first click
  return fromTimeline(tl, { onDestroy() { /* undo DOM changes */ } })
}
```

- Stage 0 = entrance (when the slide or the element's `. . .` fragment appears); stages 1..steps = extra clicks.
- The engine may call `seek(stage)` in any order (jumping slides, going back) — `seek` must be deterministic.
  `seek(-1)` = before entrance. `fromTimeline` handles this; hand-written controllers must too.
- Slides get replayed (back and forth). In a `fromTo`, **every property in the start values needs an end value too**
  (`{ autoAlpha: 1, y: -40 } → { autoAlpha: 1, y: 0 }`), or it's only applied the first time. `present check` replays
  every slide and reports "replay ends differently than the first run".
- `destroy()` must undo every DOM/style change (wrap-spans, classes, inline styles, canvases, listeners).
  Tweens made inside the factory are reverted automatically (gsap.context).
- `reduced` is true for prefers-reduced-motion and the reading/print view. The engine then seeks instead of
  playing, so timelines need nothing extra; only skip ambient/looping motion (particles, pulses) yourself.
- Any tech is fine (GSAP + all its plugins incl. SplitText/ScrambleText/DrawSVG, canvas, CSS, three.js if installed).
  A `.css` file next to the module can be imported (`import './name.css'`). No network access: everything must work offline.
- Never hide content permanently: if an effect throws, the engine shows the content unanimated and `present check` reports it.

## Bit on a slide (preset `bit`)

```yaml
  context-practice:
    intent: Bit types each practice like a command, then nods — the human approves.
    effects:
      - preset: bit
        params:
          place: right            # right | left | bottom-right | bottom-left
          size: 300               # px
          mood: happy             # starting mood
          enter: fade             # emerge (pops out of the flask) | fade | none
          at: 1b                  # when it enters
          play: [wave]            # motions right after entering
          click: [{ motion: writeCode, args: { keep: true } }, nod]   # one motion per click
          # idle: false           # no hover/blink in between
```

Each `click` entry adds a step to the slide. A motion can switch the face afterwards: `{ motion: think, mood: happy }`.
Unknown motion names make the effect fail loudly (`present check` reports it).

## Evolving Bit (new motions and moods)

Bit lives in `packages/engine/mascot/bot.js` and is shared by all decks — additions benefit every deck.

- **Motion** = a method on `bot` returning a GSAP timeline, with a one-line `/** … */` doc right above it (that's what
  `present outline` shows). Animate only `bot.parts` (`all head bulb armL armR fold smoke cork sparks eyes code …`) and
  end back in a neutral pose (arms down, head straight) unless the name says otherwise.
- Switch faces **inside the timeline** with `.add(face('wow'))`, never `bot.mood()` — so seeking back and forth works.
- New **mood** = a `<g class="bot-face" data-mood="…">` in the SVG (screen area x 56–144, y 58–118, white `bot-eye` /
  `bot-line` shapes) + its name in `MOODS`.
- New **parts** (a prop like a magnifier or a rocket) go in the SVG, hidden by default (`gsap.set(…, { autoAlpha: 0 })`).
- Stay in Bit's look: grey-blue shell (`--bot-shell`, `--bot-outline`), Fontys-purple screen/accents (`--bot-screen`,
  `--bot-accent`), white glow (`--bot-glow`). Minimal shapes, no gradients beyond the smoke.
- Check it: the motion appears as a button in `/mascot/preview.html`; then `npx present check <deck>`.

## Other visuals (filling gaps)

Effects may add DOM: create elements inside the slide's `.frame` (positioned absolutely, `z-index: 0`), mark them
`aria-hidden="true"`, keep them clear of `.slide-head`, the text and the footer band (bottom 100px), and remove them
in `onDestroy`. Endless loops can't live inside a seekable timeline: start them outside it, keep the handle and
`kill()` it in `onDestroy`; skip them when `reduced`.

## Presets vs custom

- Use **presets** (`npx present outline` → `presets`) when one fits.
- Write a **custom** effect for anything slide-specific. If the same idea would help other decks, mention
  it in the report as a candidate preset (`packages/engine/presets/`) — don't add engine presets unasked.
- Catalogue of preset ideas with LGTM timings: `docs/presets-lgtm.md`.

## Style cues (LGTM video, ~120 BPM)

One signal colour (accent green) per line; hard cuts on the beat, short overshoot eases (`back.out(2)`),
½–1 beat staggers; monospace/terminal metaphors (typing, scramble, diff, stamps, keycaps);
before a cliffhanger, dim the rest; the payoff word lands on the downbeat.
