# DEPLOYMENTS.md — Deployment suggestions & best methods

> How AITP gets from `main` to running infrastructure — safely, repeatably, cheaply. Runtime view: [OPERATIONS.md](OPERATIONS.md). Local run: [STEPS.md](STEPS.md). Decisions: [ADR-0012](DECISIONS.md#adr-012), [ADR-0013](DECISIONS.md#adr-013).

---

## 1. Strategy overview (one paragraph)

AITP deploys as **container images** built once and promoted environment-by-environment: dev → staging (auto) → prod (canary). Infrastructure is **Terraform** (GCP or AWS chosen at first cloud commit; the pattern fits both), Kubernetes (+Helm) is the runtime substrate, GitHub Actions is the pipeline. Migrations are forward-only **Jobs** that run before workloads change. Every artifact carries its provenance (commit, digest, SBOM) — if it can't be traced, it can't ship.

## 2. Environments & config

| | local | staging | prod |
|--|-------|---------|------|
| Deploy trigger | manual compose | auto on `main` green | tag + manual approval |
| Data | synthetic seed | scrubbed/synthetic | real (privacy rules: [PRIVACY.md](PRIVACY.md)) |
| Secrets | `.env` (gitignored) | vault/SSM refs | vault/SSM refs |
| LLM provider | dev key | shadow-key budget-capped | prod keys + zero-retention mode |
| Observability | local OTel | staging backend | full SLO stack |

**Config rules:**

- 12-factor: all config via env, no config-in-image; per-env values live in `deploy/helm/overlays/<env>/values.yaml` (git, no secrets).
- Secret values only via vault/SSM references, mounted as files in sandboxes ([ARCHITECTURE.md](ARCHITECTURE.md) §5).
- Every env has `ENV=`, `OTEL_EXPORTER_*`, `DATABASE_URL`, `REDIS_URL`, `S3_*`, `JWT_MODE`, `LLM_PROVIDER` at minimum.

## 3. Build & artifact pipeline (GitHub Actions)

```
on push/PR → [test gates (TESTING.md §3)] → build images (multi-stage, distroless runtime)
         → scan (trivy on image, osv on deps) → generate SBOM (syft) → sign (cosign)
         → push :sha-<commit> (+ :vX.Y.Z on tag)
```

- **Images:** `aitp/api`, `aitp/worker`, `aitp/web`, sandbox images (`aitp/runner-py`, `aitp/runner-pw`). Sandboxes are **pinned by digest** — app images may reference `:vX`, sandboxes pin exact digests ([SPECIFICATION.md](SPECIFICATION.md) §5).
- Tagging: semver via conventional commits ([ADR-0013](DECISIONS.md#adr-013)); changelog auto-generated to [CHANGELOG.md](CHANGELOG.md).
- Build isolation: workloads never `apt-get install` at runtime; base images weekly-rebuilt + rescanned.

## 4. Infrastructure as code (Terraform → K8s → Helm)

```
deploy/terraform/
├── modules/ (network, cluster, postgres, redis, buckets, vault, dns, cdn)
└── stacks/ (dev(off), staging, prod)
deploy/helm/
├── charts/aitp/ (umbrella: api, workers, web, ingress, otel)
└── overlays/{staging,prod}/values.yaml
```

Rules:

1. `terraform plan` posted on infra PRs; `apply` requires two approvals (infra owner + on-call).
2. State in locked remote bucket; never local; DR: state backup + pattern documented.
3. Everything namespaced: prod never shares a cluster account with staging; sandbox egress NetworkPolicies applied at cluster level.
4. **Manual-error-free standard:** `terraform-docs` in every module README; drift detection runs weekly; drift = incident (P3).

## 5. Release & rollout best methods

- **Canary:** prod rollouts go canary 5 % → 25 % → 100 %, 30-min bake each; auto-rollback on: SLO miss (5xx, latency), error-budget burn spike, eval-regression for model changes.
- **Blue/green alternative:** for schema-parallel risky releases only (e.g., queue topology change) — cheaper than canary drama: same pipeline, two services, DNS switch.
- **Feature flags** (server-side, per org) decouple deploy from release: heavy AI features land dark until flag-on ([FR-9.3](REQUIREMENTS.md)).
- **Model/prompt changes** are also "releases": shadow-run on staging eval first, then canary the routing config, with instant config-rollback (no redeploy needed) — that's why routing is config, not code ([ADR-0007](DECISIONS.md#adr-007)).
- **Rollback:** `helm rollback` for app; migrations never auto-down; if a migration is suspect → redeploy previous app + manual inverse path ([STEPS.md](STEPS.md) §11).
- **Windows of change:** Friday-afternoon deploys allowed for flag-off changes only (deploy ≠ release).

## 6. Database migrations in prod (danger zone discipline)

1. `alembic check` in CI proves diff-clean.
2. Expand-migrate-contract: additive first; columns dropped ≥ 1 release later.
3. Prod migration = K8s **Job** with: lock timeout, statement timeout, notify channel announce, and duration cap (kills at threshold; human decides next).
4. Big table operations use `pg_repack`/CREATE-CONCURRENTLY patterns; migration longer than 5 min gets a runbook entry.
5. Every migration file must document its inverse, even if that's "manual steps attached."

## 7. Capacity & cost model (planning numbers)

Baseline (M4 targets, per [SPECIFICATION.md](SPECIFICATION.md) §6):

| Component | Baseline unit cost qty | Scale trigger |
|-----------|------------------------|---------------|
| api pods | 3 × (vCPU 1/mem 1G) | p95 > 300 ms |
| worker exec | 6 × (2 vCPU) | queue depth > 200 |
| sandbox pool | 250 concurrent × 0.5 vCPU | sustained > 70 % pool occupancy |
| postgres | 4vCPU/16GB + 500GB | conn pool > 70 %; storage > 80 % |
| LLM spend | budget-capped per tenant | burn alarm > 3× hourly median |

Cost guardrails: per-tenant monthly budget → 429 + banner (never silent) ([PRINCIPLES.md](PRINCIPLES.md) #8); monthly unit-economics review in [CONVERSATION.md](CONVERSATION.md).

## 8. Edge/postures covered

- **LLM provider outage:** gateway failover + queue retaining jobs (dedupe resumes) — runbook `runbook-llm-provider-outage.md`.
- **Region outage (DR):** infra-as-code reapply in second region + point-in-time DB restore; RTO 4 h/RPO 15 min ([OPERATIONS.md](OPERATIONS.md) §5); twice-yearly game-day practice.
- **GitHub App deactivation:** proposals pause, no customer impact; reconnect flow documented.

## 9. Deployment checklist (copy into release PR)

- [ ] All [TESTING.md](TESTING.md) CI gates green on release commit
- [ ] Changelog entry generated + reviewed ([CHANGELOG.md](CHANGELOG.md))
- [ ] Migration review done (none? confirm none / [§6](#6-database-migrations-in-prod-danger-zone-discipline))
- [ ] Sandbox images rebuilt within 7 days
- [ ] Canary plan set; on-call aware; status page (optional pre-publish)
- [ ] Rollback rehearsed on staging (the actual command set)
- [ ] Observability dashboards freshly loading (no pink panels)
- [ ] Cost forecast change estimated (bigger than +15 % → flag for review)

## 10. Anti-patterns (we've watched the industry fail slowly)

- "It works on my machine" deploys — compose↔helm parity is enforced by smoke_compose tests.
- Secrets in Helm values — even encrypted; vault refs only.
- Snowflake prod fixes — config drift alarms; fix forward through the pipeline.
- Big-bang migrations with no inverse path.
- Deploying on the heels of an incident without reading its postmortem.
