# SPECIFICATION.md — Technical specification

> The precise contract layer: API, data model, AI pipeline, execution protocol, performance targets. Structure in [ARCHITECTURE.md](ARCHITECTURE.md); decisions in [DECISIONS.md](DECISIONS.md). Status: `stable-draft` — implemented code must match this or the spec (and this note) changes.

---

## 1. Baseline

- Backend: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic ([ADR-001](DECISIONS.md#adr-001))
- Data: PostgreSQL 16 + pgvector, Redis 7, S3-compatible storage ([ADR-003](DECISIONS.md#adr-003), [ADR-004](DECISIONS.md#adr-004), [ADR-011](DECISIONS.md#adr-011))
- Frontend: React 18 + TypeScript, generated OpenAPI client ([ADR-002](DECISIONS.md#adr-002))
- API style: REST, JSON, `/api/v1/*`, camelCase over the wire, snake_case in code
- Auth: OIDC → JWT (15 min) + rotating refresh; service-to-service: mTLS in-cluster (M4)
- Errors: RFC 7807 `application/problem+json`; every error carries `traceId`

## 2. API surface (v1)

| Method & path | Purpose | Roles |
|---------------|---------|-------|
| `POST /auth/session` `/POST /auth/refresh` `POST /auth/logout` | OIDC completion / refresh / revoke | any |
| `GET /orgs` `POST /orgs` · `GET/PUT /orgs/{id}` | Organizations | owner |
| `GET /orgs/{id}/projects` · `POST` · `GET/PATCH /projects/{id}` | Projects | member+ |
| `POST /projects/{id}/connect/github` `DELETE …/github` | GitHub App connect/install | maintainer+ |
| `POST /projects/{id}/sync` | Force re-ingest repo/specs | maintainer+ |
| `POST /projects/{id}/generations` | Queue a generation run | member+ |
| `GET /generations/{id}` · `GET /projects/{id}/generations` | Status + proposals list | member+ |
| `PATCH /proposals/{id}` | Approve / edit / reject (with diff) | maintainer+ |
| `POST /projects/{id}/runs` | Schedule execution (suite/subset) | member+ |
| `GET /runs/{id}` · `GET /runs/{id}/tests` · `GET /runs/{id}/artifacts/{key}` (signed URL) | Results & artifacts | member+ |
| `GET /tests/{id}` `GET /tests/{id}/history` | Test details, heal history | member+ |
| `POST /tests/{id}/heals/{healId}/approve` `POST …/reject` | Self-heal workflow | maintainer+ |
| `GET /projects/{id}/analytics/coverage` `/flakiness` `/risk` | Analytics | member+ |
| `GET /orgs/{id}/members` `POST` `DELETE` `PATCH /members/{uid}` | RBAC ([ADR-008](DECISIONS.md#adr-008)) | owner |
| `GET /audit?project=&type=` | Audit log | maintainer+ |
| `GET /healthz` (unauth) · `GET /readyz` | Platform health | — |
| `POST /webhooks/github` (HMAC-verified, unauth) | Repo events | — |

Non-negotiables: pagination (`cursor`), `Idempotency-Key` on all POSTs, `X-Request-Id` echoed, 429 with `Retry-After` under tenant limits.

## 3. Data model

```
orgs(id, name, plan, created_at)
  └── projects(id, org_id→, name, status[tiered], repo_provider, repo_install, config jsonb, created_at)
        ├── integrations(id, project_id→, kind, credentials_ref→vault, metadata)
        ├── sources(id, project_id→, kind[openapi|repo|story], content_hash, meta)
        │     └── embeddings(id, source_id→, chunk, vec vector(1536), model, dims)  -- HNSW idx
        ├── generations(id, project_id→, trigger[webhook|manual|schedule], status, prompt_set, token_in, token_out, cost_usd, trace_id)
        │     └── proposals(id, generation_id→, kind[api|e2e|unit|heal], path, file_content, ts_content, diff, status[draft|approved|rejected|merged], review jsonb)
        ├── tests(id, project_id→, suite, class, name, kind, status, flake_score, last_seen, intent_doc)
        │     ├── test_results(id, run_id→, test_id→, outcome[pass|fail|flaky|regressed|new], duration_ms, retries, artifacts jsonb)
        │     ├── heal_proposals(id, test_id→, breakage_class, diff, confidence, status, approved_by, decided_at)
        │     └── runs(id, project_id→, trigger, base_sha, head_sha, suite filter jsonb, status, started, finished, stats jsonb, trace_id)
        ├── coverage_maps(id, project_id→, path, line_start, line_end, test_ids[], updated)
        └── audit_events(id, org_id→, project_id→, actor, action, object, before, after, ip, ua, at)
users(id, sub, email, display_name)
  │   memberships(user_id→, org_id→, role[owner|maintainer|member|viewer])
```

Invariants:

- every tenant-scoped table has `org_id` and is covered by **RLS policy** keyed to the JWT's org claim ([ADR-008](DECISIONS.md#adr-008));
- generated/healed file content is immutable once decided — edits create new proposals (full lineage);
- `audit_events` is append-only (no UPDATE/DELETE grants);
- artifact bytes live in object storage; rows hold signed-key references only.

## 4. AI pipeline spec ([ADR-007](DECISIONS.md#adr-007))

Stages (each independently logged + budgeted):

1. **Context assembly** — inputs: diff / endpoint spec / story; retrieval over `embeddings` (top-k 8, MMR diversity) + repo conventions file (`.aitp.md`) + similar existing tests from vector store.
2. **Planning** — cheap-model task list with risk labels; user-visible in run details.
3. **Generation** — strong model; output **must** satisfy the generation contract:
   - idiomatic framework (pytest/TestClient or Playwright TS), 
   - no `sleep`/dead-waits, no CSS-path-only selectors, no network loops; 
   - retry/assertion hygiene; fixtures reuse; injected `TEST_INTENT` docstring (id → requirement linkage).
4. **Static validation** — parse (ast/tree-sitter), import-resolution, schema-valid payloads against OpenAPI, forbidden-pattern lint list. Fail → one repair pass → else model-specific fallback.
5. **Self-critique** — rubric scoring (coverage of spec'd behaviors, brittleness, readability); < threshold → regenerate with critique injected (max 2 rounds).
6. **Budgets** — per stage and per run; exceeded → stop with `partial:true` and consumed-cost report.

Model routing (config, per env): plan/completeness = small model; generation/critique = strong model; embeddings = per [ADR-007]; all providers reached through the **AI Gateway** (zero-retention mode enforced central, never per-caller).

## 5. Execution protocol

- **Sandbox image** (pinned digests): python-runner (pytest, httpx, coverage, crypto-run utils) and playwright-runner (browsers, traces, videos). Images rebuilt and re-scanned weekly.
- **Lifecycle:** `queued → provisioning → running → collecting → reporting | failed | timeout`. Heartbeats every 15s; orchestrator kills > (suite_timeout or 20 minjed); network policy: egress only to target app + defined allowlist; no egress to AITP internals beyond result upload endpoint.
- **Secrets:** injected via mounted files (env-var forbidden for values > none), TTL ≤ run, never logged; rotation on use ([SECURITY.md](SECURITY.md)).
- **Results:** per-test OTel span + one aggregate event → `test_results`; retry policy = {3 attempts with jittered backoff}; flake re-run schedule defined in [TESTING.md](TESTING.md).
- **Artifacts in S3** under `runs/{run_id}/{test_id}/…` with signed 15-min GETs.

## 6. Performance & capacity targets (M4 prod)

| Metric | Target |
|--------|--------|
| API p95 latency (dashboard reads) | < 300 ms |
| API p99 latency (all) | < 800 ms |
| Generation (first token → proposal) | p50 < 45 s, p95 < 90 s per endpoint |
| Run pickup latency | p95 < 30 s |
| Sandbox availability | ≥ 99.9 % |
| Ingest (repo re-index) | ≤ 5 min for 100k-line repos |
| Max concurrent sandboxes (baseline) | 250 w/ burst to 500 |

Load profile & test plan: [TESTING.md](TESTING.md) §7. Capacity math and cost ceilings: [DEPLOYMENTS.md](DEPLOYMENTS.md) §7.

## 7. Event & notification model

Internal events (published, durable, at-least-once): `repo.synced`, `generation.completed`, `proposal.decided`, `run.completed`, `heal.proposed`, `heal.decided`, `quota.threshold`. Consumers (analytics, notifications, webhooks-out) subscribe at-least-once and must be idempotent. Outbound webhooks: HMAC-SHA256 (`X-AITP-Signature`), targets per project, retries w/ exp backoff (max 12h).

## 8. Versioning & compatibility

- API path-versioned (`/v1`); additive changes only within a version (new optional fields, new endpoints); breaking → `/v2` + 6-month window.
- Webhook/event payloads also versioned (`kind`/`schemaVersion`).
- DB migrations: forward-only, expand-migrate-contract, every migration has an inverse script even if manual ([STEPS.md](STEPS.md)).
- Prompt-sets are content-addressed; a generation records the exact prompt set used (survives model migrations; evals correlate on it).

## 9. Observability contract

Every request/jobs carries: `traceId`, `orgId`, `projectId`, `route`, `model`, `promptSet`, `budget`. Dashboards + alerts as code in `deploy/grafana/`. SLIs/SLOs per [OPERATIONS.md](OPERATIONS.md).

## 10. Conformance checklist (applies to every PR touching this spec)

- [ ] OpenAPI schema updated + client regenerated (frontend + E2E evaluator)
- [ ] Migration written, reversible, RLS verified on new tenant tables
- [ ] Spec section updated here (same PR) or an ADR created if a conflict requires a decision
- [ ] Coverage of new endpoints ≥ 90 %; contract tests updated
- [ ] Observed via OTel with the attributes in §9

---

*Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [REQUIREMENTS.md](REQUIREMENTS.md) (the why behind these contracts) · [TESTING.md](TESTING.md) (verification)*
