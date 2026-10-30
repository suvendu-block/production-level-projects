# OPERATIONS.md — Service architecture & operations

> How AITP runs in production and how we keep it healthy. Deployment mechanics: [DEPLOYMENTS.md](DEPLOYMENTS.md). Architecture rationale: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Service architecture (runtime view)

```
                     ┌────────────── Kubernetes (prod) ──────────────┐
  Users/IdP ──────▶  │ [ingress O] → [frontend web pods]             │
  GitHub hooks ──▶   │                [api pods + webhook receiver]  │
                     │        │           │           │              │
                     │   [postgres]  [redis]   [workers: gen|exec|analytics]
                     │        │       │            │               │
                     │   [PVC?]   [cache]  ┌─────▼──────────────┐  │
                     │             │       │ runner sandbox pool │  │
                     │             │       │ (ephemeral pods)    │  │
                     │             │       └─────────────────────┘  │
                     │  S3 (artifacts) · Secrets vault · OTel collector │
                     └───────────────────────────────────────────────┘
```

| Service | Kind | Min/Max (prod) | Notes |
|---------|------|-----------------|-------|
| `web` (frontend) | static + SPA, CDN-backed | 2+ | versioned asset bundle, health `/healthz` |
| `api` | FastAPI, gunicorn+uvicorn workers | 2–20 | HPA on p95 latency; consumes webhooks |
| `worker-gen` | Celery | 2–30 | AI generation, rate-limited by token budget |
| `worker-exec` | Celery | 2–50 | provisioning sandboxes, artifact collection |
| `sandbox` | ephemeral pod | burst 0–500 | pinned images; destroyed after run |
| `postgres` | cloud-managed (RDS/Cloud SQL) | primary + standby | RPO ≤ 15 min ([NFR](REQUIREMENTS.md)) |
| `redis` | managed | 1_primary + 2_replicas | broker, cache, locks |
| `otel-collector` | DaemonSet | node-count | traces/log routing |

Tenancy note: queues and sandbox pools are namespaced per org at M4+ ("noisy neighbor" guard); Redis DBs keyed by org for rate ceilings.

## 2. Environments

| Env | Purpose | Data | Deploy |
|-----|---------|------|--------|
| local | dev workstation | synthetic | docker compose ([STEPS.md](STEPS.md)) |
| staging | pre-prod, load/dl tests, demo | scrubbed/synthetic | auto-deploy on `main` |
| prod | customers | real | manual approval + canary |

