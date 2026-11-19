# FILES.md — All files mentioned in this documentation

> The index. Every file this docs-set references, its purpose, and its status. Docs themselves are listed in §1; code/deploy paths that the docs promise are listed in §2. **Status legend:** ✅ exists · 🟨 planned (M0/M1 task IDs in [TASKS.md](TASKS.md)) · ⬜ not started.

---

## 1. Documentation set (this folder)

| File | One job | Anchor doc for… |
|------|---------|-----------------|
| [../README.md](../README.md) | entry point: what/why/stack/quick start | first contact |
| [ALL.md](ALL.md) | everything about the project, overview | orientation |
| [VISION.md](VISION.md) | where we're going; north stars; autonomy L0–L4 | strategy |
| [MILESTONES.md](MILESTONES.md) | milestones M0–M5 with exit criteria | planning horizon |
| [PRINCIPLES.md](PRINCIPLES.md) | ten design principles (conflict resolution) | judging decisions |
| [PROJECT.md](PROJECT.md) | canonical facts: stack, layout, risks, glossary | "what's the truth" |
| [REQUIREMENTS.md](REQUIREMENTS.md) | FR-1…FR-9, priorities, V-x verification | what to build |
| [SPECIFICATION.md](SPECIFICATION.md) | API contracts, data model, AI/execution specs | implementation detail |
| [ARCHITECTURE.md](ARCHITECTURE.md) | system context, containers, flows, seams | structure |
| [ROADMAP.md](ROADMAP.md) | quarter-by-quarter plan, now/next/later | when |
| [BACKLOGS.md](BACKLOGS.md) | every feature (epics A–K + icebox) | scope |
| [TASKS.md](TASKS.md) | sprint-level tasks (M0 + M1 kickoff) | execution |
| [STEPS.md](STEPS.md) | zero → production walkthrough | onboarding |
| [TESTING.md](TESTING.md) | test matrix, CI gates, AI evals | verification |
| [DEPLOYMENTS.md](DEPLOYMENTS.md) | pipeline, IaC, rollout best methods | shipping |
| [OPERATIONS.md](OPERATIONS.md) | runtime services, SLOs, runbooks, incidents | running it |
| [SECURITY.md](SECURITY.md) | policies, threat model, vuln reporting | safety |
| [PRIVACY.md](PRIVACY.md) | data handling, retention, subprocessors | data policy |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | symptom → cause → fix entries | debugging |
| [CONTRIBUTION.md](CONTRIBUTION.md) | dev workflow, PR checklist, style | contributing |
| [HUMAN.md](HUMAN.md) | human-side guidelines, review etiquette | collaboration |
| [DECISIONS.md](DECISIONS.md) | ADR-0001…ADR-0014 + proposed ADRs | why things are this way |
| [CONVERSATION.md](CONVERSATION.md) | design discussions, reviews, postmortem index | history |
| [CHANGELOG.md](CHANGELOG.md) | user-visible changes, Keep-a-Changelog | releases |

All 24 docs + README = the complete set requested at project start (see [CONVERSATION.md](CONVERSATION.md) 2026-10-30 entry).

## 2. Code & deploy paths referenced by the docs

### Backend (`../backend/`) — 🟨 M0

| Path (planned) | Purpose | Doc refs |
|----------------|---------|----------|
| `backend/app/main.py` | FastAPI app factory, `healthz`/`readyz` | STEPS §4, SPEC §2 |
| `backend/app/api/` | v1 routers (auth, orgs, projects, generations, runs…) | SPEC §2 |
| `backend/app/core/` | config, logging, security, telemetry, tenancy | ARCHITECTURE §6, ADR-0008 |
| `backend/app/models/` + `schemas/` | SQLAlchemy models / Pydantic contracts | SPEC §3 |
| `backend/app/services/` | domain logic (no cross-imports; compose via events) | ADR-0005, PRINCIPLES |
| `backend/app/ai/` | gateway, prompts, RAG, evals | SPEC §4, ADR-0007 |
| `backend/app/workers/` | Celery apps: queues `gen/exec/analytics` | TASKS T-015, SPEC §5 |
| `backend/migrations/` | Alembic, baseline + RLS policies | STEPS §4, DEPLOY §6 |
| `backend/tests/{unit,integration,contract,smoke_compose,perf}/` | test layers | TESTING §2 |
| `backend/tests/tenancy/` | adversarial cross-org suite | SECURITY §2, TESTING §2 |
| `backend/tests/perf/` | k6 load scripts | TESTING §6 |
| `backend/pyproject.toml` | deps + ruff/mypy config | CONTRIBUTION §5 |

