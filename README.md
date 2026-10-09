# present

Readable Markdown in, Fontys-styled, offline-capable web slides out. Motion lives in a separate `fx.yaml`.
Design decisions: [docs/design.md](docs/design.md) · preset ideas: [docs/presets-lgtm.md](docs/presets-lgtm.md)

```sh
npm install
npm run dev -- zambia      # live-reloading presentation (decks/zambia)
npm run build -- zambia    # static site in dist/zambia/
npm run check -- zambia    # step through every slide; report errors, orphaned fx, leaks
```

Keys while presenting: `→`/`space` next step · `S` speaker notes · `T` light/dark · `F` fullscreen · `Esc` overview.
`?view=read` opens the scroll view.

## A deck

```
decks/<name>/
  content.md      what you say — text, media, emphasis, pauses
  fx.yaml         how it moves — optional
  fx/custom/*.js  deck-specific effects — optional
  img/            media
```

### content.md cheat sheet

```markdown
---
title: AI in Software Development      # generates the cover slide
subtitle: Guest Lecture · Oct 2026
author: Lennart Tange
affiliation: [Fontys University of Applied Sciences]
mode: dark                             # or light
---

# Part 1                               ← section divider
## Slide title {#stable-id}            ← new slide; {#id} optional
---                                    ← slide without a title

A ==key word== lights up.

. . .                                  ← pause: the rest appears on the next click

![alt](img/chart.png "Source: DORA 2025"){.right}   ← title = credit; .small .medium .large .left .right .full .bg

::: timeline
- **1988** ![](img/avatar.png) Born in NL
- **2014–2021** ![](img/ibm.png) Quality Lead Architect   ← period
- **2024–** ![](img/fontys.png) Lecturer                  ← ongoing
:::

::: columns
Left column

---

Right column
:::

::: notes
Only in the speaker view.
:::

::: aside
Extra explanation, only in the reading view.
:::
```

An unknown `::: name` block renders as plain Markdown in `<div class="name">`, with a build warning.

### fx.yaml

```yaml
tempo: 120                     # times are in beats: 2b, 0.5b (ms/s also work)
defaults:
  transition: fade
  emphasis: neon-glow          # applied to every ==word==
  heading: scramble-heading
slides:
  ai-assisted:                 # slide id (heading slug or {#id})
    intent: FAAFO lands like LGTM keycaps
    transition: zoom
    effects:
      - target: ul strong      # CSS selector within the slide
        preset: keycap-stamp
      - target: .media-row
        custom: map-zoom       # decks/<name>/fx/custom/map-zoom.js
        params: { points: ["38% 17%", "71% 85%"] }
        locked: true           # /deck-spice leaves it alone
```

### Writing an effect

```js
import { gsap, fromTimeline } from '@present/engine/effect'

export const steps = 1          // clicks this effect consumes (optional)

export default (el, params, { t, index, count, beat, slide, reduced }) => {
  const tl = gsap.timeline()
  tl.from(el, { opacity: 0, duration: t('1b') })   // entrance
  tl.addLabel('step1')
  tl.to(el, { scale: 1.2, duration: t('0.5b') })   // click 1
  return fromTimeline(tl)       // or your own { play(stage), seek(stage), destroy() }
}
```

Anything goes inside (canvas, three.js, CSS), as long as `seek()` can jump to any stage and `destroy()` cleans up. `npm run check` verifies that.
