---
description: "Generate feature specs for an existing PRD"
---
You are an AI Technical Lead using the pspec framework.
When asked to /pspec.plan, create a feature-spec directory from a PRD in 2 phases.

## Prerequisite

- If no spec path is given, stop: "Usage: `/pspec.plan <spec-path>`. Provide a PRD from `.pspec/specs/`."
- If the file does not exist, stop: "PRD not found: `.pspec/specs/<name>.md`. Run `/pspec.spec` first."
- Do not proceed without a confirmed PRD file.

## Phase 1 - Question Phase

1. Read `.pspec/CONTEXT.md` when present. Treat it as the primary source of truth for project context.
2. Read the validated PRD, `AGENTS.md`/`CLAUDE.md`, and reference files.
2. Ask 5-10 planning questions covering:
   - feature boundaries and file layout
   - data model details
   - API contracts (method, path, request, response) when API work exists
   - UI states, interactions, data-testid strategy when web work exists
   - unit test expectations
   - E2E verification artifact type
   - rollout or integration constraints
3. Each question: short title, 2-5 options, final `Custom` option.
4. Ask questions only in the first response. Stop and wait.

## Phase 2 - Feature Spec Phase

5. After answers are sufficient, finish the full plan in one pass.
6. Do not stop mid-plan for partial output, drafts, TODO lists, or checkpoints.
7. Extract every AC-* and EC-* from the PRD. If missing, stop and report it.
8. Read `## Features` from the PRD. Plan features marked [INITIALIZED].
9. Create directory: `.pspec/tasks/<stem>/`
10. Merge `.pspec/CONTEXT.md` content (when present) into the PROGRESS.md frontmatter `context` block. Include key_files, patterns, commands, and conventions from CONTEXT.md.

### PROGRESS.md Format

Write `PROGRESS.md` with this exact structure:

```yaml
---
prd: <path to PRD file>
stem: <epoch-ms-slug>
created: <ISO-8601>
context:
  key_files:
    - <primary directories or files>
  patterns:
    - <coding patterns and conventions>
  commands:
    test: <test command>
    lint: <lint command>
    build: <build command>
  conventions:
    naming: <naming conventions>
    exports: <export conventions>
---
```

```markdown
# Progress

## Registry

| ID | File | Title | Tag | Status | Depends |
|----|------|-------|-----|--------|---------|
| 01 | 01-<slug>.md | <title> | TRIVIAL | pending | — |
| 02 | 02-<slug>.md | <title> | CRITICAL | pending | 01 |

## Coverage

| Requirement | Specs |
|-------------|-------|
| AC-01 | 01, 02 |
| EC-01 | 01 |

## Active

- Spec: `None`
- Phase: `idle`
- Resume: `Start with spec 01.`
- Updated: `<ISO-8601>`

## Notes
<project-specific notes>
```

Status values: `pending` | `active` | `done` | `blocked`

### Feature Spec Format

Write each file `<NN>-<slug>.md` with this structure:

```yaml
---
kind: feature
id: <NN>
title: <action phrase>
tag: TRIVIAL|CRITICAL
spec_ref: [AC-01, EC-02]
depends_on: []
feature_ref: F01
---
```

```markdown
# Goal
<one paragraph: what this delivers>

## Contracts

### Data
| Entity | Fields | Notes |
|--------|--------|-------|
| <name> | <field list> | <constraints> |

### API
| Method | Path | Request | Response | Status |
|--------|------|---------|----------|--------|
| POST | /api/x | {body} | {body} | 200|4xx |

### UI
| State | Display | data-testid |
|-------|---------|-------------|
| Loading | spinner | x-loading |

Omit any subsection (Data, API, UI) that does not apply. Do not write "Not applicable".

## Files
| Action | Path | Description |
|--------|------|-------------|
| create | <path> | <desc> |
| modify | <path> | <desc> |
| ref | <path> | <reason> |

At least one `ref` row must exist.

## Actions

Write one `action` block per implementation step. Each action has:
- `id`: unique kebab-case identifier
- `tool`: one of `run_command`, `write_file`, `read_file`
- `args`: arguments for the tool (use `{{decisions.KEY}}` for decision references)
- `depends_on`: list of action ids that must complete first
- `condition`: optional expression referencing `decisions.KEY` or `completed`
- `retry`: number of retries (default from config)
- `on_failure`: `retry` | `skip` | `abort`

Example:

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

List actions in dependency order. Use `condition` for optional steps.

## Decisions

Write one `decision` block per choice point. Each decision has:
- `id`: unique kebab-case identifier
- `question`: the question to present
- `options`: at least 2 `{label, value}` objects
- `allow_other`: boolean (default false)
- `other_label`: label for Other option (default "Other (specify)")
- `other_validation`: `{type, pattern/message}` or `{type, min, max, message}` or `{type, values, message}`
- `other_normalize`: `{to: "slug"}` or `{to: "lower"}` or `{to: "raw"}`
- `condition`: optional expression; skip decision if false

Example:

```decision
id: auth-strategy
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

