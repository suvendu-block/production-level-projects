# MILESTONES.md — Project vision and milestones

> Vision: [VISION.md](VISION.md). Time-based view: [ROADMAP.md](ROADMAP.md). Granular work: [TASKS.md](TASKS.md).

---

## Autonomy level per milestone

Each milestone unlocks a higher [autonomy level](VISION.md#evolution-of-autonomy) — the product does strictly more, only after the previous level is measured and trusted.

| Milestone | Autonomy | One-line summary |
|-----------|----------|------------------|
| M0 | L0 | Foundation: repo, stack, CI, docs |
| M1 | L0→L1 | MVP: generate + run API tests, reviewable in dashboard |
| M2 | L1→L2 | E2E (Playwright) + self-healing beta |
| M3 | L2 | Visual regression + analytics/risk engine |
| M4 | L3 | GA: enterprise (SSO, RBAC, audit), opt-in auto-heal |
| M5 | L4-ready | Scale: multi-tenant SaaS, integrations marketplace |

---

## M0 — Foundation (Nov 2 – Nov 27, 2026)

**Goal:** an empty-but-perfect skeleton: everything builds, everything is tested, everything is documented.

- Monorepo layout (`backend/`, `frontend/`, `docs/`, `deploy/`), license, CI on every PR.
- FastAPI health-check service with structured logging + OpenTelemetry.
- React shell with auth stub, design tokens, API client generated from OpenAPI.
- Postgres + Redis via docker compose; Alembic migration pipeline; one end-to-end migration in CI.
- Quality gates live: ruff, mypy, eslint, prettier, pytest, vitest, coverage thresholds.

**Exit criteria:** `docker compose up` yields green backend + frontend + db + redis; CI badge green on main; new dev to first PR < 1 hour following [STEPS.md](STEPS.md).

## M1 — MVP (Dec 2026 – Feb 2027)

**Goal:** a user can connect a GitHub repo and get an AI-generated, runnable **API test suite** they approve — the smallest loop that delivers real value.

- GitHub App: install, repo selection, webhook ingestion of push/PR events.
- Context ingestion: OpenAPI spec parser + changed-file indexer + pgvector RAG store.
- LLM pipeline v1: plan → generate → static-validate (syntax, imports, schema) → self-critique; token budgets + prompt caching.
- Execution: ephemeral Docker sandboxes running generated **pytest + FastAPI TestClient** suites; results, logs, coverage to Postgres + object storage.
- Dashboard: projects, generation runs, test review (accept/edit/reject), run history, results view.
- Auth: OIDC login, single org, single role. Audit log v1.

**Exit criteria (beta with 5 design partners):** 30+ repos onboarded; ≥ 50 % of generated API tests accepted without edits; p95 generation < 90 s per endpoint; false-red rate < 5 %.

## M2 — E2E & self-healing (Mar – May 2027)

**Goal:** browser tests that survive UI changes.

- Playwright runner in the execution engine: traces, videos, screenshots, retries with backoff.
- E2E generation from user stories + DOM snapshot analysis (accessibility-tree based selectors, no CSS-path guessing).
- **Self-healing v1 (L2):** breakage classifier (selector vs. assertion vs. app bug), minimal-diff proposals, dashboard approval flow, per-test heal history.
- Flakiness engine: retry analysis, quarantine automation, flake score per test.
- PR bot: comments on GitHub PRs with coverage delta + proposed tests; still human-merged.

**Exit criteria:** design-partner suites show ≥ 30 % fewer maintenance edits; heal precision (accepted fixes / proposals) ≥ 60 %; flake detection recall ≥ 90 % on our eval corpus.

## M3 — Visual & risk (Jun – Aug 2027)

**Goal:** AITP becomes a *prioritizer*, not just an author.

- Visual regression: baseline management, perceptual diffing, AI triage of meaningful vs. cosmetic changes.
- Risk engine: changed-lines → affected test selection; run only the risky subset on PR, full suite nightly.
- Analytics v1: coverage maps, flake trends, suite health score, "what should I do" action list.
- Notifications & digest (Slack, email); public REST API v1 + webhooks.

**Exit criteria:** PR feedback time (change → result) < 10 min for the risk-selected subset; ≥ 40 % median CI time reduction reported by partners.

## M4 — GA / Enterprise (Sep – Nov 2027)

**Goal:** production-grade, sellable.

- Multi-tenant: orgs, projects, RBAC (owner/maintainer/member/viewer), SSO (SAML/OIDC), SCIM optional.
- **Auto-heal (L3, opt-in):** only for measured high-confidence classes (e.g., renamed selectors), full audit + one-click revert.
- Compliance: SOC 2 Type I track, DPA, data residency option (EU), retention controls.
- Hardening: rate limits, cost guards per tenant, SLA 99.9 %, status page, on-call rotation.
- Docs site, in-product onboarding, template library of test patterns.

**Exit criteria:** GA release `v1.0.0`; security review complete ([SECURITY.md](SECURITY.md)); SLOs met for 30 days on staging load tests; first paying customer.

## M5 — Scale & ecosystem (2028)

**Goal:** the platform other tools plug into.

- True SaaS multi-tenancy at scale: per-tenant runner pools, queue isolation, usage-based billing metering.
- Integrations marketplace: GitLab, Bitbucket, Azure DevOps, Jira/Linear, Slack, TestRail.
- Self-hosted runtime option (air-gapped) with local model support (vLLM).
- Autonomy L4 research: bounded auto-merge for 95 %+ precision scopes.

---

## Milestone hygiene

- A milestone is **done** when its exit criteria are measured and recorded in [CONVERSATION.md](CONVERSATION.md), not when the date passes.
- Slipping an exit criterion is a scope decision → record an ADR in [DECISIONS.md](DECISIONS.md).
- Features not tied to the current milestone go to the [BACKLOGS.md](BACKLOGS.md) icebox — they do not creep into the milestone.
