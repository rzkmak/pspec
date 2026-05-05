# pspec

[![npm version](https://img.shields.io/npm/v/pspec.svg)](https://www.npmjs.com/package/pspec)
[![CI](https://github.com/rzkmak/pspec/actions/workflows/ci.yml/badge.svg)](https://github.com/rzkmak/pspec/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/rzkmak/pspec)](./LICENSE)

<p align="center">
  <img src="./pspec-logo.jpg" alt="pspec logo" width="220" />
</p>

> **A minimalist Spec-Driven Development (SDD) toolkit for solo developers and AI agents.**

`pspec` (picospec) is a lightweight alternative to heavy SDD frameworks. It focuses on clear intent, executable task breakdowns, explicit verification, and a finish line that includes tests and real-flow validation.

It is designed to work alongside Claude Code, Gemini CLI, Cursor, OpenCode, Antigravity, and Kilo Code.

## Philosophy
- **Context First:** Specs and task directories carry the working context instead of relying on fragile chat history.
- **Review Driven:** Tasks are not done when code compiles; they are done after verification and self-review.
- **Edge-Case Aware:** `/pspec.spec` and `/pspec.plan` must cover failure modes, not only happy paths.
- **Real Verification:** Definition of done includes functional completion, unit coverage, edge-case coverage, and an end-to-end verification artifact.
- **Simple Structure:** Use plain Markdown files and directories that are easy to inspect, edit, and review.

---

## Installation

Run `pspec` directly with `npx` so your generated agent commands always use the latest prompts.

```bash
npx pspec@latest
```

---

## How to Use

The workflow is: **Initialize -> Spec -> Plan -> Audit -> Implement**.

### Step 1: Initialize the Project

Run this in your project root:

```bash
npx pspec@latest
```

- It prompts for the AI agents you want to configure.
- It creates `.pspec/specs/`, `.pspec/tasks/`, and `.pspec/CONTEXT.md`.
- It writes the agent-specific slash command files such as `.opencode/commands/pspec.plan.md` or `.cursor/rules/pspec.implement.mdc`.
- Running it again updates the generated instructions without overwriting your specs or task directories.

You may need to restart your AI agent session after init so it detects the new slash commands.

### Step 2: Create a Spec

Use `/pspec.spec` to draft a PRD.

```text
/pspec.spec Add session-based authentication for the admin dashboard
```

- The agent reads project context first, including `.pspec/CONTEXT.md` when present.
- It asks **5-10 focused questions** before drafting.
- Questions should include prefilled options and always allow a custom answer.
- It stops after asking questions and waits for your answers.
- After you answer, the agent runs a checklist review for contradictions, missing edge cases, and unclear verification expectations before drafting.
- Once the answers are sufficient, it finishes the full PRD drafting run in one pass.
- It does not hand back a partial PRD, outline, todo list, checkpoint, or next-steps handoff when it can still complete the draft itself.
- It only pauses again for one short follow-up question when required product input is still missing.
- The resulting PRD is written to `.pspec/specs/<epoch-ms>-<slug>.md`.

The PRD uses a structured format with typed sections:

- `## Intent` — what this builds, why, for whom, success outcome
- `## Flow` — ordered steps in the base case
- `## Acceptance Criteria` — `AC-*` IDs with concrete testable statements
- `## Edge Cases` — `EC-*` IDs with `→` cause-effect syntax
- `## Constraints` — non-negotiable technical or product constraints
- `## Features` — `F-*` IDs for traceability to plan phase
- `## Done` — checklist with `[ ]` boxes

Stable IDs:
- `AC-01`, `AC-02`, ... for acceptance criteria
- `EC-01`, `EC-02`, ... for edge cases (each with `→` expected behavior)
- `F01`, `F02`, ... for features

### Step 3: Create a Feature Spec Directory

Use `/pspec.plan` on a PRD.

```text
/pspec.plan .pspec/specs/1742451234567-auth.md
```

- The agent reads the spec, relevant project conventions, and supporting reference files.
- It asks **5-10 focused planning questions** when execution details are unclear.
- It stops after asking questions and waits for your answers.
- It performs a checklist review before writing the plan so the task set covers the base flow, edge cases, and verification needs.
- Once the answers are sufficient, it finishes the full planning run in one pass.
- It does not hand back a partial directory, draft files, todo list, checkpoint, or next-steps handoff when it can still complete the plan itself.
- Before returning, it audits `PROGRESS.md`, the feature spec files, and the coverage map for parity.
- It writes a feature-spec directory at `.pspec/tasks/<epoch-ms>-<slug>/`.

Each feature-spec directory contains:
- `PROGRESS.md` as the completion tracker and shared context file
- one Markdown file per feature spec, such as `01-create-auth-types.md`

Feature specs are outcome-based, not file-based. One feature spec can cover multiple production files, tests, scripts, and config changes when they belong to one coherent unit of work.
The planner must include a Coverage table so every `AC-*` and `EC-*` from the PRD is assigned to one or more feature specs.

Each feature spec has 6 required sections plus structured execution blocks:
- `## Contracts` — typed tables (Data, API, UI) defining all entities, endpoints, and UI states up front
- `## Files` — create/modify/reference actions with paths
- `## Actions` — `action` blocks with id, tool, args, dependencies, conditions
- `## Decisions` — `decision` blocks with options, validation, and normalization for user choices
- `## Validates` — `validate` blocks with tool, args, expected outcomes
- `## Done` — checklist with `[ ]` boxes that agents must tick with evidence

Feature specs also contain three required execution blocks:
- `config` — spec identity, tools, environment, defaults
- `allowlist` — tool-call constraints (permitted commands and paths)
- `state` — execution progress tracking (completed, failed, decisions, artifacts)

### Feature Spec Directory Format

`PROGRESS.md` carries shared context and task status:

```md
---
spec: .pspec/specs/1742451234567-auth.md
stem: 1742451234567-auth
created: 2026-04-27T10:00:00Z
context:
  key_files:
    - src/auth/
    - src/api/
  patterns:
    - Follow request handler structure from src/users/routes.ts
  commands:
    test: npm test
    lint: npm run lint
    build: npm run build
  conventions:
    naming: camelCase functions, PascalCase types
    exports: named exports only
---

# Progress

## Registry

| ID | File | Title | Tag | Status | Depends |
|----|------|-------|-----|--------|---------|
| 01 | 01-model-and-service.md | Add auth domain model and service | CRITICAL | done | — |
| 02 | 02-http-endpoints.md | Add login and logout endpoints | CRITICAL | active | 01 |
| 03 | 03-web-verification.md | Add UI states, test IDs, and E2E verification | TRIVIAL | pending | 01, 02 |

## Coverage

| Requirement | Specs |
|-------------|-------|
| AC-01 | 01, 02 |
| EC-01 | 01 |

## Active

- Spec: `02-http-endpoints.md`
- Phase: `W2-Implement`
- Resume: `Implement login failure paths + unit tests`
- Updated: 2026-04-27T14:30:00Z

## Notes
- Complete tasks in numeric order unless a dependency note says otherwise.
- Mark a feature spec `active` and update `## Active` before editing code so interrupted runs can resume cleanly.
- A task is done only when its definition of done passes.
```

Each feature spec file has 6 required sections with typed tables and execution blocks:

````md
---
kind: feature
id: 1
title: Add auth domain model and service flow
tag: CRITICAL
spec_ref:
  - "AC-03"
  - "EC-02"
depends_on: []
feature_ref: F01
---

# Goal
Deliver the core login/logout domain logic and shared auth types.

```config
name: add-session-auth
version: 1.0.0
description: Add session-based authentication to the admin dashboard
environment:
  NODE_ENV: test
defaults:
  retry: 2
  timeout: 30000
tools:
  - run_command
  - read_file
  - write_file
  - ask_user
```

```allowlist
safe-commands:
  tool: run_command
  allow:
    - "npm test*"
    - "npm run db:migrate*"
    - "bash scripts/*"
src-paths:
  tool: write_file
  allow:
    - "src/**"
    - "scripts/*"
    - "test/**"
```

## Contracts

### Data
| Entity | Fields | Notes |
|--------|--------|-------|
| AuthSession | id, userId, createdAt, expiresAt | TTL-indexed |

### API
| Method | Path | Request | Response | Status |
|--------|------|---------|----------|--------|
| POST | /api/auth/login | {email, password} | {user, sessionId} | 200|401 |

## Files
| Action | Path | Description |
|--------|------|-------------|
| create | src/auth/service.ts | Core auth service |
| create | src/auth/service.test.ts | Unit tests |
| create | src/auth/types.ts | Add AuthSession type |
| ref | src/users/service.ts | Pattern reference |

## Actions

```action
id: setup-schema
description: Create the auth database schema
tool: run_command
args:
  command: "npm run db:migrate -- --name add-auth-tables"
depends_on: []
retry: 1
on_failure: abort
```

```action
id: create-model
description: Create the auth model and service
tool: write_file
args:
  path: "src/auth/model.ts"
  strategy: "{{decisions.auth_strategy}}"
depends_on: [setup-schema]
```

## Decisions

```decision
id: auth_strategy
question: "Which authentication strategy?"
options:
  - label: "Session-based"
    value: session
  - label: "JWT"
    value: jwt
allow_other: true
other_validation:
  type: regex
  pattern: "^[a-z][a-z0-9-]*$"
  message: "Must be lowercase kebab-case"
other_normalize:
  to: slug
```

## Validates

```validate
id: check-base
name: Base case — successful login
tool: run_command
args:
  command: "npm test -- auth/service.test.ts"
depends_on: [create-model]
expect: "all tests pass"
type: base
```

```validate
id: check-edges
name: Edge cases — invalid credentials and locked accounts
tool: run_command
args:
  command: "npm test -- auth/service.test.ts -- --grep 'invalid|locked|expired'"
depends_on: [create-model]
expect: "edge-case tests pass"
type: edges
```

```validate
id: check-e2e
name: E2E — login→logout cycle
tool: run_command
args:
  command: "bash scripts/verify-auth-flow.sh"
depends_on: [create-model]
expect: "login→logout cycle succeeds"
type: e2e
```

```state
status: idle
completed: []
failed: []
decisions: {}
artifacts: {}
current_action: null
started_at: null
finished_at: null
```

## Done
- [ ] Functional behavior works
- [ ] Unit tests pass (base + edges)
- [ ] All spec_ref IDs addressed in code
- [ ] E2E artifact runs successfully
````

### Definition Of Done

Every task must define and satisfy a Done checklist:
- functional behavior is finished
- unit tests are added or updated
- all spec_ref IDs are addressed in code
- an end-to-end verification artifact is provided

End-to-end verification artifact rules:
- API work: provide an API call verification script
- Web work: provide a Playwright script
- Other work: provide the smallest runnable artifact that verifies the real flow

### Step 4: Audit And Sync The Plan

Use `/pspec.audit` when the PRD changed after planning, when feature spec files drift from `PROGRESS.md`, or before implementation to confirm the plan is still aligned.

```text
/pspec.audit .pspec/tasks/1742451234567-auth/PROGRESS.md
```

- The agent reads `PROGRESS.md` and the linked PRD.
- It audits the Registry, Coverage table, and required feature-spec sections.
- It syncs planning artifacts when the PRD changed.
- It preserves valid completed feature specs when possible.
- It can downgrade stale completed items back to `pending` when requirement coverage changed materially.
- It does not change product code, tests, or runtime configuration. It only updates `PROGRESS.md` and feature spec files.

### Step 5: Implement The Feature Specs

Use `/pspec.implement` with the feature-spec directory or `PROGRESS.md` path.

```text
/pspec.implement .pspec/tasks/1742451234567-auth/PROGRESS.md
```

- The agent reads `PROGRESS.md` first.
- It reads the linked PRD and checks that every `AC-*` and `EC-*` in the Coverage table is valid.
- It audits that the Registry and the real feature spec files match before starting work.
- It executes feature specs in order, respecting dependencies.
- It processes one feature spec file at a time.
- It treats `PROGRESS.md` as a resumable checkpoint and resumes any existing `active` feature spec before new work.
- It keeps `## Active` updated with the current feature spec, phase, and next resume step.
- It keeps running the full implementation loop until every runnable feature spec is complete or the run is explicitly blocked.
- It does not hand back a mid-run todo list, checkpoint, or next-steps handoff when it can still make progress itself.
- It must not tell the user to run `/pspec.implement` again to continue remaining runnable feature specs.
- After one feature spec is marked complete, it immediately starts the next eligible feature spec in the same run.
- `done` means the final closeout audit passed and no `pending`, `active`, or `blocked` rows remain.
- `partial` means the current run completed at least one additional feature spec before an explicit blocker stopped it.
- `blocked` means the current run could not complete any additional feature spec because an explicit blocker stopped it.
- It must not use `partial` or `blocked` for a voluntary mid-run handoff.
- `TRIVIAL` tasks require 1 full review pass.
- `CRITICAL` tasks require 2 full review passes.
- Before marking a feature spec complete, the agent must run the listed verification steps and complete the required review passes.

The self-review must check:
- the base case still works
- edge cases and failure modes are covered
- no planned work was skipped
- no unresolved `TODO`, `FIXME`, placeholder, or follow-up markers remain unless explicitly allowed
- unit tests and end-to-end verification still match the implemented behavior
- implemented API endpoints still match the planned Contracts table when applicable
- implemented UI states and `data-testid` values still match the Contracts table when applicable

If review finds issues, the agent fixes them, reruns verification, and reviews again before checking the task off in `PROGRESS.md`.

Truthfulness rules:
- the agent must not claim a verification step passed unless it actually ran and succeeded
- if a feature spec file is missing a required section, the agent should stop and report the first missing section instead of guessing
- if a required verification step cannot run because of an external dependency or environment issue, the feature spec should be marked `blocked`
- it should not mark a feature spec complete until every planned file, verification artifact, contract, and done checkbox is accounted for
- it must not return `done` while any `pending` or `active` row remains in the Registry

### Step 6: Debugging

Use `/pspec.debug` for failures or regressions.

```text
/pspec.debug [error log or description]
```

- The agent starts with direct triage.
- It creates a minimal reproduction before changing code when possible.
- It works serially through the most likely causes.
 - If the bug is part of an active pspec plan, it uses the current feature-spec directory and `PROGRESS.md` to keep the fix aligned.

### Release Publishing

- Add an `NPM_TOKEN` repository secret with publish access to the npm package.
- Publishing is automated by `.github/workflows/auto-release.yml`.
- When the version in `package.json` changes on the master branch, the workflow creates a GitHub Release and publishes to npm.
- Stable releases publish with npm dist-tag `latest`; prereleases such as `1.2.3-beta.1` publish to the matching dist-tag such as `beta`.

---

## Directory Structure

```text
your-project/
├── .pspec/
│   ├── pspec.json
│   ├── CONTEXT.md
│   ├── specs/
│   │   └── 1742451234567-auth.md
│   └── tasks/
│       └── 1742451234567-auth/
│           ├── PROGRESS.md
│           ├── 01-model-and-service.md
│           ├── 02-http-endpoints.md
│           └── 03-e2e-verification.md
├── .opencode/
│   └── commands/
│       ├── pspec.spec.md
│       ├── pspec.plan.md
│       ├── pspec.audit.md
│       ├── pspec.implement.md
│       └── pspec.debug.md
├── .gemini/
│   └── commands/
│       ├── pspec.spec.toml
│       ├── pspec.plan.toml
│       ├── pspec.audit.toml
│       ├── pspec.implement.toml
│       └── pspec.debug.toml
├── .claude/
│   └── commands/
│       ├── pspec.spec.md
│       ├── pspec.plan.md
│       ├── pspec.audit.md
│       ├── pspec.implement.md
│       └── pspec.debug.md
├── .cursor/
│   ├── commands/
│   └── rules/
├── .agent/
│   ├── workflows/
│   └── skills/
├── .kilo/
│   └── commands/
├── src/
└── package.json
```

---

## Execution Model

pspec uses step-indexed protocols for determinism and structured blocks for machine-parseable execution.

1. `/pspec.spec` asks focused questions, collects answers, then completes the PRD draft in one pass with a save-time checklist.
2. `/pspec.plan` asks focused questions first, then completes the feature-spec directory in one pass with a Registry table, Coverage table, and save-time checklist. Feature specs include `config`, `allowlist`, `state`, `action`, `decision`, and `validate` blocks.
3. `/pspec.audit` audits and syncs the feature-spec directory against the PRD without changing product code. Validates block structure in addition to parity checks.
4. `/pspec.implement` follows an orchestrator protocol (S1-S7) that reads PROGRESS.md, refreshes frontmatter context from CONTEXT.md and AGENTS.md, audits the Registry and Coverage, dispatches one subagent per feature spec via the worker protocol (W1-W6). The worker reads CONTEXT.md fresh from disk, parses blocks, resolves decisions via `ask_user`, checks allowlists, executes actions in topological order, runs validates, and updates state.
5. `/pspec.debug` works through likely causes serially and keeps Active in PROGRESS.md and the state block in sync.

**Block execution order:** Parse → Validate structure → Check allowlists → Resolve decisions (ask_user) → Topological sort actions → Execute actions → Run validates (base → edges → e2e).

**Decision resolution:** Present options via `ask_user`. If "Other" is selected, validate with `other_validation` (regex/enum/length), normalize with `other_normalize` (slug/lower/raw), store in `state.decisions`.

**Allowlist enforcement:** Deny-by-default. If an allowlist entry exists for a tool, action args must match at least one pattern.

**Context freshness:** Every command reads `.pspec/CONTEXT.md` fresh from disk. The orchestrator refreshes PROGRESS.md frontmatter context at S1 before dispatching workers. Workers re-read CONTEXT.md and AGENTS.md at W1. Frontmatter context is advisory — workers must not rely on it as sole truth.

---

## Architecture

See [AGENTS.md](./AGENTS.md) for contributor-facing architecture notes.
