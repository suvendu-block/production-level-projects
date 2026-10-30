# REQUIREMENTS.md — Functional requirements

> What AITP must do, in testable language. Every FR traces to a milestone ([MILESTONES.md](MILESTONES.md)); every implementation to backlog items ([BACKLOGS.md](BACKLOGS.md)) and tasks ([TASKS.md](TASKS.md)). IDs are permanent.

---

## Notation

`MUST` = hard requirement (blocks the milestone) · `SHOULD` = default yes, first cut in a later sprint is acceptable with a note · `MAY` = opportunistic.
Priority tiers: **P0** (core loop breaks without it), **P1** (major value), **P2** (nice-have; schedule in [ROADMAP.md](ROADMAP.md)).
Every FR lists its **verification method** (V-x): `QA`=manual, `AT`=automated test, `EVAL`=AI eval suite ([TESTING.md](TESTING.md) §5), `LOAD`=load test.

## FR-1 — Identity & tenancy

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-1.1 | Users MUST authenticate via OIDC (Google, GitHub, enterprise IdP at M4). | P0 | M1 | AT/QA |
| FR-1.2 | The system MUST support organizations; each user belongs to ≥ 1 org with a role: `owner`, `maintainer`, `member`, `viewer`. | P0 | M1 (single org) / M4 (multi-org RBAC) | AT |
| FR-1.3 | All tenant data MUST be isolated by org — UI, API, DB (RLS), sandboxes, storage prefixes. A member of org A MUST NOT read org B data even via direct API call or crafted IDs. | P0 | M1 | AT + pentest |
| FR-1.4 | Roles MUST gate actions: viewer=read-only; member=create jobs; maintainer=approve proposals/heals, connect repos; owner=billing, members, delete. | P0 | M4 | AT |
| FR-1.5 | Every consequential action (login, generation, approval, heal, config change) MUST be audit-logged with actor, object, before/after, IP. Retention per [PRIVACY.md](PRIVACY.md). | P0 | M1 (basic) / M4 (full) | AT |
| FR-1.6 | Invitations MUST support email; seats enforce org plan limits with a clear UI error, never silent failure. | P1 | M4 | QA |

## FR-2 — Repository & context ingestion

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-2.1 | Users MUST connect GitHub via the official App flow (install → select repo → webhook verified). Disconnect MUST revoke tokens within 24 h. | P0 | M1 | QA/AT |
| FR-2.2 | On push/PR webhook, AITP MUST compute the changed-scope (files, endpoints from OpenAPI if present, linked stories if referenced) within 2 min p95. | P0 | M1 | AT |
| FR-2.3 | AITP MUST ingest OpenAPI ≥ 3.0 specs (file or URL) and map endpoints → testable contracts. Invalid specs produce a **diagnosable error**, not silent skip. | P0 | M1 | AT |
| FR-2.4 | Repo content MUST be embedded in the vector store with source/hash lineage; re-index MUST be incremental (only changed files). | P0 | M1 | AT |
| FR-2.5 | Repos with `.aitp.md` conventions file: generation MUST honor it (style, fixtures, naming) and show the file in run details. | P1 | M2 | EVAL |
| FR-2.6 | Disconnecting a repo MUST stop webhooks and trigger data deletion per [PRIVACY.md](PRIVACY.md) within the stated retention. | P0 | M4 | AT |
| FR-2.7 | Secrets present in repo config buffers MUST be detected and refused with a warning Explaining how to supply them properly (vault reference). | P0 | M1 (basic regex) / M4 (full) | AT |

