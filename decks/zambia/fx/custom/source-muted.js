// The source after a title, e.g. "*The Good FAAFO* (Vibe Coding, Kim & Yegge, 2025):", in a smaller muted line,
// so the title itself stands out. Wraps the paragraph's plain text after its first element. Target: the paragraph.
import { gsap, fromTimeline } from '@present/engine/effect'
import './source-muted.css'

export default function sourceMuted(el) {
  const nodes = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
  const spans = nodes.map((node) => {
    const span = document.createElement('span')
    span.className = 'source-muted'
    node.replaceWith(span)
    span.append(node)
    return span
  })
  return fromTimeline(gsap.timeline(), { onDestroy: () => spans.forEach((s) => s.replaceWith(...s.childNodes)) })
}
