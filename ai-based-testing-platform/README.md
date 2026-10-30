# AI-Based Testing Platform (AITP)

> Turn code, specs, and user stories into **executable, self-maintaining tests** — powered by AI, approved by humans.

AITP is a platform that automatically generates, runs, heals, and analyzes software tests (unit, API, and end-to-end) for engineering teams. It connects to your repository and CI, understands your changes, produces reviewable test code, and keeps it green over time.

**Status:** pre-alpha (documentation & foundation) · **Version:** `0.1.0-dev` · **License:** Apache-2.0

---

## Why AITP?

- **Coverage in minutes, not sprints** — AI drafts tests from your diffs, OpenAPI specs, and user stories.
- **Self-healing tests** — broken selectors and flaky assertions are detected and proposed as fixes, never silently rewritten.
- **Risk-based execution** — run only what matters for each change, cutting CI feedback time.
- **Human-in-the-loop by design** — AI proposes; engineers approve. Full audit trail on every change.

## How it works

```
Repo / Spec / Story  ──▶  Ingestion  ──▶  AI Test Generator  ──▶  Review (human)
                                                         │
        Dashboard  ◀──  Analytics & Reporting  ◀──  Execution Engine (Playwright/PyTest/Jest)
                                      ▲                        │
                                      └──  Self-Healing ◀──────┘
```

## Tech stack

| Layer      | Technology |
|------------|------------|
| Backend    | Python 3.12, FastAPI, SQLAlchemy, Alembic, Celery, Redis |
| AI         | Provider-agnostic LLM layer (OpenAI / Anthropic / self-hosted vLLM), RAG with pgvector |
| Data       | PostgreSQL 16 (+ pgvector), Redis, S3-compatible object storage |
| Execution  | Docker sandboxes, Playwright, ephemeral runners (Kubernetes in prod) |
| Frontend   | React 18, TypeScript, Vite, TanStack Query, Tailwind CSS |
| Infra      | Docker Compose (dev), Terraform + Kubernetes (prod), GitHub Actions |
| Observability | OpenTelemetry, Prometheus, Grafana, Loki, Sentry |

## Repository layout

```
ai-based-testing-platform/
├── backend/     # FastAPI app, AI pipeline, workers, execution engine
├── frontend/    # React dashboard
├── docs/        # All project documentation (this is the source of truth)
├── deploy/      # Docker Compose, Helm charts, Terraform modules
└── .github/     # CI workflows, PR/issue templates
```

## Documentation

Start here — every document has one job:

| Doc | What it answers |
|-----|-----------------|
| [docs/ALL.md](docs/ALL.md) | Everything about the project in one place |
| [docs/VISION.md](docs/VISION.md) / [docs/MILESTONES.md](docs/MILESTONES.md) | Where we're going |
| [docs/PROJECT.md](docs/PROJECT.md) / [docs/PRINCIPLES.md](docs/PRINCIPLES.md) | What governs the project |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) / [docs/SPECIFICATION.md](docs/SPECIFICATION.md) | How it is built |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) / [docs/ROADMAP.md](docs/ROADMAP.md) / [docs/BACKLOGS.md](docs/BACKLOGS.md) / [docs/TASKS.md](docs/TASKS.md) | What to build, in what order |
| [docs/STEPS.md](docs/STEPS.md) / [docs/DEPLOYMENTS.md](docs/DEPLOYMENTS.md) | Zero to production |
| [docs/TESTING.md](docs/TESTING.md) / [docs/SECURITY.md](docs/SECURITY.md) / [docs/PRIVACY.md](docs/PRIVACY.md) | How we keep it correct and safe |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) / [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Running it day-to-day |
| [docs/CONTRIBUTION.md](docs/CONTRIBUTION.md) / [docs/HUMAN.md](docs/HUMAN.md) | Working with other humans |
| [docs/DECISIONS.md](docs/DECISIONS.md) / [docs/CONVERSATION.md](docs/CONVERSATION.md) / [docs/CHANGELOG.md](docs/CHANGELOG.md) / [docs/FILES.md](docs/FILES.md) | Why things are the way they are |

## Quick start (once the code lands)

```bash
git clone <repo-url> && cd ai-based-testing-platform
cp .env.example .env            # fill in LLM API key + DB URL
docker compose up -d db redis   # PostgreSQL + Redis
cd backend && pip install -e ".[dev]" && alembic upgrade head
uvicorn app.main:app --reload   # API on http://localhost:8000
cd ../frontend && npm install && npm run dev   # Dashboard on http://localhost:5173
```

Full walkthrough: [docs/STEPS.md](docs/STEPS.md). Troubles? [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Contributing

Read [docs/CONTRIBUTION.md](docs/CONTRIBUTION.md) and [docs/HUMAN.md](docs/HUMAN.md) before your first PR.
Security issues: see [docs/SECURITY.md](docs/SECURITY.md) — **do not open a public issue**.
