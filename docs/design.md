# present — design decisions

A simpler PowerPoint alternative: readable Markdown in, static offline-capable web slides out, with AI-generated "spice" (transitions, animations, visuals) kept in a separate file.

## Core principle: two files per deck

| File | Owns | Written by |
|---|---|---|
| `content.md` | **What** — text, structure, media, emphasis, pauses (storytelling) | Human (Claude may *propose* diffs) |
| `fx.yaml` | **How** — transitions, animations, visual treatment (production) | `/deck-spice` + human tweaks |

A deck must build and present fine without `fx.yaml`.

## Architecture

- **Monorepo** (`packages/engine`, `decks/<name>/`), engine kept behind a package boundary so it can be extracted later.
- **reveal.js 5** for navigation, scaling, presenter view, scroll/reading view, PDF.
- **Build:** Node + Vite (live reload), unified/remark + remark-directive, sharp (images), Playwright (PDF + effect harness).
- **Offline is a hard requirement:** no CDN; fonts, libs and media bundled. YouTube embeds fall back to thumbnail + link.
- **Private slides:** `{.private}` on a heading → shown when presenting locally (`dev`), stripped from every export (`build`, later `pack`/PDF) together with its notes, fx entries and media used only by it. Builds ship only referenced media. `dev --public` previews the export.
- **Local-first:** `npm run dev` / `npm run present <deck>`. Publishing opt-in per deck (`publish: true`) → GitHub Pages. `npm run pack <deck>` → self-contained ZIP (Canvas fallback).

## content.md

- **Frontmatter:** `title`, `subtitle`, `author`, `lang: nl|en`, `mode: light|dark`, `publish`. Generates the cover slide.
- **Slides are heading-driven:** `#` = section divider, `##` = slide, `---` only for title-less slides.
- **Layout** inferred from content; override via class on heading (`## Title {.cover}`).
- **IDs:** auto-slug from heading; optional explicit `{#id}`. Build warns on fx entries that match nothing.
- **Emphasis:** `==word==` = key word (default: accent colour; fx may restyle).
- **Pause / step:** a line containing `. . .` — everything after appears on next click.
- **Components:** `::: name` … `:::` around plain Markdown. Unknown component → rendered as plain Markdown inside `<div class="name">` + build warning. A component is a folder with optional `parse.js`, `style.css`, `animate.js` (grows: class → CSS → full component). Components ship a default animation; fx may override.
- **Notes:** `::: notes` (private, presenter only) and `::: aside` (explanation, shown in reading view, hidden while presenting).
- **Images:** `![alt](src "credit"){.class}`
  - title text = source credit, rendered small in/next to the image
  - classes: `.small` `.medium` `.large` `.left` `.right` `.full` `.bg` (bg gets readability overlay)
  - defaults inferred from context; responsive `srcset` (WebP/AVIF) generated at build
  - same syntax for `.mp4` and YouTube links
  - a lone `.full` media on a slide fills it edge to edge (no padding, no chrome)

## Theme: `fontys`

- Recognisably Fontys, tailored "nerdy" for informatics students (inspired by the LGTM music video by Degenerative Pixels: dark card UI, code backdrop, kinetic type, emphasis on key words, pauses on cliffhangers).
- **Brand colour:** purple `#663366` only (no magenta). **Single accent:** terminal green (darker shade in light mode for WCAG AA). Red/orange reserved for semantics (wrong/before).
- **Modes:** `light` (default, lecture hall) and `dark` (purple-black ~`#1a1020`, glowing accents).
- Fontys logo fixed in a corner; large on cover.
- Base style always: monospace for labels/metadata, subtle dot/line grid. Typing/glitch/git-metaphor effects are fx presets, not base style.
- Fixed 16:9 canvas (1920×1080) for presenting + reading view (stacked, reduced motion, asides visible).
- Fonts: **Roboto** (body) + **Roboto Condensed** (headings/labels), **JetBrains Mono** for code/metadata. All self-hosted.

## fx.yaml and effects

- Targets slides/elements by slug/ID + selectors within the slide.
- References **presets** (shared building blocks) or **custom modules** (`fx/custom/<name>.js`) — custom is encouraged when context calls for it.
- Per-slide `intent:` note so re-runs keep direction; `locked: true` protects entries.
- **Timing:** click-driven steps; within a step, optional auto-sequences. Expressed in **beats** (`at: 2b`, deck `tempo`) so audio sync can be added later without rewriting fx. No audio in v1.
- **Effect contract** (any tech inside — GSAP, canvas, Three.js, CSS):
  ```js
  export default (el, params, ctx) => ({
    steps: 2,
    play(step) {},
    seek(step, 'end') {},
    destroy() {},
  })
  ```
  `fromTimeline(tl)` wraps a GSAP timeline. GSAP is the default, not mandatory.
- **Harness** runs every effect through play → seek → back → destroy, checking for errors/leaks. `/deck-spice` runs it after generating.

## Skills

- **`/deck-new`** — turn input into a good `content.md`: blank scaffold, **PPTX import** (titles/sections/notes/images/recognisable layouts; Claude edits for brevity and suggests `==emphasis==`/`. . .`; un-convertible slides like SmartArt become a TODO + screenshot of the original), or other sources (outline, Word, article).
- **`/deck-spice [slide] ["direction"]`** — incremental by default: only new/changed slides, repairs orphans, respects locks, shows a summary/diff. `--fresh` regenerates all except locked; `--force` regenerates everything. Content changes are proposed as diffs, never silent.
- Both live in `.claude/skills/`. Deterministic parts are code: `present outline` (deck as JSON; per-slide content fingerprints vs `.fx-state.json` → `new`/`changed`/`spiced`, `--mark` records them) and `deck-new/scripts/pptx-extract.mjs` (PPTX → JSON + images, no dependencies).

## v1 — one real deck end-to-end

Build only what one real lecture (containing the career timeline) needs:

1. `fontys` theme, light + dark
2. Heading-driven slides, frontmatter cover, slugs/IDs
3. `==emphasis==`, `. . .`, notes/aside
4. Images with classes + credits
5. Components: `timeline`, `columns`
6. Effect contract + harness; presets `scramble-heading`, `emphasis-glow`, `timeline-draw`
7. `/deck-spice`, then `/deck-new` (PPTX import) on that deck
8. Reading view, `pack` ZIP

Later: more components (`steps`, `stat`, `quote`, `code`), private hosting, audio sync, split engine into its own package.

## v1 candidate deck

`~/Documents/202610-Zambia-AI-software-dev.pptx` — guest lecture "AI in Software Development", Northrise, Oct 2026 (WIP). 12 content slides; 13–18 are empty template leftovers.

Import test cases it exercises:
- cover from frontmatter (slide 1)
- 3 stacked map images → custom zoom effect Venlo → Zambia (slide 2)
- free-positioned text boxes → `::: timeline`, sorted by x (slide 3)
- chart screenshots with loose "Source: …" text → image credits (slides 4, 8)
- acronym FAAFO → tile/letter emphasis (slide 7)
- terminal screenshot (slide 10)

## Open

- Preset catalogue from the LGTM frame analysis.
