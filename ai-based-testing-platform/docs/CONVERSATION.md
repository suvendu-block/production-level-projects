# CONVERSATION.md — Conversations about the project

> The memory of *why*. Structured records of design conversations, critique sessions, review outcomes, incidents called out, and drills. Design decisions themselves land in [DECISIONS.md](DECISIONS.md) — here we keep the discussion that produced them.

---

## How to add an entry (from real chats/PRs/meetings, or AI-pairing reviews)

1. Append **newest at top** with date + participants + type.
2. Keep it honest: what was argued, what was decided, what was left open. Boring is fine; sanitized fiction is not.
3. Link out to ADRs, tasks, postmortems — don't duplicate their content.

Types: `design` · `roadmap` · `review` · `incident` · `drill` · `decision-log`.

---

## 2026-10-30 · Project kickoff & docs baseline — `decision-log`

**Participants:** maintainer (PM/engineer), AI pair (documentation pass).
**Summary:** Empty repo (`backend/`, `frontend/`, `docs/`). Agreed to establish the full documentation baseline first ([README.md](../README.md) + 24 docs) so every code PR has a referent. Story defined: AI-generated, human-approved testing platform with self-healing ([ALL.md](ALL.md)).
**Decisions (consequential, quick ADRs):** [ADR-0001](DECISIONS.md#adr-001) Python/FastAPI; [ADR-0002](DECISIONS.md#adr-002) React+Vite; [ADR-0003](DECISIONS.md#adr-003) Postgres+pgvector; [ADR-0004](DECISIONS.md#adr-004) Celery+Redis; [ADR-0005](DECISIONS.md#adr-005) modular monolith; [ADR-0006](DECISIONS.md#adr-006) Playwright sandboxes.
**Left open:** which managed LLM endpoint is default (provider decision awaits eval data); exact IdP vendor ([ADR-0009](DECISIONS.md#adr-009)) pending enterprise interviews.

## 2026-10-31 · Vision → milestones walk — `roadmap`

**Participants:** maintainer.
**Summary:** Freed vision from features: [VISION.md](VISION.md) fixed north-star metrics and the L0→L4 autonomy ladder. Discipline added: *autonomy never advances on vibes — only on two consecutive clean eval cycles* ([MILESTONES.md](MILESTONES.md) closing paragraphs).
**Outcome:** M0 scoped as "empty but perfect" skeleton; anything not required for M0 exit criteria deferred to backlog (see [BACKLOGS.md](BACKLOGS.md) • icebox).

## 2026-10-31 · Principles debate: "Can generated tests ever merge alone?" — `design`

**Participants:** maintainer + AI pair (red team).
**Tension:** Principle #1 (human approval) vs VISION "L3 auto-heal"; risk that "auto-heal" quietly masks real bugs — the #1 trust-destroyer.
**Resolution:** layered defense: L3 only (a) opt-in, (b) for measured high-precision classes (selector renames), (c) with audit + one-click revert, (d) feature-off when acceptance rate drops below threshold. **Never** asserts about business logic auto-applied. Recorded as [PRINCIPLES.md](PRINCIPLES.md) #1 + [FR-5.4](REQUIREMENTS.md) precision gate.

## 2026-10-31 · Spec review: proposals, immutability & lineage — `review`

**Participants:** maintainer (reviewing [SPECIFICATION.md](SPECIFICATION.md) v1 drafts).
**Key critique 1:** proposals must be append-only (edits create new versions) else audit trail lies.
**Key critique 2:** runs must bind to commit SHA for reproducibility; flake attribution impossible otherwise.
**Key critique 3:** every generation must record `promptSet` + model + tokens; otherwise eval data unusable.
**Outcome:** spec updated §3 invariants; [ADR-0007](DECISIONS.md#adr-007) contains the hash + budget contract.

## Planned agendas (next)

- **2026-11-02 (M0 sprint kickoff):** validate default plan rules; ADR-0012 prod host question (RDS vs CloudSQL vs self-managed); pick webhook event misses w/ runbook skeleton writing for OPERATIONS §8.
- **2026-11-06 (design):** sandbox tenancy hardening (network policy set 1) & secret lockdown failure modes.
- **2026-11-13 (roadmap):** first cut of golden dataset for generation evals; success criteria of "good test" per [TESTING.md](TESTING.md) §5.

---

### Postmortems & incident records

*(none yet — first postmortem goes here with link to its doc; template in `docs/templates/postmortem.md` from M0)*

### Drills

| Date | Drill | Result | Follow-up |
|------|-------|--------|-----------|
| — | Build proof: `up` in 5 min for new dev | TODO M0 wk1 | [STEPS.md](STEPS.md) turn-by-turn validation |

---

*[FILES.md](FILES.md) index · contributed edits: see [CONTRIBUTION.md](CONTRIBUTION.md)*
