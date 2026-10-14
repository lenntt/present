// Ticks the countdown once a second. Before JS runs (or in a PDF) it shows the end time itself.
import { parseEnd } from './time.js'

export default function countdown(el) {
  const end = parseEnd(el.dataset.until)
  const time = el.querySelector('.cd-time')
  if (Number.isNaN(end) || !time) return
  const pad = (n) => String(n).padStart(2, '0')
  const tick = () => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000))
    const h = Math.floor(left / 3600)
    const m = Math.floor((left % 3600) / 60)
    time.textContent = h ? `${h}:${pad(m)}:${pad(left % 60)}` : `${pad(m)}:${pad(left % 60)}`
    el.classList.toggle('is-soon', left > 0 && left <= 5 * 60)
    el.classList.toggle('is-over', left === 0)
  }
  tick()
  setInterval(tick, 1000)
}
