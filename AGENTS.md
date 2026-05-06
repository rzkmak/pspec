# pspec Architecture

This document describes the current pspec architecture for AI agents and contributors.

## Overview

pspec is a Spec-Driven Development toolkit with three core workflow layers:

1. **PRDs** (`.pspec/specs/`) — product requirement documents that define what to build
2. **Feature Spec Directories** (`.pspec/tasks/<stem>/`) — implementation-ready feature specs with structured execution blocks
3. **Agent Commands** — generated slash commands that guide spec creation, planning, audit, implementation, and debugging

The CLI (`npx pspec`) generates agent-specific command files that enable slash commands like `/pspec.plan` in AI coding tools.

## Directory Structure

```text
src/
├── index.ts                    # CLI entry point
├── commands/
│   ├── init.ts                 # Initialize/update pspec in projects
│   └── init.test.ts            # Tests for init command
└── templates/
    ├── index.ts                # Template loading and generation
    ├── index.test.ts           # Template behavior tests
    └── prompts/                # Agent command prompts
        ├── pspec.spec.md       # Spec creation prompt
        ├── pspec.plan.md       # Task directory planning prompt
        ├── pspec.audit.md      # Feature-spec audit and sync prompt
        ├── pspec.implement.md  # Implementation prompt with orchestrator/worker protocol
        └── pspec.debug.md      # Debugging prompt
```

## Key Concepts

### 1. Agent Command Generation

The `templates/index.ts` module generates agent-specific command files:

```typescript
export const templates: Record<string, Template[]> = {
  claude: [...],      // .claude/commands/*.md
  gemini: [...],      // .gemini/commands/*.toml
  cursor: [...],      // .cursor/commands/*.md + .cursor/rules/*.mdc
  opencode: [...],    // .opencode/commands/*.md
  antigravity: [...], // .agent/workflows/*.md + .agent/skills/pspec/SKILL.md
  kilo: [...],        // .kilo/commands/*.md
};
```

Each agent gets the same prompt content formatted for its command system.

### 2. PRD Creation Flow

`/pspec.spec` is intentionally question-driven.

- It reads `.pspec/CONTEXT.md` first when present.
- It asks 5-10 focused questions before drafting.
- It stops after asking questions and waits for answers.
- After answers are sufficient, it finishes the full PRD drafting run in one pass.

The PRD uses a structured format with typed sections:

```yaml
---
kind: prd
stem: 1742451234567-auth
created: 2026-05-05T10:00:00Z
---
```

```markdown
# Add Session-Based Authentication

## Intent
One paragraph: what this builds, why, for whom, and what success looks like.

## Flow
1. User submits login form
2. Server validates credentials
3. ...

## Acceptance Criteria
- AC-01: <concrete testable statement>
- AC-02: <concrete testable statement>

## Edge Cases
- EC-01: <failure mode> → <expected system behavior>
- EC-02: <failure mode> → <expected system behavior>

## Constraints
- <non-negotiable technical or product constraint>

## Features
- F01: <feature title> [INITIALIZED]
- F02: <feature title> [INITIALIZED]

## Done
- [ ] All acceptance criteria are testable
- [ ] All edge cases have expected behaviors
- [ ] No placeholders remain
```

### 3. Feature Spec v2 Block Grammar

Feature specs use six structured block types as fenced code blocks inside Markdown:

| Block | Purpose | Required |
|-------|---------|----------|
| `config` | Spec identity and execution parameters | Yes |
| `allowlist` | Tool-call constraints (commands, paths) | Yes |
| `state` | Execution progress tracking | Yes |
| `action` | Atomic implementation steps | Yes (≥1) |
| `decision` | Interactive choice points | When needed |
| `validate` | Verification checks | Yes (≥1) |

#### `config` block

