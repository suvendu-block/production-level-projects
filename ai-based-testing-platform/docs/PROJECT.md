# PROJECT.md — All details about the project

> Canonical facts about AITP. If a doc and this file disagree on a fact, this file wins — then fix the doc.

---

## Identity

| Field | Value |
|-------|-------|
| Name | **AITP** — AI-Based Testing Platform |
| Repository | `ai-based-testing-platform` |
| Type | Product / platform (B2B developer tool) |
| License | Apache-2.0 |
| Versioning | [SemVer](https://semver.org); changelog in [CHANGELOG.md](CHANGELOG.md) |
| Current version | `0.1.0-dev` (documentation & foundation) |
| First public release | `v0.1.0` planned with M1 beta ([MILESTONES.md](MILESTONES.md)) |
| Governance | Maintainer model — see [CONTRIBUTION.md](CONTRIBUTION.md) |
| Code of conduct | Contributor Covenant 2.1 (enforced in all AITP spaces) |

## One-liner

> Turn code, specs, and user stories into executable, self-maintaining tests — powered by AI, approved by humans.

## Problem / solution

See [ALL.md](ALL.md) §1–3. Short version: teams ship faster than they test; AITP authors and maintains the tests, humans approve them.

## Canonical tech stack

| Layer | Choice | ADR |
|-------|--------|-----|
| Backend language/framework | Python 3.12 + FastAPI | [ADR-001](DECISIONS.md#adr-001) |
| Async jobs | Celery + Redis | [ADR-004](DECISIONS.md#adr-004) |
| Database | PostgreSQL 16 | [ADR-003](DECISIONS.md#adr-003) |
| Vector search | pgvector (same cluster) | [ADR-003](DECISIONS.md#adr-003) |
| Object storage | S3-compatible (MinIO dev, S3/GCS prod) | [ADR-011](DECISIONS.md#adr-011) |
| Test execution | Docker sandboxes; Playwright, pytest, Jest | [ADR-006](DECISIONS.md#adr-006) |
| AI layer | Provider-agnostic LLM gateway (OpenAI/Anthropic/self-hosted) | [ADR-007](DECISIONS.md#adr-007) |
| Frontend | React 18 + TypeScript + Vite, TanStack Query, Tailwind, shadcn/ui | [ADR-002](DECISIONS.md#adr-002) |
| Auth | OIDC (Auth0/Keycloak/Clerk — pick at M4) + short-lived JWT | [ADR-009](DECISIONS.md#adr-009) |
| Repo integration | GitHub App first (GitLab/Bitbucket later) | [ADR-010](DECISIONS.md#adr-010) |
| Architecture style | Modular monolith, service-ready seams | [ADR-005](DECISIONS.md#adr-005) |
| Infra | Docker Compose (dev) → Terraform + Kubernetes (prod) | [ADR-012](DECISIONS.md#adr-012) |
| CI/CD | GitHub Actions, trunk-based, Conventional Commits | [ADR-013](DECISIONS.md#adr-013) |
| Observability | OpenTelemetry → Prometheus/Grafana/Loki, Sentry | [ADR-014](DECISIONS.md#adr-014) |

Full technical detail: [SPECIFICATION.md](SPECIFICATION.md).

## Repository structure

```
ai-based-testing-platform/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers (v1)
│   │   ├── core/           # config, logging, security, telemetry
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic contracts
│   │   ├── services/       # domain logic (generation, healing, analytics…)
│   │   ├── ai/             # LLM gateway, prompts, RAG, evaluation
│   │   └── workers/        # Celery apps & tasks
│   ├── migrations/         # Alembic
│   ├── tests/              # unit / integration / e2e
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── features/       # projects, runs, review, analytics…
│   │   ├── components/     # shared UI
│   │   ├── api/            # generated OpenAPI client + query hooks
│   │   └── routes/
│   └── package.json
├── deploy/
│   ├── compose/            # docker-compose.yml (+ overrides)
│   ├── helm/               # Kubernetes charts
│   └── terraform/          # modules: network, cluster, db, storage
├── docs/                   # this documentation set (source of truth)
├── scripts/                # dev bootstrap, migration, release helpers
└── .github/                # workflows, templates
```

## Environments

| Env | Purpose | URL pattern | Data |
|-----|---------|-------------|------|
| local | developer machine | `localhost` | synthetic + opt-in real repos |
| staging | pre-prod verification | `staging.aitp.example` | scrubbed copies |
| production | customers | `app.aitp.example` | real, [PRIVACY.md](PRIVACY.md) rules |

Details: [DEPLOYMENTS.md](DEPLOYMENTS.md), [OPERATIONS.md](OPERATIONS.md).

## Integrations (planned order)

1. **GitHub** (M1) — App: webhooks, PR comments, checks.
2. **CI providers** (M2) — GitHub Actions native step.
3. **Slack** (M3) — digests, approval nudges.
4. **GitLab, Bitbucket, Azure DevOps** (M5).
5. **Issue/PM tools** (M5) — Jira, Linear.

## Commercial model (indicative)

- **Free tier:** 1 repo, 200 AI generations/month, community support.
- **Team:** usage-based generations + runner minutes.
- **Enterprise:** SSO/RBAC, audit export, data residency, self-hosted runners, support SLA.
- Cost guardrails per tenant are mandatory from M4 ([PRINCIPLES.md](PRINCIPLES.md) #9).

## Top risks

| Risk | Mitigation |
|------|-----------|
| Generated tests are low quality → churn | Eval harness + golden datasets gate every prompt/model change ([TESTING.md](TESTING.md)) |
| Self-healing masks real bugs | Human approval (L2) before any auto class (L3); audit + revert |
| LLM cost exceeds value | Token budgets, caching, small-model fast paths, per-tenant cost guards |
| Flaky execution erodes trust | Deterministic sandboxes, flake engine, quarantine automation (M2) |
| Security incident (repo access) | Least-privilege GitHub App, secret scanning, threat model per [SECURITY.md](SECURITY.md) |

## Glossary

| Term | Meaning |
|------|---------|
| **Generation run** | One AI invocation set producing tests for a scope (endpoint, file, story). |
| **Proposal** | Generated tests awaiting human review (dashboard or PR). |
| **Heal** | AI-suggested fix for a broken/flaky test. |
| **Risk score** | Per-change priority estimate used for test selection. |
| **Runner** | Ephemeral sandbox executing a test suite. |
| **Autonomy level** | L0–L4 scale of AI freedom ([VISION.md](VISION.md)). |
| **Golden dataset** | Curated corpus used to score generation quality. |

## Related docs

[REQUIREMENTS.md](REQUIREMENTS.md) (what) · [SPECIFICATION.md](SPECIFICATION.md) (how, precisely) · [ARCHITECTURE.md](ARCHITECTURE.md) (structure) · [DECISIONS.md](DECISIONS.md) (why) · [FILES.md](FILES.md) (index of everything)
