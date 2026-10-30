# STEPS.md — From Zero to Production

> Step-by-step path from an empty machine to a production deployment of AITP. Shortcuts: daily dev = §1–§4; releasing = §5+; production hardening = §8. Troubleshooting: [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## 0. Prerequisites (host machine)

| Tool | Version | Why |
|------|---------|-----|
| Git | ≥ 2.40 | obviously |
| Docker Engine + Compose v2 | ≥ 24 | everything runs in compose |
| Python | 3.12.x | backend ([ADR-001](DECISIONS.md#adr-001)) |
| Node.js | 20 LTS | frontend ([ADR-002](DECISIONS.md#adr-002)) |
| `uv` or pip ≥ 23 | latest | Python deps |
| An LLM API key | any provider supported by the gateway | generation only ([ADR-007](DECISIONS.md#adr-007)) |

Windows note: use WSL2 for best compatibility; paths below are POSIX-style.

## 1. Get the code

```bash
git clone <repo-url> ai-based-testing-platform
cd ai-based-testing-platform
```

## 2. Configure environment

```bash
cp .env.example .env
```

Fill at minimum:

```ini
DATABASE_URL=postgres://aitp:aitp@localhost:5432/aitp
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=sk-...          # or ANTHROPIC_API_KEY / LOCAL_LLM_BASE_URL
S3_ENDPOINT=http://localhost:9000   # MinIO in compose
JWT_DEV_MODE=true              # never in prod
```

**Rule:** `.env` is never committed; the vault (`SECRETS_*`) keys only exist in staging/prod ([SECURITY.md](SECURITY.md)).

## 3. Boot the data plane

```bash
docker compose -f deploy/compose/docker-compose.yml up -d postgres redis minio
docker compose -f deploy/compose/docker-compose.yml ps     # all healthy?
```

## 4. Install & migrate

```bash
cd backend
uv sync --extra dev          # or: pip install -e ".[dev]"
uv run alembic upgrade head  # schema up
uv run scripts/seed.py       # demo org/project (synthetic, no real repos)
```

Frontend:

```bash
cd ../frontend
npm ci
npm run dev                  # http://localhost:5173
```

Backend (separate shell):

```bash
cd backend
uv run uvicorn app.main:app --reload   # http://localhost:8000
```

Workers (third shell):

```bash
cd backend
uv run celery -A app.workers.celery_app worker -Q gen,exec,analytics -l info
```

**Verify the loop (M0 state):** open `http://localhost:5173` → login stub → projects list shows seeded demo → `healthz` returns `{"status":"ok"}` with a `traceId`.

## 5. First AI-generated test (M1+ behavior, works when EPIC-C/D/E land)

1. Dashboard → *Projects* → *Connect repo* → pick GitHub repo with an OpenAPI spec.
2. Webhook lands → *Generations → New run* → select scope (endpoint/file/story) → queue (budget defaults shown).
3. Wait for `proposal:draft` (progress bar multi-stage: Ingest → Plan → Generate → Validate).
4. Review: code, diff, provenance, cost. Choose *Approve → run now*.
5. Results page: live test progress (WebSocket), then artifacts (logs, coverage).

If any step errors, the message contains `runId` + `traceId` — take these into [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 6. Local quality loop (every day, every PR)

```bash
# backend
uv run pytest -x --cov=app --cov-fail-under=80
uv run ruff check . && uv run mypy .
uv run alembic upgrade head && alembic revision --autogenerate  # must produce empty diff

# frontend
npm run lint && npm run test -- --coverage

# contract conformance (CI does this too)
uv run pytest tests/contract/
```

PR checklists are in [CONTRIBUTION.md](CONTRIBUTION.md); coverage floors in [TESTING.md](TESTING.md).

## 7. Containerize & first "prod-like" run

```bash
docker compose -f deploy/compose/docker-compose.yml up -d --build
# stack: api :8000, web :3000 (nginx-served), worker, sandbox images, db, redis, minio
docker compose -f deploy/compose/docker-compose.yml logs api --tail 50
```

Smoke-test suite (against compose stack, not local processes):

```bash
uv run pytest tests/smoke_compose/ --env docker
```

## 8. Staging deployment (first cloud)

High level; exact commands in [DEPLOYMENTS.md](DEPLOYMENTS.md) §4:

1. `terraform apply` the network + managed Postgres + buckets + cluster ([ADR-012](DECISIONS.md#adr-012)); **confirm** state bucket versioning on.
2. Secrets into the vault/SSM; none in env files.
3. `kubectl apply -k deploy/helm/overlays/staging` (or `helmfile sync`).
4. Run migrations as a Job (never initdb-by-app): `app.migrate` job image.
5. Point the GitHub App webhook to staging; send a test PR.
6. Validate: SLO dashboard all green; run one seeded generation + execution end-to-end.

## 9. Production hardening checklist (pre-GA gate — blocks release)

- [ ] `JWT_DEV_MODE=false` everywhere; OIDC with real IdP configured ([ADR-0009](DECISIONS.md#adr-009))
- [ ] RLS verified by tenant-bleed integration tests in CI **and** in prod smoke
- [ ] Sandbox network policy enforced (egress allowlist only); secrets short-TTL
- [ ] Backups: WAL + snapshots proven by a real restore drill ([OPERATIONS.md](OPERATIONS.md) §5)
- [ ] Rate limits + token budgets per tenant active
- [ ] OTel shipping to prod backend; dashboards-as-code applied; alerts paged (drill)
- [ ] Dependency audit clean; images rescanned; SBOM attached to release
- [ ] Status page live; runbooks written for [OPERATIONS.md](OPERATIONS.md) §8 list
- [ ] [SECURITY.md](SECURITY.md) private vulnerability channel monitored (test it end-to-end)
- [ ] Load test at 2× expected concurrency passed ([TESTING.md](TESTING.md) §7)

## 10. Going live & first week after

1. Ship to 100 % traffic behind canary policy ([DEPLOYMENTS.md](DEPLOYMENTS.md) §5).
2. Day-1: watch cost/accepted-test + error rates + queue lag dashboards hourly.
3. Week-1: cancel any alert that fired falsely (fixing thresholds is legitimate ops work — log it in [CONVERSATION.md](CONVERSATION.md)).
4. Land one [TROUBLESHOOTING.md](TROUBLESHOOTING.md) entry per every confusing incident — infra docs stay alive only by being written continuously.

## 11. Rollback (know it before you need it)

```bash
helm rollback <release> <previous>            # k8s
# db: never auto-down-migrate in prod; if a migration is the culprit: redeploy previous app
#    version + follow the inverse path documented in the migration file
```

Post-incident: postmortem within 7 d ([OPERATIONS.md](OPERATIONS.md) §6).

---

*Pair this with: [DEPLOYMENTS.md](DEPLOYMENTS.md) (IaC + release strategy) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (when it breaks) · [STEPS](#) is version-tagged per [CHANGELOG.md](CHANGELOG.md).*