```yaml
```config
name: add-session-auth
version: 1.0.0
description: Add session-based authentication
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
```

Required fields: `name`, `version`. Optional: `description`, `environment`, `defaults`, `tools`.

#### `allowlist` block

```yaml
```allowlist
safe-commands:
  tool: run_command
  allow:
    - "npm test*"
    - "npm run build*"
    - "bash scripts/*"

src-paths:
  tool: write_file
  allow:
    - "src/**"
    - "scripts/*"
```
```

Deny-by-default: if an allowlist entry exists for a tool, actions must match at least one pattern.

#### `state` block

```yaml
```state
status: idle
completed: []
failed: []
decisions: {}
artifacts: {}
evidence: {}
current_action: null
started_at: null
finished_at: null
```
```

Status values: `idle` | `running` | `paused` | `done` | `failed`.

The `evidence` field maps validate block ids to brief evidence summaries. The implement worker writes entries after each validate completes:
- On pass: `"check-base": "all 12 tests pass, exit 0"`
- On fail: `"check-edges": "failed: 2 edge cases failed (retries: 1)"`
- On skip (dependency failed): `"check-e2e": "skipped-with-reason: action deploy-server in state.failed"`

#### `action` block

```yaml
```action
id: create-model
description: Create the auth model and service
tool: write_file
args:
  path: "src/auth/model.ts"
  strategy: "{{decisions.auth_strategy}}"
depends_on: [setup-schema]
condition: "decisions.auth_strategy != null"
retry: 2
on_failure: abort
```
```

Required: `id`, `tool`, `args`. Optional: `description`, `depends_on`, `condition`, `retry`, `timeout`, `on_failure`.

Template variables: `{{decisions.KEY}}` and `{{artifacts.ID}}` are resolved at execution time.

#### `decision` block

```yaml
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
```

Required: `id`, `question`, `options` (≥2). Optional: `allow_other`, `other_label`, `other_validation`, `other_normalize`, `multi_select`, `default`, `condition`.

Validation rules for `other_validation`:
- `regex`: `{type, pattern, message}` — match against regex
- `enum`: `{type, values, message}` — check in value list
- `length`: `{type, min, max, message}` — check character range

Normalization rules for `other_normalize`:
- `slug`: lowercase, replace non-alphanumeric with hyphens, strip, collapse
- `lower`: lowercase only
- `raw`: no transformation

#### `validate` block

```yaml
```validate
id: check-base
name: Base case — successful login
tool: run_command
args:
  command: "npm test -- auth/service.test.ts"
depends_on: [create-model]
expect: "all tests pass"
type: base
retry: 0
on_failure: retry
```
```

Required: `id`, `name`, `tool`, `args`, `expect`. Optional: `depends_on`, `type` (base/edges/e2e), `retry`, `on_failure`.

### 4. Execution Model

`/pspec.implement` follows a step-indexed orchestrator/worker protocol.

**Orchestrator (S1-S7):**
1. S1: Read context (PROGRESS.md, PRD, AC-*/EC-*)
2. S2: Audit registry and coverage parity
3. S3: Pick next spec (resume active, or lowest pending with met deps)
4. S4: Dispatch subagent with worker protocol + context
5. S5: Validate handoff (read PROGRESS.md from disk)
6. S6: Loop back to S3
7. S7: Close out (verify zero pending/active, coverage complete)

**Worker protocol per spec (W1-W6):**
1. W1: Load all context, parse blocks, mark spec active
2. W2: Resolve decisions via ask_user tool (validate and normalize custom input)
3. W3: Execute actions in topological order (check allowlists, resolve templates, retry on failure)
4. W4: Audit implemented work against spec
5. W5: Run validate blocks (base → edges → e2e)
6. W6: Mark done, update state, update PRD feature status

**Block execution order:**
1. Parse all blocks, validate structure
2. Check allowlists for tool-call constraints
3. Resolve decisions (ask_user for each unresolved decision block)
4. Topologically sort actions by depends_on
5. Execute actions, checking conditions and allowlists
6. Run validates grouped by type

**Decision resolution rules:**
- Present options via ask_user tool
- If user selects predefined value: store directly
- If user selects "Other": validate with other_validation, normalize with other_normalize, store result
- Max 3 re-ask attempts for invalid "Other" input, then abort
- Conditional decisions (with `condition`) are skipped if condition evaluates to false

**Allowlist enforcement rules:**
- For each action, find allowlist entries matching `action.tool`
- If entries exist, check action args against patterns (deny-by-default)
- If args don't match any pattern: block action, mark spec as blocked

### 5. Definition Of Done

Every task defines and satisfies a Done checklist:
- functional behavior is finished
- unit tests are added or updated
- all spec_ref IDs are addressed in code
- an end-to-end verification artifact is provided

End-to-end verification rules:
- API work: provide an API call verification script
- Web work: provide a Playwright script
- Other work: provide the smallest runnable artifact that verifies the real flow

### 6. Debugging Flow

`/pspec.debug` works through likely causes serially:
- start with direct triage
- create a minimal reproduction when possible
- work serially through likely hypotheses (no parallel investigation)
- apply the smallest correct fix
- check the feature spec's `state` block for failed actions or validates
- update Active in PROGRESS.md and the state block when tied to active work
- never claim the bug is fixed unless the reproduction or a relevant regression check passes

### 7. Audit Flow

`/pspec.audit` reconciles a feature-spec directory with its PRD:
- read PROGRESS.md and the source PRD
- audit registry parity, coverage parity, feature spec structure, block structure validation
- PRD change detection: compare AC-\* and EC-\* IDs from the current PRD against the Coverage table to find added, removed, or modified requirements
- validate action ids, decision ids, validate ids are unique
- validate depends_on references, tool references, allowlist structure
- check no cycles in dependency graphs
- when two or more specs reference the same AC-\* or EC-\*, ensure at least one spec remains responsible after sync
- create new pending specs for unmapped requirements (next sequential ID)
- remove stale requirement references from Coverage
- preserve valid work: `done` + still valid → keep, `active` + changed → downgrade to `pending`
- never change product code; only update PROGRESS.md and feature spec files
- never claim the directory is clean if issues remain

## Testing

The codebase uses Jest to verify:
- generated templates for each supported agent
- command prompt content requirements (required strings, forbidden legacy patterns)
- init scaffolding behavior

The tests protect workflow requirements: v2 block grammar (config, allowlist, state, action, decision, validate), structured Contracts tables, step-indexed protocols, fail-closed rules (required IDs, save-time checklists, no placeholders), and format boundaries (forbidden legacy section names like `## Steps`, `## Verification`, `from_allowlist`).