## FR-3 — AI test generation

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-3.1 | Given a connected repo + trigger, AITP MUST emit an API test suite, executed against the project's stored OpenAPI contract, with assertion coverage on: status code, schema, key headers. | P0 | M1 | EVAL |
| FR-3.2 | Generation MUST be reviewable: proposal shows test code, diff, plain-language summary, provenance (sources used), and cost/token count. | P0 | M1 | QA |
| FR-3.3 | Generated tests MUST pass static validation: syntax, imports resolve, payloads schema-valid against OpenAPI. Unvalidatable output MUST NOT surface in review. | P0 | M1 | AT |
| FR-3.4 | Users MUST be able to approve, edit-and-approve, edit inline, or reject each proposal; decisions are audited and versioned (immutable lineage). | P0 | M1 | AT |
| FR-3.5 | Approved tests MUST commit back as PR (mode A) or live in AITP-managed suites (mode B). Merge remains with the human. | P0 | M2 | AT/QA |
| FR-3.6 | E2E generation MUST produce Playwright tests using accessibility-based selectors; sleep-based waits forbidden (lint-enforced). | P0 | M2 | EVAL |
| FR-3.7 | Every generated test MUST carry intent documentation: which requirement/spec line it came from (testable via review UI). | P0 | M1 | EVAL |
| FR-3.8 | Model/prompt changes MUST be gated by the [eval suite](TESTING.md) — quality cannot regress below thresholds. | P0 | M1 | EVAL |
| FR-3.9 | Per-run cost budget MUST exist (default + org-override); exceeded → partial delivery + cost report, never silent overspend. | P0 | M1 | AT |
| FR-3.10 | Reprompting the same spec+context SHOULD reuse cached artifacts (same model, same prompt set) — deterministic reproducibility. | P1 | M2 | AT |

## FR-4 — Execution

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-4.1 | Every test decision (approved/edit/reject) MUST be recorded with the user + timestamp (immutability on lineage). | P0 | M1 | AT |
| FR-4.2 | Users MUST trigger test runs (full suite or subset) and see real-time progress (parallel: ready → running → results), with per-test artifacts (logs, video/e2e, screenshots). | P0 | M1 (API tests) / M2 (Playwright) | AT/QA |
| FR-4.3 | Every run MUST bind to a git SHA; reports are reproducible for that SHA. | P0 | M1 | AT |
| FR-4.4 | Runs MUST execute in isolated ephemeral sandboxes (pinned images, network policy, resource caps); no shared state between tenants. | P0 | M1 | AT + pentest |
| FR-4.5 | Retry policy MUST be fixed (3 attempts, jittered backoff) and the flake score persisted per test. | P0 | M2 | AT |
| FR-4.6 | Runs MUST be cancellable; kill within 10 s propagates artifact collection. | P0 | M1 | AT |

## FR-5 — Self-healing

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-5.1 | Failures MUST classify as: `selector-drift | assertion-drift | app-bug | flake` (with confidence); UI shows class + evidence. | P0 | M2 | EVAL |
| FR-5.2 | Heals MUST be proposals only (never auto-apply before L3). Approval = maintainer+; decision audited with before/after. | P0 | M2 | AT |
| FR-5.3 | Fix diffs MUST be minimal and explained ("which element changed, why this new locator"); OK to be small. | P0 | M2 | EVAL |
| FR-5.4 | Heal precision MUST be ≥ 60 % at M2 (accepted / proposed) to keep feature enabled by default; below → auto-hide behind flag + re-review. | P0 | M2 | EVAL |
| FR-5.5 | Weekly digest (per project): tests healed, precision %, time saved estimate, top flakes. | P1 | M3 | QA |

## FR-6 — Visual regression (M3)

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-6.1 | E2E runs MUST capture screenshots and diff against baselines with perceptual hashing + threshold config per project. | P0 | M3 | EVAL |
| FR-6.2 | Baselines MUST be managed (update, reject, view history); AI triage: meaningful vs cosmetic; cosmetic auto-classify ≤ cost goals. | P0 | M3 | EVAL |
| FR-6.3 | Diff view with overlay/opacity + selectable regions; annotate known-dynamics (timestamps, ads) as "ignore regions". | P1 | M3 | QA |
| FR-6.4 | Rejection of a baseline update MUST create a linked story endpoint (proposal review milestone). | P1 | M3 | AT |

