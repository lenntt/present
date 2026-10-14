// Images, video and embeds → <figure> with an optional small source credit.
import { h } from 'hastscript'

const VIDEO = /\.(mp4|webm|mov)$/i
const YOUTUBE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/
const GMAPS = /^https?:\/\/(?:www\.|maps\.)?google\.[a-z.]+\/maps|^https?:\/\/maps\.google\.[a-z.]+\//
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
  if (GMAPS.test(src)) {
    // Same as YouTube: a link offline, a live (zoomable) map online. Built from q / z / t in the URL.
    return h('a.map', { href: src, target: '_blank', rel: 'noopener', dataMap: mapEmbed(src, alt) }, [
      h('span.map-label', alt || 'Map on Google Maps'),
    ])
  }
  return h('img', { src, alt, loading: 'lazy', ...rest })
}

// https://www.google.com/maps?q=Fontys+Venlo&z=4&t=k  or  …/maps/place/Fontys+Venlo/@51.35,6.15,15z
function mapEmbed(src, alt) {
  const u = new URL(src)
  const place = u.pathname.match(/\/place\/([^/]+)/)?.[1]
  const at = u.pathname.match(/@(-?[\d.]+),(-?[\d.]+),(\d+(?:\.\d+)?)z/)
  const q = u.searchParams.get('q') ?? (place && decodeURIComponent(place.replace(/\+/g, ' '))) ?? (at && `${at[1]},${at[2]}`) ?? alt
  const params = new URLSearchParams({ q, z: u.searchParams.get('z') ?? (at ? Math.round(at[3]) : 4), output: 'embed' })
  if (u.searchParams.get('t')) params.set('t', u.searchParams.get('t'))
  return `https://maps.google.com/maps?${params}`
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
