---
kind: feature
id: 02
title: Add evidence field to state block grammar and update plan prompt
tag: CRITICAL
spec_ref: [AC-08, EC-04, EC-05]
depends_on: [01]
feature_ref: F04
---

# Goal
Extend the state block grammar to include an `evidence` field that maps validate ids to brief evidence summaries (AC-08). Update the plan prompt (`pspec.plan.md`) to include the `evidence` field in the state block template. Update the implement prompt's W5 step to write evidence after each validate execution. Handle edge cases where a validate is skipped due to a failed dependency (EC-04 — log "skipped-with-reason" in evidence) and where retries are exhausted (EC-05 — log "failed" with retry count in evidence).

## Contracts

### Data
| Entity | Fields | Notes |
|--------|--------|-------|
| state block evidence | validate_id: string, summary: string | Key-value map where key is validate id and value is a brief summary like "all 12 tests pass, exit 0" |
| evidence entry | status: pass/failed/skipped-with-reason, summary: string | For failures: includes error and retry count; for skips: includes reason |

### API
| Method | Path | Request | Response | Status |
|--------|------|---------|----------|--------| (no API — this feature modifies prompt text and block grammar)

## Files
| Action | Path | Description |
|--------|------|-------------|
| modify | src/templates/prompts/pspec.plan.md | Add `evidence` field to state block template in the feature spec format section |
| modify | src/templates/prompts/pspec.implement.md | Update W5 to write evidence entries for each validate; update state block documentation; update W4/W6 evidence references |
| modify | src/templates/index.test.ts | Add required strings for evidence field in plan and implement specs; add forbidden check that old state block format without evidence is not present |
| ref | AGENTS.md | Reference for current state block grammar definition |

## Actions

```config
name: state-evidence-field
version: 1.0.0
description: Add evidence field to state block grammar and update prompts
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
completed: [update-plan-prompt-state, update-implement-prompt-evidence, update-agents-md-state, update-tests-evidence, verify-evidence-block]
failed: []
decisions: {evidence-format: flat-map}
artifacts: {}
evidence: {check-plan-evidence: "grep returns 4 matches for evidence in plan prompt", check-implement-evidence: "grep returns 12 matches for state.evidence in implement prompt", check-edge-case-evidence: "skipped-with-reason: 2, failed/retries: 4", check-agents-md-evidence: "grep returns 2 matches for evidence in AGENTS.md", check-all-tests-pass-02: "27 tests pass, 3 suites pass"}
current_action: null
started_at: 2026-05-06T13:20:00Z
finished_at: 2026-05-06T13:45:00Z
```

```action
id: update-plan-prompt-state
description: Update pspec.plan.md to include evidence field in state block template
tool: write_file
args:
  path: "src/templates/prompts/pspec.plan.md"
depends_on: []
on_failure: abort
```

```action
id: update-implement-prompt-evidence
description: Update pspec.implement.md W5 step to require writing evidence entries after each validate, including skipped-with-reason and failed entries
tool: write_file
args:
  path: "src/templates/prompts/pspec.implement.md"
depends_on: [update-plan-prompt-state]
on_failure: abort
```

```action
id: update-agents-md-state
description: Update AGENTS.md state block section to document the evidence field
tool: write_file
args:
  path: "AGENTS.md"
depends_on: []
on_failure: abort
```

```action
id: update-tests-evidence
description: Add required strings for evidence field in plan and implement test specs; run tests
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && npx jest src/templates/index.test.ts --no-coverage 2>&1 | tail -20"
depends_on: [update-plan-prompt-state, update-implement-prompt-evidence]
on_failure: abort
```

```action
id: verify-evidence-block
description: Verify that state block template in plan prompt includes evidence field
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'evidence' src/templates/prompts/pspec.plan.md"
depends_on: [update-plan-prompt-state]
expect: "positive count"
type: base
on_failure: abort
```

## Decisions

```decision
id: evidence-format
question: "What format should evidence entries use in the state block?"
options:
  - label: "Flat key-value map (Recommended)"
    value: flat-map
  - label: "Structured with status and summary"
    value: structured
allow_other: false
```

## Validates

```validate
id: check-plan-evidence
name: Plan prompt includes evidence field in state block template
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'evidence' src/templates/prompts/pspec.plan.md"
depends_on: [update-plan-prompt-state]
expect: "positive count"
type: base
```

```validate
id: check-implement-evidence
name: Implement prompt W5 step writes evidence entries
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'state.evidence' src/templates/prompts/pspec.implement.md"
depends_on: [update-implement-prompt-evidence]
expect: "positive count"
type: base
```

```validate
id: check-edge-case-evidence
name: Evidence entries handle skipped-with-reason (EC-04) and failed (EC-05)
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'skipped-with-reason' src/templates/prompts/pspec.implement.md && grep -c 'failed.*retries' src/templates/prompts/pspec.implement.md"
depends_on: [update-implement-prompt-evidence]
expect: "each grep returns a positive count"
type: edges
```

```validate
id: check-agents-md-evidence
name: AGENTS.md documents the evidence field in state block section
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && grep -c 'evidence' AGENTS.md"
depends_on: [update-agents-md-state]
expect: "positive count"
type: base
```

```validate
id: check-all-tests-pass-02
name: Full test suite passes after evidence field changes
tool: run_command
args:
  command: "cd /Users/rizki/github.com/pspec && npx jest --no-coverage 2>&1 | tail -10"
depends_on: [update-tests-evidence]
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
    - "AGENTS.md"

read-paths:
  tool: read_file
  allow:
    - "src/**"
    - ".pspec/**"
    - "AGENTS.md"
```

## Done
- [x] Plan prompt includes evidence field in state block template
- [x] Implement prompt W5 step writes evidence after each validate
- [x] Evidence entries handle skipped-with-reason (EC-04) and failed (EC-05) cases
- [x] AGENTS.md documents the evidence field in state block section
- [x] All spec_ref IDs addressed in prompt and doc changes
- [x] Tests pass with evidence-related required strings