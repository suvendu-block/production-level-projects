# ROADMAP.md — Development roadmap

> Time-ordered view. Milestone semantics & exit criteria: [MILESTONES.md](MILESTONES.md). Feature detail: [BACKLOGS.md](BACKLOGS.md). Dates are planning commits, not promises — slips are announced here with reasons.

---

## Legend

- 🎯 = ship-critical for that quarter · 🔧 = quality/platform investment · ✂️ = explicitly cut or deferred to later
- Status: ⬜ not started · 🟨 in progress · ✅ done

## Now / Next / Later (the 3-lane view)

| Lane | Items |
|------|-------|
| **Now** (Nov 2026) | M0 skeleton: CI, migrations, compose stack, quality gates, docs templates |
| **Next** (Dec 2026 – Feb 2027) | M1 MVP: GitHub connect → generation → execution → review loop (API tests) |
| **Later** (Mar 2027+) | Self-healing, E2E, visual, risk, enterprise, scale — see quarter tables |

---

## 2026 Q4 — *Skeleton & the first green test*

**M0 Foundation (Nov 2 – Nov 27):**

- 🟨 Monorepo skeleton: `backend/`, `frontend/`, `deploy/`, `scripts/`
- ⬜ CI green: lint + typecheck + tests on every PR ([ADR-013](DECISIONS.md#adr-013))
- ⬜ `docker compose up` full stack; Postgres + Redis healthchecks
- ⬜ Alembic baseline migration + RLS spiking ([ADR-008](DECISIONS.md#adr-008))
- ⬜ FastAPI `healthz` + OTel wiring ([ADR-014](DECISIONS.md#adr-014))
- ⬜ React shell: auth stub, layout, generated API client
- 🔧 Docs templates (postmortem, ADR, review record) under `docs/templates/`

**M1 MVP kickoff (Dec 2026):**

- ⬜ GitHub App: install flow + webhook receiver (verified HMAC)
- ⬜ OpenAPI ingest + changed-file indexer → pgvector
- ⬜ AI Gateway v1 with budgets + prompt-set hashing
- 🎯 **Outcome:** one demo repo receives a first reviewable API test proposal before the year ends.

## 2027 Q1 — *The generation loop (M1 completes)*

- 🎯 Full generate→validate→review→accept→run pipeline for API tests
- 🎯 Dashboard: projects, generations, proposal review, run history
- 🎯 Execution engine v1 (sandboxed pytest runs, artifacts, WebSocket live view)
- 🎯 Eval harness v1 + golden dataset; prompt-set pinning ([TESTING.md](TESTING.md) §5)
- 🔧 Audit log v1; OIDC login; tenant isolation tests in CI
- ✂️ E2E browsers land next quarter — not now

**Exit:** 5 design partners onboarded; ≥ 50 % acceptance rate; `v0.1.0` public tag.

## 2027 Q2 — *Self-healing & E2E (M2)*

- 🎯 Playwright runner + traces/videos/screenshots; E2E generation (a11y selectors)
- 🎯 Self-healing v1: breakage classifier + minimal-diff proposals + approval flow
- 🎯 Flake engine: scores, quarantine, retry instrumentation
- 🎯 GitHub PR bot: coverage delta comments + proposal links
- 🔧 GitHub Actions step `aitp/test`; load testing of scheduler at 2× current partners

**Exit:** heal precision ≥ 60 %; maintenance edits −30 % on partner repos; `[MILESTONES.md](MILESTONES.md)` M2 gates measured.

## 2027 Q3 — *Eyes & brains (M3)*

- 🎯 Visual regression: baselines, perceptual diffs, AI triage of cosmetic vs meaningful
- 🎯 Risk engine: PR runs only affected subset (< 10 min feedback); nightly full
- 🎯 Analytics v1: coverage maps, suite health score, actionable weekly digest
- 🎯 Slack digests; public REST API v1 + outbound webhooks (HMAC-signed)

**Exit:** median CI time reduction ≥ 40 % on partner repos.

## 2027 Q4 — *GA/Enterprise (M4)*

- 🎯 RBAC + multi-org + SSO (SAML/OIDC) + audit export
- 🎯 Auto-heal L3 **(opt-in, measured classes only)** — see [VISION.md](VISION.md) ladder
- 🎯 Compliance track: SOC 2 Type I, DPA, EU residency option, deletion SLAs ([PRIVACY.md](PRIVACY.md))
- 🎯 Cost guards per tenant; status page; on-call rotation live ([OPERATIONS.md](OPERATIONS.md))
- 🎯 `v1.0.0` GA + first paying customer; self-host Helm chart GA

## 2028 — *Scale & ecosystem (M5)*

- Multi-tenant SaaS at scale: per-tenant queues/runners, usage billing (ADR-0015)
- Providers: GitLab, Bitbucket, Azure DevOps; PM tools Jira/Linear traceability
- Self-hosted/air-gapped runtime with local models (vLLM path from [ADR-007](DECISIONS.md#adr-007))
- Autonomy L4 research: bounded auto-merge where precision ≥ 95 %; community test-pattern marketplace

---

## Cut / deferred (with reasons)

| Deferred item | Why |
|---------------|-----|
| Mobile-native testing | No honest way to run it yet ([VISION.md](VISION.md) anti-goal) |
| Load/perf testing suite | Different market; revisit 2028 |
| Multi-player test suite editing | Collaboration is YAGNI for M0–M4 |
| On-prem Windows runner pools | Demand-driven; Linux-only first |

## How this roadmap changes

Any edit that (a) changes a milestone's exit criteria, or (b) adds/removes a quarterly theme must: update [MILESTONES.md](MILESTONES.md) in the same PR, add a discussion entry in [CONVERSATION.md](CONVERSATION.md), and if it contradicts an accepted principle, become an ADR in [DECISIONS.md](DECISIONS.md). Roadmap went cold last touched date stamps at file top.
