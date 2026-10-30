# ARCHITECTURE.md — Architecture of the project

> How AITP is structured and why. Decisions behind every major choice live in [DECISIONS.md](DECISIONS.md); exact contracts in [SPECIFICATION.md](SPECIFICATION.md).

---

## 1. System context (C4 — Level 1)

```
                    ┌──────────────────┐
                    │   Engineers      │  (web dashboard, PR reviews)
                    └────────┬─────────┘
                             │ HTTPS
┌──────────────┐    ┌────────▼─────────────────────┐    ┌─────────────────┐
│  GitHub /    │────▶│      AITP Platform           │◀───│  LLM Providers  │
│  GitLab repos│◀───│  (API + Workers + Runners)   │    │ (OpenAI/Anthropic/│
└──────────────┘PRs └────┬───────────┬───────────┘    │  self-hosted)   │
                         │           │                └─────────────────┘
                 ┌───────▼───┐   ┌───▼─────────┐
                 │ Target    │   │ CI (Actions)│
                 │ test app  │   └─────────────┘
                 └───────────┘
```

**Actors & dependencies:** humans (review, configure), VCS platforms (ingest changes, propose PRs), LLM providers (generation/healing), the customer's own app (the thing being tested), CI (runs AITP steps).

## 2. Containers (C4 — Level 2)

```
                         ┌──────────────────────────────────────────────┐
                         │                  Kubernetes                  │
  Browser ──HTTPS──▶ ┌───┴────┐   ┌──────────────┐   ┌────────────────┐   │
                     │Frontend│──▶│   API (FastAPI)  │──▶│ Redis ──▶ Celery Workers │
                     │ React  │   │  + AuthN/Z       │        │            │   │
                     └────────┘   └──────┬───────┘   ┌────▼──────────┐ │   │
                                         │           │ Execution     │ │   │
                                         │           │ Orchestrator  │ │   │
                                         │           └────┬──────────┘ │   │
                                         │                ▼            │   │
                                         │      ┌──────────────────┐   │   │
                                         │      │ Runner Sandbox   │   │   │
                                         │      │ (Docker, ephemeral:│ │   │
                                         │      │ Playwright/pytest)│ │   │
                                         │      └──────────────────┘   │   │
                                         └──────────┬──────────────────┘   │
                                                    │                      │
                                     ┌──────────────▼───────────┐          │
                                     │ PostgreSQL 16 + pgvector │          │
                                     │ S3-compatible storage    │          │
                                     └──────────────────────────┘          │
                                                                           │
      Webhooks (repo events) ──▶ API  ·  AI Gateway ──▶ external LLM APIs   │
```

