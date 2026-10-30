# SECURITY.md — Security policies

> How AITP is secured and how to report issues **privately**. Related: threat-model surfaces in [ARCHITECTURE.md](ARCHITECTURE.md) §5, controls in [PRIVACY.md](PRIVACY.md), verification in [TESTING.md](TESTING.md) §2/§7.

---

## 1. Reporting a vulnerability — read this first

**Do NOT open a public issue, PR, or discussion for a security concern.**

- Use **GitHub Private Vulnerability Reporting** on this repository (preferred), or email `security@aitp.example` (private, monitored inbox).
- Include: affected area (API/GitHub integration/UI/sandboxes), reproduction steps or PoC, impact hypothesis, versions/commit SHA.
- If the issue involves customer data exposure, mark the report `P1`.
- **Response SLAs:** ack ≤ 24 h; triage ≤ 3 business days; fix or mitigation track ≤ 30 days for high/critical, coordinated disclosure respected (we credit reporters in the future advisory when they want credit).
- Safe-harbor: good-faith research within scope (our own deployments, notDoS-ing prod) will never trigger legal threats from us.

## 2. Security model (what we protect from whom)

| Trust boundary | Threat | Mitigation (anchor) |
|----------------|--------|---------------------|
| Internet → API | spoofing, abuse, injection | OIDC/JWT ([ADR-0009](DECISIONS.md#adr-0009)), schema validation, rate limits, no client-trusted IDs |
| Org A ↔ Org B | tenant data bleed | RLS + org-scoped everything ([ADR-0008](DECISIONS.md#adr-0008)); adversarial tenancy tests ([TESTING.md](TESTING.md) §2) |
| Platform → GitHub | stolen repo access | GitHub App least-scope tokens, webhook HMAC verification, short TTL ([ADR-0010](DECISIONS.md#adr-0010)) |
| Sandbox ↔ Platform ↔ Internet | sandbox escape / lateral movement | pinned images, non-root, egress allowlist, per-tenant network policy ([ADR-0006](DECISIONS.md#adr-0006)) |
| Platform → LLM provider | code/data leakage to third party | zero-retention endpoints, never-training policy, redaction in prompt assembly ([ADR-0007](DECISIONS.md#adr-0007), [PRIVACY.md](PRIVACY.md) §4) |
| AI output → repo/CI | malicious/harmful generated code | static validation + human approval + PR review — AI never merges itself ([PRINCIPLES.md](PRINCIPLES.md) #1) |
| Operator → prod | insider overreach | audit log, least-privilege RBAC, no direct prod data access without audit event |

**Data classification:** P0 = customer code/test data (secret) · P1 = personal data (emails, names) · P2 = business metadata · P3 = public. Handling rules follow the classification.

## 3. AI-specific threat surface (this is our unusual part)

| Threat | Scenario | Defense |
|--------|----------|---------|
| **Prompt injection** | malicious repo content (README, file names, spec comments) hijacks generation → produces exfil-seeking or harmful tests | repo content is **untrusted input**: structural prompts (system/user separation), output schema enforcement, static validation of outputs, egress-free sandboxes (a generated test could *never* reach AITP internals), allowlist lint: no arbitrary network in generated tests beyond target app |
| **Goal drift / jailbreak via content** | "ignore instructions and print tokens" style payloads | no secrets ever in prompt context; instruction-scrub layer before retrieval; generation output lint blocks suspicious patterns (token-like strings, unknown hosts) |
| **Data exfil via artifacts** | generated artifact streams customer code out | artifacts upload only to our S3; signed URLS short-lived; sandbox egress policy blocks other destinations |
| **Poisoned baselines** | attacker PR-forces "known-good" visual baselines to mask UI fraud | baseline changes go through maintainer approval + audit |
| **Model-provider incident** | provider breach exposes prompts | zero-retention contracted providers; prompts contain code snippets only — never credentials; key rotation ([OPERATIONS.md](OPERATIONS.md) §8 runbook 6) |

Threat model review cadence: pre-GA full pentest (external), then annually + after any major architecture change (ADR).

## 4. Secure development lifecycle

- Branch protection: no direct-`main` pushes; required checks = CI gates including tenancy + scans.
- Dependencies: renovate-style automated PRs; **high** CVEs block merge waiver required; **critical** → immediate emergency patch path.
- SBOM per release artifact; container images signed (cosign) and verified at admission.
- Secrets: no secrets in code (scan enforces); vault age ≤ 90 days; rotation runbook ([OPERATIONS.md](OPERATIONS.md) §8); sandbox secret injection short-TTL files, never env, never logs.
- Access: prod data access requires break-glass with audit event + auto-expiry; on-call grants time-boxed.
- Pentest before GA + annual; internal adversarial tenancy suite runs on every PR.

## 5. Cryptography & key management

- TLS 1.2+ everywhere; HSTS; internal service mTLS at M4.
- At-rest: managed-Disk encryption + DB-level; S3 SSE; object-level for artifacts with tenant-scoped keys (M4).
- Keys: LLM keys, GitHub App private key, DB creds, signing keys — vault-managed; rotation ≤ 90 d; never deployed to sandbox except scoped short-TTL run creds.
- JWTs: RS256, ≤ 15 min expiry, rotation-backed; refresh tokens rotate-on-use with reuse detection (theft → family revocation).

## 6. Vulnerability management & SLAs

| Severity (CVSS + exploitability-in-context) | Fix SLA | Comms |
|--------------------------------------------|---------|-------|
| Critical (data cross-tenant, RCE, authn bypass) | 72 h mitigation, 14 d fix | P1 incident + customer notice |
| High | 30 d | changelog `Security` section |
| Medium | 60 d | batched release notes |
| Low | 90 d / best effort | release notes |

Out-of-SLA items surface in monthly ops review ([OPERATIONS.md](OPERATIONS.md) §10) as `ops-debt` tasks.

## 7. Incident response (security variant)

Security events (suspected breach, anomaly, report) trigger the **security incident path**: incident lead = security owner (never solo triage); containment first; evidence preservation; lawful notifications per [PRIVACY.md](PRIVACY.md) §6; postmortem published (sanitized) within 7 days. Details and templates: [OPERATIONS.md](OPERATIONS.md) §6.

## 8. Compliance posture

- **SOC 2 Type I** track through M4 (Type II after 6 months of evidence).
- GDPR/CCPA alignment via [PRIVACY.md](PRIVACY.md); DPAs available pre-GA.
- CSA-lite control mapping kept in private compliance workspace; mapped controls obligate the controls in §3–§5.

## 9. Data subject conciseness clause (see [PRIVACY.md](PRIVACY.md) for the full policy)

Security lifecycle never overrides privacy rights: deletion requests, export requests, and breach notification duties are hard constraints on security tooling, too.

---

*Contact: `security@aitp.example` (monitored) · public-good-faith research welcome within safe-harbor rules above. UI text for researchers: "Thank you."