## Extending the System

### Adding a New Agent

1. Add the agent to `choices` in `src/commands/init.ts`
2. Add the formatter in `src/templates/index.ts`
3. Add or update tests in `src/templates/index.test.ts` and `src/commands/init.test.ts`

### Changing the Workflow

When adjusting pspec flow, update all of these together:
1. Prompt templates in `src/templates/prompts/`
2. Generated template expectations in `src/templates/index.test.ts`
3. CLI init behavior in `src/commands/init.ts` if project scaffolding changes
4. README and this architecture document

## Key Constraints

- **Universal Compatibility:** Works across multiple AI agents through generated command files
- **Minimal Intrusion:** pspec only touches `.pspec/`, `.*/commands/`, and `.*/rules/`
- **Human Readability:** Specs and task directories remain easy to inspect directly
- **Structured Over Prose:** Tables, typed blocks, and step-indexed protocols reduce ambiguity better than free-form text
- **Deterministic Execution:** Action blocks, decision blocks, and validate blocks make agent behavior predictable
- **Safety by Default:** Allowlist blocks constrain tool calls; decisions validate and normalize custom input

## Configuration

`pspec.json` (auto-generated in `.pspec/`):

```json
{
  "agents": ["claude", "opencode"],
  "paths": {
    "specs": ".pspec/specs",
    "tasks": ".pspec/tasks"
  }
}
```

## CONTEXT.md

`.pspec/CONTEXT.md` is an optional project-level context file created as an empty stub by `npx pspec`. When present, all five commands treat it as the primary source of truth for product context, architecture, patterns, and constraints.

Fill it with:
- project architecture overview
- key constraints and non-negotiables
- tech stack and versions
- integration patterns or shared conventions

Example:

```markdown
# Project Context

## Architecture
REST API with Express + PostgreSQL. All handlers in `src/handlers/`, models in `src/models/`.

## Constraints
- Node 20+, TypeScript strict mode
- No default exports - named exports only
- All DB access through repository layer, never direct in handlers
```

### Context Freshness

Context can rot between planning and implementation. pspec prevents this:

1. **Every command reads CONTEXT.md fresh from disk.** All five commands (`/pspec.spec`, `/pspec.plan`, `/pspec.implement`, `/pspec.audit`, `/pspec.debug`) read `.pspec/CONTEXT.md` when present. No command relies solely on a snapshot from a previous stage.

2. **The orchestrator refreshes PROGRESS.md frontmatter before dispatching workers.** At S1, the orchestrator overwrites the `context` block in PROGRESS.md frontmatter with current values from CONTEXT.md and AGENTS.md/CLAUDE.md. This prevents stale planning-time context from propagating to workers.

3. **Workers re-read context files independently.** At W1, each worker reads CONTEXT.md and AGENTS.md/CLAUDE.md from disk. Frontmatter context is advisory — workers must not rely on it as sole truth.

4. **The audit command refreshes context during sync.** `/pspec.audit` reads CONTEXT.md at Phase 1 and updates PROGRESS.md frontmatter context in Phase 3 when syncing.