| Container | Tech | Responsibility | Scales |
|-----------|------|----------------|--------|
| **Frontend** | React 18 + Vite ([ADR-002](DECISIONS.md#adr-002)) | Dashboard, review flows, analytics | HPA by CPU/RPS |
| **API** | FastAPI ([ADR-001](DECISIONS.md#adr-001)) | REST v1, authn/z, tenancy, orchestration entrypoints | HPA by latency |
| **Ingestion** (module of API) | — | Repo/sync, OpenAPI parse, changed-file indexing → vector store | with API |
| **AI Gateway** (module of workers) | provider-agnostic ([ADR-007](DECISIONS.md#adr-007)) | Prompt assembly, RAG retrieval, budgets, caching, retries, evals | queue depth |
| **Execution Orchestrator** (Celery) | [ADR-004](DECISIONS.md#adr-004) | Build/run lifecycle of sandboxes, result collection | queue depth |
| **Runner sandboxes** | Docker/Playwright ([ADR-006](DECISIONS.md#adr-006)) | Isolated test execution, traces/logs/screenshots | pod autoscale |
| **PostgreSQL + pgvector** | [ADR-003](DECISIONS.md#adr-003) | Tenants, projects, runs, results, embeddings | vertical + read replicas (M5) |
| **Object storage** | S3/MinIO ([ADR-011](DECISIONS.md#adr-011)) | Artifacts: traces, videos, screenshots, generated files | infinite |
| **Redis** | broker + cache + locks | Celery transport, idempotency keys, rate limiting | sharded (M5) |

## 3. Core components & responsibilities

| Component | In | Owns | Never does |
|-----------|-----|------|-----------|
| Ingestion | backend `services/` | Repo indexing, change detection, spec parsing | Executes anything |
| AI Generator | backend `ai/` | Test-case synthesis, static validation, self-critique | Merging, rewriting user code |
| Execution Engine | backend `workers/` | Sandbox lifecycle, retries, timeouts, artifacts | AI decisions |
| Self-Healing | backend `ai/` + `services/` | Breakage classification, fix proposals, audit trail | Auto-applying (until L3, opt-in) |
| Analytics/Risk | backend `services/` | Coverage maps, flake scores, risk selection | Deletions |
| Dashboard | frontend | Review UX, reporting, RBAC UI | Direct DB access (API only) |

## 4. Key flows

### 4.1 Generation (the heart)

1. `push`/`pr` webhook or manual trigger → API validates tenancy → job enqueued.
2. **Ingestion** diffs the change; parses OpenAPI/user story context; upserts embeddings into pgvector.
3. **AI Generator** RAG-retrieves relevant context (existing tests, conventions, fixtures) → *plan* (what to test, risk) → *generate* (test code) → *static-validate* (ast/syntax, imports resolve, schema-valid requests) → *self-critique* (reject sleep-prays, brittle selectors) with token budget per stage ([PRINCIPLES.md](PRINCIPLES.md) #8).
4. Output is a **Proposal** (dashboard draft) or **PR** with bot comments — human gate mandatory ([PRINCIPLES.md](PRINCIPLES.md) #1).
5. Fast-path: cheap small model for completeness checks; big model only for hard cases.

### 4.2 Execution

Celery picks up run → provisions ephemeral sandbox (pinned image, non-root, network policy, per-tenant resource caps) → injects only needed secrets (short-TTL) → runs suite (pytest/Playwright) → streams live status via WebSocket → writes results + artifacts (OTel-traced span per test) → updates analytics indexes → notifications.

### 4.3 Self-healing

Failure artifacts → **breakage classifier** {selector-drift | assertion-drift | app-bug | flake} → RAG over test history for intent → minimal-diff fix proposal with explanation → **human approval** → commit (with revert hint) → precision timestamped for [autonomy gating](VISION.md#evolution-of-autonomy).

## 5. Cross-cutting architecture

- **Tenancy & isolation:** every table keyed by `org_id`; Postgres **RLS** enforced at the session layer ([ADR-008](DECISIONS.md#adr-008)); sandboxes never share networks; object storage prefixes per tenant.
- **Auth:** OIDC → short-lived JWTs; GitHub App tokens are per-install, least-scope ([ADR-009](DECISIONS.md#adr-009), [ADR-010](DECISIONS.md#adr-010), [SECURITY.md](SECURITY.md)).
- **Observability:** OpenTelemetry everywhere ([ADR-014](DECISIONS.md#adr-014)); correlation ID follows webhook → generation → run → artifacts; dashboards defined as code.
- **Reliability:** all jobs idempotent (dedupe keys), at-least-once with result de-dup, dead-letter queues, per-tenant rate limits and token budgets.
- **Failure posture:** AI/generation is *additive* — if down, repo CI and existing tests are unaffected. Cooldowns degrade gracefully: skip healing proposals, keep executing.

## 6. Architectural seams (designed, not built yet — [ADR-005](DECISIONS.md#adr-005))

The monolith has hard module boundaries so extraction later is cheap:

```
app/
├── api/          → saw them first; thin controllers only
├── services/     → domain logic; may not import each other (compose via events)
├── ai/           → swappable: gateway interface, so OpenAI↔vLLM is config
├── workers/      → owns orchestration; talks to services via the same functions API reads
└── core/         → config, db, security, telemetry — no domain deps
```

Extraction candidates (in order): execution orchestrator → runner pool service → generation service.

## 7. What we explicitly avoid

- Microservices at M0–M3 (see [ADR-005](DECISIONS.md#adr-005)).
- Cross-service in-process imports between `services/*` (event seams instead).
- Shared sandbox VMs (tenancy bleed — [SECURITY.md](SECURITY.md)).
- Any stateful data in containers (only Postgres, Redis, object store are durable).
- Determinism-critical paths touching an LLM (see [PRINCIPLES.md](PRINCIPLES.md) #3).

---

*Related: [SPECIFICATION.md](SPECIFICATION.md) (contracts, data model) · [OPERATIONS.md](OPERATIONS.md) (runtime/SLOs) · [STEPS.md](STEPS.md) (build it locally)*
