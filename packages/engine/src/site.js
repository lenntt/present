// `present site`: every deck in decks/ built into one static site (dist/<deck>/ + dist/index.html).
// A deck with `publish: false` in its frontmatter is skipped entirely. Private slides are always left out.
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'
import YAML from 'yaml'

export async function buildSite(deckDirs, { outDir, configFor }) {
  fs.rmSync(outDir, { recursive: true, force: true })
  const decks = []
  for (const dir of deckDirs) {
    const meta = frontmatter(path.join(dir, 'content.md'))
    const slug = path.basename(dir)
    if (meta.publish === false) {
      console.log(`skipping ${slug} (publish: false)`)
      continue
    }
    console.log(`building ${slug}…`)
    await build(configFor(dir))
    decks.push({ slug, title: meta.title ?? slug, subtitle: meta.subtitle, author: meta.author })
  }
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), indexPage(decks))
  console.log(`site: ${decks.length} deck(s) in ${outDir}`)
}

function frontmatter(file) {
  const m = fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return (m && YAML.parse(m[1])) ?? {}
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function indexPage(decks) {
  const items = decks
    .map((d) => `<li><a href="./${esc(d.slug)}/"><strong>${esc(d.title)}</strong>${
      d.subtitle ? `<span>${esc(d.subtitle)}</span>` : ''}${d.author ? `<span>${esc(d.author)}</span>` : ''}</a></li>`)
    .join('\n      ')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Presentations</title>
  <style>
    :root { --bg: #fff; --fg: #1e1e1e; --muted: #666; --accent: #663366; --card: #f6f2f6; color-scheme: light dark; }
    @media (prefers-color-scheme: dark) { :root { --bg: #16121a; --fg: #eee; --muted: #aaa; --accent: #c08ac0; --card: #221b26; } }
    body { margin: 0; padding: 48px 16px; background: var(--bg); color: var(--fg); font: 18px/1.5 system-ui, sans-serif; }
    main { max-width: 720px; margin: 0 auto; }
    h1 { font: 600 14px ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
    h1::before { content: '$ ls '; color: var(--muted); }
    ul { list-style: none; padding: 0; display: grid; gap: 12px; }
    a { display: grid; gap: 2px; padding: 16px 20px; border-left: 4px solid var(--accent); background: var(--card); border-radius: 6px; color: inherit; text-decoration: none; }
    a:hover, a:focus-visible { outline: 2px solid var(--accent); }
    strong { font-size: 22px; }
    span { color: var(--muted); font-size: 15px; }
  </style>
</head>
<body>
  <main>
    <h1>presentations</h1>
    <ul>
      ${items || '<li>No decks yet.</li>'}
    </ul>
  </main>
</body>
</html>
`
}
