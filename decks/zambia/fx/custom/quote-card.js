// A quote or definition set apart as a card: accent bar on the left, a soft tint, room below.
// Layout only, so it pairs with a text effect (e.g. type-in) on the same element. Target: the quote's paragraph.
import { gsap, fromTimeline } from '@present/engine/effect'
import './quote-card.css'

export default function quoteCard(el) {
  el.classList.add('quote-card')
  return fromTimeline(gsap.timeline(), { onDestroy: () => el.classList.remove('quote-card') })
}
