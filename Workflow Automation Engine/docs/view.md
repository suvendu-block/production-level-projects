# Workflow Automation Engine

## Project Overview

A distributed backend system that allows developers to define, execute,
monitor, and recover automated workflows.

A workflow is a collection of tasks connected by dependencies. The
engine determines which tasks are ready, schedules them, executes
independent tasks concurrently, records their state, and handles
failures.

The project is inspired by workflow orchestration systems such as
Temporal, but this implementation is an educational system built from
the ground up.

## Problem Statement

In a typical backend application, business processes often involve
multiple operations:

1.  Create a customer account.
2.  Send a verification email.
3.  Wait for verification.
4.  Process a payment.
5.  Generate an invoice.
6.  Send a confirmation.

Executing these operations directly inside one HTTP request is fragile.
A server restart, network failure, slow external service, or duplicate
request can leave the process in an inconsistent state.

The Workflow Automation Engine separates workflow definition from
workflow execution. It persists execution state and is designed to
resume work after failures.

## Project Goals

-   Define workflows using JSON or a TypeScript SDK.
-   Validate workflow definitions before execution.
-   Represent task dependencies as a directed acyclic graph (DAG).
-   Execute independent tasks concurrently.
-   Persist workflow and task execution state.
-   Retry failed tasks using configurable policies.
-   Prevent duplicate task side effects through idempotency.
-   Distribute work across multiple worker processes.
-   Recover tasks abandoned by crashed workers.
-   Support scheduling, cancellation, pause, and resume.
-   Expose APIs for starting and inspecting executions.

## Core Concepts

### Workflow

A versioned definition describing a business process and its tasks.

### Task

A single unit of work, such as sending an email or calling an external
service.

### Workflow Execution

One running instance of a workflow definition. A workflow can have many
executions.

### Task Execution

One attempt or execution record for a task within a workflow execution.

### Scheduler

Finds tasks whose dependencies are satisfied and makes them eligible for
execution.

### Worker

Claims an eligible task, executes its handler, and reports the result.

### Retry Policy

Defines which failures are retryable, the maximum number of attempts,
and the delay between attempts.

## Example Workflow

``` json
{
  "name": "customer-registration",
  "version": 1,
  "tasks": [
    {
      "id": "create-user",
      "type": "create-user",
      "dependsOn": []
    },
    {
      "id": "send-verification",
      "type": "send-email",
      "dependsOn": ["create-user"]
    },
    {
      "id": "create-audit-record",
      "type": "create-audit-record",
      "dependsOn": ["create-user"]
    },
    {
      "id": "activate-account",
      "type": "activate-account",
      "dependsOn": [
        "send-verification",
        "create-audit-record"
      ]
    }
  ]
}
```

`send-verification` and `create-audit-record` can run concurrently after
`create-user` completes. `activate-account` can run only after both
dependencies complete.

## High-Level Architecture

``` text
                 Client / SDK
                      |
                      v
                 API Service
                      |
             Validate Workflow
                      |
                      v
              PostgreSQL Database
                      |
                      v
                  Scheduler
                      |
                Task Queue
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Worker 1    Worker 2    Worker 3
          |           |           |
          +-----------+-----------+
                      |
                Task Handlers
                      |
                      v
              External Services
```

### Main Components

  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  API service                         Create workflow definitions and
                                      start executions

  Workflow validator                  Validate task IDs, dependencies,
                                      cycles, and configuration

  Execution engine                    Coordinate workflow and task state
                                      transitions

  Scheduler                           Find tasks ready to run

  Queue                               Hold tasks waiting for workers

  Worker                              Execute task handlers

  State manager                       Enforce valid state transitions

  Retry manager                       Calculate retry eligibility and
                                      delays

  Recovery manager                    Reclaim work abandoned by failed
                                      workers

  Persistence layer                   Store definitions, executions, and
                                      events

  Observability                       Expose logs, traces, and metrics
  -----------------------------------------------------------------------

## Recommended Technology Stack

  Area                                   Technology
  -------------------------------------- -------------------------------------
  Language                               TypeScript
  Backend framework                      NestJS
  Database                               PostgreSQL
  Database access                        Prisma or Drizzle
  Initial queue implementation           BullMQ
  Coordination and caching               Redis
  Event streaming (later phase)          Kafka
  Internal communication (when needed)   gRPC
  Containers                             Docker
  Orchestration (later phase)            Kubernetes
  Metrics                                Prometheus
  Tracing                                OpenTelemetry
  Testing                                Jest, integration tests, load tests

Do not introduce every technology on day one. Start with one API
service, one scheduler, one worker process, PostgreSQL, and Redis. Add
distributed components only when the core execution model is correct.

## Suggested Repository Structure

``` text
workflow-engine/
├── apps/
│   ├── api/
│   ├── scheduler/
│   └── worker/
├── packages/
│   ├── workflow-core/
│   ├── workflow-validator/
│   ├── execution-engine/
│   ├── task-queue/
│   ├── state-manager/
│   ├── retry-manager/
│   ├── recovery-manager/
│   ├── event-engine/
│   └── shared/
├── database/
│   └── migrations/
├── infrastructure/
│   ├── docker/
│   └── kubernetes/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── concurrency/
│   └── failure-recovery/
└── docs/
    ├── architecture.md
    └── design-decisions.md
```

## Data Model

Suggested PostgreSQL tables:

  Table                   Important data
  ----------------------- ------------------------------------------
  `workflows`             Workflow identity and metadata
  `workflow_versions`     Immutable versioned definitions
  `workflow_executions`   Workflow run status and timestamps
  `tasks`                 Task definitions and dependency metadata
  `task_executions`       Task status, attempts, lease, and result
  `execution_events`      Append-only execution history
  `worker_instances`      Worker identity and heartbeat
  `scheduled_jobs`        Tasks eligible at a future time
  `dead_letter_jobs`      Tasks that exhausted retry policy

