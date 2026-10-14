// "16:30 Africa/Lusaka" (today, in that time zone), "16:30" (today, local time)
// or any date string Date understands ("2026-10-16T16:30+02:00") → epoch ms, or NaN.
const CLOCK = /^(\d{1,2}):(\d{2})(?:\s+(\S+))?$/

export function parseEnd(text, now = Date.now()) {
  const s = String(text ?? '').trim()
  const m = s.match(CLOCK)
  if (!m) return Date.parse(s)
  const [, hh, mm, zone] = m
  if (!zone) {
    const d = new Date(now)
    d.setHours(Number(hh), Number(mm), 0, 0)
    return d.getTime()
  }
  try {
    const today = partsIn(zone, now)
    const guess = Date.UTC(today.year, today.month - 1, today.day, Number(hh), Number(mm))
    return guess - offsetIn(zone, guess)
  } catch {
    return NaN // unknown time zone
  }
}

// How far `zone`'s wall clock is ahead of UTC at instant `ms`.
function offsetIn(zone, ms) {
  const p = partsIn(zone, ms)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(ms / 1000) * 1000
}

function partsIn(zone, ms) {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
  return Object.fromEntries(fmt.formatToParts(ms).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]))
}
