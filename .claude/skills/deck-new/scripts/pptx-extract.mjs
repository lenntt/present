#!/usr/bin/env node
// pptx-extract <file.pptx> <deck-dir>
// Dumps a PowerPoint as JSON (stdout) for /deck-new to rewrite as content.md, and copies
// every slide picture to <deck-dir>/img/. No dependencies: uses the system `unzip`.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const [file, deckDir] = process.argv.slice(2)
if (!file || !deckDir) {
  console.error('usage: pptx-extract <file.pptx> <deck-dir>')
  process.exit(1)
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pptx-'))
execFileSync('unzip', ['-oq', path.resolve(file), '-d', tmp])
const read = (p) => (fs.existsSync(path.join(tmp, p)) ? fs.readFileSync(path.join(tmp, p), 'utf8') : '')
const imgDir = path.join(deckDir, 'img')
fs.mkdirSync(imgDir, { recursive: true })

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
const attr = (xml, name) => xml.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]

function rels(partPath) {
  const dir = path.posix.dirname(partPath)
  const relsXml = read(`${dir}/_rels/${path.posix.basename(partPath)}.rels`)
  const out = {}
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)) {
    const target = attr(m[0], 'Target')
    out[attr(m[0], 'Id')] = attr(m[0], 'TargetMode') === 'External' ? target : path.posix.normalize(`${dir}/${target}`)
  }
  return out
}

const pres = read('ppt/presentation.xml')
const [cx, cy] = [Number(attr(pres.match(/<p:sldSz[^>]*>/)?.[0] ?? '', 'cx')) || 12192000, Number(attr(pres.match(/<p:sldSz[^>]*>/)?.[0] ?? '', 'cy')) || 6858000]
const presRels = rels('ppt/presentation.xml')
const slidePaths = [...pres.matchAll(/<p:sldId\b[^>]*r:id="([^"]+)"/g)].map((m) => presRels[m[1]])

// Paragraphs of a text body: level, text, bold/italic runs as Markdown, links inline.
function paragraphs(xml, r) {
  const out = []
  for (const [p] of xml.matchAll(/<a:p>[\s\S]*?<\/a:p>|<a:p\s[\s\S]*?<\/a:p>/g)) {
    const level = Number(attr(p.match(/<a:pPr[^>]*>/)?.[0] ?? '', 'lvl') ?? 0)
    const bullet = !/<a:buNone\/>/.test(p)
    let text = ''
    for (const [run] of p.matchAll(/<a:r>[\s\S]*?<\/a:r>|<a:br\/>|<a:fld[\s\S]*?<\/a:fld>/g)) {
      if (run === '<a:br/>') { text += '\n'; continue }
      let t = decode(run.match(/<a:t>([\s\S]*?)<\/a:t>/)?.[1] ?? '')
      const rPr = run.match(/<a:rPr[^>]*>/)?.[0] ?? ''
      if (t.trim() && attr(rPr, 'b') === '1') t = t.replace(/^(\s*)(.*?)(\s*)$/, '$1**$2**$3')
      if (t.trim() && attr(rPr, 'i') === '1') t = t.replace(/^(\s*)(.*?)(\s*)$/, '$1*$2*$3')
      const link = run.match(/<a:hlinkClick[^>]*r:id="([^"]+)"/)?.[1]
      if (link && r[link]) t = `[${t}](${r[link]})`
      text += t
    }
    text = text.replace(/\*\*\*\*/g, '').replace(/\*\*(\s*)\*\*/g, '$1')
    if (text.trim()) out.push({ level, bullet, text })
  }
  return out
}

const box = (xml) => {
  const off = xml.match(/<a:off\b[^>]*>/)?.[0]
  const ext = xml.match(/<a:ext\b[^>]*cx=[^>]*>/)?.[0]
  if (!off || !ext) return null
  const pct = (v, total) => Math.round((Number(v) / total) * 1000) / 10
  return { x: pct(attr(off, 'x'), cx), y: pct(attr(off, 'y'), cy), w: pct(attr(ext, 'cx'), cx), h: pct(attr(ext, 'cy'), cy) }
}

let imageCount = 0
const copied = new Map()
function copyImage(src, slideNo) {
  if (copied.has(src)) return copied.get(src)
  const name = `slide${String(slideNo).padStart(2, '0')}-${++imageCount}${path.extname(src).toLowerCase()}`
  fs.copyFileSync(path.join(tmp, src), path.join(imgDir, name))
  copied.set(src, `img/${name}`)
  return `img/${name}`
}

