// "Don't: … / Instead: …" list items. As the slide appears (after `at`, default 1.5b), a red line strikes
// through the Don't and it fades; the Instead line lights up with a check mark. onClick: true waits for a click instead.
// Target: the list (or anything containing both items).
import { gsap, fromTimeline } from '@present/engine/effect'
import './dont-instead.css'

export const steps = (params) => (params.onClick ? 1 : 0)

export default function dontInstead(el, params, { t }) {
  const items = [...el.querySelectorAll('li')]
  const dont = items.find((li) => /^\s*don[’']?t\b/i.test(li.textContent))
  const instead = items.find((li) => /^\s*instead\b/i.test(li.textContent))
  if (!dont || !instead) throw new Error('dont-instead: needs a "Don\'t: …" and an "Instead: …" item')

  // The strike spans the text, not the whole row: measure the text in slide pixels
  // (again once the web fonts are in — a fallback font measures narrower).
  const strike = document.createElement('span')
  strike.className = 'di-strike'
  const measure = () => {
    const range = document.createRange()
    range.selectNodeContents(dont)
    range.setEndBefore(strike)
    const scale = dont.getBoundingClientRect().width / dont.offsetWidth || 1
    const textWidth = (range.getBoundingClientRect().right - dont.getBoundingClientRect().left) / scale
    if (textWidth > 0) strike.style.width = `${textWidth - parseFloat(getComputedStyle(dont).paddingLeft)}px`
  }
  dont.append(strike)
  measure()
  document.fonts?.ready.then(() => strike.isConnected && measure())
  const check = document.createElement('span')
  check.className = 'di-check'
  check.textContent = '✓'
  instead.append(check)

  const tl = gsap.timeline()
  tl.fromTo(strike, { scaleX: 0 }, { scaleX: 0, duration: 0.001 }, 0)
  tl.fromTo(check, { scale: 0, autoAlpha: 0 }, { scale: 0, autoAlpha: 0, duration: 0.001 }, 0)
  // A "step1" label marks a click for fromTimeline; the load-time variant uses its own label.
  const go = params.onClick ? 'step1' : 'strike'
  tl.addLabel(go, params.onClick ? undefined : t(params.at, t('1.5b')))
  tl.to(strike, { scaleX: 1, duration: t('0.5b'), ease: 'power2.out' }, go)
  tl.to(dont, { opacity: 0.45, duration: t('0.5b') }, `${go}+=${t('0.25b')}`)
  tl.to(check, { scale: 1, autoAlpha: 1, duration: t('0.5b'), ease: 'back.out(3)' }, `${go}+=${t('0.75b')}`)
  tl.fromTo(instead, { backgroundColor: 'rgba(15, 138, 69, 0)' }, { backgroundColor: 'rgba(15, 138, 69, 0.12)', duration: t('0.5b') }, '<')

  return fromTimeline(tl, {
    onDestroy() {
      strike.remove()
      check.remove()
      gsap.set([dont, instead], { clearProps: 'opacity,backgroundColor' })
    },
  })
}
