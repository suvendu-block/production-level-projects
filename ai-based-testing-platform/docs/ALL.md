# ALL.md — Everything about AITP

> The one overview document. New here? Read this top to bottom (≈8 minutes), then follow the links.

---

## 1. What it is

**AITP (AI-Based Testing Platform)** is a platform that uses AI to **generate, execute, self-heal, and analyze** software tests. Engineers connect a repository (or an OpenAPI spec, or a running app URL); AITP produces reviewable test code, runs it in isolated sandboxes, keeps it passing as the product evolves, and reports what is risky, flaky, or untested.

**It is not** a test-recording browser plugin, a load-testing tool, or a replacement for engineering judgment. AITP drafts; humans approve.

## 2. The problem

- Teams ship faster than they write tests. Coverage decays with every sprint.
- Existing E2E suites are brittle: one renamed button, ten broken tests.
- Flaky tests erode trust until nobody believes a red build.
- Writing tests is low-status work, so it is deprioritized — until production incidents.

## 3. The solution, in five capabilities

| # | Capability | What it does |
|---|-----------|--------------|
| 1 | **AI Test Generator** | Turns diffs, OpenAPI specs, and user stories into unit/API/E2E test cases as real, committable code. |
| 2 | **Execution Engine** | Runs tests in ephemeral, isolated containers (Playwright, pytest, Jest) with full logs, traces, and screenshots. |
| 3 | **Self-Healing** | Detects broken selectors and flaky assertions, proposes minimal diffs, requires human approval before applying. |
| 4 | **Visual Regression** | Screenshot diffing with perceptual hashing; AI triages meaningful changes vs. noise. |
| 5 | **Analytics & Risk** | Coverage maps, flakiness scores, risk-based test selection per change. |

## 4. Who it is for

- **Primary:** backend/full-stack engineers and QA engineers at teams shipping web apps with CI.
- **Secondary:** engineering managers who need coverage and reliability visibility.
- **Not (yet) for:** mobile-native, embedded, or hardware-in-the-loop testing.

## 5. How it works (one paragraph)

AITP ingests context (repo structure, changed files, API contracts, prior tests) through the **Ingestion Service**, retrieves relevant knowledge with **pgvector RAG**, and drives a **provider-agnostic LLM pipeline** (plan → generate → statically validate → self-critique) to produce tests. Generated tests are proposed as pull requests or dashboard review items — never auto-merged. Approved tests run in the **Execution Engine**: ephemeral Docker sandboxes orchestrated by Celery workers, with results, traces, and coverage written back to **PostgreSQL** and object storage. Failures flow to **Self-Healing**, which may propose a fix; the **Dashboard** presents everything with a full audit trail.

## 6. What exists today

| Area | State |
|------|-------|
| Documentation | ✅ Complete baseline (this `docs/` folder) |
| Backend | ⬜ Not started — see [TASKS.md](TASKS.md) M0/M1 |
| Frontend | ⬜ Not started — see [TASKS.md](TASKS.md) M0/M1 |
| CI/CD & infra | ⬜ Not started — see [DEPLOYMENTS.md](DEPLOYMENTS.md) |
| Releases | None yet — first tag `v0.1.0` planned with M1 |

Current milestone: **M0 Foundation** — see [MILESTONES.md](MILESTONES.md) and [ROADMAP.md](ROADMAP.md).

## 7. Tech stack (canonical)

Python 3.12 · FastAPI · SQLAlchemy/Alembic · Celery + Redis · PostgreSQL 16 (+ pgvector) · S3-compatible storage · Docker + Playwright · Provider-agnostic LLM layer · React 18 + TypeScript + Vite · Tailwind + shadcn/ui · Terraform + Kubernetes (prod) · GitHub Actions · OpenTelemetry. Rationale for every choice: [DECISIONS.md](DECISIONS.md).

## 8. Constraints we accept

1. **AI output is untrusted input** — it is parsed, linted, sandboxed, and human-approved before execution.
2. **Customer code never trains models** — see [PRIVACY.md](PRIVACY.md).
3. **Cost awareness** — every generation job has a token budget; caching is mandatory.
4. **Determinism where it counts** — the execution engine and reporting are fully deterministic; only generation is probabilistic (and is eval-gated, see [TESTING.md](TESTING.md)).

## 9. The docs, grouped

| Group | Documents |
|-------|-----------|
| Direction | [VISION](VISION.md), [MILESTONES](MILESTONES.md), [PRINCIPLES](PRINCIPLES.md) |
| Definition | [PROJECT](PROJECT.md), [REQUIREMENTS](REQUIREMENTS.md), [SPECIFICATION](SPECIFICATION.md), [ARCHITECTURE](ARCHITECTURE.md) |
| Planning | [ROADMAP](ROADMAP.md), [BACKLOGS](BACKLOGS.md), [TASKS](TASKS.md), [STEPS](STEPS.md) |
| Quality & safety | [TESTING](TESTING.md), [SECURITY](SECURITY.md), [PRIVACY](PRIVACY.md), [TROUBLESHOOTING](TROUBLESHOOTING.md) |
| Running it | [OPERATIONS](OPERATIONS.md), [DEPLOYMENTS](DEPLOYMENTS.md) |
| People & history | [CONTRIBUTION](CONTRIBUTION.md), [HUMAN](HUMAN.md), [DECISIONS](DECISIONS.md), [CONVERSATION](CONVERSATION.md), [CHANGELOG](CHANGELOG.md), [FILES](FILES.md) |

## 10. One-sentence pitch

> AITP is the QA engineer that never sleeps: it writes the tests you didn't have time for, keeps them passing as your product changes, and always asks before it touches your code.
