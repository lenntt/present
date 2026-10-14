// Effect harness: walks every slide forward step by step, back again, and away,
// then reports page errors, fx warnings and controllers that outlive their slide.
const SETTLE = 120

// Runs in the page: does content stick out of the slide body (into the footer or off-slide)?
function overflowing() {
  const slide = window.Reveal.getCurrentSlide()
  const body = slide.querySelector('.slide-body')
  if (!body) return null
  const scale = window.Reveal.getScale()
  const limit = body.getBoundingClientRect()
  const slack = 2 * scale
  for (const el of body.querySelectorAll('*')) {
    if (el.closest('.tl-label')) continue // rotated timeline labels may hang into the margin
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue // faded out by an effect
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    if (r.bottom > limit.bottom + slack) return `content overflows the bottom by ${Math.round((r.bottom - limit.bottom) / scale)}px (${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''})`
    if (r.right > limit.right + slack) return `content overflows the right edge by ${Math.round((r.right - limit.right) / scale)}px (${el.tagName.toLowerCase()})`
  }
  return null
}

// Runs in the page: which elements of the current slide are visible once everything has settled.
function visibleState() {
  window.__present.fx.settle()
  const frame = window.Reveal.getCurrentSlide().querySelector('.frame')
  if (!frame) return []
  return [...frame.querySelectorAll('*')]
    .filter((el) => !el.closest('.bot-bubble, .fx-step')) // ambient loops (flask bubbles) are allowed to differ
    .map((el, i) => {
      const cs = getComputedStyle(el)
      const shown = cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.01
      const name = `${el.tagName.toLowerCase()}${el.classList[0] ? '.' + el.classList[0] : ''}`
      return `${i}:${name}:${shown ? 'shown' : 'hidden'}`
    })
}

export async function checkDeck(url, { log = console.log } = {}) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  const problems = []
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && problems.push(`console error: ${m.text()}`))

  await page.goto(url)
  await page.waitForFunction(() => window.Reveal?.isReady())
  const total = await page.evaluate(() => window.Reveal.getTotalSlides())

  for (let i = 0; i < total; i++) {
    const id = await page.evaluate((i) => {
      window.Reveal.slide(i, 0, -1)
      return window.Reveal.getCurrentSlide().dataset.slide
    }, i)
    let steps = 0
    while (await page.evaluate(() => window.Reveal.nextFragment())) {
      steps++
      await page.waitForTimeout(SETTLE)
    }
    await page.waitForTimeout(SETTLE)
    // Measure the final layout: every step shown, entrance animations jumped to their end.
    const overflow = await page.evaluate(() => { window.__present.fx.settle(); return null }).then(() => page.evaluate(overflowing))
    if (overflow) problems.push(`slide "${id}": ${overflow}`)
    const first = await page.evaluate(visibleState)
    while (await page.evaluate(() => window.Reveal.prevFragment())) await page.waitForTimeout(SETTLE / 2)

    // Replay: leave the slide, come back, step through again — the end state must match the first run.
    if (i > 0) {
      await page.evaluate((i) => { window.Reveal.slide(i - 1); window.Reveal.slide(i, 0, -1) }, i)
      await page.waitForTimeout(SETTLE)
      while (await page.evaluate(() => window.Reveal.nextFragment())) await page.waitForTimeout(SETTLE)
      await page.waitForTimeout(SETTLE)
      const again = await page.evaluate(visibleState)
      const diff = first.filter((x, k) => x !== again[k])
      if (diff.length || first.length !== again.length) {
        const sample = diff.slice(0, 3).map((x, k) => `${x.split(':')[1]} ${x.split(':')[2]} → ${again[first.indexOf(x)]?.split(':')[2] ?? 'missing'}`)
        problems.push(`slide "${id}": replay ends differently than the first run (${diff.length} element(s), e.g. ${sample.join(', ')})`)
      }
      while (await page.evaluate(() => window.Reveal.prevFragment())) await page.waitForTimeout(SETTLE / 2)
    }
    log(`  ✓ ${String(i + 1).padStart(2)} ${id}${steps ? ` (${steps} step${steps > 1 ? 's' : ''})` : ''}`)
  }

  // Jump around: back to start, to the end, to the middle — seek paths, not play paths.
  await page.evaluate((t) => { const R = window.Reveal; R.slide(0); R.slide(t - 1); R.slide(Math.floor(t / 2)) }, total)
  await page.waitForTimeout(SETTLE)
  const alive = await page.evaluate(() => window.__present.fx.alive())
  const perSlideMax = await page.evaluate(() => Math.max(0, ...[...window.__present.fx.plans.values()].map((p) => p.length)))
  if (alive > perSlideMax * 3) problems.push(`leak: ${alive} live controllers after navigation (expected ≤ ${perSlideMax * 3})`)

  const warnings = await page.evaluate(() => [...(window.__present.warnings ?? []), ...(window.__fxWarnings ?? [])])
  await browser.close()
  return { total, problems, warnings: [...new Set(warnings)] }
}
