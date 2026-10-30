# PRINCIPLES.md — Design principles

> Ten principles. When two of them conflict, the lower-numbered one wins, and the resolution becomes an ADR in [DECISIONS.md](DECISIONS.md).

---

## 1. AI proposes; humans approve

The AI writes, fixes, and prioritizes. **Humans decide.** No AI-authored code merges, and no AI-authored fix lands without a human gate, until a class of action has earned [autonomy level L3](VISION.md#evolution-of-autonomy) through measured precision — and even then it is opt-in, audited, and one click from revert.

## 2. Trust is the product

A tool that occasionally lies is worse than no tool. We optimize for *calibrated trust*: fewer, better proposals; honest uncertainty ("I could not verify this assertion"); explicit "I don't know" states over plausible guesses.

## 3. Boring where it matters, clever where it helps

Execution, storage, reporting, and permissions are **deterministic and dull** — same input, same result, no magic. Intelligence is applied only where it creates leverage: authoring, triage, and prioritization. We never let a probabilistic component sit in the critical path of a factual answer.

## 4. Generated code is customer code

Generated tests are not disposable artifacts — they will be read, edited, and maintained by humans. Therefore: idiomatic style, meaningful names, no dead code, no `sleep`-based synchronization, respect for the target framework's conventions. If a senior engineer would reject it in review, we don't propose it.

## 5. Explainability or it doesn't ship

Every generated test can answer "why does this exist?" (linked requirement/spec/diff). Every heal can answer "what broke and why this fix?" Every risk score can answer "which lines drove this?" No unexplainable output reaches the user.

## 6. Least privilege, always

Tokens, keys, runner sandboxes, and human roles all get the minimum access that works. The GitHub App requests read-only + checks by default; sandboxes are network-scoped and non-root; a viewer cannot trigger runs. ([SECURITY.md](SECURITY.md))

## 7. Privacy by design, not by policy

Customer code and data are treated as **secret by default**: encrypted at rest, isolated per tenant, zero-retention LLM endpoints, never used for training, deletable on request. Architecture is the control; policy is the confirmation. ([PRIVACY.md](PRIVACY.md))

## 8. Cost is a feature

Every AI call has a budget, a cache, and a cheaper alternative considered. We measure **value per token**, not accuracy at any price. A generation run that burns 10× tokens for 3 % quality gain is rejected. Per-tenant cost guards from day one.

## 9. Docs are the source of truth

Decisions live in this `docs/` folder, not in Slack threads or someone's memory. Code references docs; docs reference code paths. A change without a doc change (or an explicit "docs: not needed" in the PR) is incomplete. ([HUMAN.md](HUMAN.md))

## 10. Small, reversible steps

Modular monolith over premature microservices ([ADR-005](DECISIONS.md#adr-005)); feature flags over big branches; trunk-based development; every migration reversible; every autonomy increase gated by metrics. We would rather ship a thin vertical slice this week than a perfect layer next quarter.

---

### How to use these principles

- **In design:** before proposing a feature, check it against #1–#8. A feature that breaks #1 or #7 is a non-starter regardless of value.
- **In review:** cite the principle number when objecting ("this violates #2 — the UI implies certainty the model doesn't have").
- **In disputes:** lower number wins; the outcome is written into [DECISIONS.md](DECISIONS.md) so it is settled once.
