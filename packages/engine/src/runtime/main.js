import Reveal from 'reveal.js'
import Notes from 'reveal.js/plugin/notes/notes.esm.js'
import 'reveal.js/dist/reveal.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/400-italic.css'
import '@fontsource/roboto/700.css'
import '@fontsource/roboto-condensed/400.css'
import '@fontsource/roboto-condensed/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import '../../theme/fontys.css'
import deck from 'virtual:deck'
import { createFx } from './fx.js'

import.meta.glob('../../components/*/style.css', { eager: true })
const modules = {
  presets: byName(import.meta.glob('../../presets/*.js', { eager: true }), /presets\/(.+)\.js$/),
  components: byName(import.meta.glob('../../components/*/animate.js', { eager: true }), /components\/([^/]+)\/animate\.js$/),
  custom: deck.custom,
}

const params = new URLSearchParams(location.search)
const reading = params.get('view') === 'read'
const printing = params.has('print-pdf')
const root = document.documentElement
root.classList.toggle('view-read', reading)

for (const w of deck.warnings) console.warn(`[deck] ${w}`)

const slides = document.querySelector('.reveal .slides')
slides.innerHTML = deck.html
addChrome(slides, deck.meta)
if (navigator.onLine) embedOnline(slides)

const fx = createFx({ Reveal, fx: deck.fx, meta: deck.meta, modules, still: reading || printing })
fx.attach()

Reveal.initialize({
  width: 1920,
  height: 1080,
  margin: 0,
  center: false,
  hash: true,
  controls: false,
  progress: true,
  slideNumber: false,
  transitionSpeed: 'fast',
  view: reading ? 'scroll' : null,
  scrollProgress: true,
  plugins: [Notes],
  keyboard: {
    84: () => root.classList.replace(...(root.classList.contains('mode-dark') ? ['mode-dark', 'mode-light'] : ['mode-light', 'mode-dark'])), // T: toggle light/dark
  },
})

window.Reveal = Reveal // for the effect harness and debugging
window.__present = { fx, warnings: deck.warnings }

Reveal.on('slidechanged', ({ currentSlide, previousSlide }) => {
  previousSlide?.querySelectorAll('video').forEach((v) => v.pause())
  previousSlide?.querySelectorAll('iframe.youtube').forEach((f) => f.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'))
  currentSlide.querySelectorAll('video[data-autoplay]').forEach((v) => v.play().catch(() => {}))
})

function addChrome(slides, meta) {
  const sections = [...slides.querySelectorAll(':scope > section')]
  const total = String(sections.length).padStart(2, '0')
  sections.forEach((s, i) => {
    const chrome = document.createElement('div')
    chrome.className = 'chrome'
    chrome.innerHTML = `<span class="chrome-logo" aria-hidden="true"></span><span class="chrome-path">~/${meta.slug ?? 'deck'}/<b>${s.dataset.slide}</b></span><span class="chrome-count">${String(i + 1).padStart(2, '0')}/${total}</span>`
    s.querySelector('.frame')?.appendChild(chrome)
  })
}

// Offline the YouTube/map links stay links; online they become the player / a live map.
function embedOnline(slides) {
  for (const a of slides.querySelectorAll('a.youtube[data-youtube]')) {
    const iframe = document.createElement('iframe')
    iframe.className = 'youtube'
    iframe.src = `https://www.youtube-nocookie.com/embed/${a.dataset.youtube}?enablejsapi=1&rel=0`
    iframe.title = a.textContent
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture'
    iframe.allowFullscreen = true
    a.replaceWith(iframe)
  }
  for (const a of slides.querySelectorAll('a.map[data-map]')) {
    const iframe = document.createElement('iframe')
    iframe.className = 'map'
    iframe.src = a.dataset.map
    iframe.title = a.textContent
    iframe.loading = 'lazy'
    iframe.referrerPolicy = 'no-referrer-when-downgrade'
    a.replaceWith(iframe)
  }
  // Clicking the player or map hands it keyboard focus, so arrows would seek instead of advance.
  // Take focus back right after; the click itself still reaches the player.
  window.addEventListener('blur', () => setTimeout(() => {
    if (document.activeElement?.matches('iframe.youtube, iframe.map')) {
      document.activeElement.blur()
      window.focus()
    }
  }))
}

function byName(globbed, re) {
  return Object.fromEntries(Object.entries(globbed).map(([file, mod]) => [file.match(re)[1], mod]))
}
