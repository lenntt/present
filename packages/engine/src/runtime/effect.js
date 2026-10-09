// Helpers for writing effects. An effect module's default export is
//   (el, params, ctx) => ({ play(stage), seek(stage), destroy() })
// with optional `export const steps = n` (or `(params) => n`): the clicks it consumes.
// Stage 0 is the entrance (when `el` becomes visible); stages 1..steps are clicks;
// seek(-1) restores the state before the entrance.
import gsap from 'gsap'

export { gsap }

// "2b" → 2 beats, "300ms", "1.5s", or a bare number (beats) → seconds.
export function timeParser(beat) {
  return (v, fallback = 0) => {
    if (v == null) return fallback
    if (typeof v === 'number') return v * beat
    const m = String(v).trim().match(/^(-?[\d.]+)\s*(b|ms|s)?$/)
    if (!m) return fallback
    const n = Number(m[1])
    return m[2] === 'ms' ? n / 1000 : m[2] === 's' ? n : n * beat
  }
}

// Wrap a paused GSAP timeline. Labels "step1", "step2", … mark where each click stage
// starts; everything before "step1" is the entrance.
export function fromTimeline(tl, { onDestroy } = {}) {
  tl.pause(0)
  const bounds = (stage) => {
    const start = stage <= 0 ? 0 : tl.labels[`step${stage}`] ?? tl.duration()
    const next = tl.labels[`step${stage + 1}`]
    return [start, next ?? tl.duration()]
  }
  let active
  return {
    play(stage) {
      active?.kill()
      const [from, to] = bounds(stage)
      active = tl.tweenFromTo(from, to)
    },
    seek(stage) {
      active?.kill()
      if (stage < 0) tl.pause(0)
      else tl.pause(bounds(stage)[1])
    },
    destroy() {
      active?.kill()
      tl.kill()
      onDestroy?.()
    },
  }
}
