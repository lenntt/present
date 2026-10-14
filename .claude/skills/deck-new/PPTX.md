# PPTX → content.md mapping

The extractor gives facts; you make the judgement calls. Positions (`box`) are % of the slide.

| PPTX | content.md |
|---|---|
| slide 1 with a title-ish layout (`Voorblad…`, `Title Slide`) | frontmatter: `title` ← title, body lines → `subtitle` / `author` / `affiliation` |
| `placeholder:title` | `## Title` (fix casing/typos; keep it short) |
| `placeholder:body` paragraphs | list; `level` → nesting. Paragraphs with `bullet: false` → plain text |
| `**…**` runs that start each bullet (F**aster**, **A**mbitious) | an acronym → keep as is; suggest `keycap-stamp` in the report for /deck-spice |
| `text` boxes laid out as a grid/row | `::: columns` (split with `---`), in x order |
| years in text boxes along a line + labels/logos below or above | `::: timeline`: pair each year with the label and logo closest in **x**; `2011–2014`-style periods when a label spans two years; `**2026+**` for "the future" |
| `image` | `![alt](img/…)` — alt from `alt`, else describe it. Two+ images on one slide = consecutive lines (a row). Image covering ≥ 90 % of the slide with text on top → `{.bg}`; alone and full-bleed → `{.full}` |
| small text box near an image starting with `Source`, `Bron`, `©`, a URL | the image's credit: `![alt](src "Source: …")` |
| several large images stacked/overlapping (e.g. maps zooming in) | one row in widest-first order; suggest a custom zoom effect for /deck-spice |
| `video` | `![alt](video-url)` (YouTube or a copied `.mp4`) |
| `table` (`rows`) | GFM table |
| `smartart` / `chart` / `object` / `group` you can't rebuild | rebuild as list/columns/timeline if the meaning is clear; otherwise `<!-- TODO: slide N had a <kind> "<name>" — recreate or screenshot -->` |
| `notes` | `::: notes` (keep the speaker's wording; drop slide-number leftovers) |
| `hidden: true` | ask: skip, or keep as `{.private}` |
| slides with no shapes (template leftovers) | skip silently |
| a slide that's just a section title (big text, no body) | `# Section` |

Notes:

- Bullet text from Word/PPT often has smart quotes, `- ` prefixes, `->` arrows or trailing spaces — normalise (`→`, `⟷`).
- The Fontys logo/backgrounds come from the theme: drop template decoration images.
- Repeated identical titles on consecutive slides (e.g. "Context Engineering" twice) → give the later ones a distinguishing title or `{#id}`, or merge if short.
- Keep the source's language (`lang:`); don't translate unless asked.
