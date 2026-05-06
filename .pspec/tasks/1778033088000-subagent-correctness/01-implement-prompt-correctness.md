---
kind: feature
id: 01
title: Add fail-closed worker rules and Done-to-validate mapping to implement prompt
tag: CRITICAL
spec_ref: [AC-01, AC-02, AC-03, AC-07, EC-01, EC-04, EC-05, EC-07]
depends_on: []
feature_ref: F01
---

# Goal
Strengthen the `/pspec.implement` prompt template so that workers cannot mark a Done checkbox without validate evidence (AC-01), must perform a diff review at W4 against Files table and Contracts section (AC-02), batch-fix and retry on validate failures instead of silently continuing (AC-03), and never claim a validate or Done item passed without executing it and capturing evidence (AC-07). Handle edge cases where a validate lacks evidence (EC-01), depends on a failed action (EC-04), exhausts retries (EC-05), or where W4 finds a file missing (EC-07).

## Contracts

### Data
| Entity | Fields | Notes |
|--------|--------|-------|
| validate evidence | validate_id → summary string | Maps each validate id to a brief evidence summary (e.g., "all 12 tests pass, exit 0") captured at run time |
| Done mapping | checkbox_text → [validate_ids] | Each Done checkbox maps to one or more validate block ids that prove it |

### API
| Method | Path | Request | Response | Status |
|--------|------|---------|----------|--------| (no API — this feature modifies prompt text only)

## Files
| Action | Path | Description |
|--------|------|-------------|
| modify | src/templates/prompts/pspec.implement.md | Add fail-closed rules section, strengthen W4 diff review, add Done-to-validate mapping at W6, add evidence capture requirement at W5 |
| modify | src/templates/index.test.ts | Add required strings for fail-closed rules, diff review, Done-to-validate mapping, evidence capture in the implement spec |

## Actions

```config
name: implement-prompt-correctness
version: 1.0.0
description: Add fail-closed rules, diff review gate, and Done-to-validate mapping to implement prompt
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
completed: [read-implement-prompt, add-fail-closed-section, strengthen-w4-diff-review, add-w5-evidence-capture, add-w6-done-mapping, update-tests]
failed: []
decisions: {insert-point: after-guardrails}
artifacts: {}
evidence: {check-prompt-structure: "10 tests pass", check-required-strings: "Fail-Closed=1, done-to-validate=1, state.evidence=12", check-diff-review-section: "grep returns 1 match", check-edge-case-handling: "no evidence=3, skipped-with-reason=2, batch-fix=3", check-all-tests-pass: "27 tests pass, 3 suites pass"}
current_action: null
started_at: 2026-05-06T12:30:00Z
finished_at: 2026-05-06T13:15:00Z
```

```action
id: read-implement-prompt
description: Read the current pspec.implement.md prompt to understand its structure
tool: read_file
args:
  path: "src/templates/prompts/pspec.implement.md"
depends_on: []
on_failure: abort
```

```action
id: add-fail-closed-section
description: Add a new ## Fail-Closed Rules section to pspec.implement.md after the Worker Guardrails section
tool: write_file
args:
  path: "src/templates/prompts/pspec.implement.md"
  strategy: "{{decisions.insert_point}}"
depends_on: [read-implement-prompt]
on_failure: abort
```

```action
id: strengthen-w4-diff-review
description: Update W4 step in the implement prompt to include diff review against Files table and Contracts section, and to block progress on mismatches
tool: write_file
args:
  path: "src/templates/prompts/pspec.implement.md"
depends_on: [add-fail-closed-section]
on_failure: abort
```

```action
id: add-w5-evidence-capture
description: Update W5 step to require capturing evidence for each validate and writing it to state.evidence
tool: write_file
args:
  path: "src/templates/prompts/pspec.implement.md"
depends_on: [add-fail-closed-section]
on_failure: abort
```

```action
id: add-w6-done-mapping
description: Update W6 step to require Done-to-validate mapping and attestation written to PROGRESS.md Active section
tool: write_file
args:
  path: "src/templates/prompts/pspec.implement.md"
depends_on: [add-fail-closed-section]
on_failure: abort
```

```action
id: update-tests
description: Add required strings to the implement spec test for fail-closed rules, diff review, Done mapping, and evidence capture
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && npx jest src/templates/index.test.ts --no-coverage 2>&1 | head -80"
depends_on: [add-w6-done-mapping]
on_failure: abort
```

## Decisions

```decision
id: insert-point
question: "Where should the new ## Fail-Closed Rules section be inserted relative to existing sections in pspec.implement.md?"
options:
  - label: "After Worker Guardrails, before Block Parsing"
    value: after-guardrails
  - label: "After Context Freshness, before Orchestrator Protocol"
    value: after-context
  - label: "After Orchestrator Protocol, before Worker Protocol"
    value: after-orchestrator
allow_other: false
```

## Validates

```validate
id: check-prompt-structure
name: Implement prompt has new fail-closed rules, diff review, evidence, and Done mapping sections
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && npx jest src/templates/index.test.ts --no-coverage 2>&1 | tail -20"
depends_on: [update-tests]
expect: "all tests pass"
type: base
```

```validate
id: check-required-strings
name: Implement prompt contains required fail-closed strings
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'Fail-Closed' src/templates/prompts/pspec.implement.md && grep -c 'done-to-validate' src/templates/prompts/pspec.implement.md && grep -c 'state.evidence' src/templates/prompts/pspec.implement.md"
depends_on: [add-w6-done-mapping]
expect: "each grep returns a positive count"
type: base
```

```validate
id: check-diff-review-section
name: W4 diff review requires Files table and Contracts comparison
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'Files table and Contracts section' src/templates/prompts/pspec.implement.md"
depends_on: [add-w6-done-mapping]
expect: "positive count"
type: base
```

```validate
id: check-edge-case-handling
name: Edge cases EC-01 EC-04 EC-05 EC-07 are addressed in prompt text
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'no evidence' src/templates/prompts/pspec.implement.md && grep -c 'skipped-with-reason' src/templates/prompts/pspec.implement.md && grep -c 'batch-fix' src/templates/prompts/pspec.implement.md"
depends_on: [add-w6-done-mapping]
expect: "each grep returns a positive count"
type: edges
```

```validate
id: check-all-tests-pass
name: Full test suite passes after all prompt changes
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && npx jest --no-coverage 2>&1 | tail -10"
depends_on: [update-tests]
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
    - "src/commands/*"

read-paths:
  tool: read_file
  allow:
    - "src/**"
    - ".pspec/**"
```

## Done
- [x] Fail-Closed Rules section exists in implement prompt with explicit rules for AC-01, AC-03, AC-07
- [x] W4 step requires diff review against Files table and Contracts section (AC-02)
- [x] W5 step requires capturing evidence in state.evidence for each validate (AC-08 partial)
- [x] W6 step requires Done-to-validate mapping and attestation (AC-01, AC-04)
- [x] Edge cases EC-01, EC-04, EC-05, EC-07 are addressed in prompt text
- [x] All spec_ref IDs addressed in prompt changes
- [x] Tests pass with new required strings