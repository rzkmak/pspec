# pspec Architecture

This document describes the internal architecture of pspec for AI agents and contributors.

## Overview

pspec is a Spec-Driven Development (SDD) toolkit with three core components:

1. **Specs** (`.pspec/specs/`) — Intent documents that define what to build
2. **Tasks** (`.pspec/tasks/`) — Execution checklists that define how to build it
3. **Subagent Roles** (`.pspec/subagent-roles/`) — System prompts for parallel AI execution

The CLI (`npx pspec`) generates agent-specific command files that enable slash commands like `/pspec.plan` in AI coding tools.

## Directory Structure

```
src/
├── index.ts                    # CLI entry point
├── commands/
│   ├── init.ts                 # Initialize/update pspec in projects
│   └── init.test.ts            # Tests for init command
├── templates/
│   ├── index.ts                # Template loading and generation
│   ├── index.test.ts           # Template tests with word budgets
│   └── prompts/                # Agent command prompts
│       ├── pspec.spec.md       # Spec creation prompt
│       ├── pspec.plan.md       # Task planning prompt (with parallelization rules)
│       ├── pspec.implement.md  # Implementation prompt (with subagent orchestration)
│       ├── pspec.debug.md      # Debugging prompt (with parallel investigation)
│       ├── pspec.commit-raise-pr.md
│       └── pspec.commit-current-branch.md
└── subagent/
    └── roles/                  # Subagent system prompts
        ├── _base.md            # Base rules (injected into all subagents)
        ├── typescript-engineer.md
        ├── kotlin-engineer.md
        ├── test-creator.md
        ├── debugger.md
        ├── security-analyst.md
        └── investigator.md
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
  roo: [...],         // .roo/commands/*.md
  kilo: [...],        // .kilo/commands/*.md
};
```

Each agent gets the same prompt content formatted for its specific command system.

### 2. Subagent Role System

> **Design decision:** We use role-specific system prompts instead of creating specialized agents. Agentic tools (OpenCode, Cursor, Claude Code, etc.) automatically load all agent definitions into their command palette. Creating specialized agents for each role would clutter the UI and make the system harder to manage. Instead, pspec **injects role-specific prompts** when spawning subagents — specialization without UI overhead.

The subagent system enables token-efficient parallel execution:

**Role Files** (`src/subagent/roles/`):
- `_base.md` — Core rules for all subagents (output format, scope constraints)
- Role files (e.g., `typescript-engineer.md`) — Domain-specific expertise

**Prompt Composition**:
When spawning a subagent, the AI composes a system prompt by concatenating:
1. `_base.md` (always)
2. Each role file in the subtask's `roles` array
3. A context block with subtask title, scope, and approach

**Output Contract**:
All subagents return structured YAML:
```yaml
summary:
  - "[file:line] finding or action"
files_touched:
  - path/to/file.ts
verification: passed|failed|skipped
blocked_reason: null
```

This keeps responses condensed (max 5 bullet points) and token-efficient.

### 3. Parallelization in pspec.plan

The planner detects parallelizable work using these rules:

**Mark `parallelizable: true` when:**
- Work spans multiple independent modules
- No data dependency between subtasks
- Clear, non-overlapping file scopes
- At least 2 subtasks worth spawning

**Role Inference (priority order):**
1. Context keywords (highest priority):
   - "security", "audit", "crypto" → `security-analyst`
   - "test", "coverage" → `test-creator`
   - "debug", "fix", "error" → `debugger`
   - "find", "locate" → `investigator`
2. File extensions:
   - `*.ts`, `*.tsx` → `typescript-engineer`
   - `*.kt`, `*.kts` → `kotlin-engineer`
   - `*.test.*`, `*.spec.*` → `test-creator`
3. Combine roles when context overlaps
4. Default: `investigator`

