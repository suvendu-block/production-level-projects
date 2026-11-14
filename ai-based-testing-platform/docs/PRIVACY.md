# PRIVACY.md — Privacy policies

> What data AITP touches, why, for how long, and what we never do with it. Enforcement lives in architecture ([PRINCIPLES.md](PRINCIPLES.md) #7); security controls in [SECURITY.md](SECURITY.md); retention mechanics in [OPERATIONS.md](OPERATIONS.md) §5.

---

## 1. Principles (non-negotiable)

1. **No training on customer data.** Customer code, tests, specs, and artifacts are never used to train, fine-tune, or evaluate models for anyone else. Ever ([VISION.md](VISION.md) anti-goal).
2. **Secret by default.** Everything a customer connects is encrypted, tenant-isolated, and treated as confidential until they explicitly publish it.
3. **Minimum collection.** We collect what the product needs to run — not what might be useful someday.
4. **Deletable on request.** Export or erase, no friction, with a published timeline below.
5. **Architecture is the policy.** Zero-retention LLM routing, RLS isolation, and scoped tokens are the real controls ([ADR-0007](DECISIONS.md#adr-007), [ADR-0008](DECISIONS.md#adr-008)); this document is the promise those controls keep.

## 2. Data we process

| Category | Examples | Where it lives | Purpose |
|----------|----------|----------------|---------|
| **Account data** | name, email, OIDC subject, role | Postgres `users`/`memberships` | auth, RBAC, billing contact |
| **Repo context** | cloned source, diffs, OpenAPI specs, `.aitp.md` | ephemeral cache (per run) + embeddings in Postgres | generation, RAG retrieval |
| **Test artifacts** | generated test files, results, logs, traces, screenshots, videos | Postgres (metadata) + S3 (bytes) | review, reporting, healing history |
| **AI prompts/completions** | prompt sets + model outputs per run | Postgres (with run record, `promptSet` hash) | audit, eval correlation, reproducibility |
| **Telemetry** | usage events, latency metrics, error traces | Prometheus/Loki/OTel | reliability, cost management |
| **Support data** | tickets, emails you send us | support tool | resolving your request |

**We never collect:** keystrokes, personal content beyond the above, data from competitor analysis, or anything needed to "build a profile."

## 3. Where processing happens

- **Ingestion & generation:** repo content is fetched into ephemeral worker storage, processed, and discarded after the run (embeddings + generated artifacts persist, per your project config).
- **Execution:** customer test runs execute in isolated sandboxes with only the secrets needed for that run ([SPECIFICATION.md](SPECIFICATION.md) §5); secrets are short-TTL files, never env-var dumps, never logs.
- **LLM calls:** only the *context needed for the task* leaves our boundary — never credentials, never the whole repo, never unrelated tenant data ([SECURITY.md](SECURITY.md) §3).

## 4. AI/LLM data policy

| Rule | Implementation |
|------|----------------|
| Zero-retention endpoints | provider contracts/API modes where prompts are not retained or logged by the provider ([ADR-0007](DECISIONS.md#adr-007)) |
| No training on customer data | contractual + architectural: prompts are task-scoped; no dataset construction from customer content |
| Subprocessor transparency | LLM providers listed in §7; changes announced ≥ 30 days before taking effect |
| Self-host path | privacy-sensitive orgs can route to self-hosted models (vLLM) — content never leaves their boundary (M5, [ROADMAP.md](ROADMAP.md)) |
| Prompt hygiene | redaction layer strips secrets/PII patterns before retrieval ([SECURITY.md](SECURITY.md) §3) |

## 5. Retention schedule

| Data | Retention | Trigger |
|------|-----------|---------|
| Repo clones / ephemeral run storage | deleted at run end (≤ 24 h hard cap) | automatic |
| Test artifacts (traces, videos, screenshots) | 90 days baseline tier (configurable per org, M4) | lifecycle rule in S3 |
| Generated tests / proposals lineage | while project exists (+ 30 days after disconnect) | FR-2.6 purge job |
| Embeddings + prompts (run records) | project lifetime + 90 days | eval reproducibility need |
| Audit events | 24 months | compliance evidence |
| Account data | until account deleted + 30-day restore window | GDPR erasure flow |
| Backups | 35 days (Postgres WAL + snapshots) | DR ([OPERATIONS.md](OPERATIONS.md) §5) |

Org owners can shorten (not lengthen) retention per project from M4 ([FR-9.2](REQUIREMENTS.md)).

## 6. Data subject rights

- **Export:** full JSON + artifacts export via UI/API (owner role), delivered ≤ 7 days.
- **Erasure:** owner-initiated org deletion → 30-day soft-delete (undo window) → hard purge of Postgres rows, embeddings, S3 objects, backups aged out per schedule. Individual users can request erasure of account data anytime.
- **Rectification:** profile fields editable in-product.
- **Breach notification:** affected customers notified ≤ 72 h of confirmed breach with scope + impact ([SECURITY.md](SECURITY.md) §7); regulatory follow-ups per jurisdiction.
- Requests: `privacy@aitp.example` — human-answered, no bot wall; ≤ 30 days to complete, GDPR/CCPA-aligned.

## 7. Subprocessors (planned baseline — confirm before GA)

| Subprocessor | Data | Region options |
|--------------|------|----------------|
| Cloud host (AWS or GCP) | all platform data at rest | EU residency option at M4 |
| LLM provider(s) (OpenAI/Anthropic/self-hosted) | task-scoped prompts/completions | configurable; self-host = none |
| OIDC IdP (auth vendor, TBD) | account identity | vendor-dependent |
| Email provider | transactional mail | — |
| Error tracker (Sentry) | traces w/ scrubbing enabled | EU option |

Customers get the subprocessor list + DPA before GA ([MILESTONES.md](MILESTONES.md) M4).

## 8. Children, sales, and change management

- AITP is B2B; no knowingly-collected children's data.
- We do not sell personal data — ever — regardless of jurisdictional definitions.
- Material policy changes: announced in-product + changelog ≥ 30 days ahead ([CHANGELOG.md](CHANGELOG.md)), with continued use as consent and an easy objection path (delete or export).

## 9. Contact

`privacy@aitp.example` (data protection requests) · `security@aitp.example` (incidents — see [SECURITY.md](SECURITY.md)) · maintainers via private channel for everything else.

---

*This policy is written to be auditable: every claim above maps to a control in [SECURITY.md](SECURITY.md), an FR in [REQUIREMENTS.md](REQUIREMENTS.md), or a mechanism in [OPERATIONS.md](OPERATIONS.md). If you find a claim without a control, file it as P2 — that gap is a bug.*
