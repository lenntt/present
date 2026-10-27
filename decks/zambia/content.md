---
title: AI in Software Development
subtitle: Guest Lecture · Northrise · Oct 2026
author: Lennart Tange
affiliation:
  - Software Factory Engineering
  - Fontys University of Applied Sciences
  - Venlo, The Netherlands
lang: en
mode: light
tempo: 120
ends: 17:00 Africa/Lusaka    # session end, local time in Lusaka — drives the countdown
---

---

![LGTM (Looks Good to Me) — Claude Opus 5.5 music video](https://www.youtube.com/watch?v=3TNpOD6bov8){.full}

::: notes
"LGTM", was a meme long before, but AI popularized it even more by the amount of churn.
Watch together, then discuss with the group before the introduction.
:::


## Greetings from Venlo {#venlo}

**Lennart Tange**

Software Factory Engineering


![Fontys Venlo](https://www.google.com/maps?q=Fontys+Venlo&z=4 "Map data: Google")

## Tell me something about you

![Menti](img/mentimeter-qr.png)

https://form.menti.com/s/alftywx2b1ai

## My Career {#career}

::: timeline
- **1988** ![](img/avatar.png) Born in NL, 38 years ago
- **1998** Wrote my first software (BASIC)
- **2008** BSc Electrical Engineering
- **2011** ![](img/uva.png) MSc Software Engineering *(cum laude)*
  - University of Amsterdam
- **2011–2014** ![](img/axini.png) R&D Software Engineer
  - full-stack, start-up, model-based testing
- **2014–2021** ![](img/ibm.png) R&D Lead Quality Architect
  - Watson, Cognos
- **2021–2024** ![](img/xebia.png) Strategic Software Delivery Consultant
- **2024–** ![](img/fontys.png) Lecturer, coach, researcher
  - In Software Factory Engineering at **Fontys Venlo**
:::

::: more
More: [linkedin.com/in/lennarttange](https://www.linkedin.com/in/lennarttange/)
:::

::: notes
obsessed with: work should be fun, quality, learning things -->
leading teams towards continuous delivery
:::


## LGTM? {#lgtm}

```diff
fix: make tests pass ✅

  def test_voucher_gives_5_percent_discount():
      cart = Cart([item(price=100)])
      cart.apply_voucher("ZAMBIA5")
-     assert cart.total() == 95
+     assert cart.total() == 100

+ @pytest.mark.skip(reason="flaky")
  def test_expired_voucher_is_rejected():
      ...
```

. . .

The bug is still there. The agent changed the tests. **Green ≠ correct**

::: notes
Callback to the video: the commit says ✅, would you approve this? Let the room vote: merge / don't merge. Then reveal.
- The voucher logic is broken. Instead of fixing it, the agent rewrote the expectation and skipped the other failing test.
- Agents optimise for "tests pass". Review test changes extra carefully, and treat a skipped test as a red flag.
:::


## Software Engineers rely on AI (sept 2025)

![Percentage of respondents who use AI at work](img/dora-2025-ai-use.png "Source: DORA, State of AI-assisted Software Development (Sept 2025) via https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf")
![Reliance on AI by task](img/dora-2025-reliance.png)


## Faster, at making instable software (?) {#ai-impact}

![Estimated effect of AI adoption on key outcomes](img/dora-2025-ai-impact.png "Source: DORA, State of AI-assisted Software Development (Sept 2025), via https://services.google.com/fh/files/misc/2025_state_of_ai_assisted_software_development.pdf")

_"How do we keep up with the speed, without ==sacrificing quality==?"_

**Accountability -> you**


## AI is an amplifier {#amplifier}

![J-curve of AI value realization](img/dora-2026-j-curve.png "Source: DORA, ROI of AI-assisted Software Development (April 2026) https://services.google.com/fh/files/misc/dora-roi-of-ai-assisted-software-development-2026.pdf")
![Learning curve, verification tax, pipeline adaptation](img/dora-2026-challenges.png "Source: DORA (April 2026)")

::: notes
- fail/succeed faster
- pipeline adaption, learn to trust the process
:::


## Vibe coding {#vibe-coding}

_"Accepting AI-generated code without thorough review."_

. . .

*The Good ==FAAFO==* (Vibe Coding, Gene Kim & Steve Yegge, 2025):

- **F**aster
- **A**mbitious
- **A**utonomously
- **F**un
- **O**ptions

. . .

Great for quick feedback, experiments and personal projects.

. . .

Not (always) a great way to **responsibly** deliver software to customers.

::: notes
Encourage students to try it out, its fun.
In the past months:
e.g. I learned about the stock market by making the app I wanted.

But also, I vibe-coded this powerpoint alternative last week (on top of reveal.js)
(the content is still my own!).

I've also a more serious project that is running for a year, with different collaborators - I do not feel in control anymore.

The hard thing is to stay in control. Its very tempting to just press enter.
:::


## AI in software development

::: timeline
- **2021** GitHub Copilot (preview)
  - _A better auto-complete_
- **2022** ChatGPT
- **2025** Agentic coding tools
  - e.g. Claude Code
  - _"Vibe coding"_
- **2026** Autonomous agents, loops
- **2027+** ??? (not the topic of today)
:::


::: notes
- I want to share a few things about my workflow. There is no single right one.
- In many ways, not that much changed opposed to CD: get the right quality gates,learn to trust the process.
- Best thing to do, is keep yourself updated, experiment, stay critical.
:::


## 1 · Tooling {#tooling}

The right tooling:
- Don't: use a webchat (e.g. ChatGPT)
- Instead: Use an IDE or CLI, e.g. Claude Code, OpenCode, ...

![Claude code](img/claude-code.png "Example: Claude code")


## 2 · Plan first {#plan}

Ensure alignment:

- Don't: "`Make a powerpoint alternative. make no mistakes`"
- Instead: "`/plan …`", "`/grill-me …`"

Use ==skills== for the AI to ask questions before implementing.

::: notes
```
/grill-me i want to make a powerpoint alternative thats simpler to manage and outputs static webpages where we can leverage js animations etc.
the first sheet templates (styles) need to fit the fontys theme (e.g. /Users/len/Downloads/Powerpoint-sjablonen-Nov-2023\ 4/Digitaal_Lesmateriaal_Fontys_NL_ENG.pptx).
the content should be a readable file (like markdown), but support media and links.
I imagine there's an other file that can be generated with claude code to add the extra spice like transitions, animations, visual appearance - like the effects in the video to support this music https://www.youtube.com/watch?v=3TNpOD6bov8. perhaps based on a set of presets.
```

22 questions, ±1.5 hours
- its not an app, but a library + reveal.js + 2 skills
- should it be able to convert from existing presentations
spent 0.25 hours of implementing, at end of the session, context was ±18% full

the first version included transforming my draft pptx version of this presentation
:::

## 3 · Small steps {#small}

- Don't: build a big thing (complete app, complicated feature) in one session
- Instead: break into smaller user stories ("story slicing"). Prefer vertical slices

. . .

Plan for something you can validate as early as possible, in parts you can manage. This helps you to be specific.

::: notes
- example, I tried to create a video game (4x), based on a only vague idea. crap in -> crap out.
- story slicing: elephant carpaccio
- parallel agents? not always a good idea if you want to stay in control. If you do, give each agent its own `git worktree` so they don't trip over each other's changes.
:::


## 4 · Fresh context {#context}

Between phases/features:

- Don't: keep working in the same session (context rot)
- Instead: clear and short sessions

. . .

Avoid the model getting 'dumber' over time, make sure you are often in a state where you can close the session and start over.

Tip: use `AGENTS.md` and other `.md` files to document glossary and decisions records.


## 5 · Your own skills {#custom-skills}

- Tip: use **custom skills** or make your own:  `/deck-spice`, `/deck-new`.

Custom skills is a `.md` file with instructions -> give the agents a sequence of steps, including pointing to scripts to run, etc.


## Finally {#final}

- ==Criticize== AI and AI output
  - Stay in control, ==you== are ==accountable== for your work

. . .

- ==Learning== is important (also after graduating)
  - ==AI cannot learn for you==

. . .

- Stay ==curious==, ==experiment==.
  - Start a personal project this week: something **you** want to exist

. . .

- Contribute to ==make the world a better place== for everyone,
    _AI might not do that for us_


# Questions? {#questions}

What will you build first?

::: countdown
:::
