# CHANGELOG.md — All notable changes

> Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning: [SemVer](https://semver.org). Machine-generated PR summaries are merged into this file at release by the process in [ADR-0013](DECISIONS.md#adr-013). Entries must be user-relevant, not commit dumps.

---

## [Unreleased]

### Added

- Complete documentation baseline: this `docs/` set (24 documents) incl. architecture, spec, requirements, ops, security, privacy ([ALL.md](ALL.md) index)
- ADR-0001 … ADR-0014 (accepted decisions on stack, tenancy, AI gateway, deployment) ([DECISIONS.md](DECISIONS.md))
- Feature backlog mapped to requirements FR-1…FR-9 ([BACKLOGS.md](BACKLOGS.md), [REQUIREMENTS.md](REQUIREMENTS.md))
- M0 task breakdown and sprint plan ([TASKS.md](TASKS.md))

### Planned (M0, Nov 2 – Nov 27, 2026)

- Monorepo skeleton (backend FastAPI, frontend React/Vite) + CI gates
- `docker compose` full-stack dev environment; Alembic + RLS baseline
- Observability wiring (OTel, dashboards-as-code)

## [0.1.0] — 2026-10-30 (documentation baseline)

### Added

- Project charter docs: [README.md](../README.md), [VISION.md](VISION.md), [MILESTONES.md](MILESTONES.md), [PRINCIPLES.md](PRINCIPLES.md), [PROJECT.md](PROJECT.md)
- Engineering docs: [ARCHITECTURE.md](ARCHITECTURE.md), [SPECIFICATION.md](SPECIFICATION.md), [REQUIREMENTS.md](REQUIREMENTS.md)
- Planning docs: [ROADMAP.md](ROADMAP.md), [BACKLOGS.md](BACKLOGS.md), [TASKS.md](TASKS.md), [STEPS.md](STEPS.md)
- Operations docs: [OPERATIONS.md](OPERATIONS.md), [DEPLOYMENTS.md](DEPLOYMENTS.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Safety & policy docs: [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md), [TESTING.md](TESTING.md)
- People & history docs: [CONTRIBUTION.md](CONTRIBUTION.md), [HUMAN.md](HUMAN.md), [DECISIONS.md](DECISIONS.md), [CONVERSATION.md](CONVERSATION.md), [FILES.md](FILES.md)

## Format of an entry

```
## [x.y.z] — YYYY-MM-DD
### Added / Changed / Deprecated / Removed / Fixed / Security
- Change in user-visible language; link FR/task IDs; ADR links for why.
```

Rules:

1. **Never** edit a released entry (history is history); mistakes get a new entry that corrects the record.
2. Breaking changes must say what breaks, what replaces it, and the sunset date ([SPECIFICATION.md](SPECIFICATION.md) §8 policy).
3. Security fixes get their own `Security` section; details stay in the private advisory, only summary here.
4. Every released link to `docs/` must have valid anchor targets — link rot check is part of the release checklist ([DEPLOYMENTS.md](DEPLOYMENTS.md) §9).
