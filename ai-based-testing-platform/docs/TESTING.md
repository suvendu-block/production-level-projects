# TESTING.md — Testing strategy

> How we verify AITP — including the unusual part: **AI output is itself tested**. Coverage floors, gate definitions, and eval methodology. Verification methods referenced by requirement IDs: [REQUIREMENTS.md](REQUIREMENTS.md).

---

## 1. Philosophy

1. **The platform is a factory for tests — so its own testing is non-negotiable.** A testing tool with broken tests is dead on arrival.
2. **Probabilistic components get quality gates, not unit tests.** Generation is verified by eval suites against golden datasets; execution is verified by determinism tests.
3. **Flakiness is a defect.** A flaky test in our suite is treated like a failing test.
4. **Test pyramid, AI-overlaid:** lots of fast unit tests, moderate integration, few E2E — plus a parallel lattice of AI-evals.

## 2. Test matrix (what kind, where)

| Layer | Scope | Tooling | Runs on | Coverage floor |
|-------|-------|---------|---------|----------------|
| **Unit** | pure functions, prompt assembly, risk math, fle logic | pytest (backend), vitest (FE) | every PR | backend **80 %**, FE **70 %** |
| **Integration** | API endpoints + real Postgres (ephemeral) + Redis + RLS assertions | pytest + testcontainers | every PR | all endpoints ✓ |
| **Contract** | OpenAPI schema ↔ router ↔ FE generated client drift | schemathesis + CI check | every PR | 0 drift tolerance |
| **E2E (platform)** | happy-path user journeys in browser (login, review flow, run view) | Playwright | nightly + release | core flows |
| **Sandbox determinism** | same suite × same image × 10 runs = same results | pytest custom runner | weekly | 10/10 identical |
| **Migration** | upgrade → autogenerate empty diff; forward + inverse | alembic | every PR | — |
| **Load/perf** | scheduler, queue, API at 2× target ([SPECIFICATION.md](SPECIFICATION.md) §6) | k6 + custom runner driver | per release | p95s within targets |
| **Security** | dependency scan, container scan, SAST, secrets grep | GitHub/Austin-style tooling view below | every PR + weekly deep | zero critical |
| **Tenant isolation** | cross-org access attempts across API/DB/queue/storage | pytest adversarial suite | every PR + prod smoke | 0 leaks |
| **AI evals** | generation/healing quality vs golden datasets | eval harness ([§5](#5-ai-quality-evals)) | prompt/model changes + weekly | thresholds below |

## 3. CI gates (PR passes only if...)

1. Lint + typecheck (ruff + mypy strict; eslint + tsc)
2. Unit + integration tests green with coverage floors
3. No OpenAPI/client drift
4. Migration check clean
5. Dependency/container scans: zero **critical**, no new highs without waiver
6. Secrets scan clean
7. Tenancy test suite green
8. Coverage did not drop (ratchet rule)
9. Prompt changes (if any): eval suite run with results attached, thresholds met

## 4. Golden datasets & eval methodology {#5-ai-quality-evals}

**Golden dataset v0 (built by M1 kickoff):** 50 endpoints across 10 synthetic target apps (deliberately varied: REST CRUD, auth flows, pagination, webhooks, error contracts) + 20 UI flows + 20 known-broken tests with labeled truth (what healing *should* propose).

Every eval run scores generated artifacts on:

| Metric | Definition | threshold (M1) |
|--------|-----------|----------------|
| **Acceptance rate** | % of proposals a human panel accepts unchanged | ≥ 50 % |
| **Valid-syntax rate** | passes static validation first try | ≥ 90 % |
| **Contract coverage** | specified behaviors asserted / total behaviors | ≥ 80 % |
| **Brittleness count** | sleep/selectors without fallback/asserts without failure modes | 0 tolerance on hard list; ≤ 1 soft trainings |
| **Flake stability** | N-run result consistency in sandbox | ≥ 95 % |
| **Heal precision** (M2+) | accepted heal proposals / proposed | ≥ 60 % |
| **Heal side-effect rate** (M2+) | fixes that error [TROUBLESHOOTING.md-safe noise category], per eval | ≤ 5 % |

- LLM-as-judge is allowed **only** for cosmetic/readability dimensions; correctness metrics are **deterministic programs** (schema check, run-result, coverage analyzer). [PRINCIPLES.md](PRINCIPLES.md) #3.
- Every prompt/model change ships with: eval diff table + representative 3 examples (before/after) attached to the PR.
- Model routing changes (raising small-model usage) require two consecutive clean eval cycles.

## 5. Flakiness engineering (the platform's and the customers')

- All E2E platform tests use Playwright auto-wait; no sleeps ([lint-enforced](SPECIFICATION.md) §4).
- Retry policy exists but **counts**: retry must be visible in reports (per [FR-4.5](REQUIREMENTS.md)) and flake score feeds analytics.
- Flaky tests in our own repos are **quarantined within 24 h** with a ticket and a 2-week fix SLA; quarantined tests' health is itself tracked (a quarantine that lasts is a P2 incident).
- Prod regression monitoring: test-result distribution shift alarms (same suite, same image, rising retry-rate = environment drift, page).

## 6. Performance testing

- k6 scripts in `backend/tests/perf/` (API: dashboard read mix, webhook ingestion rate).
- Scheduler load script: enqueue `runs/h` = 500 sustained, 1500 burst; assert queue pickup p95 < 30 s and no sandbox crash-loops ([SPECIFICATION.md](SPECIFICATION.md) §6 targets).
- Cost load test: tokens/budget guards trip correctly under burst (no runaway spend) — [PRINCIPLES.md](PRINCIPLES.md) #8 enforced by CI-generated report.

## 7. Security testing details → [SECURITY.md](SECURITY.md)

Pentests pre-GA (external) + internal adversarial suite continuously; supply-chain scans with SBOM per release; customers' trust is the product (same reason trust is [PRINCIPLES.md](PRINCIPLES.md) #2).

## 8. Coverage & quality visibility

- Badge per service: coverage %, gate pass-rate.
- Evals landing page (internal): per-release acceptance trends — tied to the L0→L4 autonomy ladder in [VISION.md](VISION.md).
- Coverage eviction: stale -by-90-day untested modules appear on "risk debt" list; leaders see it, and it is discussed in the monthly review ([OPERATIONS.md](OPERATIONS.md) §7).

```
                    ┌──────────────────────────────┐
                    │      merge to main           │
                    │  (gates 1–9 above passed) 🟢  │
                    └──────────────┬───────────────┘
                                   ▼
                 ┌───────────── staging auto-deploy ─────────────┐
                 │  E2E platform + sandbox determinism + load    │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                          canary 5 % → 25 % → 100 % (prod)
```

---

*Related: [STEPS.md](STEPS.md) §6 (daily loop) · [REQUIREMENTS.md](REQUIREMENTS.md) (V-x verification labels) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (when tests betray you)*
