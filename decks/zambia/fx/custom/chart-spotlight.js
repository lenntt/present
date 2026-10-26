// A spotlight on a chart image: the rest dims and a framed band picks out one row, with a small tag.
// The first spot lands `at` (default 3b) after the chart appears; every further spot is a click, and the
// band glides there. Target: the figure (or img); the picture fills the figure's free space (e.g. layout-picture). params: at, spots (list of { box: [x, y, w, h] in % of
// the image, label, color (CSS, default accent), side (of the tag: right | above, default right) }), dim (0–1, default 0.55).
import { gsap, fromTimeline } from '@present/engine/effect'
import './chart-spotlight.css'

export const steps = (params) => Math.max(0, (params.spots?.length ?? 1) - 1)

const pct = (box) => ({ left: `${box[0]}%`, top: `${box[1]}%`, width: `${box[2]}%`, height: `${box[3]}%` })

export default function chartSpotlight(el, params, { t }) {
  const img = el.tagName === 'IMG' ? el : el.querySelector('img')
  const spots = params.spots ?? []
  if (!img || !spots.length) throw new Error('chart-spotlight needs an image and at least one spot')

  // Wrap the image so the band can be placed in % of the picture itself: the wrap takes the image's
  // free space, the inner box is exactly the picture (its aspect ratio, contained).
  const wrap = document.createElement('span')
  wrap.className = 'chart-spotlight'
  wrap.style.setProperty('--cs-dim', String(params.dim ?? 0.55))
  wrap.innerHTML = '<span class="csp-pic"></span>'
  const pic = wrap.firstChild
  const ratio = () => img.naturalWidth && pic.style.setProperty('--cs-ratio', String(img.naturalWidth / img.naturalHeight))
  ratio()
  img.addEventListener('load', ratio)
  img.replaceWith(wrap)
  pic.append(img)
  const band = document.createElement('span')
  band.className = 'csp-band'
  band.setAttribute('aria-hidden', 'true')
  band.innerHTML = '<b class="csp-tag"></b>'
  pic.append(band)
  const tag = band.firstChild

  const color = (s) => s.color ?? 'var(--accent)'
  const tl = gsap.timeline()
  const at = t(params.at, t('3b'))
  tl.fromTo(band, { autoAlpha: 0, scale: 1.15, ...pct(spots[0].box) }, { autoAlpha: 1, scale: 1, ...pct(spots[0].box), duration: t('0.5b'), ease: 'back.out(2)' }, at)
  tl.set(band, { '--cs-color': color(spots[0]) }, at)
  tl.set(tag, { textContent: spots[0].label ?? '' }, at)
  tl.set(band, { attr: { 'data-side': spots[0].side ?? 'right' } }, at)
  tl.fromTo(tag, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: t('0.5b'), ease: 'back.out(2)' }, at + t('0.5b'))

  spots.slice(1).forEach((s, i) => {
    const step = `step${i + 1}`
    const prev = spots[i]
    tl.addLabel(step)
    tl.to(tag, { autoAlpha: 0, duration: t('0.25b') }, step)
    tl.fromTo(band, pct(prev.box), { ...pct(s.box), duration: t('1b'), ease: 'power3.inOut' }, step)
    tl.fromTo(band, { '--cs-color': color(prev) }, { '--cs-color': color(s), duration: t('0.5b') }, `${step}+=${t('0.5b')}`)
    tl.set(tag, { textContent: s.label ?? '' }, `${step}+=${t('1b')}`)
    tl.set(band, { attr: { 'data-side': s.side ?? 'right' } }, `${step}+=${t('1b')}`)
    tl.fromTo(tag, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: t('0.5b'), ease: 'back.out(2)', immediateRender: false }, `${step}+=${t('1b')}`)
    // A small jolt when it lands on a bad one.
    if (s.color) tl.fromTo(band, { x: 0 }, { x: 4, duration: 0.04, yoyo: true, repeat: 3, ease: 'none', immediateRender: false }, `${step}+=${t('1b')}`)
  })

  return fromTimeline(tl, {
    onDestroy() {
      img.removeEventListener('load', ratio)
      wrap.replaceWith(img)
    },
  })
}
