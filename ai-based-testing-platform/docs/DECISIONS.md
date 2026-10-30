# DECISIONS.md — Architecture decision records

> Why things are the way they are. Format: lightweight ADR (context → decision → consequences → alternatives). Statuses: **accepted** / **proposed** / **superseded**.
> Rules: decisions are additive — never renumbered; superseding creates a new ADR and marks the old one; every accepted ADR links the meeting/PR in [CONVERSATION.md](CONVERSATION.md).

---

## ADR-0001 — Python 3.12 + FastAPI for the backend {#adr-001}

**Status:** accepted (2026-10-29) · **Scope:** M0–∞

**Context:** AI-heavy service; team strength; ecosystem of ML tooling; speed of iteration.

**Decision:** Python 3.12, FastAPI + Pydantic v2, SQLAlchemy 2.0, uvicorn.

**Consequences:** first-class AI library support; typing via mypy strict; async-friendly; hot paths (ingestion, vector math) must avoid Python GIL traps — moving heavy compute to workers/polyglot tools if needed.

**Alternatives:** Node/TypeScript (single language everywhere, but weaker AI tooling); Go (faster runtime, slower iteration, smaller LLM ecstosyem); Java/Kotlin (enterprise polish, team mismatch).

## ADR-0002 — React 18 + TypeScript + Vite for the dashboard {#adr-002}

**Status:** accepted (2026-10-29)

**Decision:** React + Vite + TanStack Query + Tailwind + shadcn/ui; OpenAPI-generated client.

**Consequences:** hiring-friendly; typed API contract from [SPECIFICATION.md](SPECIFICATION.md); SSR not needed for a tool behind auth — if SEO ever matters (docs/marketing), that gets a separate static site.

