# CONTRIBUTION.md — Contributing

> Everything a developer needs to land their first (and hundredth) PR.

---

## 1. Ground rules first

1. **Docs are code.** A change without its doc change (or an explicit `docs: none needed` statement in the PR) is incomplete — [PRINCIPLES.md](PRINCIPLES.md) #9.
2. **AI proposes; humans approve.** Applies to platform users *and* to us: contributors may use AI assistants, but reviewers decide; AI-drafted PRs must disclose it.
3. **Every non-obvious choice gets an ADR** in [DECISIONS.md](DECISIONS.md); every design debate gets a record in [CONVERSATION.md](CONVERSATION.md).
4. We follow the Contributor Covenant (2.1): harassignment is real — harassment or bad faith gets addressed under escalation rules.

## 2. Getting set up

1. Follow [STEPS.md](STEPS.md) §0–§6 (≤ 15 min to green local stack; if it takes longer, that's a doc bug — fix it in your PR).
2. Required tooling is in `.tool-versions`/`package.json` engines; nothing global beyond Docker+Python+Node.
3. Local quality loop (same commands CI runs): [STEPS.md](STEPS.md) §6.

## 3. How we work (trunk-based, [ADR-0013](DECISIONS.md#adr-013))

- Branch names: `feat/<epic-id>-short-desc`, `fix/<issue-id>-desc`, `docs/<topic>`, `chore/<topic>`.
- Commits: **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`) — release notes and semver derive from these; breaking = `feat!:`/`fix!:` + `BREAKING CHANGE:` footer.
- One PR = one topic. Size guide: ≤ ~400 changed lines (plus migrations/fixtures) for a smooth review.
- Small PRs may merge with 1 approval; L/XL tasks ([TASKS.md](TASKS.md)) require 2 + design sign-off if new patterns are touched.
- CI is the bouncer: all [TESTING.md](TESTING.md) §3 gates green before review begins.

## 4. PR checklist (full copy in the PR template)

**Author checks**

- [ ] Tests added/updated (unit for logic; integration for endpoints; [AI evals attach results](TESTING.md) if prompts touched)
- [ ] OpenAPI updated + FE client regenerated (0 drift)
- [ ] Migration written w/ inverse documented
- [ ] RLS asserted if any tenant-scoped table changed
- [ ] Observability: request trace + relevant span attributes ([SPECIFICATION.md](SPECIFICATION.md) §9)
- [ ] Docs touched (this folder), ADR/CONVERSATION entry if decision-level
- [ ] No secrets; no PII in fixtures; synthesized data only
- [ ] `docs: none needed` explicitly stated if that's the claim

**Reviewer checks**

- [ ] Requirement traceability (FR link) present
- [ ] Tenancy & auth surfaces considered (roles per [FR-1.4](REQUIREMENTS.md))
- [ ] Cost / net-new AI budget touched? (tokens, new S3 usage, new queues)
- [ ] Failure modes: what happens when this is down/rate-limited/outage?
- [ ] Tests would *fail* if the feature regressed (mutation-of-truth check, informal)

## 5. Code style & conventions

**Backend (Python):** ruff (rules as configured) · mypy strict · Pydantic for boundaries, dataclasses internally if faster · pure-function domain logic in `services/` (no I/O), I/O in adapters/workers · atomic `services` functions compose via events ([ADR-0005](DECISIONS.md#adr-005)).

**Frontend:** TypeScript strict · feature-folder structure ([PROJECT.md](PROJECT.md) tree) · server state via TanStack Query only — no ad-hoc fetch in components · tokens over raw values.

**General:** comments explain *why*, not *what*; error messages are actionable ("what happened / what to do / link to runbook"); no `# TODO` without a task ID in [TASKS.md](TASKS.md).

## 6. Testing commitments (before you type `git commit`)

- Coverage floors enforced (backend 80 %, FE 70 %) — see [TESTING.md](TESTING.md).
- Flaky test = defect: quarantine + fix within 2 weeks ([TESTING.md](TESTING.md) §5).
- Prompt/model diffs include the eval report ([TESTING.md](TESTING.md) §4) in the PR body.
- New tables → tenancy tests; new endpoints → contract tests; new authz surface → role-matrix test.

## 7. Where decisions happen (don't skip)

1. Big/ambiguous → open an **RFC issue** referencing the epic/backlog item; maintainer triages within 3 business days.
2. Outcome lands as: an ADR (architecture), a REQUIREMENTS/BACKLOGS edit (scope), or a CONVERSATION record (discussion sanity-preservative).
3. Incidents → postmortems within 7 days ([OPERATIONS.md](OPERATIONS.md) §6), actions into [TASKS.md](TASKS.md) tagged `ops-debt`.

## 8. Newton's law of AITP contribution (don't hurt the users of the users)

Our users' users are *their test suites*. Changes touching generation prompts, healing, or flake scoring rotate a two-release shadow period behind flags before default-on — unless eval semantics prove safety faster. No exceptions.

## 9. Recognition

First merged PR → contributor listed in `CONTRIBUTORS.md` (generated); recurring contributors → `CODEOWNERS`. Reviews are work: reviewers who repeatedly catch real issues get process-granted sway (fast-track their +1s count as approvals for scoped PRs).

---

*Link loss: this doc assumes files in `docs/`; the repo layout is in [PROJECT.md](PROJECT.md). Stuck? [TROUBLESHOOTING.md](TROUBLESHOOTING.md).*