const slides = slidePaths.map((slidePath, i) => {
  const no = i + 1
  const xml = read(slidePath)
  const r = rels(slidePath)
  const layoutPath = Object.values(r).find((t) => t.includes('slideLayouts/'))
  const layout = layoutPath ? decode(read(layoutPath).match(/<p:cSld name="([^"]*)"/)?.[1] ?? '') : ''
  const hidden = /<p:sld\b[^>]*show="0"/.test(xml)

  const shapes = []
  // Top-level shapes only; groups are reported as one unit with their combined text.
  const tree = xml.match(/<p:spTree>([\s\S]*)<\/p:spTree>/)?.[1] ?? ''
  for (const [el, tag] of tree.matchAll(/<p:(sp|pic|graphicFrame|grpSp|cxnSp)\b[\s\S]*?<\/p:\1>/g)) {
    const name = decode(attr(el, 'name') ?? '')
    const ph = el.match(/<p:ph\b[^>]*>/)?.[0]
    const placeholder = ph ? attr(ph, 'type') ?? 'body' : null
    const pos = box(el)
    if (tag === 'pic') {
      const embed = el.match(/r:embed="([^"]+)"/)?.[1]
      const linkVideo = el.match(/<a:videoFile[^>]*r:link="([^"]+)"/)?.[1]
      const src = embed && r[embed] && fs.existsSync(path.join(tmp, r[embed])) ? copyImage(r[embed], no) : null
      const descr = decode(attr(el.match(/<p:cNvPr\b[^>]*>/)?.[0] ?? '', 'descr') ?? '')
      // Embedded videos are copied like images; linked ones (YouTube, files elsewhere) keep their URL.
      const videoTarget = linkVideo ? r[linkVideo] : undefined
      const video = videoTarget && fs.existsSync(path.join(tmp, videoTarget)) ? copyImage(videoTarget, no) : videoTarget
      shapes.push({ kind: video ? 'video' : 'image', name, alt: descr, src, video, box: pos })
    } else if (tag === 'graphicFrame') {
      const kind = /drawingml\/2006\/table/.test(el) ? 'table' : /chart/.test(el) ? 'chart' : /diagram/.test(el) ? 'smartart' : 'object'
      const rows = kind === 'table' ? [...el.matchAll(/<a:tr\b[\s\S]*?<\/a:tr>/g)].map(([tr]) => [...tr.matchAll(/<a:tc\b[\s\S]*?<\/a:tc>/g)].map(([tc]) => paragraphs(tc, r).map((p) => p.text).join(' '))) : undefined
      shapes.push({ kind, name, rows, box: pos, convertible: kind === 'table' })
    } else if (tag === 'cxnSp') {
      continue
    } else {
      const paras = paragraphs(el, r)
      if (!paras.length && tag === 'sp') continue
      shapes.push({ kind: tag === 'grpSp' ? 'group' : placeholder ? `placeholder:${placeholder}` : 'text', name, box: pos, paragraphs: paras })
    }
  }
  // Reading order: title first, then top to bottom, left to right. Placeholders without a
  // box inherit their position from the layout; treat a body placeholder as sitting near the top.
  const isTitle = (s) => /^placeholder:(title|ctrTitle)$/.test(s.kind)
  const y = (s) => s.box?.y ?? (s.kind.startsWith('placeholder:') ? 20 : 0)
  shapes.sort((a, b) => isTitle(b) - isTitle(a) || y(a) - y(b) || (a.box?.x ?? 0) - (b.box?.x ?? 0))

  const notesPath = Object.values(r).find((t) => t.includes('notesSlides/'))
  const notes = notesPath
    ? paragraphs(read(notesPath).replace(/<p:sp>(?:(?!<\/p:sp>)[\s\S])*?<p:ph type="sldImg"[\s\S]*?<\/p:sp>/g, ''), {}).map((p) => p.text).filter((t) => !/^\d+$/.test(t.trim())).join('\n')
    : ''

  return { no, layout, hidden, shapes, notes }
})

fs.rmSync(tmp, { recursive: true, force: true })
console.log(JSON.stringify({ source: path.basename(file), slideSize: { cx, cy }, images: [...copied.values()], slides }, null, 2))