Config & envs are per [DEPLOYMENTS.md](DEPLOYMENTS.md) §2. **No `admin` remote debugging without an audit event** ([PRINCIPLES.md](PRINCIPLES.md) #6).

## 3. SLIs / SLOs & error budget

| SLI | Target SLO (prod) | Window | Measured by |
|-----|-------------------|--------|-------------|
| API availability (2xx/4xx, not 5xx/timeout) | 99.9 % | 30 d rolling | OTel → Prometheus |
| API p95 latency (dashboard reads) | < 300 ms | 30 d | histogram |
| Sandbox pickup p95 | < 30 s queue wait | 7 d | orchestrator metric |
| Generation delivery p95 | < 90 s per endpoint | 7 d | worker events |
| Artifact durability (uploads) | 100 % committed | event-driven | S3 upload receipts |
| Alert→ack for P1 (on-call latency) | < 15 min | drill-truth | incident log |

**Error budget policy:** budget exhaustion (> 43 min downtime/30d) → feature freeze except reliability work; review recorded in [CONVERSATION.md](CONVERSATION.md).

## 4. Observability stack

- **Traces:** OTel auto-instr (FastAPI, Celery, SQLAlchemy, httpx), span-per-test; sampled 10 % (100 % errors).
- **Metrics:** Prometheus (latency histograms, queue depth, sandbox transitions, token spend per run, budget consumption).
- **Logs:** structured JSON → Loki; `traceId`/`orgId` everywhere; **no PII, no code snippets > single lines, no secrets in logs** (scrubber at emit).
- **Dashboards-as-code:** `deploy/grafana/` — generated on each deploy.
- **Alerts (page-worthy):** api 5xx rate > 2 %/5-min; drop in webhook ingestion > 15 min; worker queue > 200 backlog > 10 min; sandbox crash-loop; postgres storage > 80 % / replication lag > 30s; LLM budget-burn anomaly (> 3× hourly median).
- **AI-specific dashboards:** acceptance rate, eval-score trend (post-release), cost per accepted test, healing precision. These two trends raise an incident gate if negative over 7 d.

## 5. Backup, DR, resilience

| Asset | Backup cadence | Retention | Restore drill |
|-------|---------------|-----------|---------------|
| Postgres | continuous WAL + nightly snapshot | 35 d | monthly (automated, restored to isolated env) |
| S3 artifacts | bucket versioning + cross-region (M4) | 90 d (baseline tier) | quarterly restore audit |
| Secrets/vault | vendor-managed snapshots | vendor policy | annual drill |
| Redis | none (ephemeral by design) | — | rebuilt on restart |

- **RPO ≤ 15 min / RTO ≤ 4 h** — twice-yearly full game-day exercise; the last drill report link lives in [CONVERSATION.md](CONVERSATION.md).
- Sandbox/host failures: orchestrator drains and re-enqueues; stuck sandboxes killed at hard timeout (never releases secrets until cleanup complete).
- AITP failure does **not** break customer CI: generated code lives in customer repos; AITP service outage only pauses new proposals.

## 6. Incident management

Severities: **P1** = data leak/tenant bleed/total outage/security vuln active-exploited; **P2** = key feature down (generation, runs); **P3** = degraded/slow/perf; **P4** = cosmetic.

Flow: detect (alert or report) → ack ≤ 15 min (P1/P2) → incident channel opened, incident lead assigned → mitigate first, investigate second → comms to status page (P1 ≤ 30 min) → postmortem within 7d (blameless, template below) → action items become tasks in [TASKS.md](TASKS.md) tagged `ops-debt`.

Postmortem template is in `docs/templates/postmortem.md` (created at M0).

## 7. Capacity & cost operations

- Cost dashboards per org: tokens/run, runner-minutes, storage. Hard caps enforced per tenant ([PRINCIPLES.md](PRINCIPLES.md) #8); cap breach → 429 + customer-visible banner, not silent failure.
- Unit-economics review monthly ([CONVERSATION.md](CONVERSATION.md) entry): cost per accepted test must trend down with caching + routing.
- Capacity model: `sandboxes = avg_concurrency = runs/h × avg_test_minutes`; rechecked every release with load numbers ([TESTING.md](TESTING.md) §7).

## 8. Runbooks (index)

Written per operation team agreement at M0; stored under `docs/runbooks/`. Top-priority runbooks:

1. `runbook-api-5xx-spike.md`
2. `runbook-llm-provider-outage.md` (failover provider switching, [ADR-007](DECISIONS.md#adr-007))
3. `runbook-sandbox-crash-loop.md`
4. `runbook-postgres-failover.md`
5. `runbook-queue-backlog.md`
6. `runbook-secrets-rotation.md` (LLM keys, GitHub App key, DB creds)
7. `runbook-tenant-isolation-breach.md` (P1, security lead + rollback plan)

Each contains: trigger, impact radius, first 5 commands, escalation, rollback, verify.

## 9. Release operations

- Deploys: canary → 5 % then 25 %, then 100 % (30/30-minute windows), auto-rollback on SLO regression ([DEPLOYMENTS.md](DEPLOYMENTS.md) §5).
- Prompt/model migrations: shadow runs on staging eval first; two clean eval cycles before production default change.
- On-call: primary + shadow, weekly rotation, rides handoff in [CONVERSATION.md](CONVERSATION.md).

## 10. Production hygiene checklist (recurring, monthly)

- [ ] Unacked alerts < 5 at any time last month
- [ ] Postgres bloat checked; unused indexes pruned
- [ ] Sandbox images rescanned + redeployed (CVE refresh)
- [ ] Cost per accepted test trended down or explained
- [ ] DR drill completed or scheduled
- [ ] Secrets < 90 days old (or justified)
- [ ] OTel sampling and log scrubbers verified (we still don't leak)
- [ ] Runbooks updated for anything new from incidents

---

*Related: [DEPLOYMENTS.md](DEPLOYMENTS.md) (shipping) · [SECURITY.md](SECURITY.md) (security events) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (devs debugging)*
