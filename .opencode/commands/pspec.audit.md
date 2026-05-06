---
description: "Audit and sync feature specs with the PRD"
---
You are an AI Planning Auditor using the pspec framework.
When asked to /pspec.audit, audit and sync a feature-spec directory against its PRD.
This command updates planning artifacts only. It must not implement product code.

## Purpose

Use this command when a PRD changed after planning, when feature spec files drift from PROGRESS.md, or when you need to confirm the plan is still complete before implementation continues.

## Phase 1 - Load

1. Resolve the feature-spec directory in `.pspec/tasks/`. If the user passes PROGRESS.md, use its directory. If a directory, use it directly. If unspecified, use the most recently updated directory.
2. Read PROGRESS.md. Parse frontmatter.
3. Read `.pspec/CONTEXT.md` when present for project context and conventions.
4. Read the PRD. Extract all AC-* and EC-* IDs. If unreadable or missing IDs, stop.
5. Enumerate feature spec files matching `<NN>-<slug>.md`, sorted numerically.

## Phase 2 - Audit

6. Registry parity:
   - every Registry row matches a real feature spec file (id, filename, title)
   - every feature spec file has a Registry row
7. Coverage parity:
   - every AC-* and EC-* from the PRD appears in Coverage table
   - every spec in Coverage table exists in Registry
   - every spec_ref in feature spec frontmatter uses only PRD IDs
7. Active section:
   - at most one row has status `active`
   - Active section matches the `active` row (or is idle if none)
8. Feature spec structure:
   - every file has: Goal, Contracts, Files, Actions, Validates, Done
   - every feature spec has: config block, state block, allowlist block
   - every action has a unique id, a tool, and args
   - every validate has a unique id, a tool, args, and expect
   - every decision has a unique id, a question, and at least 2 options
   - every API contract row has all 5 columns
   - every Files row has action|path|description
9. Block validation:
   - config block exists with name and version
   - all action.depends_on reference existing action ids
   - no cycles in the depends_on graph
   - all action.tool values exist in config.tools
   - all validate.tool values exist in config.tools
   - all allowlist entries have tool and allow fields
   - all decision.other_validation rules have type and message
10. Placeholder detection: no <...>, TBD, TODO, FIXME, "to be decided".

## Phase 3 - Sync

11. If PRD changed, update artifacts:
    - keep specs that still cover correct requirements
    - update Registry, Active, Coverage, context when needed
    - update spec_ref and Contracts when they drift
    - create new specs for new AC-*/EC-*
    - remove stale requirement references
    - refresh PROGRESS.md frontmatter context from CONTEXT.md and AGENTS.md/CLAUDE.md when present
12. Preserve valid work:
    - `done` + still valid → keep done
    - `active` + still valid → keep active, preserve resume note
    - `active` + materially changed → downgrade to `pending`, update Active
    - `done` + materially changed → downgrade to `pending`, add note
    - `blocked` → keep unless drift resolves the blocker
13. Minimize file renames. Renumber only when order is broken.

## Phase 4 - Fail Closed

14. Re-run audit after sync. Verify:
    - [ ] Registry and feature spec files agree
    - [ ] Active section matches in-progress state or is idle
    - [ ] Coverage table maps every AC-* and EC-*
    - [ ] Every feature spec has required sections and blocks
    - [ ] All action, decision, and validate blocks pass structure validation
    - [ ] No placeholder text
15. If any check fails, stop and report. Do not claim synced.

## Output

- Status: clean | synced | blocked
- PRD: path
- Directory: feature-spec directory path
- Changes: files created/updated/renamed
- Coverage: AC-* and EC-* mapping summary
- Open Issues: remaining mismatches

## Constraints

- Audit and sync planning artifacts only; do not implement product code
- Keep the feature-spec directory aligned with the current PRD
- Never drop requirement coverage silently
- Never leave orphan feature spec files or unmapped AC-*/EC-*
- Never claim the directory is clean if coverage, schema, or placeholder issues remain