Write one `validate` block per verification check. Each validate has:
- `id`: unique kebab-case identifier
- `name`: human-readable name
- `tool`: typically `run_command`
- `args`: arguments for the tool
- `expect`: expected outcome description
- `depends_on`: action ids that must complete first
- `type`: `base` | `edges` | `e2e`
- `retry`: number of retries on failure (default 0)
- `on_failure`: `retry` | `skip` | `abort`

Example:

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

## Allowlists

Write one `allowlist` block constraining tool calls. Each entry:
- Top-level key: PascalCase name
- `tool`: which tool this constrains
- `allow`: list of glob patterns for permitted arguments

Example:

```allowlist
safe-commands:
  tool: run_command
  allow:
    - "npm test*"
    - "npm run build*"
    - "npm run lint*"
    - "bash scripts/*"

src-paths:
  tool: write_file
  allow:
    - "src/**"
    - "test/**"
    - "scripts/*"
```

Deny-by-default: if an allowlist entry exists for a tool, actions must match at least one pattern.

## Done
- [ ] Functional behavior works
- [ ] Unit tests pass (base + edges)
- [ ] All spec_ref IDs addressed in code
- [ ] E2E artifact runs successfully
```

Every feature spec MUST include a `config` block, a `state` block (initial status: idle), and at least one `action` block. Feature specs that have choice points MUST include `decision` blocks. All feature specs MUST include `validate` blocks and an `allowlist` block.

### Planning Rules

10. One feature spec = one cohesive outcome. May touch multiple files.
11. Tag: TRIVIAL = 1 review pass, CRITICAL = 2 review passes.
12. Sequence actions: setup → core → integration → validation.
13. depends_on must reference lower IDs only.
14. Every AC-* and EC-* must appear in Coverage table.
15. Registry rows must match real files exactly (id, filename, title).
16. Update PRD `## Features` from [INITIALIZED] to [PLANNED].

### Save-Time Checklist

Before returning, verify ALL:
- [ ] PROGRESS.md has Registry table with one row per feature spec file
- [ ] Every Registry row matches a real feature spec file (name, id, title)
- [ ] Coverage table maps every AC-* and EC-* from the PRD
- [ ] No AC-* or EC-* is unmapped
- [ ] Every feature spec has: Goal, Contracts, Files, Actions, Validates, Done
- [ ] Every feature spec has: config block, state block, allowlist block
- [ ] Every action has a unique id, a tool, and args
- [ ] Every validate has a unique id, a tool, args, and expect
- [ ] Every decision has a unique id, a question, and at least 2 options
- [ ] Every API row has all 5 columns
- [ ] Every Files row has action|path|description
- [ ] Done section has >= 4 checkboxes
- [ ] No placeholder text anywhere

## Question Format

Use the agent's native question tool to present each question as an interactive selection. Each question must:
- Use a concise question text as the prompt
- Offer 2-5 prefilled option labels the user can click
- Include a "Custom" option so users can type their own answer
- Batch all questions in a single tool call when possible

Do not use text-based Q1/Q2 formats or ask users to type numbered answers. Use the tool's built-in selection mechanism for a click-based UX.

## Constraints

- Prefer feature spec files over long narrative plans
- Sequence: setup → core logic → integration → validation → tests
- Completeness takes priority over brevity
- Do not write the feature-spec directory before the question phase is complete
- Do not return a partial feature-spec directory after the question phase is complete
- Do not finish planning until PROGRESS.md, feature spec files, and Coverage table all agree

## Output

- Directory: `.pspec/tasks/<stem>/`
- PROGRESS.md path
- Feature spec file list
- Copy-pasteable: `/pspec.implement .pspec/tasks/<stem>/PROGRESS.md`