## FR-7 — Analytics & risk (M3)

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-7.1 | Risk engine MUST select the affected test subset for a change (changed-lines → coverage map → tests), targeting < 10 min PR feedback ([MILESTONES.md](MILESTONES.md) M3). | P0 | M3 | AT/LOAD |
| FR-7.2 | Coverage maps MUST show: routes/files ↔ tests coverage %, drift over time (weekly), gap list ranked by risk. | P0 | M3 | AT |
| FR-7.3 | Flake badging per test MUST exist (score 0–100, drivers listed: timing, race, environment), with quarantine automation opt-in. | P0 | M3 | AT |
| FR-7.4 | Exec summary dashboard: what changed, what broke, what is untested, action list. Every panel actionable (PRINCIPLES #2 "explain or don't ship"). | P0 | M3 | QA |

## FR-8 — Integrations (M2–M5)

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-8.1 | GitHub PR bot comments: coverage delta, new tests proposed, flake badging; reaction-aware (they can approve right there). | P0 | M2 | QA |
| FR-8.2 | GitHub Actions step `aitp/test` (digest-image) enabling teams to run AITP tests in their own CI. | P0 | M2 | AT |
| FR-8.3 | Slack digest + 'approval needed' nudges (threshold: idle approvals > 24h escalate). | P1 | M3 | QA |
| FR-8.4 | Public REST API + outbound webhooks (per [SPECIFICATION.md](SPECIFICATION.md) §7) for programmatic use. | P1 | M3 | AT |
| FR-8.5 | GitLab, Bitbucket, Azure DevOps providers with parity to GitHub-connector (M5 backlog). | P2 | M5 | AT |
| FR-8.6 | Jira/Linear: link stories → tests traceably (coverage by user story). | P2 | M5 | AT |

## FR-9 — Administration & platform (M4)

| ID | Requirement | Pri | Mile | Verify |
|----|-------------|-----|------|--------|
| FR-9.1 | Owner MUST manage plan/quota; overage produces clear UI events + webhook `quota.threshold`; no silent throttling. | P0 | M4 | AT |
| FR-9.2 | Org data deletion via API/UI with 30-day soft delete (restore window), then purge per [PRIVACY.md](PRIVACY.md). | P0 | M4 | AT |
| FR-9.3 | Feature flags per org (canary for heal L3 etc.) with audit trail. | P0 | M4 | AT |
| FR-9.4 | Status page + public health endpoints + [runbooks](OPERATIONS.md) requiring ≤ 15-min MTTR for P1s. | P0 | M4 | QA/drill |
| FR-9.5 | Self-service docs + in-product onboarding: first green test ≤ 15 min ([VISION.md](VISION.md) north star). | P0 | M4 | QA on fresh account |

## NFR summary

Full details in [TESTING.md](TESTING.md) (how we verify) and [ARCHITECTURE.md](ARCHITECTURE.md) §5 (how we achieve).

| Class | Requirement |
|-------|-------------|
| Availability | 99.9 % (prod +14 days SLO window) |
| Data durability | 11 x 9s for artifacts; RPO ≤ 15 min / RTO ≤ 4 h (Postgres) |
| Security | Zero customer-code exposure beyond required scope; pen-test before GA; details [SECURITY.md](SECURITY.md) |
| Privacy | No training on customer data; inner LLM zero-retention; deletion ≤ 30 days ([PRIVACY.md](PRIVACY.md)) |
| Performance | API p95 < 300 ms; generation p95 < 90 s/run; throughput per [SPECIFICATION.md](SPECIFICATION.md) §6 |
| Maintainability | Coverage gates; every EB decision in ADRs; runbooks for top-10 incidents |
| Portability | Self-host option (docker compose/K8s) parity for accepts-cost customers, M4 |
| Observability | 100 % of requests traced (sampled ≥ 10 % payloads), dashboards-as-code |
| Cost | Per-tenant budget caps; forecastable (no surprise bills) |

---

*Traceability: FR ⇄ [BACKLOGS.md](BACKLOGS.md) feature ⇄ [TASKS.md](TASKS.md) tasks ⇄ [MILESTONES.md](MILESTONES.md) milestone. A changed requirement = a doc change in the same PR ([PRINCIPLES.md](PRINCIPLES.md) #9).*
