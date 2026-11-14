# TROUBLESHOOTING.md — All about troubleshooting

> Symptom → cause → fix. If your problem isn't here, add it — this file earns its keep one entry per confusing hour ([PRINCIPLES.md](PRINCIPLES.md) #9). Related: [STEPS.md](STEPS.md) (setup), [OPERATIONS.md](OPERATIONS.md) (production runbooks).

---

## 0. The debugging order (always)

1. **Reproduce with a `traceId`.** Every error carries one (API responses, worker logs, run pages). `traceId` is the join key across api → celery → sandbox → S3 ([ARCHITECTURE.md](ARCHITECTURE.md) §4).
2. **Check the layer, not the symptom:** stack healthy? (`docker compose ps`) → API up? (`/healthz`) → worker consuming? (queue depth in Grafana) → sandbox image present? → LLM budget not exhausted?
3. **Read logs in order:** `api` → `worker-gen`/`worker-exec` → sandbox logs (attached to the run as artifact).
4. Found it? → fix → **write the entry below** (or fix the doc that misled you).

Log locations:

| Where | Command / path |
|-------|----------------|
| Local compose | `docker compose logs api|worker|postgres|redis` |
| Backend dev | stdout (JSON structured) + `backend/.logs/` if file sink enabled |
| Frontend dev | browser console + Vite terminal |
| Sandbox | run detail page → *Artifacts* → `sandbox.log`, `pytest.log`, `trace.zip` |
| Prod | Grafana Loki (labels: service, orgId, traceId) — dashboard "Troubleshooting" |

---

## 1. Environment & setup

**`docker compose up` fails: port already in use**
Cause: 5432/6379/8000/5173 occupied by another local service.
Fix: `docker compose down` the old stack, or override ports in `deploy/compose/docker-compose.override.yml`. Identify the squatter: `netstat -ano | findstr 5432` (Windows) / `lsof -i :5432` (macOS/Linux).