### Frontend (`../frontend/`) — 🟨 M0

| Path | Purpose | Doc refs |
|------|---------|----------|
| `frontend/src/features/` | projects, generations, review, runs, analytics | PROJECT §structure |
| `frontend/src/api/generated/` | OpenAPI client (never hand-edit) | TROUBLESHOOTING §7 |
| `frontend/src/api/realtime.ts` | WebSocket live run view | TROUBLESHOOTING §7 |
| `frontend/vite.config.ts` | dev proxy → api:8000 | TROUBLESHOOTING §3 |
| `frontend/package.json` | scripts incl. `api:gen` | CONTRIBUTION §4 |

### Deploy (`../deploy/`) — 🟨 M0/M4

| Path | Purpose | Doc refs |
|------|---------|----------|
| `deploy/compose/docker-compose.yml` (+ overrides) | full local stack | STEPS §3, TROUBLESHOOTING §1 |
| `deploy/images/runner-py.Dockerfile` / `runner-pw.Dockerfile` | sandbox images (pinned digests) | SPEC §5, ADR-0006 |
| `deploy/helm/charts/aitp/` + `overlays/{staging,prod}/` | prod runtime | DEPLOY §4, STEPS §8 |
| `deploy/terraform/modules/` + `stacks/` | cloud foundation | DEPLOY §4, ADR-0012 |
| `deploy/grafana/` | dashboards/alerts as code | OPERATIONS §4, ADR-0014 |

### Repo root & meta — 🟨 M0

| Path | Purpose | Doc refs |
|------|---------|----------|
| `.env.example` | all config keys documented | STEPS §2 |
| `.github/workflows/` | CI gates (lint/type/test/scan/migrate) | TESTING §3, ADR-0013 |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR checklist mirror | CONTRIBUTION §4 |
| `docs/templates/postmortem.md` | postmortem template | OPERATIONS §6, TASKS T-008 |
| `docs/templates/adr.md`, `docs/templates/review-record.md` | doc templates | TASKS T-008 |
| `docs/runbooks/runbook-*.md` (7 runbooks) | operational runbooks | OPERATIONS §8 |
| `scripts/bootstrap.sh` | scripted [STEPS.md](STEPS.md) pre-flight | TASKS T-025 |
| `CODEOWNERS`, `LICENSE` (Apache-2.0), `CONTRIBUTORS.md` | governance | PROJECT §identity, CONTRIBUTION §9 |

### Files referenced but explicitly **not** in this repo

| Path | Why |
|------|-----|
| `.env` | gitignored, machine-local (secrets never committed) |
| Customer repo content, `.aitp.md` per customer | lives in customer repos / ephemeral worker storage ([PRIVACY.md](PRIVACY.md) §3) |
| Run artifacts (`runs/{run_id}/…`) | object storage, signed URLs only ([SPECIFICATION.md](SPECIFICATION.md) §5) |
| Compliance evidence workspace | private, outside this repo ([SECURITY.md](SECURITY.md) §8) |

## 3. Housekeeping

- This file is regenerated/verified as part of M0 exit task **T-032** ([TASKS.md](TASKS.md)); any new doc added to `docs/` must get a row here in the same PR.
- Filename note: the earlier case-variant stub `Files.md` (a raw list of the 24 requested docs) was consolidated into this index on 2026-11-14 — Windows treats `FILES.md` and `Files.md` as the same file, so only this index remains.
- Other code in this repository outside the paths above (e.g., work-in-progress app code in `backend/` and `frontend/`) is tracked in git, not in this index; add a row here only when a doc references it.
