// An acronym list (`- **F**aster`, `- **A**mbitious`, …) laid out as one row of keys, each word under its letter:
// the acronym reads left to right at a glance and takes one line instead of five. Layout only — pair it with
// `keycap-stamp` on `ul strong` for the motion. Target: the list.
import { gsap, fromTimeline } from '@present/engine/effect'
import './acronym-row.css'

export default function acronymRow(el) {
  el.classList.add('acronym-row')
  return fromTimeline(gsap.timeline(), {
    onDestroy() {
      el.classList.remove('acronym-row')
    },
  })
}