**Python version mismatch / `pydantic-core` wheel missing**
Cause: Python ≠ 3.12 ([ADR-001](DECISIONS.md#adr-001)).
Fix: `python --version`; use `pyenv`/`uv python install 3.12`; never mix venvs — recreate: `uv sync --extra dev`.

**`uv`/`npm` install succeeds but imports fail**
Cause: wrong venv active (VS Code interpreter drift) or stale lockfile.
Fix: `uv run pytest --collect-only`; `npm ci` (not `npm install`) after lockfile changes.

**`.env` values ignored**
Cause: `.env` at repo root but compose reads `deploy/compose/.env`, or variable names changed.
Fix: compare `.env.example` keys **exactly**; restart compose (env is read at start, not hot-reloaded).

**Windows/WSL2 Docker file-permission or path errors**
Fix: clone inside WSL2 filesystem (`\\wsl$\...`), keep Docker Desktop integration ON for your WSL2 distro; avoid mounting `/mnt/c/...` for dev workspaces (slow + permission noise).

## 2. Database & migrations

**`alembic upgrade head` → `relation "users" does not exist` (partial schema)**
Fix: you're in a partial local state: `docker compose down -v` (destroys dev volume — data is synthetic, safe) → `up -d postgres` → `alembic upgrade head` again. Never hand-edit dev tables.

**`alembic revision --autogenerate` produces a diff you didn't expect**
Cause: model/table drift — a migration was edited after applying, or a model field lacks `server_default` (nullable vs default).
Fix: verify the model is the source of truth; on a fresh dev DB with a wrong baseline use `alembic stamp base` then re-run migrations. Prod rule: never autogenerate against prod ([DEPLOYMENTS.md](DEPLOYMENTS.md) §6).

**`new row violates row-level security policy`**
Cause: connection session is missing `SET LOCAL app.org_id` — an integration test or worker ran without tenant context (this is the guard *working*).
Fix: tests → use the tenant-scoped session fixture; workers → every job entry must resolve `org_id` from the job payload (`core/tenancy.py`); API calls showing this → check JWT middleware order.

**`pgvector` extension missing / HNSW build fails**
Fix: `CREATE EXTENSION IF NOT EXISTS vector;` is in the baseline migration — if missing, you restored a pre-extension dump. Re-run baseline; for large indexes, build with `CONCURRENTLY` outside transactions.

**Slow queries after seeding large synthetic repos**
Fix: `EXPLAIN ANALYZE` the `embeddings` selects; confirm the HNSW index exists; chunking-bug suspicion → grep logs for `chunk` warnings. Add the repro here with numbers.

## 3. Backend / API

**401s everywhere after switching auth modes**
Cause: `JWT_DEV_MODE=true` tokens presented to OIDC mode (or vice versa).
Fix: align `.env`, clear browser localStorage/session cookies, restart api. In prod this config is a hard-fail at boot (intentional).

**CORS errors from the frontend**
Fix: dev uses the Vite proxy (see `frontend/vite.config.ts`); if you bypassed it, set `CORS_ORIGINS` exactly (no trailing slash). Never `*` with credentials.

**Webhook from GitHub returns 401**
Checks: (1) webhook secret matches the App config; (2) HMAC computed over the **raw body** (middleware must not JSON-parse first); (3) replay protection isn't rejecting legitimate retries — compare the `X-GitHub-Delivery` dedupe window.

**429 with `Retry-After`**
Cause: tenant rate/token budget ([PRINCIPLES.md](PRINCIPLES.md) #8) — working as designed.
Fix: wait per the header, or raise the org budget (owner role). If it's a *loop* (client auto-retry storm), check the frontend query retry config.

## 4. Workers & queues

**Jobs sit in `queued` forever**
Diagnosis order: worker process alive? → correct queue names (`gen,exec,analytics`)? → broker reachable (`redis-cli ping`)? → task exceptions in the dead-letter queue? → idempotency-key collision (job silently deduped — look for the `dedupe` log line).

**`KombuError: connection refused`**
Fix: Redis not up or wrong `REDIS_URL`/DB index; `docker compose up -d redis`; verify the `db` field matches the compose config.

**Duplicate test runs for one trigger**
Cause: at-least-once delivery + missing dedupe key on the task (invariant in [ARCHITECTURE.md](ARCHITECTURE.md) §4.2).
Fix: confirm `Idempotency-Key` derived from (trigger event id, run scope); if a refactor removed it — that's the bug; add a regression test.

**Celery worker eats all memory on big repos**
Fix: lower prefetch (`-P gevent` or `--prefetch-multiplier 1` for the exec queue), chunk ingestion tasks (T-104 work), and take a heap snapshot to the runbook if reproducible.

## 5. Sandboxes & execution

**Sandbox image pull fails / "manifest unknown"**
Cause: pinned digest not present locally or registry auth missing in cluster.
Fix (local): build runner images: `docker build -f deploy/images/runner-py.Dockerfile -t aitp/runner-py:local .` (compose references this tag). Prod: check `imagePullSecrets` and that the digest exists in the release manifest.

**Playwright: `browser not found at /ms-playwright`**
Fix: the runner must be the `aitp/runner-pw` variant (browsers baked in); do NOT `playwright install` at runtime (network + time cost, breaks determinism).

**Tests pass locally in compose but time out in CI**
Causes, in likelihood order: (1) target app not reachable from the sandbox network namespace — check egress NetworkPolicy and that `TARGET_BASE_URL` uses service DNS, not `localhost`; (2) resource starvation (raise CPU quota, check node pressure); (3) a real wall-clock dependency your tests shouldn't have (lint rule, [SPECIFICATION.md](SPECIFICATION.md) §4).

**Artifacts missing from the run page**
Diagnosis: sandbox log → upload step (`S3 put` errors — MinIO up?), then signed-URL generation (clock skew > 5 min breaks signatures), then bucket policy. Local MinIO console: `http://localhost:9001` (creds in `.env.example`).

**Sandbox never reaches `reporting` state**
Cause: heartbeat missed (worker pause / node pressure) → orchestrator hard-kill at timeout (by design, [SPECIFICATION.md](SPECIFICATION.md) §5).
Fix: inspect `sandbox.log` for OOM (`exit 137` = memory cap — raise limit or shrink the suite); if systematic, file a task in [TASKS.md](TASKS.md).

## 6. AI generation

**Generation returns `partial: true` with empty proposals**
Cause: token budget or static-validation failure on all candidates ([SPECIFICATION.md](SPECIFICATION.md) §4).
Check the run page: stage timing + token usage. Budget → raise the org/run budget. Validation → look at the `validation_report.json` artifact; a *systematic* failure (e.g., OpenAPI parser rejecting your spec dialect) is a product bug — file it with the spec attached.

**Provider `429/503` storms**
Fix: the gateway should retry with backoff + failover ([ADR-0007](DECISIONS.md#adr-007)); if failover didn't fire, check `LLM_PROVIDER_FAILOVER` config and follow `runbook-llm-provider-outage.md`. Queued jobs are safe — they resume; don't manually re-trigger (dedupe).

**Output looks hijacked / references instructions that aren't yours**
Possible prompt injection from repo content ([SECURITY.md](SECURITY.md) §3). Actions: save the run, **do not approve**, report to `security@aitp.example` with the run ID; the generation output lint should have blocked it — note which pattern slipped through.

**Eval score dropped after a model swap**
Expected until gates pass: run the harness on the golden dataset ([TESTING.md](TESTING.md) §4); if thresholds fail, revert the routing config (config-only rollback, [DEPLOYMENTS.md](DEPLOYMENTS.md) §5) and record the delta in [CONVERSATION.md](CONVERSATION.md).

**Cost surprise on one run**
Check: cache-miss reason (prompt-set hash mismatch → cache bypassed), repair-loop iterations, the model actually routed (run record `model` field). All four are visible on the run page; if they aren't, that's a reporting bug — file it.

## 7. Frontend

**Generated API client out of sync (type errors in CI)**
Fix: regenerate from OpenAPI (`npm run api:gen`); the drift check is a gate ([CONTRIBUTION.md](CONTRIBUTION.md)). Never hand-edit `src/api/generated/`.

**Pages render but data never loads (no error toast)**
Check: Vite proxy target (`VITE_API_URL`), auth token attached (network tab → `Authorization`), and whether the query cache is serving a logged-out state — logout/login resets TanStack Query state.

**WebSocket live run view disconnects repeatedly**
Fix: heartbeat/reconnect in `src/api/realtime.ts`; if behind an nginx ingress, ensure `Upgrade` headers are forwarded (see `deploy/helm` ingress annotations).

## 8. CI

**CI green locally, red in pipeline**
Compare: same commands? ([STEPS.md](STEPS.md) §6 vs `.github/workflows`) → same dependency resolution (`uv sync` / `npm ci` with lockfile) → caches stale (bump the cache key) → missing service containers (compose-based tests need the `services:` block).

**Flaky vitest/pytest in CI but never locally**
Investigate timing assumptions and shared fixtures; quarantine per [TESTING.md](TESTING.md) §5 (24 h rule) — never re-run-to-green silently.

**Migration check fails only in CI**
Usually: uncommitted model change, or `alembic` env reading a different `DATABASE_URL` in CI. Check the workflow's env wiring first.

## 9. Escalation

| Situation | Action |
|-----------|--------|
| Blocked > 30 min on setup | re-read [STEPS.md](STEPS.md); ask in the team channel with the failing command output |
| Suspected product bug | GitHub issue w/ `bug` label + `traceId` + reproduction |
| Suspected security issue | **private** channel only — [SECURITY.md](SECURITY.md) §1 |
| Suspected privacy gap (doc claims no control) | `privacy@aitp.example` or P2 issue per [PRIVACY.md](PRIVACY.md) §9 |
| Prod incident | [OPERATIONS.md](OPERATIONS.md) §6 — on-call first, not GitHub |

## 10. Known issues

| Issue | Status | Workaround | Tracking |
|-------|--------|------------|----------|
| (empty at documentation baseline — add rows here as discovered) | | | |

---

*Entry template: `### <symptom>` → Cause → Fix (commands) → Prevented-by (test/CI/doc change). Every incident fix should land at least one row or one doc fix ([OPERATIONS.md](OPERATIONS.md) §6 action items).*
