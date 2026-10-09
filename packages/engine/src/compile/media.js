// Images, video and embeds → <figure> with an optional small source credit.
import { h } from 'hastscript'

const VIDEO = /\.(mp4|webm|mov)$/i
const YOUTUBE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/
const URL_RE = /(https?:\/\/[^\s)]+)/g

export function figureFor(img, { inline = false } = {}) {
  const { src = '', alt = '', title, className = [], ...rest } = img.properties
  const classes = [].concat(className)
  const media = mediaElement(src, alt, rest)
  const children = [media]
  if (title) children.push(h('figcaption.credit', linkify(title)))
  return h('figure', { className: ['media', inline ? 'inline' : null, ...classes].filter(Boolean) }, children)
}

function mediaElement(src, alt, rest) {
  if (VIDEO.test(src)) {
    return h('video', { src, muted: true, loop: true, playsInline: true, dataAutoplay: true, ariaLabel: alt || undefined })
  }
  const yt = src.match(YOUTUBE)
  if (yt) {
    // Offline-first: a local thumbnail link, upgraded to an embed only when online.
    return h('a.youtube', { href: src, target: '_blank', rel: 'noopener', dataYoutube: yt[1] }, [
      h('span.youtube-label', alt || 'Video on YouTube'),
    ])
  }
  return h('img', { src, alt, loading: 'lazy', ...rest })
}

function linkify(text) {
  const out = []
  let last = 0
  for (const m of text.matchAll(URL_RE)) {
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) })
    const url = m[1]
    out.push(h('a', { href: url, target: '_blank', rel: 'noopener' }, shortUrl(url)))
    last = m.index + url.length
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) })
  return out
}

function shortUrl(url) {
  const u = new URL(url)
  const file = u.pathname.split('/').filter(Boolean).at(-1)
  return file ? `${u.hostname}/…/${file}` : u.hostname
}