**Task File Structure for Parallel Tasks:**
```yaml
subagent:
  max_concurrent: 4
  max_retries: 1
  on_final_failure: partial
  token_budget: 50000

## Task 3
parallelizable: true
subtasks:
  - id: 3.1
    roles: [security-analyst, typescript-engineer]
    scope:
      files: [src/auth/**/*.ts]
    approach: |
      1. Review login flow
    result: null
  - id: 3.2
    roles: [security-analyst]
    scope:
      files: [src/api/**/*.ts]
    approach: |
      1. Check CSRF
    result: null
aggregate_result: null
```

### 4. Orchestration in pspec.implement

The implementer follows this protocol for parallelizable tasks:

**Step 1: Token Budget Check**
```
investigator-only: 1,500 tokens
single role: 3,000 tokens
multi-role: 4,500 tokens

if total_estimated > token_budget:
  safe_parallelism = floor(token_budget / avg_tokens)
  batch subtasks into groups
```

**Step 2: Spawn Subagents**
- Compose prompt: `_base.md` + role files + context
- Spawn up to `max_concurrent` at a time
- Track state: `pending | running | completed | failed`

**Step 3: Collect Results**
- Parse YAML output from each subagent
- Populate `result` field in task file
- If failed and retries remain: queue for retry
- If retries exhausted: apply `on_final_failure` policy

**Step 4: Aggregate**
- Combine all `summary` arrays
- Group by type, deduplicate
- Write max 10 bullet points to `aggregate_result`
- Run verification, mark task `[x]`

### 5. Parallel Investigation in pspec.debug

The debugger uses subagents for complex bugs with multiple hypotheses:

**When to Parallelize:**
- Multiple independent hypotheses
- Each hypothesis requires distinct, non-overlapping file sets
- Serial checking would be expensive

**Role Inference from Error Context:**
- JS/TS stack trace → `debugger` + `typescript-engineer`
- Kotlin/JVM trace → `debugger` + `kotlin-engineer`
- Test failure → `debugger` + `test-creator`
- Auth/crypto error → `debugger` + `security-analyst`
- Default → `debugger`

**Flow:**
1. Compose prompts for each hypothesis
2. Spawn up to 3 subagents at a time
3. Collect YAML summaries
4. If one confirmed → proceed with fix
5. If all inconclusive → report evidence and stop

## Testing

The codebase uses Jest with strict word budget tests:

```typescript
// templates/index.test.ts
{
  file: 'pspec.debug.md',
  maxWords: 320,  // Enforced via wordCount()
  required: ['Start with direct triage.', 'Use parallel investigation only for distinct hypotheses'],
  forbidden: ['grep_search', 'Resource Cleanup']
}
```

Word budgets ensure prompts remain token-efficient and focused.

## Extending the System

### Adding a New Role

1. Create `src/subagent/roles/<role-name>.md`
2. Add role name to `SUBAGENT_ROLE_NAMES` in `templates/index.ts`
3. Update role inference rules in `pspec.plan.md`
4. Run `npm test` to verify

### Adding a New Agent

1. Add agent to `choices` array in `commands/init.ts`
2. Create formatter in `templates/index.ts` `templates` record
3. Add test case in `templates/index.test.ts`

## Key Constraints

- **Token Efficiency:** Prompts have strict word budgets
- **Universal Compatibility:** Works across all AI agents via standardized prompts
- **Minimal Intrusion:** pspec only touches `.pspec/`, `.*/commands/`, and `.*/rules/`
- **No Runtime Dependencies:** The CLI only generates files; execution is handled by AI agents

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

The subagent roles directory (`.pspec/subagent-roles/`) is always created on init/update and is not configurable.

## CONTEXT.md

`.pspec/CONTEXT.md` is an optional project-level context file created as an empty stub by `npx pspec`. When present, `/pspec.spec` treats it as the **primary source of truth** for project architecture, patterns, and constraints — taking precedence over codebase exploration.

Fill it manually with:
- Project architecture overview
- Key constraints and non-negotiables
- Tech stack and versions
- Integration patterns or shared conventions

Example:

```markdown
# Project Context

## Architecture
REST API with Express + PostgreSQL. All handlers in `src/handlers/`, models in `src/models/`.

## Constraints
- Node 20+, TypeScript strict mode
- No default exports — named exports only
- All DB access through repository layer, never direct in handlers
```
