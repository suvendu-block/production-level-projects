# BACKLOGS.md — Feature backlog

> Every feature, wherever it lives. Sources: [REQUIREMENTS.md](REQUIREMENTS.md) (FRs) split into groomable items; each item carries: source FR · priority (P0/P1/P2) · size (S/M/L/XL) · status. Sequencing: [ROADMAP.md](ROADMAP.md); work-ready detail: [TASKS.md](TASKS.md).
>
> **Status vocabulary:** `idea` → `groomed` (has FR link + acceptance note) → `ready` (has task breakdown) → `in-progress` → `done` → `shipped`. Nothing gets `ready` without an FR ID and a verification plan.

---

## Legend

P0 = core · P1 = major value · P2 = icebox/nice · Size S(<1d) M(≤3d) L(≤2wk) XL(>2wk)

## EPIC A — Platform foundation (M0)

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-A1 | Monorepo skeleton + tooling baseline (ruff/mypy/vitest/eslint) | — | P0 | L | in-progress |
| BL-A2 | Docker compose full-stack dev environment | — | P0 | M | groomed |
| BL-A3 | CI pipeline: lint, typecheck, unit, migration check | — | P0 | M | groomed |
| BL-A4 | FastAPI app shell: config, logging, `healthz`, OTel | — | P0 | M | groomed |
| BL-A5 | DB migration pipeline (Alembic) + RLS scaffolding | FR-1.3 | P0 | M | groomed |
| BL-A6 | React shell: routing, layout, design tokens, generated client | — | P0 | M | groomed |
| BL-A7 | Docs templates (ADR, postmortem, review record) | — | P1 | S | done* |

## EPIC B — Identity, tenancy & RBAC

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-B1 | OIDC login (Google + GitHub) | FR-1.1 | P0 | M | idea |
| BL-B2 | Orgs + memberships model, invite flow (email) | FR-1.2/FR-1.6 | P0 | M | idea |
| BL-B3 | Role matrix enforcement (viewer/member/maintainer/owner) | FR-1.4 | P0 | M | idea |
| BL-B4 | Audit log: event capture, viewer UI, export (CSV/NDJSON) | FR-1.5 | P0 | M | idea |
| BL-B5 | Multi-org switcher + org settings UI | FR-1.2 | P1 | M | idea |
| BL-B6 | SCIM provisioning | FR-1.6 | P2 | L | idea |
| BL-B7 | Session security: rotation, device list, revoke-all | — | P0 | S | idea |

## EPIC C — Repo & context ingestion

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-C1 | GitHub App: install/uninstall, webhook HMAC verify | FR-2.1 | P0 | M | idea |
| BL-C2 | Change-scope computation (diff → tested surfaces) | FR-2.2 | P0 | M | idea |
| BL-C3 | OpenAPI parser + validation + endpoint mapping UI | FR-2.3 | P0 | M | idea |
| BL-C4 | Incremental repo indexer → embeddings (pgvector) | FR-2.4 | P0 | L | idea |
| BL-C5 | `.aitp.md` conventions ingestion & per-run display | FR-2.5 | P1 | S | idea |
| BL-C6 | Secret/dangerous-pattern detector (env keys, hardcodes) | FR-2.7 | P0 | S | idea |
| BL-C7 | Disconnect + data purge job per privacy retention | FR-2.6 | P0 | M | idea |
| BL-C8 | Other providers (GitLab, Bitbucket, Azure) | FR-8.5 | P2 | XL | idea |

## EPIC D — AI generation

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-D1 | AI Gateway: provider adapters, zero-retention mode, failover | FR-3 | P0 | L | idea |
| BL-D2 | Prompt-set library (plan/generate/critique) + content hashing | FR-3.8/FR-3.10 | P0 | M | idea |
| BL-D3 | API test generator (pytest/pytest+TestClient) | FR-3.1 | P0 | L | idea |
| BL-D4 | Static validation pipeline ((ast, import-resolve, schema checks)) | FR-3.3 | P0 | M | idea |
| BL-D5 | Self-critique + rubric scoring + repair loop | FR-3.8 | P0 | M | idea |
| BL-D6 | Token budgets + caching + cost reporting per run | FR-3.9 | P0 | M | idea |
| BL-D7 | E2E generator: Playwright TS, a11y selectors, sleep-forbidden lint | FR-3.6 | P0 | L | idea |
| BL-D8 | Intent documentation (test → spec line traceability) | FR-3.7 | P0 | S | idea |
| BL-D9 | Unit test generator for diffs (post-GA) | — | P1 | L | idea |
| BL-D10 | Prompt regression eval harness (run per prompt/model change) | FR-3.8 | P0 | L | idea |

