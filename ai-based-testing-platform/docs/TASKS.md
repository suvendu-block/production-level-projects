# TASKS.md — Task breakdown

> Execution-level work items. A task belongs to a backlog feature ([BACKLOGS.md](BACKLOGS.md)) and gates a milestone ([MILESTONES.md](MILESTONES.md)). This file follows the current milestone closely (M0 + M1 kickoff) — deeper milestones get groomed as they approach.

**Effort points:** 1=hours, 2=half-day, 3=1–2 days, 5=≈1 week.
**Owners:** roles until people exist: `BE` backend · `FE` frontend · `DEVOPS` platform · `AI` ML/LLM · `PIC` person-in-charge placeholder.

---

## M0 — Foundation (Nov 2 – Nov 27, 2026)

### Sprint 0.1 (Nov 2 – 6) — "Skeleton stands up"

| ID | Task | BL | Owner | Pts | Depends | Status |
|----|------|----|-------|-----|---------|--------|
| T-001 | Repo init: license, CODEOWNERS, .gitignore, commit template | BL-A1 | DEVOPS | 1 | — | ⬜ |
| T-002 | Backend package skeleton `app/{api,core,models,schemas,services,ai,workers}` + pyproject | BL-A1 | BE | 2 | T-001 | ⬜ |
| T-003 | Frontend Vite+TS shell, routing, Tailwind, tokens | BL-A6 | FE | 2 | T-001 | ⬜ |
| T-004 | docker compose: postgres, redis, api, worker, frontend with healthchecks | BL-A2 | DEVOPS | 2 | T-002 | ⬜ |
| T-005 | CI workflow: install, ruff+eslint, mypy+tsc, pytest+vitest gates | BL-A3 | DEVOPS | 2 | T-002/3 | ⬜ |
| T-006 | FastAPI bootstrap: settings, structured logs, `healthz`, OTel no-op → collector in compose | BL-A4 | BE | 2 | T-002 | ⬜ |
| T-007 | Alembic setup + baseline migration + RLS policy spike (org_id SET LOCAL) | BL-A5 | BE | 2 | T-004 | ⬜ |
| T-008 | Postmortem/ADR/review templates in `docs/templates/` | BL-A7 | PIC | 1 | — | ⬜ |

**Sprint exit:** new dev reaches `docker compose up` → all green in ≤ 15 min ([STEPS.md](STEPS.md) validated).

### Sprint 0.2 (Nov 9 – 13) — "Walls & wiring"

| ID | Task | BL | Owner | Pts | Depends | Status |
|----|------|----|-------|-----|---------|--------|
| T-010 | Core models: users, orgs, memberships, projects (+RLS on all) | BL-B2 | BE | 3 | T-007 | ⬜ |
| T-011 | Auth stub: OIDC dev-mode (fake local IdP) + JWT issuance + refresh | BL-B1 | BE | 3 | T-010 | ⬜ |
| T-012 | Frontend auth screens consuming OIDC stub; org switcher skeleton | BL-B1/5 | FE | 3 | T-003/11 | ⬜ |
| T-013 | OpenAPI client generation wired into FE build (CI check drift) | BL-A6 | FE | 2 | T-006 | ⬜ |
| T-014 | Sandbox image v1: python-runner (pytest) pinned by digest | BL-F2 | DEVOPS | 2 | T-004 | ⬜ |
| T-015 | Celery skeleton: queues `gen/exec/analytics`, idempotency helper, dead-letter | BL-F1 | BE | 3 | T-006 | ⬜ |
| T-016 | Audit log service (append-only table + emit util) | BL-B4 | BE | 2 | T-010 | ⬜ |

### Sprint 0.3 (Nov 16 – 20) — "Quality gates everywhere"

