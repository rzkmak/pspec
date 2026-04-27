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

The PRD should cover:
- product goal and context
- user problem and success outcome
- base flow
- edge cases and failure modes
- interfaces, contracts, or data shape
- constraints and dependencies
- acceptance criteria
- definition of done expectations

The final PRD should use stable IDs:
- `AC-01`, `AC-02`, ... for acceptance criteria
- `EC-01`, `EC-02`, ... for edge cases and failure modes

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
The planner must also include a coverage map so every `AC-*` and `EC-*` from the PRD is assigned to one or more feature specs.

Each feature spec should define these guardrail sections up front:
- Data model involved
- For API work: all endpoints with request and response shapes
- For web work: all UI states, all user interactions and outcomes, and `data-testid` values to use in both code and tests

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

## Coverage Map
- `AC-01` -> `01-model-and-service.md`
- `EC-01` -> `01-model-and-service.md`, `02-http-endpoints.md`

## Feature Specs
- [ ] `01-model-and-service.md` - Add auth domain model and service flow
- [ ] `02-http-endpoints.md` - Add login and logout endpoints
- [ ] `03-web-verification.md` - Add UI states, test IDs, and end-to-end verification

## Notes
- Complete tasks in numeric order unless a dependency note says otherwise.
- A task is done only when its definition of done passes.
```

Each feature spec file contains its own frontmatter and execution details:

```md
---
id: 1
title: Add auth domain model and service flow
tag: CRITICAL
spec_ref:
  - "AC-03"
  - "EC-02"
depends_on: []
---

# Goal
Deliver the core login/logout domain logic and shared auth types.

## Requirement Coverage
- `AC-03` - Adds the core auth flow behavior
- `EC-02` - Covers invalid credentials and locked-account behavior

## Files
### Create
- `src/auth/service.ts` - Core authentication service
- `src/auth/service.test.ts` - Unit coverage for the service

### Modify
- `src/auth/types.ts` - Shared auth contracts

### Reference
- `src/users/service.ts` - Existing service structure

## Data Model
- `AuthSession` with session id, user id, created at, expires at
- `LoginInput` with email and password

## API Contracts
- Endpoint: `POST /api/auth/login`
  - Request: `{ email: string, password: string }`
  - Response: `{ user: { id: string, email: string }, sessionId: string }`

## UI States
- Not applicable

## User Interactions
- Not applicable

## Data Test IDs
- Not applicable

## Edge Cases
- Invalid password
- Unknown email
- Locked account
- Session store failure

## Approach
1. Add the auth service and shared types.
2. Implement success and failure paths.
3. Add unit tests for the base case and listed edge cases.
4. Hook the service into the verification artifact if needed.

## Verification
- Base case:
  - Command: `npm test -- auth/service.test.ts`
  - Expected: successful login path passes
- Unit tests:
  - Command: `npm test -- auth/service.test.ts`
  - Expected: base and failure-path assertions pass
- Edge cases:
  - Command: `npm test -- auth/service.test.ts`
  - Expected: invalid credentials, locked account, and store failure cases pass
- E2E:
  - Type: `api-script`
  - Path: `scripts/verify-auth-flow.sh`
  - Command: `bash scripts/verify-auth-flow.sh`
  - Expected: login and logout flow succeeds against the running app

## Definition Of Done
- Functional behavior is finished.
- Unit tests cover the base case and listed edge cases.
- Failure modes are implemented and verified.
- The end-to-end verification artifact runs successfully.
```

### Definition Of Done

Every task must define and satisfy all of the following:
- functional behavior is finished
- unit tests are added or updated
- edge cases are implemented and verified
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
- It audits the feature-spec registry, coverage map, and required feature-spec sections.
- It syncs planning artifacts when the PRD changed.
- It preserves valid completed feature specs when possible.
- It can downgrade stale completed items back to `[ ]` when requirement coverage changed materially.
- It does not change product code, tests, or runtime configuration. It only updates `PROGRESS.md` and feature spec files.

### Step 5: Implement The Feature Specs

Use `/pspec.implement` with the feature-spec directory or `PROGRESS.md` path.

```text
/pspec.implement .pspec/tasks/1742451234567-auth/PROGRESS.md
```

- The agent reads `PROGRESS.md` first.
- It reads the linked PRD and checks that every `AC-*` and `EC-*` in the coverage map is valid.
- It audits that `PROGRESS.md` and the real feature spec files match before starting work.
- It executes feature specs in order, respecting dependencies.
- It processes one feature spec file at a time.
- It keeps running the full implementation loop until every runnable feature spec is complete or the run is explicitly blocked.
- It does not hand back a mid-run todo list, checkpoint, or next-steps handoff when it can still make progress itself.
- `done` means the final closeout audit passed and no `[ ]` or `[~]` remains.
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
- implemented API endpoints still match the planned request and response shapes when applicable
- implemented UI states, interactions, and `data-testid` values still match the feature spec when applicable

If review finds issues, the agent fixes them, reruns verification, and reviews again before checking the task off in `PROGRESS.md`.

Truthfulness rules:
- the agent must not claim a verification step passed unless it actually ran and succeeded
- if a feature spec file is missing a required section, the agent should stop and report the first missing section instead of guessing
- if a required verification step cannot run because of an external dependency or environment issue, the feature spec should be marked blocked
- it should not mark a feature spec complete until every planned file, verification artifact, API/UI contract, and definition-of-done bullet is accounted for
- it must not return `done` while any `[ ]` or `[~]` remains in `PROGRESS.md`
- it must not use `partial` or `blocked` for a voluntary mid-run handoff

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

pspec now favors serial, complete execution over orchestration features.

1. `/pspec.spec` asks focused questions, collects answers, then completes the PRD draft in one pass once the answers are sufficient.
2. `/pspec.plan` asks focused questions first, then completes the feature-spec directory in one pass with `PROGRESS.md`, one file per feature, and a coverage map for every `AC-*` and `EC-*` requirement.
3. `/pspec.audit` audits and syncs the feature-spec directory against the PRD without changing product code.
4. `/pspec.implement` reads `PROGRESS.md`, audits the feature-spec registry and coverage map, executes one feature spec file at a time, verifies the base case and edge cases, runs unit tests and the end-to-end artifact, checks API/UI contract fidelity, checks every definition-of-done bullet, keeps going until every runnable feature spec is complete or the run is explicitly blocked, and only then marks completion.
5. `/pspec.debug` works through likely causes serially and keeps active task directories in sync.

This keeps the workflow explicit and reviewable without adding orchestration-specific structures to your project.

---

## Architecture

See [AGENTS.md](./AGENTS.md) for contributor-facing architecture notes.