## EPIC E — Proposal & review workflow

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-E1 | Proposal data model + immutable lineage | FR-3.4 | P0 | M | idea |
| BL-E2 | Review UI: code pane, diff, summary, provenance, cost | FR-3.2 | P0 | L | idea |
| BL-E3 | Approve / edit-and-approve / reject actions + audit | FR-3.4 | P0 | M | idea |
| BL-E4 | Inline editor with syntax highlighting + sandbox preview | — | P1 | M | idea |
| BL-E5 | Commit-as-PR flow (repo-mode A) with bot footer | FR-3.5 | P0 | M | idea |
| BL-E6 | AITP-managed suite mode (B): CI-friendly file layout | FR-3.5 | P0 | M | idea |

## EPIC F — Execution engine

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-F1 | Orchestrator: sandbox lifecycle state machine | FR-4.4 | P0 | L | idea |
| BL-F2 | Pinned runner images (pytest, playwright) + weekly rescan | FR-4.4 | P0 | M | idea |
| BL-F3 | Secret injection (short-TTL files) + network policy | FR-4.4 | P0 | M | idea |
| BL-F4 | Live status streaming (WebSocket) + run timeline UI | FR-4.2 | P0 | M | idea |
| BL-F5 | Artifact pipeline: S3 upload, signed URLs, viewer UIs | FR-4.2 | P0 | M | idea |
| BL-F6 | Retry policy + flake score persistence | FR-4.5 | P0 | S | idea |
| BL-F7 | Run cancellation + cleanup | FR-4.6 | P0 | S | idea |
| BL-F8 | Warm sandbox pool (prod perf) | — | P1 | M | idea |
| BL-F9 | SHA-bound run ledger | FR-4.3 | P0 | S | idea |

## EPIC G — Self-healing

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-G1 | Breakage classifier (selector/assertion/app-bug/flake) | FR-5.1 | P0 | L | idea |
| BL-G2 | Fix proposal generator (minimal diff + explanation) | FR-5.3 | P0 | L | idea |
| BL-G3 | Approval workflow + audit + one-click revert | FR-5.2 | P0 | M | idea |
| BL-G4 | Precision tracking + feature-off fallback | FR-5.4 | P0 | S | idea |
| BL-G5 | Weekly heal digest | FR-5.5 | P1 | S | idea |

## EPIC H — Visual regression (M3)

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-H1 | Screenshot capture + perceptual diffing engine | FR-6.1 | P0 | L | idea |
| BL-H2 | Baseline management UI (approve/reject/history) | FR-6.2 | P0 | M | idea |
| BL-H3 | AI triage cosmetic vs meaningful + ignore regions | FR-6.3 | P1 | M | idea |

## EPIC I — Analytics & risk (M3)

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-I1 | Coverage map store + PR subset selection engine | FR-7.1 | P0 | L | idea |
| BL-I2 | Coverage dashboard + gap list | FR-7.2 | P0 | M | idea |
| BL-I3 | Flake dashboard + quarantine automation | FR-7.3 | P0 | M | idea |
| BL-I4 | Exec summary & action list | FR-7.4 | P0 | M | idea |

## EPIC J — Integrations

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-J1 | PR bot: coverage delta + proposals + flake badge | FR-8.1 | P0 | M | idea |
| BL-J2 | GitHub Actions step (`aitp/test`) | FR-8.2 | P0 | M | idea |
| BL-J3 | Slack digests + approval nudges | FR-8.3 | P1 | M | idea |
| BL-J4 | Public API v1 + outbound webhooks | FR-8.4 | P1 | M | idea |

## EPIC K — Administration, billing & scale (M4/M5)

| ID | Feature | FR | P | Size | Status |
|----|---------|----|---|------|--------|
| BL-K1 | Plans/quotas + event-driven overage UX | FR-9.1 | P0 | M | idea |
| BL-K2 | Org deletion (soft-30d → purge) | FR-9.2 | P0 | M | idea |
| BL-K3 | Feature flag system per org | FR-9.3 | P0 | M | idea |
| BL-K4 | Billing metering (ADR-0015) | — | P1 | L | idea |
| BL-K5 | Per-tenant queue/runner isolation (ADR-0016) | — | P1 | L | idea |
| BL-K6 | Self-hosted runtime parity checks | — | P2 | L | idea |

## Icebox (unlinked, needs grooming first)

- Test-pattern template marketplace (2028)
- "Test impact comment" for docs changes only runs
- Slack-based approvals (mobile-first flourish)
- Browser extension: right-click "cover this with AITP"
- AI-generated test data factories (privacy-safe synthetic users) — must survive [PRIVACY.md](PRIVACY.md) review first

---

### Grooming rules

1. New ideas land in Icebox; someone must link FR (or create one in [REQUIREMENTS.md](REQUIREMENTS.md)) to enter the tables above.
2. `L`+ items need a task breakdown in [TASKS.md](TASKS.md) before they can be `ready`.
3. Quarterly review prunes: anything untouched for 2 quarters and P2 gets deleted (not "forever someday") — git history remembers.