**Alternatives:** Next.js (SSR we don't need, heavier); Vue (fine but smaller team overlap); SvelteKit (younger ecosystem).

## ADR-0003 — PostgreSQL 16 (+pgvector) as the primary & vector store {#adr-003}

**Status:** accepted (2026-10-29)

**Context:** Need relational integrity (tenants, runs, results) and vector retrieval (RAG) without operating a second stateful system.

**Decision:** single Postgres cluster; pgvector (HNSW) for embeddings.

**Consequences:** transactional consistency across metadata + vectors; simpler ops/backup; scale ceiling exists (~10M vectors fine; beyond → dedicated ANN service, revisit in M5). Distance-type locked per implementation (cosine).

**Alternatives:** dedicated vector DB (Pinecone/weaviate/qdrant) — extra moving part; Elasticsearch (more ops for moderate benefit).

## ADR-0004 — Celery + Redis for async orchestration {#adr-004}

**Status:** accepted (2026-10-29)

**Decision:** Celery workers (queues: `gen`, `exec`, `analytics`), Redis as broker/cache/locks; idempotent tasks with dedupe keys.

**Consequences:** battle-tested; visibility tooling exists (flower-lite); Redis Sentinel from M4; long-running generation split into checkpointed sub-tasks ( perseveres across worker restarts).

**Alternatives:** Temporal (superior workflow guarantees, more ops surface now); asyncio-in-process (no durability); Sidekiq-alikes (not Python).

## ADR-0005 — Modular monolith first; microservices only at natural seams {#adr-005}

**Status:** accepted (2026-10-29)

**Decision:** one FastAPI app + workers, hard module boundaries (`api/`, `services/`, `ai/`, `workers/`, `core/`), no cross-service imports; extraction only of: execution orchestrator → runner-pool service → generation service, and only when load or team scale demands.

**Consequences:** fastest iteration at small team; cheap deploy/dev; risk = boundary erosion — mitigated by import-linter CI rule (enforced M0).

**Alternatives:** microservices from day 1 (distributed-monolith trap for a 1–5 person team); pure single-file pyramid (no seams).

## ADR-0006 — Ephemeral Docker sandboxes; Playwright for E2E {#adr-006}

**Status:** accepted (2026-10-29)

**Decision:** every test run executes in a fresh container from pinned digest images; E2E = Playwright; unit/API = pytest (+TestClient).

**Consequences:** reproducible runs, deterministic注定 flake attribution; cold-start cost managed by warm pool at M4; Playwright chosen for built-in trace/video and a11y-tree selectors (self-healing friendly).

**Alternatives:** Selenium grid (legacy selector pain); long-lived runner VMs (cross-contamination risk); browser-in-API-pod (tenancy bleed).

## ADR-0007 — Provider-agnostic AI gateway; small-model fast paths {#adr-007}

**Status:** accepted (2026-10-29)

**Decision:** all model calls go through an internal `ai/gateway` interface; providers (OpenAI, Anthropic, self-hosted vLLM) behind adapters; central zero-retention policy; per-stage model routing (cheap model for plan/critique-lite, strong model for generation); every prompt set content-addressed + recorded.

**Consequences:** vendor failover is config; costs visible per run; eval gates stay provider-neutral ([TESTING.md](TESTING.md) §5); self-host path (privacy-sensitive orgs) exists without redesign.

**Alternatives:** vendor SDK directly (lock-in, no failover); local-only models (quality gap); multi-vendor spaghetti per prompt (client chaos).

## ADR-0008 — Multi-tenancy: org-keyed RLS from day one {#adr-008}

**Status:** accepted (2026-10-29)

**Decision:** every tenant table carries `org_id`; Postgres **Row-Level Security** enforced with session `SET LOCAL app.org_id` from the JWT claim; sandbox/storage/queue isolation mirrors this key.

**Consequences:** defense-in-depth (application code can't leak what DB refuses); slight query-penalty accepted; single-tenant mode = dedicated customer DB later without model changes.

**Alternatives:** app-layer filtering only (one WHERE bug = breach); schema-per-tenant (migration hell); sharding by tenant before needed (over-engineering).

## ADR-0009 — OIDC-first identity; short-lived JWTs {#adr-009}

**Status:** accepted (2026-10-29)

**Decision:** OIDC federation (Google/GitLab/GitHub + enterprise SAML/OIDC later); AITP issues 15-min access tokens + rotating refresh; service tokens for CI steps.

**Consequences:** no password storage; enterprise-SO买家 ready by M4 with provider swap only; revocation is refresh-rotation + denylist.

**Alternatives:** local accounts+magic links (slower enterprise adoption); sessions-in-cookies-only (headless/CI friction).

## ADR-0010 — GitHub-first integration via official GitHub App {#adr-0010}

**Status:** accepted (2026-10-29)

**Decision:** GitHub as the first-class provider using a **GitHub App** (not PATs): scoped installation per repo, webhook secret per install, PR comments + check runs.

**Consequences:** least-privilege by design ([PRINCIPLES.md](PRINCIPLES.md) #6); no user-token expiry headaches; GitLab/Bitbucket/Azure follow after M4 with the same abstraction seam.

**Alternatives:** webhook-only integration (missing check-runs UX); deploy-keys (no PR surface).

## ADR-0011 — S3-compatible object storage for artifacts {#adr-011}

**Status:** accepted (2026-10-29)

**Decision:** MinIO locally, S3 (or GCS) managed in prod; single signed-URL'retrieval pattern; versioning on.

**Consequences:** cheap, durable traces/videos/screenshots; lifecycle rules encode [PRIVACY.md](PRIVACY.md) retention; signed URLs keep bandwidth off the API.

**Alternatives:** DB BLOB (bloat + slow); filesystem onNode (fails multi-pod).

## ADR-0012 — Terraform + Kubernetes for prod; docker compose for dev {#adr-012}

**Status:** accepted (2026-10-30)

**Decision:** dev = `docker compose` (parity-first), prod = Kubernetes with Helm; Terraform for cloud foundation (network, DB, buckets, cluster).

**Consequences:** one runtime semantics (containers) dev→prod; early K8s burden accepted in exchange for realistic sandbox-pool resource management; self-host customers can run the Helm chart.

**Alternatives:** ECS/Fargate (OK, but k8s ecosystem fit for sandbox autoscale is better); VMs + docker-compose in prod (no autoscale discipline).

## ADR-0013 — Trunk-based development; Conventional Commits; semver releases {#adr-013}

**Status:** accepted (2026-10-30)

**Decision:** short-lived branches (`feat/…`, `fix/…`) with ≥1 approval; conventional commit messages; changelogs generated into [CHANGELOG.md](CHANGELOG.md); semver for backend/frontend/worker images.

**Consequences:** low merge debt; release notes free; breaking-change discipline tied to `/v1` API policy ([SPECIFICATION.md](SPECIFICATION.md) §8).

**Alternatives:** GitFlow (heavy for small team); merge-free trunk with feature flags only (accepted discipline later, not now).

## ADR-0014 — OpenTelemetry end-to-end, dashboards as code {#adr-014}

**Status:** accepted (2026-10-30)

**Decision:** OTEL instrumentation in API/workers/sandboxes (span-per-test); OTLP → collector → Loki/Prometheus/Grafana; dashboards and alerts versioned in `deploy/grafana/`.

**Consequences:** correlation across webhook→generation→run→artifact; losing observability = release blocker ([PRINCIPLES.md](PRINCIPLES.md) #2).

**Alternatives:** bespoke logging only (no cross- service joins); vendor APM (fine, but keep OTel as the substrate anyway).

---

## Deferred / future ADRs (placeholders)

| # | Topic | Trigger |
|---|-------|---------|
| ADR-0015 | Billing metering (usage events) | before M4 paywall |
| ADR-0016 | Queue-per-tenant partitioning | M4 noisy-neighbor evidence |
| ADR-0017 | Read replicas strategy | M5 scale |
| ADR-0018 | L4 autonomy gating mechanics | ≥ harvest precision data (M4) |

## How to propose a new ADR

1. Open a PR adding `## ADR-NNNN — Title` with **proposed** status + alternatives considered.
2. Discussion in the PR (or the ops-radar meeting, logged in [CONVERSATION.md](CONVERSATION.md)).
3. On merge, status → accepted, date stamped, links added. Superseding adds `Superseded by ADR-XXXX` to the old entry — old text is never edited, only annotated.
