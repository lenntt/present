---
name: deck-spice
description: Generates or updates a deck's fx.yaml (transitions, animations, emphasis, custom effects) for the `present` slide engine, in the LGTM music-video style. Use when the user runs /deck-spice, or asks to animate, add effects/transitions/"spice" to slides, or re-spice a deck after editing content.md.
---

# /deck-spice [deck] [slide-id …] ["direction"] [--fresh | --force]

`content.md` says **what**; `fx.yaml` says **how it moves**. This skill writes only `fx.yaml`
and `fx/custom/*.js`. It never edits `content.md` — content ideas are proposed as diffs.

## 1. Read the deck

```sh
npx present outline <deck>      # JSON: slides, fx status, presets, components, custom effects
```

Also read `decks/<deck>/content.md`, `fx.yaml` (if any) and `docs/presets-lgtm.md` (style + preset ideas).

Each slide has `fx`: `new` · `changed` (content edited since last spice) · `spiced` · `unknown` (has fx, never recorded).

## 2. Pick what to (re)spice

| Mode | Slides |
|---|---|
| default | `new` + `changed`; `unknown` only if its entry is broken |
| `slide-id …` | just those |
| `--fresh` | all, except `locked` |
| `--force` | all, including `locked` — confirm with the user first |

Always: delete `orphans` entries (they match no slide) and fix every outline `warning` that concerns fx.
Never touch an entry or effect with `locked: true` (unless `--force`). Keep an existing `intent:` unless the content changed so much that it no longer fits.

## 3. Direct each slide

Think like the LGTM video's editor, not a PowerPoint user:

- **One idea per slide gets the motion.** The key word (`==…==`) lands on the beat; the rest stays calm.
- **Pauses (`. . .`) are cliffhangers**: the step before should leave tension; the reveal pays off.
- Match the effect to the meaning: acronyms → `keycap-stamp`, verdicts → stamp, numbers → count-up, journeys → zoom/draw.
- **Fill the gaps.** A slide that's only text with empty space (most of the right half, below a short list) gets a
  visual that fits its meaning: the mascot acting it out, a small illustrative SVG/canvas scene, a terminal, a diagram that draws itself.
  Aim for nearly every content slide to have *something* to look at; leave a slide bare only when the content already fills it
  or the bareness is the point (a cliffhanger, a quote).
- **Keep focus**: one hero motion per slide. Ambient visuals stay small/slow so the key word still wins; never cover text
  (check `npx present check` for overflow) and never compete with a `==key word==` at the same moment.
- **Bit, the mascot** (preset `bit`; repertoire in `present outline` → `mascot`; preview `/mascot/preview.html`):
  a grey-blue robot genie (= the AI) in a lab flask of Fontys-purple liquid. A prompt is a wish — powerful,
  literal, and you decide when to uncork it. **Pick Bit's pose per slide from what the slide says**: where it
  stands (free space, never over text), its mood, and which motions play automatically or on a click
  (e.g. `emerge` when AI enters the story, `writeCode` at coding, `think` at a question, `glitch` at a failure,
  `retreat` when the human takes over). Vary it; not on every slide.
  **Bit evolves**: when a slide needs a pose or motion Bit doesn't have (e.g. `review`, `deploy`, `shrug`), add it
  to `packages/engine/mascot/bot.js` — see REFERENCE.md — and list it in your report as new.
- Prefer an existing preset; write a **custom effect** when the slide's context calls for something specific (e.g. zooming into a map). Custom code is cheap — make it fit.
- Respect `private` slides like any other (they're stripped at build automatically).
- **Author hints come first**: a slide's `hints` (from `<!-- fx: … -->` comments in content.md) are the author's own
  ideas for that slide — build them (write a custom effect if no preset fits) and name them in the report. Never remove them.
- Honour the user's `"direction"` (e.g. "calmer", "more glitch") across all chosen slides.

Write an `intent:` (one sentence: what the motion should make the audience feel/notice) for every slide you spice.

## 4. Write

`fx.yaml` schema, effect contract and examples: see [REFERENCE.md](REFERENCE.md).
Times are in beats (`1b` = ½ s at tempo 120). Keep comments and ordering in `fx.yaml` intact (edit, don't regenerate).

## 5. Verify

```sh
npx present check <deck>        # every slide, every step, forward/back; errors, missing targets, overflow, leaks
```

Fix until it prints `ok` (warnings about unrelated content may remain — report them). Then record the result:

```sh
npx present outline <deck> --mark=<id>,<id>   # record the slides you spiced (plain --mark = all)
```

## 6. Report

A short table: slide · what changed · intent. List skipped locked slides and any content suggestions as a
Markdown diff of `content.md` (e.g. "add `==emphasis==` here", "split this slide", "a `. . .` before the punchline") — never apply those yourself.
Tell the user to look at it live: `npm run dev -- <deck>` (the dev server reloads on save).
