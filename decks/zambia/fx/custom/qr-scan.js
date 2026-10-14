// A QR code gets scanned: the image rises in, viewfinder corners snap onto it and a green scan line
// sweeps top → bottom once — "get your phone out". Entrance only. Target: the figure holding the QR.
// params: at (default 0.5b).
import { gsap, fromTimeline } from '@present/engine/effect'
import './qr-scan.css'

export default function qrScan(el, params, { t }) {
  const img = el.querySelector('img') ?? el
  const prevPosition = el.style.position
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
  const box = document.createElement('div')
  box.className = 'qr-scan'
  box.setAttribute('aria-hidden', 'true')
  Object.assign(box.style, { left: `${img.offsetLeft}px`, top: `${img.offsetTop}px`, width: `${img.offsetWidth}px`, height: `${img.offsetHeight}px` })
  box.innerHTML = '<i class="qs-corner tl"></i><i class="qs-corner tr"></i><i class="qs-corner bl"></i><i class="qs-corner br"></i><i class="qs-line"></i>'
  el.append(box)

  const at = t(params.at, t('0.5b'))
  const corners = box.querySelectorAll('.qs-corner')
  const line = box.querySelector('.qs-line')
  const tl = gsap.timeline()
  tl.fromTo(el, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: t('1b'), ease: 'power3.out' }, at)
  tl.fromTo(corners, { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: t('0.5b'), ease: 'back.out(2)' }, at + t('1b'))
  tl.fromTo(line, { autoAlpha: 0, top: '0%' }, { autoAlpha: 1, top: '0%', duration: 0.001 }, at + t('1.5b'))
  tl.to(line, { top: '100%', duration: t('2b'), ease: 'power1.inOut' })
  tl.to(line, { autoAlpha: 0, duration: t('0.25b') })
  return fromTimeline(tl, {
    onDestroy() {
      box.remove()
      el.style.position = prevPosition
    },
  })
}
