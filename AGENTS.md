# pspec Architecture

This document describes the current pspec architecture for AI agents and contributors.

## Overview

pspec is a Spec-Driven Development toolkit with three core workflow layers:

1. **PRDs** (`.pspec/specs/`) — product requirement documents that define what to build
2. **Feature Spec Directories** (`.pspec/tasks/<stem>/`) — implementation-ready feature specs made of `PROGRESS.md` plus one file per feature
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
        ├── pspec.implement.md  # Implementation prompt with review loop rules
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
- Questions should include prefilled options and a custom-answer path.
- It stops after asking questions and waits for answers.
- After answers are collected, the agent runs a checklist review before drafting.
- After the answers are sufficient, the agent finishes the full PRD drafting run in one pass.
- It should not stop mid-phase to hand back a partial PRD, outline, todo list, checkpoint, or next-steps handoff when it can still complete the draft itself.

The PRD should explicitly capture:
- product goal and success outcome
- base flow
- edge cases and failure modes
- interfaces or contracts
- acceptance criteria
- definition-of-done expectations

The spec should use stable IDs:
- acceptance criteria as `AC-*`
- edge cases and failure modes as `EC-*`

Before returning, the saved PRD should be audited for missing required sections, duplicate `AC-*` or `EC-*` IDs, contradictions, and placeholder text.

### 3. Feature Spec Planning

`/pspec.plan` writes a feature-spec directory instead of a single checklist file.

Example layout:

```text
.pspec/tasks/1742451234567-auth/
├── PROGRESS.md
├── 01-model-and-service.md
├── 02-http-endpoints.md
└── 03-e2e-verification.md
```

`PROGRESS.md` stores shared context:
- spec path and stem
- key files and patterns
- project commands for test/lint/build
- naming and export conventions
- task completion state
- active in-progress resume state
- requirement coverage map

Each feature spec file is outcome-based and may cover multiple files. It should contain:
- YAML frontmatter with `id`, `title`, `tag`, `spec_ref`, and `depends_on`
- `Goal`
- `Requirement Coverage`
- `Files` with create/modify/reference sections
- `Data Model`
- `API Contracts`
- `UI States`
- `User Interactions`
- `Data Test IDs`
- `Edge Cases`
- `Approach`
- `Verification`
- `Definition Of Done`

`/pspec.plan` is also two-phase:
- ask questions first and stop
- wait for answers
- run a checklist review
- write `PROGRESS.md` and feature spec files only after the question phase is complete

After the answers are sufficient, the agent must finish the full planning run in one pass. It should not stop mid-phase to hand back a partial directory, draft files, a todo list, checkpoint, or next-steps handoff when it can still complete the plan itself.

`/pspec.plan` must also fail closed:
- stop if the spec is missing `AC-*` or `EC-*` IDs
- include a `Coverage Map` in `PROGRESS.md`
- map every `AC-*` and `EC-*` to at least one feature spec file
- never save placeholder text in final plan files
- audit the saved directory and fix mismatches between `PROGRESS.md`, feature spec files, frontmatter, filenames, and the coverage map before returning

Feature spec contract additions:
- `Data Model` lists all involved entities, types, fields, and relationships
- API work must define all endpoints with request and response shapes
- Web work must define all UI states, user interactions and outcomes, and `data-testid` values up front

### 4. Definition Of Done

Definition of done is part of the workflow contract, not an optional note.

Every task must require:
- functional behavior finished
- unit tests added or updated
- edge cases implemented and verified
- an end-to-end verification artifact

End-to-end verification rules:
- API work -> API call verification script
- Web work -> Playwright script
- Other work -> smallest runnable artifact that exercises the real flow

### 5. Implementation Loop

`/pspec.implement` is serial and review-heavy.

It must finish the full run whenever work remains runnable. It should not stop mid-run to hand back a todo list, checkpoint, or next-steps handoff when it can still diagnose, fix, verify, and continue itself.

It must not tell the user to run `/pspec.implement` again to continue remaining runnable work. After one feature spec is complete, it should immediately continue to the next eligible feature spec in the same run.

Flow:
1. Read `PROGRESS.md`
2. Read the source spec and extract all `AC-*` and `EC-*` IDs
3. Audit feature spec files, `PROGRESS.md`, and the coverage map for parity
4. Execute feature specs in `id` order
5. Read each feature spec's reference files before editing
6. Implement the described outcome
7. Audit planned files, data model, API/UI contracts, and required artifacts
8. Run base-case verification, unit tests, edge-case checks, and the end-to-end artifact
9. Perform the required number of review passes: `TRIVIAL` = 1, `CRITICAL` = 2
10. Check every `Definition Of Done` bullet with evidence
11. If review finds problems, diagnose all identified errors, fix them in a single batch, and repeat the affected verification and review pass
12. Mark the feature spec complete in `PROGRESS.md`
13. Run a final closeout audit before returning done

Resume guardrails:
- `PROGRESS.md` is the resumable source of truth, not just a final checklist
- mark the active feature spec `[>]` before code edits begin
- keep `## Active Work` updated with the current feature spec, current phase, and next resume step at major checkpoints
- if a session is interrupted, resume the existing `[>]` feature spec before starting a new `[ ]` item
- never leave more than one `[>]` entry in `PROGRESS.md`

Implementation is one feature spec file at a time. Do not batch feature specs.

Truthfulness rule:
- never claim a verification step passed unless it was actually run and succeeded
- if a required section is missing, stop and report it instead of guessing
- if a required verification step cannot run because of environment or external dependency issues, mark the task blocked
- do not return done while any `[ ]`, `[>]`, or `[~]` remains in `PROGRESS.md`
- do not ignore task-registry or coverage-map mismatches
- use `partial` only when the current run completed at least one additional feature spec before an explicit blocker stopped it
- use `blocked` only when the current run could not complete any additional feature spec because an explicit blocker stopped it
- never use `partial` or `blocked` for a voluntary mid-run handoff
- never ask the user to rerun `/pspec.implement` while runnable work still remains

### 6. Debugging Flow

`/pspec.debug` stays simple:

- start with direct triage
- create a minimal reproduction when possible
- work serially through likely hypotheses
- apply the smallest correct fix
- update the active feature-spec directory when the bug is tied to planned work
- never claim the bug is fixed unless the reproduction or a relevant regression check passes

### 7. Audit Flow

`/pspec.audit` reconciles a feature-spec directory with its PRD.

- read `PROGRESS.md` and the source PRD
- audit feature-spec files, coverage map, and feature-spec registry for parity
- update planning artifacts when the PRD changed
- preserve valid completed work when possible
- preserve valid in-progress resume state when possible
- downgrade stale completed items when requirement coverage changed materially
- never change product code; only update `PROGRESS.md` and feature spec files

## Testing

The codebase uses Jest to verify:
- generated templates for each supported agent
- command prompt content requirements
- init scaffolding behavior

The tests intentionally assert workflow requirements, phase boundaries, and literal output schema rather than prompt word budgets.
They also protect fail-closed rules such as requirement IDs, coverage maps, placeholder bans, and final closeout checks.

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
- **Human Readability:** Specs and task directories should remain easy to inspect directly
- **Quality Over Brevity:** Prompt compactness is useful, but completeness and verification come first

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

`.pspec/CONTEXT.md` is an optional project-level context file created as an empty stub by `npx pspec`. When present, `/pspec.spec` treats it as the primary source of truth for product context, architecture, patterns, and constraints.

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