| ID | Task | BL | Owner | Pts | Depends | Status |
|----|------|----|-------|-----|---------|--------|
| T-020 | Coverage gates wired (pytest --cov floor 80 backend, vitest 70 FE) | BL-A3 | DEVOPS | 2 | T-005 | ⬜ |
| T-021 | Migration-drift CI check (alembic upgrade → autogenerate diff empty) | BL-A3 | BE | 1 | T-007 | ⬜ |
| T-022 | Integration test harness: ephemeral pg + redis in CI container set | BL-A3 | BE | 2 | T-005 | ⬜ |
| T-023 | Sandbox smoke test: run sample pytest inside compose-exec runner; artifact to MinIO | BL-F3 | BE | 3 | T-014/15 | ⬜ |
| T-024 | Observability: traces from api+worker visible in Grafana; dashboard-as-code v1 | BL-A4 | DEVOPS | 2 | T-006/15 | ⬜ |
| T-025 | `scripts/bootstrap.sh` (or .ps1) implementing the full [STEPS.md](STEPS.md) pre-flight | — | DEVOPS | 1 | T-004 | ⬜ |

### Sprint 0.4 (Nov 23 – 27) — "M0 exit review"

| ID | Task | BL | Owner | Pts | Depends | Status |
|----|------|----|-------|-----|---------|--------|
| T-030 | M0 exit-criteria audit vs [MILESTONES.md](MILESTONES.md); write outcomes into [CONVERSATION.md](CONVERSATION.md) | — | PIC | 1 | all | ⬜ |
| T-031 | Load a trivial generated file end-to-end hand-mock (no AI): UI→API→queue→sandbox→result | BL-F1 | BE/FE | 3 | T-015/12 | ⬜ |
| T-032 | Docs pass: update all "state" tables across [ALL.md](ALL.md)/[PROJECT.md](PROJECT.md)/[FILES.md](FILES.md) to real status | — | PIC | 1 | T-030 | ⬜ |
| T-033 | Tag `v0.0.1-foundation` (internal) — first immutable checkpoint | — | DEVOPS | 1 | T-030 | ⬜ |

## M1 kickoff — Sprint 1.1 (Dec 7 – 11, 2026) — "Repo conversations"

| ID | Task | BL | Owner | Pts | Depends | Status |
|----|------|----|-------|-----|---------|--------|
| T-100 | GitHub App manifest + install flow + creds vault integration | BL-C1 | DEVOPS | 3 | M0 | ⬜ |
| T-101 | Webhook receiver (HMAC verify, dedupe, signature replay protection) | BL-C1 | BE | 2 | T-100 | ⬜ |
| T-102 | Repo sync worker: shallow clone (cached), changed-file diff computation | BL-C2 | BE | 3 | T-101 | ⬜ |
| T-103 | OpenAPI parser (3.0/3.1) + validation + mapped endpoint store | BL-C3 | BE | 3 | T-102 | ⬜ |
| T-104 | Embedding pipeline (pgvector HNSW, cosine; chunking by file/endpoint) | BL-C4 | AI | 3 | T-102 | ⬜ |
| T-105 | Secret/danger-pattern detector on fetched repo config surfaces | BL-C6 | BE | 2 | T-102 | ⬜ |

## Capacity note

Team assumption M0: 1 BE + 1 FE + 1 DEVOPS + AI-assist (≈30 pts/sprint total). If staffing differs, re-plan via the "adaptation" rule in [MILESTONES.md](MILESTONES.md) — scope cuts land in [BACKLOGS.md](BACKLOGS.md), time never stretches silently.

## Definition of Ready / Definition of Done (applies to every task)

- **Ready:** FR referenced; acceptance note testable; dependencies unblocked; ≤ 5-pt tasks have a verification label (per [REQUIREMENTS.md](REQUIREMENTS.md) V-x).
- **Done:** code merged with green CI; tests passing at new coverage level; docs section updated ([PRINCIPLES.md](PRINCIPLES.md) #9); observability attributes added ([SPECIFICATION.md](SPECIFICATION.md) §9); no TODOs without a task ID.
