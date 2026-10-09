// Effect harness: walks every slide forward step by step, back again, and away,
// then reports page errors, fx warnings and controllers that outlive their slide.
const SETTLE = 120

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
    while (await page.evaluate(() => window.Reveal.prevFragment())) await page.waitForTimeout(SETTLE / 2)
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
