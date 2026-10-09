# Preset catalogue — derived from the LGTM music video

Source: "LGTM (Looks Good to Me) — Claude Opus 5.5 music video", Degenerative Pixels.
Analysed from YouTube storyboard frames (~1 per 5 s) + auto-subtitles; motion and timing are **inferred, not measured**. Tempo ≈ 120 BPM (1 beat ≈ 0.5 s).

## Visual language

- Dark dashboard chrome (`#0d1014` / panels `#1a1f26`, 1px `#2a313a` hairlines), off-white text, muted grey labels.
- **One signal colour** (green) for the key word per line; red reserved for the "disaster" act.
- Heavy grotesque for lyrics, monospace for code/terminal, chunky letters on keycap tiles.
- Faint dot/particle dust, dim code-rain walls, CRT vignette.
- UI metaphors: chat messages, PR/approval modals, code editor with highlighted line, diff counters, status pages, charts, rubber stamps, tickets.
- Pauses: background dims to ~30 %, chrome goes grey, one or two lines stay; payoff word lands on the downbeat. Bridge = almost-black screen with one pulsing green dot.

## Candidate presets

| Preset | Suits | Web technique |
|---|---|---|
| `karaoke-word-reveal` | headings, definitions | SplitText words, hard reveal on beat, newest word accent then settles |
| `neon-glow-word` | `==emphasis==` default | accent colour + `text-shadow` bloom pulse, scale 1→1.04→1 over 1 beat |
| `partial-type-cursor` | key terms, commands | char-by-char hard type, no easing, glow |
| `leet-glitch-code` | identifiers, code, security topics | ScrambleText with `0123$[]()&` |
| `chat-type-in` | opening hook, quotes | words stagger ½ beat, 4px rise |
| `keycap-stamp` | acronyms (FAAFO!), short checklists | per-letter tiles, scale 1.4→1, ±8° rotation, `back.out(2)`, 1 beat stagger |
| `rubber-stamp` | verdicts, correct/incorrect, quiz answers | scale 2.5→1 in 0.12 s `expo.in`, 2px shake, SVG turbulence ink |
| `count-up-codewall` | statistics, numbers | snapped number tween + dim code-rain backdrop |
| `line-chart-draw` | growth, complexity curves | DrawSVG `power2.in`, text on `<textPath>` |
| `code-line-highlight` | code walkthroughs | line backdrop scaleX from left, caution-tape strips |
| `word-highlight-chips` | tokens, categories | per-word background chip scaleX, ½ beat stagger |
| `callout-leaders` | annotated diagrams | DrawSVG leader lines + labels |
| `handwritten-aside` | misconceptions, instructor comments | stroke-drawn script + arrow |
| `speech-bubble-pop` | quotes, compiler/system output | scale 0.6→1 `back.out(1.7)` from tail |
| `particle-dissolve` | exits, transitions | canvas pixel sampling + noise drift |
| `wireframe-flythrough` | section transitions | CSS 3D push into a panel / three.js edges |
| `theme-flip` | topic shift, theory → example | swap CSS tokens on the beat |
| `red-alert-mode` | warnings, security incidents | red token swap, inset vignette, chromatic split |
| `shatter-impact` | the one "never do this" moment | crack overlay DrawSVG + screen shake |
| `clock-sweep` | time complexity, latency, deadlines | hand rotation `ease: none`, dial textPath |
| `pause-dim` | `. . .` cliffhangers | dim rest of slide to ~30 %, drifting dust |

## Priority for lectures

1. `neon-glow-word` (default emphasis) + `karaoke-word-reveal`
2. `partial-type-cursor` / `leet-glitch-code`
3. `keycap-stamp`
4. `rubber-stamp`
5. `count-up-codewall`
6. `line-chart-draw`
7. `pause-dim`

Better fidelity needs the actual MP4 (YouTube blocks anonymous download; local ffmpeg needs `brew reinstall ffmpeg`).
