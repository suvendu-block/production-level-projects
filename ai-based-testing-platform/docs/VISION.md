# VISION.md — Vision

> Where AITP is going, and why it should exist at all.

---

## The belief

Software quality should **scale with the team**, not against it. Today it doesn't: the more you ship, the less test coverage you afford, and the more risk you accumulate. We believe that test creation and test maintenance are, respectively, a **language problem** and a **pattern-recognition problem** — exactly the problems modern AI is good at.

## The vision (3 years)

**Every merge request arrives with a trustworthy, AI-drafted test suite that a human spent two minutes reviewing instead of two hours writing.**

Concretely, by 2029 we want AITP to be:

1. **The default test author in the pipeline.** Adding AITP to a repo is one install and produces its first valuable test in under 15 minutes.
2. **The owner of test maintenance.** A green AITP suite stays green — selector renames, copy changes, and refactors are absorbed by the self-healing layer, with every fix visible and reversible.
3. **A risk authority, not just a test runner.** "This change touches payments and has 34% coverage on the changed paths" is a first-class signal in every PR.
4. **Trustworthy by construction.** Every AI action is auditable, every generated test is human-approvable, and no customer code ever trains a model.

## North-star metrics

| Metric | Target (GA +12 mo) |
|--------|--------------------|
| **Time-to-first-green-test** for a new repo | < 15 minutes |
| **Human acceptance rate** of proposed tests | ≥ 70 % |
| **Self-heal precision** (accepted fixes / proposed fixes) | ≥ 80 % |
| **False-red rate** (flake-caused failures / all failures) | < 2 % |
| **Maintenance hours saved** (self-reported) | ≥ 6 h / engineer / month |

## What we will not do

- **No fully autonomous merging.** AI never merges its own tests. ([PRINCIPLES.md](PRINCIPLES.md) #1)
- **No black boxes.** If we cannot explain why a test was generated or healed, we do not ship it.
- **No training on customer code.** Ever. ([PRIVACY.md](PRIVACY.md))
- **No test types we cannot run faithfully.** We would rather support three test types excellently than ten poorly. Mobile-native and embedded are out of scope until they can be done properly.
- **No dashboards without decisions.** Every chart must answer "what should I do?"

## Values that shape the product

1. **Trust is the product.** One silently "healed" test that masks a bug destroys more value than 100 saved hours.
2. **Boring where it matters, clever where it helps.** Execution, reporting, and data are deterministic; intelligence is applied only to authoring and triage.
3. **Engineer respect.** Generated tests must read like a good engineer wrote them — idiomatic, named well, no sleep-and-pray.
4. **Earned autonomy.** The platform's freedom grows only as its measured precision grows (see [MILESTONES.md](MILESTONES.md): autonomy levels).

## Evolution of autonomy

| Level | Name | Behavior | Reached in |
|-------|------|----------|-----------|
| L0 | Suggest | AI drafts tests; human writes/edits everything. | M1 |
| L1 | Propose | AI opens PRs with generated tests; human merges. | M1–M2 |
| L2 | Heal-with-approval | AI proposes fixes for broken/flaky tests; human approves. | M2 |
| L3 | Auto-heal trusted classes | Trivial, high-confidence fixes (selector updates) auto-apply with audit + easy revert. | M4 (opt-in) |
| L4 | Autonomy for high-trust scopes | Bounded auto-merge on paths with 95 %+ measured precision. | Beyond GA |

We advance levels **only** when the measured metrics in [TESTING.md](TESTING.md) (AI quality gates) clear their thresholds for two consecutive releases.

## Anti-vision (failure modes we design against)

- A "magic" tool teams disable after a month because it floods PRs with junk tests.
- A dashboard nobody opens because it reports activity instead of risk.
- A self-healer that papers over real regressions.
- An AI bill that exceeds the engineer-hours it saves.

---

*Related: [MILESTONES.md](MILESTONES.md) (when) · [PRINCIPLES.md](PRINCIPLES.md) (how we decide) · [ALL.md](ALL.md) (what)*
