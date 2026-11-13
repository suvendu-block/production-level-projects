# AI Agent-Based Application Testing Platform

> An AI-powered application testing platform that uses bounded autonomous browser agents to explore authorized web applications, execute tests with Playwright, detect failures, collect evidence, and generate actionable reports.

**Status:** Architecture and implementation blueprint  
**Primary language:** TypeScript  
**Architecture:** Monorepo, modular control plane, distributed workers  
**Local environment:** Docker Compose  
**Production direction:** Container orchestration, isolated browser execution, durable job processing, observability, and horizontal worker scaling

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [Core Features](#4-core-features)
5. [Architecture](#5-architecture)
6. [Technology Stack](#6-technology-stack)
7. [System Workflow](#7-system-workflow)
8. [Repository Structure](#8-repository-structure)
9. [Prerequisites](#9-prerequisites)
10. [Local Development Setup](#10-local-development-setup)
11. [Environment Variables](#11-environment-variables)
12. [Docker Compose](#12-docker-compose)
13. [Database Design](#13-database-design)
14. [Domain Model and Relationships](#14-domain-model-and-relationships)
15. [API Design](#15-api-design)
16. [Queue and Job Design](#16-queue-and-job-design)
17. [AI Agent Architecture](#17-ai-agent-architecture)
18. [Browser Action Contract](#18-browser-action-contract)
19. [Browser Execution and Isolation](#19-browser-execution-and-isolation)
20. [Security Model](#20-security-model)
21. [Run Lifecycle and State Machines](#21-run-lifecycle-and-state-machines)
22. [Failure Handling and Recovery](#22-failure-handling-and-recovery)
23. [Artifact and Finding Management](#23-artifact-and-finding-management)
24. [Real-Time Updates](#24-real-time-updates)
25. [Frontend Architecture](#25-frontend-architecture)
26. [Backend Architecture](#26-backend-architecture)
27. [Worker Architecture](#27-worker-architecture)
28. [Observability](#28-observability)
29. [Testing Strategy](#29-testing-strategy)
30. [CI/CD](#30-cicd)
31. [Scaling Strategy](#31-scaling-strategy)
32. [Performance and Cost Controls](#32-performance-and-cost-controls)
33. [Data Retention and Privacy](#33-data-retention-and-privacy)
34. [Implementation Roadmap](#34-implementation-roadmap)
35. [Definition of Done](#35-definition-of-done)
36. [Known Risks and Trade-Offs](#36-known-risks-and-trade-offs)
37. [Troubleshooting](#37-troubleshooting)
38. [Contributing](#38-contributing)
39. [License](#39-license)
40. [Architecture Decisions](#40-architecture-decisions)

---

## 1. Project Overview

The AI Agent-Based Application Testing Platform lets a developer register a web application, describe a testing goal, configure a bounded number of simulated users, and start a test run.

The platform plans test scenarios, distributes agent sessions through a job queue, runs browser actions in isolated Playwright workers, collects evidence, analyzes failures, and presents results in a dashboard.

Example request:

> Test the staging application's registration flow. Check required-field validation, successful navigation after valid registration, and whether errors are displayed clearly. Use a maximum of five agents and twenty actions per agent.

The system should produce:
- A run summary and final status.
- Agent-by-agent execution timelines.
- Action history and observations.
- Screenshots, logs, and optional Playwright traces.
- Findings with severity, evidence, and reproduction steps.
- Resource usage and AI cost estimates.

### Product principles

1. **Evidence before conclusions:** an AI explanation is not a confirmed bug without supporting observations.
2. **Bounded autonomy:** the model may choose only from explicitly supported browser actions.
3. **Durable state:** PostgreSQL is the business source of truth; queues are delivery mechanisms.
4. **Isolation by default:** every test session has restricted browser, filesystem, and network access.
5. **Observable execution:** each run can be inspected and diagnosed.
6. **Incremental complexity:** start with one deterministic worker and scale only after correctness is proven.

---

## 2. Problem Statement

Manual testing and fixed end-to-end scripts have limitations:
- Scripts can break when application layouts change.
- Test coverage depends on the scenarios engineers explicitly write.
- Failures can be difficult to reproduce without evidence.
- Running many independent test sessions requires scheduling and resource management.
- AI-generated test steps can be invalid, unsafe, expensive, or nondeterministic.

This platform combines deterministic browser automation with AI-based scenario selection and bounded action planning. Playwright executes actions; application code enforces policy, budgets, timeouts, persistence, and recovery.

---

## 3. Goals and Non-Goals

### Goals

- Test only applications and environments that the user is authorized to test.
- Support projects, organizations, members, and access roles.
- Create test runs from natural-language goals.
- Generate structured test scenarios with an LLM.
- Execute multiple agent sessions concurrently.
- Record action-level history and evidence.
- Detect console errors, failed requests, and assertion failures.
- Deduplicate findings using stable fingerprints.
- Support cancellation, retries, deadlines, and recovery.
- Stream run progress to the dashboard.
- Enforce resource, concurrency, and LLM usage limits.
- Provide a path from local Docker Compose to a horizontally scaled worker fleet.

### Non-goals for the first release

- Unrestricted autonomous browsing of arbitrary websites.
- Unrestricted shell, filesystem, or JavaScript execution by an LLM.
- Production destructive actions or real financial transactions.
- Guaranteed detection of every bug.
- Treating simulated browser sessions as equivalent to real-user load testing.
- Starting with Kubernetes before the Compose-based system is reliable.
- Claiming exactly-once execution for browser side effects.

For high-volume HTTP load generation, integrate a dedicated tool such as k6 rather than opening thousands of full browser instances.

---

## 4. Core Features

### MVP features

- Project registration and authorized target host configuration.
- Authentication and organization membership.
- Test run creation and status tracking.
- Fixed test scenarios executed with Playwright.
- PostgreSQL persistence.
- BullMQ jobs backed by Redis.
- Screenshots and action logs.
- A basic Next.js dashboard.

### AI features

- Natural-language test goal interpretation.
- Structured scenario generation.
- AI selection of the next permitted action.
- Observation-based action planning.
- Failure explanation grounded in logs and screenshots.
- Finding deduplication and severity suggestions.
- Explicit indication when evidence is insufficient.

### Distributed-system features

- Separate API and worker processes.
- Queue-based execution.
- Per-run and per-organization concurrency limits.
- Retry policy and dead-letter handling strategy.
- Worker heartbeats or leases.
- Idempotent processing.
- Transactional outbox for reliable job publication.
- Graceful cancellation and shutdown.
- Queue and execution metrics.

### Production-oriented features

- Multi-tenant authorization.
- Audit logs.
- Artifact object storage.
- Usage accounting and quotas.
- OpenTelemetry-compatible tracing.
- CI pipelines and security checks.
- Worker autoscaling when deployed to a suitable orchestrator.

---

## 5. Architecture

### High-level architecture

```mermaid
flowchart TB
    U[Developer] --> W[Next.js Dashboard]
    W -->|HTTPS / WebSocket| API[NestJS API / Control Plane]

    API --> PG[(PostgreSQL)]
    API --> R[(Redis)]
    API --> O[Transactional Outbox]

    O --> D[Outbox Dispatcher]
    D --> Q[BullMQ Queues]

    Q --> OR[Run Orchestrator]
    OR --> PLAN[AI Scenario Planner]
    PLAN --> Q

    Q --> BW[Isolated Playwright Workers]
    BW --> LLM[LLM Provider Adapter]
    BW --> PG
    BW --> S3[(S3-Compatible Artifact Storage)]

    BW --> EV[Run Events]
    EV --> R
    R --> API

    API --> W
```

### Control plane

Responsible for:
- Authentication and authorization.
- Organization, project, and membership management.
- Target-domain authorization.
- Test-run creation, cancellation, and status retrieval.
- Quotas, rate limits, and concurrency policies.
- API and WebSocket access control.

### Execution plane

Responsible for:
- Scenario planning.
- Queue consumption.
- Agent-session lifecycle.
- Browser session creation.
- Action validation and execution.
- Evidence collection and failure analysis.
- Retries, deadlines, and worker recovery.

### Data plane

Responsible for:
- Durable application state in PostgreSQL.
- Queue coordination in Redis.
- Screenshots, traces, videos, and logs in object storage.
- Metrics, logs, and distributed traces.

### Architectural rule

Start with a **modular monolith plus separate worker process**. Do not create a microservice for every module. The API and worker can share domain packages while running and scaling independently.

PostgreSQL is the source of truth. Redis and BullMQ coordinate work but must not be the only record of whether a test run exists or has completed.

---

## 6. Technology Stack

| Area | Technology | Responsibility |
|---|---|---|
| Language | TypeScript | Shared language across web, API, and worker |
| Runtime | Node.js LTS | Application runtime |
| Monorepo | pnpm workspaces + Turborepo | Dependency and task management |
| Frontend | Next.js + React | Dashboard and project management |
| UI | Tailwind CSS | Styling |
| Client data | TanStack Query | Server-state fetching and caching |
| Forms | React Hook Form + Zod | Form state and validation |
| Backend | NestJS | Modular API and application services |
| API validation | class-validator / class-transformer | Request DTO validation |
| Shared schemas | Zod | Shared contracts and LLM output validation |
| Database | PostgreSQL | Durable relational state |
| ORM | Prisma | Database queries and migrations |
| Queue | BullMQ | Job scheduling, retries, concurrency |
| Queue storage | Redis | Queue and transient coordination state |
| Browser automation | Playwright | Browser control and evidence |
| AI | LLM provider SDK behind an adapter | Scenario and action planning |
| Real-time | Socket.IO / WebSockets | Live run progress |
| Object storage | S3-compatible storage | Screenshots, traces, reports |
| Local containers | Docker + Docker Compose | Repeatable development environment |
| Logging | Pino or structured JSON logger | Searchable application logs |
| Tracing | OpenTelemetry | Cross-process traces |
| Metrics | Prometheus-compatible metrics | Queue, worker, and API health |
| CI | GitHub Actions | Lint, typecheck, tests, builds |
| Load testing | k6 | API and non-browser traffic testing |
| Infrastructure | Terraform (later) | Repeatable cloud infrastructure |
| Orchestration | Kubernetes or managed containers (later) | Worker scaling and scheduling |

### Version policy

- Use a supported Node.js LTS version.
- Commit `pnpm-lock.yaml`.
- Pin Playwright package and browser-image versions to compatible releases.
- Choose one Prisma major version and follow its matching configuration and generation requirements.
- Avoid unpinned `latest` tags in production.
- Upgrade dependencies deliberately and run the full test suite after upgrades.

---

## 7. System Workflow

### Starting a test run

1. The user authenticates and selects an organization.
2. The user creates or selects a project.
3. The API verifies membership and project access.
4. The API validates the target URL against the project's authorized hosts.
5. The API validates the run configuration and usage limits.
6. A database transaction creates a `TestRun` and an outbox event.
7. An outbox dispatcher publishes a planning job to BullMQ.
8. The planner generates structured scenarios and validates them.
9. The orchestrator creates `AgentSession` records.
10. Agent execution jobs are published to the appropriate queue.

### Executing an agent session

1. A worker claims a job.
2. The worker validates the run status, deadline, and cancellation state.
3. The worker launches or obtains a suitably isolated browser session.
4. The worker captures a bounded observation.
5. The LLM selects one action from the approved schema.
6. The policy layer validates the action, destination, target, and budget.
7. Playwright executes the action with a timeout.
8. The worker records the result and relevant evidence.
9. The worker observes the new browser state.
10. The loop continues until the agent finishes or reaches a limit.

### Finishing a run

1. All agent sessions reach a terminal state, or the run deadline expires.
2. The orchestrator reconciles agent outcomes.
3. Failure-analysis jobs process collected evidence.
4. Findings are deduplicated.
5. The run is marked `COMPLETED`, `FAILED`, or `CANCELLED`.
6. A final report is persisted.
7. The dashboard receives the terminal status and displays evidence.

A run can be technically completed while containing failed tests. Keep execution status separate from test outcome if richer reporting is needed; for example, add a run-level outcome such as `PASS`, `FAIL`, or `INCONCLUSIVE`.

---

## 8. Repository Structure

```text
ai-test-platform/
├── apps/
│   ├── web/                            # Next.js dashboard
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/
│   │       │   ├── dashboard/
│   │       │   ├── organizations/
│   │       │   ├── projects/
│   │       │   └── runs/[runId]/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── projects/
│   │       │   ├── test-runs/
│   │       │   ├── agents/
│   │       │   ├── findings/
│   │       │   └── artifacts/
│   │       ├── hooks/
│   │       └── lib/
│   │
│   ├── api/                            # NestJS control plane
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── common/
│   │       ├── auth/
│   │       ├── organizations/
│   │       ├── memberships/
│   │       ├── projects/
│   │       ├── test-runs/
│   │       ├── agent-planner/
│   │       ├── orchestration/
│   │       ├── queues/
│   │       ├── results/
│   │       ├── findings/
│   │       ├── artifacts/
│   │       ├── events/
│   │       ├── outbox/
│   │       └── health/
│   │
│   └── worker/                         # Independent worker process
│       └── src/
│           ├── main.ts
│           ├── config/
│           ├── queues/
│           ├── processors/
│           ├── orchestrator/
│           ├── agents/
│           │   ├── agent-loop.ts
│           │   ├── action-policy.ts
│           │   ├── action-executor.ts
│           │   ├── observation.ts
│           │   └── budget-manager.ts
│           ├── browser/
│           │   ├── browser-factory.ts
│           │   ├── browser-session.ts
│           │   ├── network-guard.ts
│           │   └── artifact-capture.ts
│           ├── llm/
│           │   ├── llm-client.ts
│           │   ├── provider-adapter.ts
│           │   └── prompts/
│           ├── recovery/
│           └── telemetry/
│
├── packages/
│   ├── contracts/
│   │   └── src/
│   │       ├── browser-action.ts
│   │       ├── test-run.ts
│   │       └── events.ts
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   ├── queue-contracts/
│   ├── config/
│   └── observability/
│
├── infra/
│   ├── docker/
│   │   ├── web.Dockerfile
│   │   ├── api.Dockerfile
│   │   └── worker.Dockerfile
│   ├── prometheus/
│   └── terraform/                      # Later
│
├── tests/
│   ├── integration/
│   ├── contract/
│   ├── security/
│   └── load/
│
├── compose.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
└── README.md
```

### Module responsibilities

- `auth`: identity, session/token validation, authentication guards.
- `organizations` and `memberships`: tenant boundaries and roles.
- `projects`: registered apps and authorized hosts.
- `test-runs`: run creation, cancellation, and state transitions.
- `agent-planner`: scenario generation and validation.
- `orchestration`: run scheduling and agent lifecycle coordination.
- `queues`: queue producers and job configuration.
- `results` and `findings`: outcomes, evidence, and deduplication.
- `artifacts`: metadata and access to object storage.
- `outbox`: reliable publication of database events to queues.
- `agents`: bounded AI loop and policy enforcement.
- `browser`: Playwright lifecycle and network controls.

Keep controllers thin. Put business rules in application/domain services. Keep queue processors as adapters that validate a job, invoke a service, and translate errors into retryable or terminal outcomes.

---

## 9. Prerequisites

Install the following:

- Git
- Node.js LTS
- pnpm
- Docker Engine or Docker Desktop
- Docker Compose v2
- An LLM provider API key for AI features

Verify:

```bash
node --version
pnpm --version
docker --version
docker compose version
git --version
```

A machine with limited RAM can develop the API and database first. Running multiple Chromium sessions is memory-intensive; start with one or two browser workers and increase concurrency only after measuring resource use.

---

## 10. Local Development Setup

> The repository structure in this document is the target architecture. The commands below are a setup guide, not a claim that every application file and Dockerfile already exists.

### 10.1 Create the workspace

```bash
mkdir ai-test-platform
cd ai-test-platform
pnpm init
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create the web app:

```bash
pnpm dlx create-next-app@latest apps/web
```

Create the NestJS API:

```bash
pnpm dlx @nestjs/cli new apps/api --package-manager pnpm
```

Create the worker application using NestJS CLI or a minimal TypeScript Node application. The worker should be an independently runnable process and should not expose a public API by default.

Create shared packages for contracts, database access, queue payloads, configuration, and observability. Configure TypeScript path aliases or workspace package exports consistently.

### 10.2 Install dependencies

**API workspace:**

```bash
pnpm --filter api add @nestjs/config @nestjs/bullmq bullmq
pnpm --filter api add @nestjs/websockets @nestjs/platform-socket.io
pnpm --filter api add class-validator class-transformer
pnpm --filter api add @prisma/client zod
pnpm --filter api add -D prisma
```

**Worker workspace:**

```bash
pnpm --filter worker add bullmq ioredis playwright zod pino
pnpm --filter worker add @prisma/client
```

**Web workspace:**

```bash
pnpm --filter web add socket.io-client @tanstack/react-query
pnpm --filter web add zod react-hook-form
```

If workspace package names differ, update the `--filter` selectors accordingly. Install only dependencies that the relevant application actually uses.

### 10.3 Start infrastructure

```bash
cp .env.example .env
# Edit .env and replace local secrets.

docker compose up -d postgres redis
docker compose ps
```

Generate the Prisma client and run migrations from the configured database package:

```bash
pnpm --filter database exec prisma generate
pnpm --filter database exec prisma migrate dev --name init
```

These commands assume the Prisma schema and package scripts have been created as shown in the database package layout. Adjust the filter if Prisma lives in a different workspace.

### 10.4 Start the applications

Once the applications and scripts exist:

```bash
pnpm --filter api dev
pnpm --filter worker dev
pnpm --filter web dev
```

For the full Docker Compose environment:

```bash
docker compose up --build
```

---

## 11. Environment Variables

Create `.env.example` and commit it. Keep the real `.env` out of version control.

```dotenv
# General
NODE_ENV=development
LOG_LEVEL=debug

# Database
POSTGRES_USER=app
POSTGRES_PASSWORD=replace-with-a-local-secret
POSTGRES_DB=ai_testing
DATABASE_URL=postgresql://app:replace-with-a-local-secret@localhost:5432/ai_testing

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
API_PORT=3001
WEB_ORIGIN=http://localhost:3000
PUBLIC_API_URL=http://localhost:3001

# AI provider - adapt to the chosen SDK
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=
LLM_TIMEOUT_MS=30000

# Agent limits
DEFAULT_MAX_AGENTS=5
DEFAULT_MAX_STEPS_PER_AGENT=20
DEFAULT_RUN_TIMEOUT_SECONDS=900
DEFAULT_ACTION_TIMEOUT_MS=15000
MAX_CONCURRENT_SESSIONS_PER_ORG=5

# Object storage - values depend on the chosen provider
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_REGION=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=

# Authentication - use strong random secrets
SESSION_SECRET=replace-with-a-long-random-secret
```

Validate environment variables at startup. Fail fast if a required production variable is missing. Never expose provider keys, database URLs, storage credentials, session secrets, or private configuration through the Next.js client bundle.

---

## 12. Docker Compose

The local Compose stack should contain:

- `postgres`: durable relational database.
- `redis`: queue coordination and persistence.
- `api`: NestJS control plane.
- `worker`: BullMQ consumer and Playwright execution.
- `web`: Next.js dashboard.
- `minio` or another S3-compatible service: optional local artifact storage.

Example starting point:

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
      POSTGRES_DB: ai_testing
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d ai_testing"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: .
      dockerfile: infra/docker/api.Dockerfile
    env_file: .env
    environment:
      DATABASE_URL: postgresql://app:${POSTGRES_PASSWORD}@postgres:5432/ai_testing
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "127.0.0.1:3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    build:
      context: .
      dockerfile: infra/docker/worker.Dockerfile
    env_file: .env
    environment:
      DATABASE_URL: postgresql://app:${POSTGRES_PASSWORD}@postgres:5432/ai_testing
      REDIS_HOST: redis
      REDIS_PORT: 6379
      WORKER_CONCURRENCY: 2
    init: true
    shm_size: 1gb
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: infra/docker/web.Dockerfile
    env_file: .env
    environment:
      API_INTERNAL_URL: http://api:3001
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

This Compose file is a template. It requires working Dockerfiles, matching application ports, valid environment variables, and a Prisma migration strategy before the complete stack can start.

### Docker rules

- Use service names (`postgres`, `redis`) for connections inside the Compose network, not `localhost`.
- Bind development ports to loopback where possible.
- Do not commit secrets.
- Run migrations through a controlled one-off job or deployment step.
- Use non-root application users.
- Avoid mounting the Docker socket into browser workers.
- Do not run untrusted browser sessions with `privileged: true`.
- Use a Playwright browser image compatible with the installed Playwright version.
- Add network egress restrictions outside the browser process.

Compose is for local development and small controlled deployments. Production autoscaling requires an orchestrator or managed container platform.

---

## 13. Database Design

PostgreSQL stores durable business data. Redis stores queue and coordination data. Large binary artifacts live in object storage.

### Initial entities

| Entity | Purpose | Key relationships |
|---|---|---|
| `User` | Account identity | Has memberships |
| `Organization` | Tenant | Has memberships and projects |
| `Membership` | User role within a tenant | Links user and organization |
| `Project` | Registered application | Belongs to an organization |
| `TestRun` | One testing execution | Belongs to a project |
| `AgentSession` | One simulated browser user | Belongs to a run |
| `TestAction` | Proposed/executed action history | Belongs to an agent session |
| `Finding` | Potential or confirmed issue | Belongs to a run; optionally an agent |
| `Artifact` | Metadata for evidence files | Belongs to a run; optionally an agent |
| `UsageRecord` | Token, time, or resource accounting | Belongs to a run |
| `OutboxEvent` | Reliable event publication | Independent durable event record |
| `AuditEvent` | Security-sensitive actions | References actor and affected resource |

### Core fields and constraints

#### User
- `id`: UUID primary key.
- `email`: unique normalized email.
- `passwordHash`: nullable if using external identity provider.
- `createdAt`, `updatedAt`.

#### Organization
- `id`, `name`, `createdAt`.

#### Membership
- `userId`, `organizationId`, `role`.
- Unique constraint on `(userId, organizationId)`.
- Roles: `OWNER`, `ADMIN`, `MEMBER`.

#### Project
- `organizationId`, `name`, `baseUrl`, `allowedHosts`.
- The API must validate URL and hostname policy at creation and execution.
- Index `(organizationId, createdAt)`.

#### TestRun
- `projectId`, `status`, `goal`, `config`.
- `maxAgents`, `maxStepsPerAgent`, `deadlineAt`.
- `startedAt`, `completedAt`, `failureReason`.
- Index `(projectId, createdAt)` and `(status, createdAt)`.

#### AgentSession
- `testRunId`, `status`, `scenario`, `currentUrl`, `stepsUsed`.
- `startedAt`, `completedAt`, `errorMessage`.
- Index `(testRunId, status)`.

#### TestAction
- `agentSessionId`, `sequence`, `actionType`, `input`, `status`, `observation`, `durationMs`.
- Unique constraint on `(agentSessionId, sequence)`.
- Never store secrets in action inputs or observations.

#### Finding
- `testRunId`, optional `agentSessionId`, `title`, `description`.
- `severity`, `status`, `fingerprint`, `evidence`.
- Unique constraint on `(testRunId, fingerprint)`.

#### Artifact
- `testRunId`, optional `agentSessionId`, `type`, `storageKey`.
- `contentType`, `sizeBytes`, `metadata`.
- Store object keys, not public artifact URLs.

#### UsageRecord
- `testRunId`, optional `agentSessionId`, `metric`, `quantity`, `unit`.
- Record model tokens, browser duration, and other measurable usage.

#### OutboxEvent
- `id`, `eventType`, `payload`, `createdAt`, `publishedAt`, `attempts`.
- Dispatcher retries publication until the event is delivered.
- Use a stable event ID as an idempotency key.

### Prisma schema starter

The following is a compact starting schema. Validate it with the Prisma version chosen for the project and extend it as the implementation evolves.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
}

enum RunStatus {
  QUEUED
  PLANNING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum AgentStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum ActionStatus {
  PROPOSED
  APPROVED
  EXECUTING
  SUCCEEDED
  FAILED
  REJECTED
}

enum FindingSeverity {
  INFO
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum FindingStatus {
  OPEN
  CONFIRMED
  FALSE_POSITIVE
  RESOLVED
}

enum ArtifactType {
  SCREENSHOT
  TRACE
  VIDEO
  LOG
  REPORT
}

model User {
  id           String       @id @default(uuid()) @db.Uuid
  email        String       @unique
  passwordHash String?
  memberships  Membership[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Organization {
  id          String       @id @default(uuid()) @db.Uuid
  name        String
  memberships Membership[]
  projects    Project[]
  createdAt   DateTime     @default(now())
}

model Membership {
  id             String       @id @default(uuid()) @db.Uuid
  userId         String       @db.Uuid
  organizationId String       @db.Uuid
  role           OrgRole      @default(MEMBER)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())

  @@unique([userId, organizationId])
  @@index([organizationId, role])
}

model Project {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @db.Uuid
  name           String
  baseUrl        String
  allowedHosts   String[]
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  runs           TestRun[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([organizationId, createdAt])
}

model TestRun {
  id               String       @id @default(uuid()) @db.Uuid
  projectId        String       @db.Uuid
  status           RunStatus    @default(QUEUED)
  goal             String
  config           Json
  maxAgents        Int          @default(5)
  maxStepsPerAgent Int          @default(20)
  deadlineAt       DateTime
  startedAt        DateTime?
  completedAt      DateTime?
  failureReason    String?
  project          Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agents           AgentSession[]
  findings         Finding[]
  artifacts        Artifact[]
  usageRecords     UsageRecord[]
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([projectId, createdAt])
  @@index([status, createdAt])
}

model AgentSession {
  id           String       @id @default(uuid()) @db.Uuid
  testRunId    String       @db.Uuid
  status       AgentStatus  @default(QUEUED)
  scenario     Json
  currentUrl   String?
  stepsUsed    Int          @default(0)
  startedAt    DateTime?
  completedAt  DateTime?
  errorMessage String?
  testRun      TestRun      @relation(fields: [testRunId], references: [id], onDelete: Cascade)
  actions      TestAction[]
  findings     Finding[]
  artifacts    Artifact[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([testRunId, status])
}

model TestAction {
  id             String       @id @default(uuid()) @db.Uuid
  agentSessionId String       @db.Uuid
  sequence       Int
  actionType     String
  input          Json
  status         ActionStatus @default(PROPOSED)
  observation    Json?
  errorMessage   String?
  durationMs     Int?
  agentSession   AgentSession @relation(fields: [agentSessionId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())

  @@unique([agentSessionId, sequence])
  @@index([agentSessionId, createdAt])
}

model Finding {
  id             String          @id @default(uuid()) @db.Uuid
  testRunId      String          @db.Uuid
  agentSessionId String?         @db.Uuid
  title          String
  description    String
  severity       FindingSeverity @default(MEDIUM)
  status         FindingStatus   @default(OPEN)
  fingerprint    String
  evidence       Json?
  testRun        TestRun         @relation(fields: [testRunId], references: [id], onDelete: Cascade)
  agentSession   AgentSession?   @relation(fields: [agentSessionId], references: [id], onDelete: SetNull)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@unique([testRunId, fingerprint])
  @@index([testRunId, severity])
}

model Artifact {
  id             String        @id @default(uuid()) @db.Uuid
  testRunId      String        @db.Uuid
  agentSessionId String?       @db.Uuid
  type           ArtifactType
  storageKey     String
  contentType    String
  sizeBytes      BigInt?
  metadata       Json?
  testRun        TestRun       @relation(fields: [testRunId], references: [id], onDelete: Cascade)
  agentSession   AgentSession? @relation(fields: [agentSessionId], references: [id], onDelete: SetNull)
  createdAt      DateTime      @default(now())

  @@index([testRunId, type])
}

model UsageRecord {
  id             String   @id @default(uuid()) @db.Uuid
  testRunId      String   @db.Uuid
  agentSessionId String?  @db.Uuid
  metric         String
  quantity       Decimal  @db.Decimal(20, 6)
  unit           String
  metadata       Json?
  testRun        TestRun  @relation(fields: [testRunId], references: [id], onDelete: Cascade)
  createdAt      DateTime @default(now())

  @@index([testRunId, metric])
}

model OutboxEvent {
  id          String    @id @default(uuid()) @db.Uuid
  eventType   String
  payload     Json
  attempts    Int       @default(0)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())

  @@index([publishedAt, createdAt])
}
```

### Database implementation rules

- Add `AuditEvent` and indexes for all common filtering patterns.
- Add tenant checks to every project/run query; UUIDs are not authorization.
- Use database transactions for related writes.
- Use an outbox to bridge database commits and queue publication.
- Use stable fingerprints to deduplicate findings.
- Use object storage for large files.
- Use pagination for action history and findings.
- Define retention policies before collecting sensitive data at scale.
- Consider partitioning high-volume event tables only after measurements justify it.

---

## 14. Domain Model and Relationships

```mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ MEMBERSHIP : includes
    ORGANIZATION ||--o{ PROJECT : owns
    PROJECT ||--o{ TEST_RUN : contains
    TEST_RUN ||--o{ AGENT_SESSION : schedules
    AGENT_SESSION ||--o{ TEST_ACTION : records
    TEST_RUN ||--o{ FINDING : reports
    AGENT_SESSION o|--o{ FINDING : discovers
    TEST_RUN ||--o{ ARTIFACT : stores
    AGENT_SESSION o|--o{ ARTIFACT : produces
    TEST_RUN ||--o{ USAGE_RECORD : accounts
```

Keep identity, tenant authorization, execution state, and evidence separate. This makes it easier to change the execution engine without redesigning user and project management.

---

## 15. API Design

Prefix endpoints with `/api/v1`. Require authentication except for explicitly public health checks.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/organizations` | Create an organization |
| `GET` | `/api/v1/organizations` | List organizations accessible to the user |
| `POST` | `/api/v1/projects` | Register a project |
| `GET` | `/api/v1/projects` | List accessible projects |
| `GET` | `/api/v1/projects/:projectId` | Get project details |
| `PATCH` | `/api/v1/projects/:projectId` | Update project configuration |
| `POST` | `/api/v1/projects/:projectId/runs` | Create a test run |
| `GET` | `/api/v1/runs/:runId` | Get run status and summary |
| `GET` | `/api/v1/runs/:runId/agents` | List agent sessions |
| `GET` | `/api/v1/runs/:runId/actions` | Retrieve paginated actions |
| `GET` | `/api/v1/runs/:runId/findings` | List findings |
| `POST` | `/api/v1/runs/:runId/cancel` | Request cancellation |
| `GET` | `/api/v1/findings/:findingId` | Get finding details |
| `GET` | `/api/v1/artifacts/:artifactId` | Authorize artifact access |
| `GET` | `/health/live` | Process liveness |
| `GET` | `/health/ready` | Dependency readiness |

### Example: create a project

Request:

```json
{
  "name": "Staging application",
  "baseUrl": "https://staging.example.com",
  "allowedHosts": ["staging.example.com"]
}
```

The server must validate that the URL is permitted, that the hostname matches policy, and that the caller has permission to create a project in the selected organization.

### Example: create a test run

Request:

```json
{
  "goal": "Verify registration validation and successful navigation",
  "maxAgents": 5,
  "maxStepsPerAgent": 20,
  "timeoutSeconds": 900
}
```

The API must enforce server-side maximums regardless of the client-provided values. Return `202 Accepted` with a run ID when the request is durably accepted.

Example response:

```json
{
  "runId": "00000000-0000-4000-8000-000000000001",
  "status": "QUEUED"
}
```

The ID above is illustrative, not a real run.

### API conventions

- Use DTO validation and a consistent error format.
- Use cursor-based pagination for large histories.
- Use idempotency keys for run creation.
- Return `401` for unauthenticated requests and `403` for unauthorized access.
- Return `404` when resource visibility policy requires hiding existence.
- Do not return internal stack traces to clients.
- Apply per-user and per-organization rate limits.
- Authorize every WebSocket subscription and artifact request.

---

## 16. Queue and Job Design

Use distinct queues for planning, execution, analysis, artifacts, and maintenance.

| Queue | Job | Responsibility |
|---|---|---|
| `planning` | `plan-run` | Generate and validate scenarios |
| `agent-execution` | `execute-agent` | Execute one bounded agent session |
| `analysis` | `analyze-failure` | Analyze evidence and create findings |
| `artifacts` | `upload-artifact` | Upload screenshots and traces |
| `maintenance` | `reconcile-run` | Recover or finalize stale runs |

### Example job payload

```typescript
export interface AgentExecutionJob {
  runId: string;
  agentSessionId: string;
  projectId: string;
  attemptId: string;
  deadlineAt: string;
  maxSteps: number;
}
```

Job payloads should contain identifiers and bounded configuration, not credentials, cookies, complete DOM snapshots, or API keys.

### Queue reliability

- Use stable job IDs where suitable.
- Make processors idempotent.
- Configure exponential backoff for transient failures.
- Do not retry invalid input, denied actions, or expired deadlines indefinitely.
- Use a dead-letter or failed-job review strategy.
- Track queue age and stalled jobs.
- Persist execution state in PostgreSQL.
- Implement an outbox dispatcher.
- Reconcile incomplete runs after process restarts.

BullMQ provides retries and job processing semantics, but a queue retry does not make browser side effects exactly-once. A worker may crash after an action succeeds and before its result is saved. Re-observe the browser before retrying a potentially non-idempotent action.

---

## 17. AI Agent Architecture

### Agent loop

Use a bounded loop:

1. **Observe:** collect current URL, relevant visible elements, bounded accessibility information, and recent browser errors.
2. **Plan:** ask the LLM to choose the next action from a strict schema.
3. **Validate:** parse the output and enforce target, domain, action, and budget policies.
4. **Execute:** run the approved action through a deterministic Playwright adapter.
5. **Verify:** inspect the resulting browser state and assertions.
6. **Persist:** record action, outcome, duration, and relevant evidence.
7. **Repeat:** continue until completion, cancellation, timeout, or budget exhaustion.

### LLM provider abstraction

Define an application-owned interface rather than importing a provider SDK throughout the codebase.

```typescript
export interface AgentPlanner {
  plan(input: {
    goal: string;
    observation: unknown;
    allowedActions: string[];
  }): Promise<unknown>;
}
```

Implement one provider adapter initially. Validate every response with Zod, apply a timeout, record usage, and handle rate limits. Keep prompts versioned so results can be reproduced and evaluated.

### Model input rules

- Send only the information needed for the current decision.
- Bound the length of page text and accessibility snapshots.
- Remove credentials and sensitive form values.
- Treat page content as untrusted data, not system instructions.
- Do not include cookies or authorization headers in prompts.
- Avoid sending full screenshots unless the task requires visual reasoning.
- Store prompt/model versions and usage metadata where appropriate.

### Model output rules

- Must match a strict action schema.
- Must not contain arbitrary JavaScript or shell commands.
- Must not choose an unapproved destination.
- Must not exceed action or input limits.
- Must pass deterministic policy validation before execution.

An LLM's own claim that an issue exists is not enough. Findings should cite observations, assertion results, screenshots, console errors, or other concrete evidence.

---

## 18. Browser Action Contract

Use a discriminated union to constrain model output.

Example `packages/contracts/src/browser-action.ts`:

```typescript
import { z } from "zod";

export const BrowserActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("click"),
    target: z.string().min(1).max(200)
  }).strict(),

  z.object({
    type: z.literal("fill"),
    target: z.string().min(1).max(200),
    value: z.string().max(2000)
  }).strict(),

  z.object({
    type: z.literal("navigate"),
    path: z.string().min(1).max(1000)
  }).strict(),

  z.object({
    type: z.literal("assert_text"),
    text: z.string().min(1).max(500)
  }).strict(),

  z.object({
    type: z.literal("screenshot")
  }).strict(),

  z.object({
    type: z.literal("finish"),
    summary: z.string().max(1000)
  }).strict()
]);

export type BrowserAction = z.infer<typeof BrowserActionSchema>;
```

### Action policy

- `click`: target a visible, permitted element.
- `fill`: target an approved form field; redact sensitive values from logs.
- `navigate`: accept only a relative path or a URL validated against the project's allowed origin policy.
- `assert_text`: check bounded visible text.
- `screenshot`: capture an allowed viewport and store the artifact privately.
- `finish`: stop the agent session and return a summary.

Use role/name locators or controlled element identifiers. Do not allow unrestricted CSS, XPath, JavaScript evaluation, or arbitrary browser context operations in the initial action set.

### Agent loop skeleton

```typescript
import {
  BrowserActionSchema,
  type BrowserAction
} from "@repo/contracts/browser-action";

interface AgentRuntime {
  observe(): Promise<unknown>;
  plan(observation: unknown): Promise<unknown>;
  authorize(action: BrowserAction): Promise<void>;
  execute(action: BrowserAction): Promise<unknown>;
  record(input: {
    action: BrowserAction;
    result: unknown;
  }): Promise<void>;
}

export async function runAgent(
  runtime: AgentRuntime,
  maxSteps = 20
): Promise<void> {
  for (let step = 0; step < maxSteps; step++) {
    const observation = await runtime.observe();
    const rawAction = await runtime.plan(observation);
    const parsed = BrowserActionSchema.safeParse(rawAction);

    if (!parsed.success) {
      throw new Error("Invalid AI action schema");
    }

    const action = parsed.data;

    await runtime.authorize(action);
    const result = await runtime.execute(action);
    await runtime.record({ action, result });

    if (action.type === "finish") return;
  }

  throw new Error("Agent step budget exhausted");
}
```

This is an orchestration skeleton, not a complete implementation. Add cancellation checks, deadlines, per-action timeouts, telemetry, durable state transitions, and safe recovery before production use.

---

## 19. Browser Execution and Isolation

### Browser lifecycle

Each agent session should have:
- A bounded execution deadline.
- A separate browser context and isolated session state.
- Restricted network access.
- A maximum number of actions.
- An explicit download policy.
- Limited artifact retention.
- Clean-up logic for normal completion and worker crashes.

A shared browser process may host multiple contexts for efficiency, but the isolation model must be assessed carefully. For stronger tenant isolation, use separate containers or jobs with restricted resources and network policies.

### Network safety and SSRF

A user-supplied URL is a potential server-side request forgery vector. Validate the initial URL and every subsequent navigation.

Block, unless explicitly allowed in a controlled test environment:
- Loopback destinations.
- Private network ranges.
- Link-local addresses.
- Cloud instance metadata endpoints.
- Disallowed ports and schemes.
- Redirects to forbidden hosts.
- DNS rebinding paths that resolve to forbidden addresses.

Application-level checks are not sufficient alone. Enforce egress policy at the container/network layer and re-check the actual destination after DNS resolution. Do not expose internal services to browser workers.

### Browser image

Use an official Playwright image or a controlled image based on a supported browser runtime. Pin the image to the same compatible Playwright version as the installed package.

Playwright's standard image is useful for browser automation, but visiting untrusted sites requires additional security isolation. Do not treat a container as a complete sandbox by default.

---

## 20. Security Model

### Authentication and authorization

- Use a maintained authentication solution.
- Hash passwords with a modern password-hashing algorithm if managing passwords.
- Prefer secure, HTTP-only cookies for browser sessions where appropriate.
- Enforce organization membership on every protected resource.
- Use least-privilege roles.
- Add CSRF protection where cookie-based authentication requires it.
- Rate-limit login, run creation, and other expensive endpoints.

### Secrets

- Store provider credentials in a secret manager in production.
- Do not expose secrets to the LLM.
- Do not put credentials into queue payloads.
- Redact tokens, cookies, passwords, and sensitive form data from logs.
- Use short-lived, scoped credentials for target applications when possible.

### Untrusted content and prompt injection

A tested website can contain malicious instructions intended to influence an agent. Treat page text, HTML, accessibility labels, and downloaded content as untrusted input.

The policy engine, not the LLM, must enforce permissions. An instruction embedded in a page must not override system policy, host restrictions, action limits, or tool permissions.

### Data isolation

- Apply tenant checks in the service/data-access layer.
- Authorize every artifact download.
- Use short-lived signed object URLs.
- Avoid public artifact buckets.
- Apply retention and deletion policies.
- Keep audit events for sensitive actions.
- Encrypt traffic and stored secrets in production.

### Destructive actions

The initial platform should use test accounts and seeded data. Block real payments, destructive production operations, account deletion, external messaging, and other irreversible side effects by default. Add explicit environment controls and approval gates before considering such capabilities.

---

## 21. Run Lifecycle and State Machines

### Test run states

```mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> PLANNING
    PLANNING --> RUNNING
    QUEUED --> CANCELLED
    PLANNING --> CANCELLED
    RUNNING --> COMPLETED
    RUNNING --> FAILED
    RUNNING --> CANCELLED
```

Define valid transitions centrally. Do not allow arbitrary status changes from controllers or workers.

### Agent session states

```mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> RUNNING
    QUEUED --> CANCELLED
    RUNNING --> COMPLETED
    RUNNING --> FAILED
    RUNNING --> CANCELLED
```

### Cancellation

Cancellation is a request, not an instantaneous guarantee:
1. Persist the cancellation request.
2. Stop scheduling new agent jobs.
3. Notify active workers.
4. Abort supported browser operations.
5. Close browser contexts and release resources.
6. Mark unfinished sessions cancelled.
7. Finalize the run after reconciliation.

### Execution status versus test outcome

Keep operational status separate from the result:
- Execution status: `COMPLETED`, `FAILED`, `CANCELLED`.
- Test outcome: `PASS`, `FAIL`, `INCONCLUSIVE`.

A completed run can have a failed test outcome. A worker crash can produce a failed execution without a valid test conclusion.

---

## 22. Failure Handling and Recovery

| Failure | Expected behavior |
|---|---|
| LLM timeout | Retry within budget; otherwise mark planning/action failure |
| Invalid model output | Reject; optionally request one constrained correction |
| Browser crash | Record evidence if possible; retry according to policy |
| Worker termination | Reconcile lease and recover or fail the session |
| Redis interruption | Stop accepting work that cannot be durably scheduled |
| PostgreSQL interruption | Do not claim successful persistence |
| Duplicate queue delivery | Idempotency check prevents duplicate logical processing |
| Artifact upload failure | Retry upload without repeating browser actions |
| Target unavailable | Record a target connectivity finding or inconclusive result |
| Run deadline exceeded | Request cancellation and terminate remaining work |
| Budget exceeded | Stop scheduling actions and finalize with a clear reason |

### Transactional outbox

The database write and Redis enqueue are not one atomic transaction. A process could commit a `TestRun` and crash before publishing its job.

Use this pattern:
1. Create the run and outbox event in one PostgreSQL transaction.
2. A dispatcher claims unpublished events.
3. The dispatcher publishes to BullMQ.
4. It records successful publication.
5. Failed events are retried.
6. Consumers deduplicate using stable event or job identifiers.

The consumer must still be idempotent because a dispatcher may publish successfully and crash before marking the outbox event as published.

### Leases and recovery

Store or derive a worker lease/heartbeat for active sessions. A recovery process should:
- Find sessions whose lease has expired.
- Check the durable run status and deadline.
- Determine whether the session can safely resume.
- Retry only if action progress is sufficiently known.
- Otherwise mark the session failed or inconclusive.

Never blindly replay non-idempotent actions such as submitting a form.

---

## 23. Artifact and Finding Management

### Artifacts

Store files in private object storage. PostgreSQL holds the artifact metadata.

Artifact types:
- Screenshot.
- Playwright trace.
- Video, if enabled.
- Browser console log.
- Failed network request report.
- Final run report.

Use generated storage keys, not user-controlled paths. Apply size limits, content-type checks, retention policies, and authorization on downloads.

### Findings

A finding should include:
- Title and description.
- Severity suggestion.
- Reproduction steps.
- Relevant action IDs.
- Evidence references.
- Browser and environment metadata.
- Confidence or verification status.
- Stable deduplication fingerprint.

### Evidence quality

Prefer deterministic signals:
- Failed assertion.
- Unexpected HTTP response.
- Uncaught JavaScript error.
- Reproducible timeout.
- Broken navigation or missing expected element.

LLM explanations should be marked as AI-generated and grounded in evidence. A human or deterministic verification step may be required before labeling a security vulnerability as confirmed.

---

## 24. Real-Time Updates

Use WebSockets or Socket.IO to stream progress.

Example event:

```json
{
  "type": "run.progress",
  "runId": "00000000-0000-4000-8000-000000000001",
  "status": "RUNNING",
  "completedAgents": 3,
  "totalAgents": 5,
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

This is illustrative data, not a live event.

Suggested events:
- `run.queued`
- `run.started`
- `run.progress`
- `agent.started`
- `agent.action.completed`
- `finding.created`
- `artifact.available`
- `run.completed`
- `run.failed`
- `run.cancelled`

### Event delivery rules

- Authorize subscriptions against organization and project membership.
- Avoid broadcasting secrets or full sensitive observations.
- Treat WebSocket events as notifications, not the durable source of truth.
- On reconnect, fetch current state through the API.
- Consider a database-backed event cursor or event table if clients need reliable replay.

---

## 25. Frontend Architecture

### Main pages

- Login and account management.
- Organization selector and settings.
- Project list and project details.
- Create test run form.
- Live run monitoring.
- Agent session timeline.
- Findings list and finding details.
- Artifact viewer.
- Usage and quota dashboard.
- Organization member and role management.

### Run dashboard

Show:
- Run status and elapsed time.
- Total agents, active agents, completed agents.
- Queue wait time.
- Agent action timeline.
- Screenshot previews.
- Console and network errors.
- Findings grouped by severity.
- Token and resource usage.
- Cancel action with confirmation.

### Frontend principles

- Keep server state in TanStack Query or an equivalent data-fetching layer.
- Use WebSockets to invalidate or update cached run data.
- Re-fetch authoritative state after reconnect.
- Validate forms on both client and server.
- Never expose provider secrets through `NEXT_PUBLIC_*` variables.
- Use pagination and virtualized lists for large action histories.
- Provide explicit empty, loading, error, and cancelled states.

---

## 26. Backend Architecture

### Module pattern

Each NestJS module should separate:
- Controller: transport and DTO handling.
- Application service: use cases and orchestration.
- Repository/data-access layer: database operations.
- Domain types and policies: business rules.
- Events/queue adapter: asynchronous communication.

Example:

```text
test-runs/
├── test-runs.module.ts
├── test-runs.controller.ts
├── test-runs.service.ts
├── test-runs.repository.ts
├── dto/
│   ├── create-test-run.dto.ts
│   └── list-test-runs.dto.ts
├── policies/
│   └── run-configuration.policy.ts
└── test-runs.service.spec.ts
```

### API responsibilities

- Validate request data.
- Authenticate the caller.
- Authorize access to the organization/project.
- Enforce quotas and URL policy.
- Persist the request and outbox event.
- Return the accepted run ID.
- Publish real-time notifications when state changes.

Do not keep long-running browser operations inside an HTTP request handler.

---

## 27. Worker Architecture

The worker is a separate process with no public endpoint by default.

### Worker responsibilities

- Consume typed jobs.
- Validate job payloads.
- Load durable run and project state.
- Check cancellation and deadline.
- Create an isolated browser session.
- Execute the bounded agent loop.
- Persist action outcomes and evidence.
- Upload artifacts.
- Finalize session state.
- Emit telemetry and release resources.

### Worker concurrency

Start with low concurrency. Browser sessions consume significant memory and CPU. Tune concurrency using measured resource use rather than arbitrary large values.

A worker should:
- Handle graceful shutdown.
- Stop claiming new jobs when shutting down.
- Finish or safely interrupt active work within a deadline.
- Close browser contexts.
- Release leases and connections.
- Avoid losing action state during termination.

### Separation of responsibilities

- The orchestrator decides which sessions should run.
- BullMQ schedules and delivers jobs.
- The worker executes a session.
- The database records durable state.
- The recovery process reconciles incomplete work.

---

## 28. Observability

Use structured logs, metrics, and traces from the beginning.

### Structured log fields

- `timestamp`
- `level`
- `service`
- `requestId`
- `runId`
- `agentSessionId`
- `jobId`
- `attempt`
- `durationMs`
- `errorCode`

Never log passwords, cookies, authorization headers, or raw secret-bearing form inputs.

### Metrics

Track:
- API request latency and error rate.
- Queue depth and oldest-job age.
- Jobs completed, retried, and failed.
- Browser session startup time.
- Browser crash rate.
- Agent steps per session.
- LLM latency, tokens, and estimated cost.
- Artifact upload failures.
- Run completion rate.
- Resource usage per worker.

### Distributed tracing

Propagate correlation IDs across:
- API request.
- Outbox event.
- Queue job.
- Agent session.
- LLM call.
- Browser action.
- Artifact upload.

This is necessary to diagnose why a run took ten minutes or why an agent repeatedly failed.

---

## 29. Testing Strategy

### Unit tests

Test:
- Run state transitions.
- Action schema validation.
- Action policy.
- URL and hostname validation.
- Budget manager.
- Finding fingerprint generation.
- Retry classification.
- Tenant authorization.

### Integration tests

Test:
- Prisma repositories against PostgreSQL.
- BullMQ processing against Redis.
- Outbox publication and deduplication.
- Run creation and cancellation.
- Artifact metadata persistence.
- Worker recovery.

### Browser tests

Create a controlled fixture website with:
- A login form.
- Required-field validation.
- A multi-step form.
- A navigation flow.
- A deliberate JavaScript error.
- A failing network request.
- A predictable broken assertion.

Test against this fixture rather than arbitrary public websites.

### Security tests

Test:
- Unauthorized project access.
- Cross-tenant data access.
- SSRF and redirect restrictions.
- Access to private IP ranges.
- Prompt-injection attempts in page content.
- Malicious or malformed model output.
- Secret redaction.
- Artifact authorization.
- Resource exhaustion and oversized observations.

### Load tests

Use k6 for API and queue submission load. Use a controlled benchmark harness for browser concurrency.

Measure system behavior at 1, 5, 10, 25, and 50 concurrent sessions before choosing production scaling targets.

---

## 30. CI/CD

A GitHub Actions pipeline should run on pull requests and main-branch updates.

### CI stages

1. Install dependencies from the lockfile.
2. Run formatting and lint checks.
3. Run TypeScript type checking.
4. Validate Prisma schema and migrations.
5. Run unit tests.
6. Run integration tests with PostgreSQL and Redis services.
7. Build web, API, and worker.
8. Build Docker images.
9. Run dependency and image security scans.
10. Publish versioned images after successful checks.

### Deployment stages

- Deploy the API.
- Run database migrations as a controlled job.
- Deploy compatible workers.
- Deploy the web app.
- Verify readiness checks.
- Monitor error rate and queue backlog.
- Roll back application versions if required.

Database migrations must remain compatible with the application versions that are running during a rolling deployment. Use expand-and-contract migrations for changes that cannot be applied atomically.

---

## 31. Scaling Strategy

### Stage 1: Local development

- One API process.
- One worker process.
- PostgreSQL and Redis.
- One or two concurrent browser sessions.

### Stage 2: Small deployment

- Multiple API replicas.
- Separate worker containers.
- Private object storage.
- Managed PostgreSQL and Redis where practical.
- Queue and application metrics.

### Stage 3: Distributed worker fleet

- Worker autoscaling based on queue age, backlog, and resource utilization.
- Separate queues for CPU/memory-heavy browser jobs and lighter analysis jobs.
- Per-organization concurrency limits.
- Centralized telemetry.
- Strong browser network isolation.
- Retry and recovery automation.

### Stage 4: Larger scale

- Kubernetes or a managed container platform.
- Dedicated browser-worker pools.
- Queue partitioning or additional Redis capacity where required.
- PostgreSQL connection pooling.
- Read replicas only for demonstrated read-scaling needs.
- Artifact lifecycle policies and cost controls.
- Capacity planning based on measured browser resource usage.

### Scaling principles

- Scale workers independently from the API.
- Limit active sessions per worker.
- Use backpressure instead of accepting unlimited work.
- Keep job payloads small.
- Avoid unbounded in-memory queues.
- Do not add microservices without a clear operational reason.
- Load test before claiming a concurrency target.

---

## 32. Performance and Cost Controls

Every run should have configurable server-enforced limits:
- Maximum agent sessions.
- Maximum steps per session.
- Maximum run duration.
- Maximum LLM tokens or cost.
- Maximum concurrent sessions per organization.
- Maximum artifact size.
- Maximum observation size.
- Maximum retries per job.
- Maximum navigation and action timeout.

### Cost optimizations

- Use small/fast models for simple planning tasks where quality is sufficient.
- Use stronger models only for difficult reasoning.
- Keep observations concise.
- Avoid sending screenshots on every step unless necessary.
- Cache static scenario templates where appropriate.
- Stop loops when no meaningful progress occurs.
- Deduplicate repeated failures.
- Record cost per successful run and per finding.

Never let a model set its own unrestricted budget. The API and worker enforce limits independently of model output.

---

## 33. Data Retention and Privacy

Browser testing can capture personal information, authentication data, and confidential application content.

Define:
- How long screenshots and traces are retained.
- Whether raw observations are persisted.
- Whether model providers receive page content.
- How users request deletion.
- How credentials are stored and removed.
- How artifacts are authorized.
- Whether artifacts may be used for product analytics or model improvement.

Default to minimal collection. Redact secrets and sensitive fields. Keep storage private and encrypt data in transit and at rest in production. Do not send sensitive page content to a third-party model provider without appropriate authorization and disclosure.

---

## 34. Implementation Roadmap

Implement a vertical slice first, then expand.

### Phase 1 — Workspace and infrastructure

**Deliverable:** API, worker, database, and Redis start reliably.

- [ ] Initialize pnpm workspace and TypeScript configuration.
- [ ] Create Next.js app.
- [ ] Create NestJS API.
- [ ] Create independent worker process.
- [ ] Configure Docker Compose.
- [ ] Add health and readiness checks.
- [ ] Add Prisma and first migration.
- [ ] Add structured logging.
- [ ] Validate environment variables.

### Phase 2 — Identity and projects

**Deliverable:** authorized users can create projects.

- [ ] Authentication.
- [ ] Organizations and memberships.
- [ ] Role-based authorization.
- [ ] Project CRUD.
- [ ] Target URL and host validation.
- [ ] Tenant-isolation tests.
- [ ] Rate limiting.

### Phase 3 — Deterministic browser execution

**Deliverable:** one agent runs a predefined test.

- [ ] Browser worker container.
- [ ] Playwright session lifecycle.
- [ ] Navigation, click, fill, assertion, screenshot.
- [ ] Console and network error capture.
- [ ] Action persistence.
- [ ] Artifact storage.
- [ ] Timeouts and cleanup.

### Phase 4 — AI planning

**Deliverable:** an agent chooses actions dynamically.

- [ ] Provider abstraction.
- [ ] Structured scenario generation.
- [ ] Strict action schema.
- [ ] Observation builder.
- [ ] Action policy.
- [ ] Token and time budgets.
- [ ] Prompt-injection defenses.
- [ ] AI evaluation tests.

### Phase 5 — Distributed orchestration

**Deliverable:** several agents execute concurrently.

- [ ] BullMQ queues.
- [ ] Transactional outbox.
- [ ] Idempotent consumers.
- [ ] Concurrency limits.
- [ ] Worker heartbeat or leases.
- [ ] Cancellation propagation.
- [ ] Retry classification.
- [ ] Recovery and reconciliation.

### Phase 6 — Findings and dashboard

**Deliverable:** developers can inspect a complete run.

- [ ] Run dashboard.
- [ ] Agent timeline.
- [ ] WebSocket updates.
- [ ] Findings list.
- [ ] Finding detail and evidence.
- [ ] Artifact access control.
- [ ] Usage metrics.
- [ ] Final report.

### Phase 7 — Production readiness

**Deliverable:** measured, recoverable, secured deployment.

- [ ] CI/CD.
- [ ] Security scans.
- [ ] Integration and failure-injection tests.
- [ ] Load testing.
- [ ] Queue and worker observability.
- [ ] Browser network isolation.
- [ ] Retention and deletion.
- [ ] Autoscaling policy.
- [ ] Backup and recovery drills.
- [ ] Deployment and incident runbooks.

### First complete vertical slice

The first end-to-end milestone should be:

1. Register a local fixture website.
2. Create a test run.
3. Persist the run and outbox event.
4. Publish one job.
5. Start one isolated Playwright session.
6. Generate or load one structured action.
7. Validate and execute it.
8. Capture a screenshot and result.
9. Persist the result and finalize the run.
10. Show the final status in the dashboard.

Do not start with thousands of agents. First make one agent reliable, then five concurrent agents, and then increase concurrency based on measurements.

---

## 35. Definition of Done

A feature is not done merely because the happy path works.

### Functional

- [ ] The expected behavior works.
- [ ] Invalid input is rejected.
- [ ] Authorization is enforced.
- [ ] Loading, failure, and cancellation states are handled.
- [ ] Results are persisted and visible.

### Reliability

- [ ] Retries do not create duplicate logical results.
- [ ] Worker crashes do not leave runs permanently stuck.
- [ ] Cancellation eventually stops active work.
- [ ] Timeouts and resource limits are enforced.
- [ ] Failure reasons are actionable.

### Security

- [ ] Secrets are not logged or sent to the model.
- [ ] Tenant isolation is tested.
- [ ] Browser destinations are restricted.
- [ ] Artifact access is authorized.
- [ ] Untrusted page content cannot change policy.
- [ ] Dependencies and container images are reviewed.

### Operations

- [ ] Logs include correlation IDs.
- [ ] Relevant metrics are exposed.
- [ ] Health checks reflect actual readiness.
- [ ] Deployment and rollback instructions exist.
- [ ] Backups and retention are documented.

---

## 36. Known Risks and Trade-Offs

| Risk | Impact | Mitigation |
|---|---|---|
| LLM nondeterminism | Tests vary across runs | Record model/prompt versions and validate outputs |
| Prompt injection | Agent attempts forbidden behavior | Treat page data as untrusted; enforce deterministic policy |
| SSRF | Browser accesses internal systems | URL validation, DNS checks, egress filtering, isolation |
| Browser memory use | Worker crashes under concurrency | Measure resource usage and cap sessions |
| Queue duplicate delivery | Repeated actions or records | Idempotency and recovery logic |
| Database/queue inconsistency | Lost or stranded jobs | Transactional outbox and reconciliation |
| False-positive findings | Wasted developer time | Evidence-backed findings and verification |
| AI cost spikes | Unprofitable runs | Token budgets, deadlines, quotas, loop detection |
| Sensitive artifact leakage | Privacy/security incident | Private storage, redaction, access control, retention |
| Model provider outage | Planning failures | Timeouts, retry limits, clear failure states, optional fallback |
| Excessive architectural complexity | Slow development | Modular monolith and incremental milestones |

---

## 37. Troubleshooting

### PostgreSQL connection fails

- Confirm the database container is healthy.
- Inside Docker, use hostname `postgres`; from the host, use `localhost`.
- Verify the database name, user, and password.
- Confirm migrations have run.

### Redis connection fails

- Confirm Redis is healthy.
- Inside Docker, use hostname `redis`.
- Check configured port and password.
- Review Redis logs and BullMQ connection settings.

### Playwright cannot launch Chromium

- Verify the installed Playwright version matches the browser image.
- Confirm required OS dependencies are present.
- Check container memory and shared memory.
- Review sandbox settings and worker permissions.
- Do not solve launch problems by granting unrestricted container privileges.

### Jobs remain queued

- Check that the worker process is running.
- Confirm queue names and Redis connection configuration match.
- Inspect worker logs and failed jobs.
- Verify that the job payload passes validation.
- Check worker concurrency and resource exhaustion.

### A run never finishes

- Inspect run and agent state transitions.
- Check for expired leases and missing terminal events.
- Verify that every session has a deadline.
- Run reconciliation.
- Ensure failures cannot silently bypass finalization.

### AI actions fail repeatedly

- Inspect schema validation errors.
- Review the bounded observation sent to the model.
- Verify the target locator.
- Check timeouts and current browser state.
- Enforce a maximum correction/retry count.
- Stop the agent if it makes no progress.

---

## 38. Contributing

1. Create a branch from the main development branch.
2. Make a focused change.
3. Add or update tests.
4. Run linting, type checks, unit tests, and relevant integration tests.
5. Document new configuration and architecture decisions.
6. Open a pull request with the problem, solution, risks, and validation evidence.

Do not commit secrets, test credentials, production screenshots, or private customer data. New browser actions require schema validation, authorization policy, execution tests, and security review.

---

## 39. License

Choose a license before public release. Until a license is added to the repository, do not assume others have permission to redistribute or use the code.

Possible choices include:
- MIT for a permissive open-source project.
- Apache-2.0 for a permissive license with explicit patent provisions.
- A commercial license for proprietary distribution.

Replace this section with the selected license and add the corresponding `LICENSE` file.

---

## 40. Architecture Decisions

### Why TypeScript across the stack?

It allows shared schemas and types between the frontend, API, queue payloads, and worker. It does not eliminate runtime validation, especially for LLM output or external requests.

### Why NestJS?

It provides modules, dependency injection, guards, interceptors, and a structured backend architecture. It is suitable for a codebase that will grow beyond a small CRUD API.

### Why PostgreSQL?

The application needs durable relational state, transactional updates, constraints, and queries across organizations, projects, runs, agents, and findings.

### Why Redis and BullMQ?

They provide queue processing, concurrency management, retries, and job scheduling. They do not replace durable domain state or remove the need for idempotency.

### Why Playwright?

It supports modern browser automation and provides screenshots, tracing, locators, navigation control, and browser events. Its browser execution must still be isolated when targets are untrusted.

### Why a separate worker?

Browser execution is resource-intensive and long-running. It should scale and fail independently of the API.

### Why not microservices immediately?

A modular monolith reduces operational overhead while preserving module boundaries. Extract services only when independent deployment, scaling, or ownership justifies the cost.

### Why not Kubernetes on day one?

Compose is easier for local development and reproducing failures. Kubernetes becomes useful when worker orchestration, autoscaling, scheduling, and deployment requirements exceed the local setup.

---

## Final Engineering Principle

The hardest part of this project is not making an LLM click buttons. It is building a system that can **execute untrusted, AI-selected actions within strict limits; survive worker and queue failures; preserve evidence; protect tenant data; and scale without losing control of cost or reliability**.

Build the smallest complete vertical slice first. Prove correctness and recovery. Then increase concurrency, improve AI planning, and add production infrastructure based on measured bottlenecks.
