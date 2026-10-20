# present

Readable Markdown in, Fontys-styled, offline-capable web slides out. Motion lives in a separate `fx.yaml`.
Design decisions: [docs/design.md](docs/design.md) · preset ideas: [docs/presets-lgtm.md](docs/presets-lgtm.md)

```sh
npm install
npm run dev -- zambia      # live-reloading presentation (decks/zambia)
npm run build -- zambia    # static site in dist/zambia/
npm run check -- zambia    # step through every slide; report errors, orphaned fx, overflow, leaks
npm run dev -- zambia --public   # preview exactly what gets exported (private slides left out)
npx present site           # every deck → dist/<deck>/ + an index page (what GitHub Pages serves)
```

Every push to `main` publishes all decks to GitHub Pages (`.github/workflows/pages.yml`), at
`https://<user>.github.io/<repo>/<deck>/`. Private slides are always left out; put `publish: false` in a
deck's frontmatter to keep the whole deck off the site.

With Claude Code, in this repo:

```
/deck-new ~/Documents/talk.pptx my-talk    # import a PowerPoint (or an outline, Word/PDF, or nothing) → decks/my-talk/content.md
/deck-spice my-talk                        # write fx.yaml: motion for new/changed slides, then run check
/deck-spice my-talk career "more glitch"   # one slide, with a direction; --fresh = all unlocked slides, --force = everything
```

`npx present outline <deck>` prints the deck as JSON (slides, fx status, presets, components) — what `/deck-spice` reads.
`.fx-state.json` remembers which slide versions were spiced, so a re-run only touches what changed.

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
ends: 16:30 Africa/Lusaka              # session end (IANA time zone optional) — for ::: countdown
---

# Part 1                               ← section divider
## Slide title {#stable-id}            ← new slide; {#id} optional
## About me {.private}                 ← shown when presenting locally, never exported
---                                    ← slide without a title

A ==key word== lights up.

Tip: a paragraph or bullet starting with "Tip:" gets the tip style (badge + callout).

. . .                                  ← pause: the rest appears on the next click

![alt](img/chart.png "Source: DORA 2025"){.right}   ← title = credit; .small .medium .large .left .right .full .bg

::: timeline
- **1988** ![](img/avatar.png) Born in NL
- **2014–2021** ![](img/ibm.png) Quality Lead Architect   ← period
  - Watson/Cognos                                      ← nested item: smaller subline
- **2024–** ![](img/fontys.png) Lecturer                  ← ongoing
- **2026+** What's next?                               ← looking ahead: line ends in an arrow
:::

::: columns
Left column

---

Right column
:::

::: countdown                          ← big clock counting down to `ends:` (or {until="16:30 Europe/Amsterdam"})
:::                                       content, if any, is the label; default "until 16:30"

::: notes
Only in the speaker view.
:::

<!-- fx: a slider that animates from "vibe coding" to "full control" -->   ← idea for /deck-spice (never shown)
<!-- anything else -->                                                     ← private remark (never shown)

::: aside
Extra explanation, only in the reading view.
:::
```

A `{.private}` slide is shown in `npm run dev` (marked "private — not exported" in the footer) and left out of every build:
its text, notes, `fx.yaml` entry and any media only it uses don't end up in `dist/`. The build only ships media that the exported slides reference.

A component folder may hold a `client.js` that runs once per instance in the browser, independent of fx (the countdown's clock).

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
