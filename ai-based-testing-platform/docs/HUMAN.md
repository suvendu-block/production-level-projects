# HUMAN.md — Guidelines for humans

> AITP is built by humans with AI assistants in the loop. This page governs the human side: how we talk, decide, document, review, and look after each other. Tech rules: [CONTRIBUTION.md](CONTRIBUTION.md); decisions: [DECISIONS.md](DECISIONS.md).

---

## 1. Where the truth lives

- **This docs folder is the source of truth.** If the answer isn't here or in code+ADR, the honest answer is "undecided."
- **Persist, don't remember.** Anything decided in DMs/meetings gets a record in [CONVERSATION.md](CONVERSATION.md) the same day — one paragraph is enough. Memory-decay is a defect.
- **Write for the stranger.** Assume a competent engineer joins next week, reads only `docs/`, and must become productive ([STEPS.md](STEPS.md) exists for exactly this test — if onboarding takes > 1 hour, docs are wrong).

## 2. Communication norms

- **Async by default** (issues, PRs, docs). Meetings only for: ambiguity needing 20+ minutes of back-and-forth, incident response, or milestone reviews. If it fits in a PR comment — it doesn't need a meeting.
- **Say the uncomfortable thing first.** "This won't work because…" beats polite silence; being right later costs milestones.
- **Critique artifacts, never people.** Blameless ops ([OPERATIONS.md](OPERATIONS.md) §6) extends to design reviews.
- **DECISIONS have a single owner.** After a decision, one name is accountable to execute it; open loops die.
- Meeting/decision hygiene: agenda in the invite, notes into [CONVERSATION.md](CONVERSATION.md), action items verifiable ("done when…").

## 3. Working with AI assistants inside this project

Because AITP itself is AI-adjacent, we hold ourselves to the same bar we sell:

1. **Disclose AI-drafted content** (PRs, docs, tasks).
2. **You are responsible for everything you merge**, AI-assisted or not. "The model wrote it" is not a defense any more than "the linter wrote it."
3. **Never paste customer data, real repo content, secrets, or production logs** into AI tools. Synthetic fixtures only ([PRIVACY.md](PRIVACY.md)).
4. Prompt changes to the *product* follow the real gates ([TESTING.md](TESTING.md) §4) — your ChatGPT session is not a substitute for the eval harness.
5. Generated docs get the same human editorial pass; AI is a force-multiplier for writing, not an authority on deciding.

## 4. Review etiquette (both sides)

- **Author:** keep PRs small; state the testing story and the doc story; mark AI-assisted; respond to every comment (address or explain — silence is not an answer).
- **Reviewer:** first reaction within one business day; prioritize the two things that genuinely matter over fifteen nits; mark nitpicks as `nit:`; **approve early when it's safe**, not late-when-perfect.
- **Disagreements:** argue principle #number or ADR link; if two principles conflict, the resolution becomes a new ADR — never a vibes tiebreak.
- Nobody merges their own PR, including maintainers.

## 5. Health, focus, and respect

- **DPDF:** default. On-call ([OPERATIONS.md](OPERATIONS.md) §6) is compensated with recovery time — no silent extra hours.
- After a P1 incident, the incident lead gets a no-deploy window; humans are load-bearing too.
- Time-zone spread beats face-time: publish decisions, don't gate them on presence.
- Vacation = work stops transferring; a genuinely off person is a feature of a sustainable project, deliberately budgeted ([VISION.md](VISION.md) is a multi-year race).

## 6. Onboarding checklist (new human, day 1–5)

Day 1: read [README.md](../README.md) → [ALL.md](ALL.md) → [VISION.md](VISION.md) → [PRINCIPLES.md](PRINCIPLES.md).
Day 2: environment up per [STEPS.md](STEPS.md) — measure the time it took and tell us (that number is a tracked metric in [VISION.md](VISION.md) north-star proxies).
Day 3: read [ARCHITECTURE.md](ARCHITECTURE.md) + [SPECIFICATION.md](SPECIFICATION.md); run the eval harness once on the golden dataset ([TESTING.md](TESTING.md) §4).
Day 4: pick a `good-first-task` from [TASKS.md](TASKS.md); ship a tiny PR end-to-end (code + docs).
Day 5: give feedback: what's confusing in docs? Fix one page in the same PR you file notes.

## 7. Definitions of done (project-level)

- **Feature done:** FR verified per its V-x label; docs updated; eval/coverage gates green; flagged or released per [DEPLOYMENTS.md](DEPLOYMENTS.md) §5.
- **Milestone done:** exit criteria measured and recorded ([MILESTONES.md](MILESTONES.md) hygiene), not just dated.
- **Incident done:** mitigated + postmortem published + actions in [TASKS.md](TASKS.md).

## 8. The unwritten rules, written

- If you find a doc lying, fix it *now* — a half-hour today beats a wrong default next quarter.
- Uncertainty is allowed and expected: "I don't know yet" is a complete sentence; "I guessed quietly" is not.
- Skills rotate: every maintainer sends at least one PR outside their comfort area per quarter (keeps empathy for reviewers and rust off).
- The dumbest question in a PR thread is the one that saved us a month later. Ask it.

---

*Escalation path: technical → issue with `escalate` label; conduct → maintainers privately; security → [SECURITY.md](SECURITY.md) channel ( Issues are never the place for vulnerability reports).*