Use database constraints and transactions to protect state changes.
Consider `SELECT ... FOR UPDATE SKIP LOCKED` for safely claiming
available work from PostgreSQL.

## State Machines

### Workflow states

-   `PENDING`
-   `RUNNING`
-   `COMPLETED`
-   `FAILED`
-   `CANCELLED`
-   `PAUSED`

### Task states

-   `PENDING`
-   `READY`
-   `QUEUED`
-   `RUNNING`
-   `RETRY_WAIT`
-   `COMPLETED`
-   `FAILED`
-   `CANCELLED`

Define allowed transitions centrally. Do not allow arbitrary status
updates from API handlers or workers.

## Reliability Requirements

### Retries

Use configurable retry policies with exponential backoff and jitter.
Distinguish retryable errors from permanent errors.

### Idempotency

A worker may execute a task more than once if it crashes after
performing an external side effect but before recording success. Give
side-effecting operations stable idempotency keys and require handlers
or downstream services to honor them.

### Worker leases and heartbeats

A worker claims a task for a limited lease period and periodically
renews the lease. If the worker disappears and the lease expires, the
recovery manager can make the task eligible again.

### Crash recovery

Persist execution state before acknowledging progress. On restart,
reconcile expired leases and identify tasks that are ready to run.

### Delivery semantics

Design for at-least-once task execution. Do not claim exactly-once
execution of arbitrary external side effects; that guarantee cannot
generally be provided by the workflow engine alone.

### Cancellation

Cancellation is cooperative. A running task may need to observe a
cancellation signal and clean up safely.

## Development Milestones

### Milestone 1 --- Workflow definitions

-   Define workflow and task TypeScript types.
-   Accept and validate JSON definitions.
-   Reject duplicate task IDs and unknown dependencies.
-   Detect dependency cycles.
-   Implement topological sorting.

**Acceptance test:** Invalid DAGs are rejected, and valid DAGs produce a
correct dependency order.

### Milestone 2 --- Local execution engine

-   Implement task handlers.
-   Find tasks whose dependencies have completed.
-   Execute independent tasks concurrently.
-   Enforce configurable concurrency limits.
-   Implement task and workflow state transitions.

**Acceptance test:** A workflow with dependent and independent tasks
executes in the correct order.

### Milestone 3 --- Durable persistence

-   Add PostgreSQL schema and migrations.
-   Persist workflow definitions and versions.
-   Persist executions and task results.
-   Wrap state transitions in database transactions.

**Acceptance test:** Restarting the API does not erase workflow
execution state.

### Milestone 4 --- Queue and workers

-   Add a queue abstraction.
-   Add a worker process.
-   Implement task claiming and completion.
-   Add worker identity and heartbeat records.

**Acceptance test:** Multiple worker processes can process tasks without
intentionally assigning the same valid lease to two workers.

### Milestone 5 --- Failure handling

-   Add retry policies and backoff.
-   Add task timeouts.
-   Add idempotency keys.
-   Add lease expiry and recovery.
-   Add dead-letter handling.

**Acceptance test:** Kill a worker during execution and verify that
abandoned work is recovered without corrupting workflow state.

### Milestone 6 --- Advanced orchestration

-   Add conditional branches.
-   Add scheduled and delayed workflows.
-   Add pause, resume, and cancellation.
-   Add compensation tasks for Saga-style workflows.
-   Add workflow versioning rules.

**Acceptance test:** A workflow can be paused, resumed, and completed
while preserving its execution history.

### Milestone 7 --- Production engineering

-   Add structured logs and distributed traces.
-   Add Prometheus metrics.
-   Add load and concurrency tests.
-   Add fault-injection tests.
-   Document deployment and operational procedures.

**Acceptance test:** Publish reproducible throughput and latency
measurements, plus results from worker-crash and database-failure tests.

## API Sketch

  Method   Endpoint                      Purpose
  -------- ----------------------------- --------------------------------
  `POST`   `/workflows`                  Register a workflow definition
  `GET`    `/workflows/:id`              Get workflow metadata
  `POST`   `/workflows/:id/executions`   Start an execution
  `GET`    `/executions/:id`             Inspect execution status
  `GET`    `/executions/:id/tasks`       Inspect task states
  `POST`   `/executions/:id/cancel`      Request cancellation
  `POST`   `/executions/:id/pause`       Pause an execution
  `POST`   `/executions/:id/resume`      Resume an execution

## Non-Goals for the First Version

-   No frontend or dashboard.
-   No visual workflow editor.
-   No plugin marketplace.
-   No multi-region deployment.
-   No custom distributed database.
-   No claim of exactly-once execution.

Keep the project backend-only.

## Resume Description

**Workflow Automation Engine --- TypeScript, NestJS, PostgreSQL, Redis**

Designed and implemented a durable workflow orchestration backend
featuring DAG-based task execution, concurrent workers, persistent
execution state, retry policies, idempotency, worker leases, and crash
recovery. Evaluated throughput, latency, and failure recovery through
integration, concurrency, and load testing.

Only include features you have actually implemented and benchmark
results you have actually measured.

## Definition of Done

The first serious version is complete when:

-   A workflow can contain dependent and independent tasks.
-   Invalid workflows are rejected.
-   Independent tasks execute concurrently within configured limits.
-   Task and workflow state survive process restarts.
-   Multiple workers can safely claim tasks.
-   Failed tasks follow retry policies.
-   Expired worker leases are recovered.
-   Duplicate side effects are mitigated through idempotency.
-   Integration and failure-recovery tests pass.
-   Performance results are documented.
