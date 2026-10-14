---
name: deck-new
description: Creates a new slide deck (decks/<name>/content.md + img/) for the `present` engine — from a PowerPoint (.pptx) import, an outline, a Word/PDF/article source, or a blank Fontys scaffold. Use when the user runs /deck-new, wants to start a presentation/lecture/slides, or convert/import a PowerPoint or document into a deck.
---

# /deck-new [source] [name]

Produces a readable `decks/<name>/content.md` (plus `img/`). Motion is a separate step: `/deck-spice`.
Syntax of content.md: see the cheat sheet in `README.md` — read it first, it's the source of truth.

## 1. Set up

- **name**: short kebab-case (`ai-software-dev`); ask only if the source gives no good one. Refuse to overwrite an existing `decks/<name>/`.
- Create `decks/<name>/` and `decks/<name>/img/`.

## 2. Get the material

| Source | How |
|---|---|
| `.pptx` | `node .claude/skills/deck-new/scripts/pptx-extract.mjs <file> decks/<name> > <scratch>/pptx.json` (scratchpad/temp dir, not the deck) — JSON per slide (shapes in reading order with % boxes, bullets/levels, bold/italic/links as Markdown, notes, hidden flag) and all pictures copied to `img/slideNN-M.ext`. Mapping rules: [PPTX.md](PPTX.md) |
| `.docx` / `.rtf` | `textutil -convert html -stdout <file>` (macOS), then work from the headings |
| `.pdf` | Read it (pages) |
| outline / notes / article / URL | Read it as is |
| nothing | Scaffold: frontmatter + a section, 3–4 example slides showing `==emphasis==`, `. . .`, an image with credit, `::: notes` |

## 3. Write content.md

Frontmatter: `title`, `subtitle`, `author`, `affiliation` (list), `lang` (en/nl, from the source), `mode: light`.
The cover slide is generated from it — don't add a cover slide.

Write like a good lecturer, not like a PowerPoint:

- `##` per slide with a short, specific title. `#` for a section divider when the talk has parts.
- **Brevity**: bullets ≤ ~8 words, ≤ 6 per slide; move detail into `::: notes` (speaker) or `::: aside` (reading view). Keep the author's voice and terms — tighten, don't rewrite opinions.
- Suggest ==one key word== per slide where there is a punchline, and `. . .` before a cliffhanger/reveal. Be sparing.
- Images: `![alt](img/file.png "Source: …")` — the title is the credit. Put loose "Source: …" text from the original there.
  Use `{.left}` `{.full}` `{.bg}` `{.small}` only when the default layout (text left, media right) is wrong.
- Use components where the structure fits: `::: timeline` (years/careers/history), `::: columns` (side-by-side comparisons). `npx present outline <name>` lists all available components.
- Give a slide `{#id}` only when its slug would be long or unstable.
- **Privacy**: personal details (home address/maps, phone, family, salaries, student names/grades) → ask whether that slide should be `{.private}` (shown locally, never exported).

## 4. Tidy media

Rename extracted images to meaningful names (`dora-2025-ai-use.png`, not `slide04-11.png`) and update the references.
Delete extracted images that ended up unused (template backgrounds, logos repeated by the theme).

## 5. Verify

```sh
npx present check <name>    # renders every slide; reports missing media, unknown components, overflow
```

Fix overflow by trimming/splitting slides (not by shrinking fonts). Repeat until `ok`.

## 6. Report

- Slide list: original → new (merged/split/skipped and why).
- **TODOs** you left in the deck (`<!-- TODO: … -->`) for things that didn't convert (SmartArt, charts, complex diagrams).
- Suggested `{.private}` slides.
- Next: `npm run dev -- <name>` to look at it, then `/deck-spice <name>` for motion.

Don't commit deck content unless the user asks.
