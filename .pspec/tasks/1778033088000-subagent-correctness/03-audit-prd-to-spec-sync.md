---
kind: feature
id: 03
title: Strengthen audit prompt for PRD-to-spec synchronization
tag: CRITICAL
spec_ref: [AC-05, AC-06, EC-02, EC-03, EC-06]
depends_on: [02]
feature_ref: F05
---

# Goal
Strengthen the `/pspec.audit` prompt template to detect PRD changes by comparing AC-* and EC-* IDs (AC-06), create new pending specs for unmapped requirements (EC-02), remove stale references when requirements are deleted (EC-03), ensure at least one spec covers each requirement even with overlapping specs (EC-06), and verify at S5 that the orchestrator confirms spec status from PROGRESS.md on disk — blocking handoff when status disagrees (AC-05).

## Contracts

### Data
| Entity | Fields | Notes |
|--------|--------|-------|
| PRD comparison | AC_ids_from_prd, EC_ids_from_prd, AC_ids_covered, EC_ids_covered | Sets of requirement IDs extracted from current PRD vs what Coverage maps |
| Coverage diff | added, removed, modified | Requirements new to PRD, removed from PRD, or with changed wording |

### API
| Method | Path | Request | Response | Status |
|--------|------|---------|----------|--------| (no API — this feature modifies prompt text only)

## Files
| Action | Path | Description |
|--------|------|-------------|
| modify | src/templates/prompts/pspec.audit.md | Add PRD change detection, Coverage synchronization rules, and overlapping spec handling |
| modify | src/templates/prompts/pspec.implement.md | Strengthen S5 handoff validation to confirm spec status from disk, block on status mismatch |
| modify | src/templates/index.test.ts | Add required strings for PRD change detection, Coverage sync, overlapping spec handling, and S5 handoff in audit and implement specs |
| ref | AGENTS.md | Reference for audit flow description |

## Actions

```config
name: audit-prd-to-spec-sync
version: 1.0.0
description: Strengthen audit prompt for PRD-to-spec synchronization and S5 handoff validation
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

```state
status: done
completed: [read-audit-prompt, add-prd-change-detection, add-overlapping-spec-handling, strengthen-s5-handoff, update-tests-audit]
failed: []
decisions: {new-spec-naming: next-id}
artifacts: {}
evidence: {check-audit-prd-diff: "PRD change detection found", check-audit-overlap: "overlap found, at least one spec found", check-s5-handoff: "Confirm the spec status matches found", check-audit-coverage-sync: "4 matches for unmapped/stale/new spec/removal", check-all-tests-pass-03: "27 tests pass, 3 suites pass"}
current_action: null
started_at: 2026-05-06T13:50:00Z
finished_at: 2026-05-06T14:15:00Z
```

```action
id: read-audit-prompt
description: Read the current pspec.audit.md prompt to understand its structure
tool: read_file
args:
  path: "src/templates/prompts/pspec.audit.md"
depends_on: []
on_failure: abort
```

```action
id: add-prd-change-detection
description: Add PRD change detection to audit prompt Phase 2 — compare AC-* and EC-* IDs between current PRD and Coverage table
tool: write_file
args:
  path: "src/templates/prompts/pspec.audit.md"
depends_on: [read-audit-prompt]
on_failure: abort
```

```action
id: add-overlapping-spec-handling
description: Add overlapping spec detection and resolution rule to audit prompt Phase 3 — ensure at least one spec covers each requirement when multiple specs reference the same AC-*
tool: write_file
args:
  path: "src/templates/prompts/pspec.audit.md"
depends_on: [add-prd-change-detection]
on_failure: abort
```

```action
id: strengthen-s5-handoff
description: Strengthen S5 in implement prompt to confirm spec status from PROGRESS.md on disk and block on status mismatch (active after worker returns)
tool: write_file
args:
  path: "src/templates/prompts/pspec.implement.md"
depends_on: []
on_failure: abort
```

```action
id: update-tests-audit
description: Add required strings to audit and implement spec tests for PRD change detection, overlapping spec handling, and S5 handoff validation
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && npx jest src/templates/index.test.ts --no-coverage 2>&1 | tail -20"
depends_on: [add-prd-change-detection, add-overlapping-spec-handling, strengthen-s5-handoff]
on_failure: abort
```

## Decisions

```decision
id: new-spec-naming
question: "When audit creates a new pending spec for an unmapped requirement, how should it be named?"
options:
  - label: "Next sequential ID"
    value: next-id
  - label: "Reuse the PRD requirement ID in the slug"
    value: requirement-slug
allow_other: false
```

## Validates

```validate
id: check-audit-prd-diff
name: Audit prompt includes PRD change detection comparing AC and EC IDs
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'PRD change detection' src/templates/prompts/pspec.audit.md || grep -c 'compare.*AC.*EC.*IDs' src/templates/prompts/pspec.audit.md"
depends_on: [add-prd-change-detection]
expect: "positive count"
type: base
```

```validate
id: check-audit-overlap
name: Audit prompt handles overlapping specs with at least one responsible spec per requirement
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'overlap' src/templates/prompts/pspec.audit.md || grep -c 'at least one spec' src/templates/prompts/pspec.audit.md"
depends_on: [add-overlapping-spec-handling]
expect: "positive count"
type: base
```

```validate
id: check-s5-handoff
name: Implement prompt S5 confirms spec status from disk and blocks on mismatch
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'status.*mismatch\\|status mismatch\\|still.*active.*blocker\\|confirm.*status.*from.*disk' src/templates/prompts/pspec.implement.md"
depends_on: [strengthen-s5-handoff]
expect: "positive count"
type: base
```

```validate
id: check-audit-coverage-sync
name: Audit prompt creates new specs for unmapped requirements and removes stale references
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'unmapped.*requirement\\|new.*pending.*spec\\|stale.*reference\\|remove.*from.*Coverage' src/templates/prompts/pspec.audit.md"
depends_on: [add-prd-change-detection, add-overlapping-spec-handling]
expect: "positive count"
type: edges
```

```validate
id: check-all-tests-pass-03
name: Full test suite passes after audit and handoff changes
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && npx jest --no-coverage 2>&1 | tail -10"
depends_on: [update-tests-audit]
expect: "all tests pass"
type: e2e
```

## Allowlists

```allowlist
safe-commands:
  tool: run_command
  allow:
    - "npx jest*"
    - "grep*"
    - "cd*"

src-paths:
  tool: write_file
  allow:
    - "src/templates/prompts/*"
    - "src/templates/index.test.ts"

read-paths:
  tool: read_file
  allow:
    - "src/**"
    - ".pspec/**"
    - "AGENTS.md"
```

## Done
- [x] Audit prompt detects PRD changes by comparing AC-* and EC-* IDs (AC-06)
- [x] Audit prompt creates new pending specs for unmapped requirements (EC-02)
- [x] Audit prompt removes stale references when EC-* is deleted (EC-03)
- [x] Audit prompt handles overlapping specs (EC-06)
- [x] Implement prompt S5 confirms spec status from disk (AC-05)
- [x] All spec_ref IDs addressed in prompt changes
- [x] Tests pass with new required strings for audit and implement