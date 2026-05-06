---
kind: prd
stem: 1778033088000-subagent-correctness
created: 2026-05-06T12:00:00Z
---

# Improve Subagent Correctness and Prevent Context Rot

## Intent

pspec's orchestrator/worker protocol (S1–S7, W1–W6) delegates feature-spec execution to subagents. Two systemic problems undermine this: workers report false positives by claiming Done items they never verified, and PRD-to-spec gaps accumulate when the PRD changes after planning but feature specs and PROGRESS.md are not reconciled. This PRD tightens the worker protocol so that every Done checkbox maps to a validate block result, adds a diff-review gate before marking a spec done, enforces fail-closed behavior with configurable auto-retry, and strengthens the PRD-to-spec synchronization path. Success means a worker can never mark a spec done without producing evidence, and a PRD change always propagates to specs before the next dispatch.

## Flow

1. Orchestrator reads PROGRESS.md and PRD at S1, dispatches worker with paths
2. Worker loads context, parses all blocks, marks spec active at W1
3. Worker resolves decisions at W2, writes state after each
4. Worker executes actions in topological order at W3, writes state after each action
5. Worker audits implemented work against spec at W4, comparing diffs to Contracts and Files tables
6. Worker runs validate blocks at W5 (base → edges → e2e), collects verbatim output as evidence
7. Worker maps each Done checkbox to one or more validate block results at W6
8. Worker can only check a Done item if at least one corresponding validate passed with evidence
9. If any validate fails, worker batch-fixes and retries up to config.defaults.retry times before marking the spec failed/blocked
10. Orchestrator validates handoff at S5, confirms spec state matches PROGRESS.md
11. Audit command reconciles PRD changes to specs before any dispatch resumes

## Acceptance Criteria

- AC-01: Every Done checkbox in a feature spec maps to one or more validate block ids, and a worker can only mark a Done item checked if at least one mapped validate block has a passing result with captured evidence
- AC-02: Workers must perform a diff review at W4: compare actual file changes against the spec's Files table and Contracts section, and report mismatches as audit failures before proceeding
- AC-03: When a validate block fails, the worker batch-fixes all related failures and retries up to the spec's retry limit; if all retries are exhausted and on_failure is abort, the spec is marked failed — never silently continued past a failure
- AC-04: The W6 completion step requires the worker to attest that each Done checkbox has corresponding validate evidence, and this attestation is written into the PROGRESS.md Active section before the spec is marked done
- AC-05: The orchestator at S5 reads PROGRESS.md from disk and confirms the spec status matches what the worker reported; if status is still active after the worker returns, the orchestrator reports a blocker instead of advancing
- AC-06: The audit command (/pspec.audit) detects when a PRD has changed since the last plan by comparing AC-* and EC-* IDs; any new, removed, or modified requirement triggers a sync that updates Coverage, Registry, and affected spec files before implementation can continue
- AC-07: The implement prompt template includes an explicit fail-closed rule: workers must never mark a Done item or a validate as passed unless they executed it and captured evidence in the same run
- AC-08: The state block gains an `evidence` field that maps validate ids to a brief evidence summary (e.g., "all 12 tests pass, exit 0"), and the state block is updated after each validate completes

## Edge Cases

- EC-01: Worker claims a validate passed but provides no evidence → orchestrator treats it as a failure and marks the spec blocked
- EC-02: PRD gains a new AC-* after planning, but no feature spec covers it → audit command creates a new pending spec and adds it to Coverage before implementation resumes
- EC-03: PRD removes an EC-* that was mapped to a done spec → audit command removes the stale reference from Coverage and re-evaluates whether the spec still covers remaining requirements
- EC-04: Worker encounters a validate that depends on an action in state.failed → worker skips the validate, logs it in state.evidence as skipped-with-reason, and does not check the corresponding Done item
- EC-05: Auto-retry exhausts all attempts for a validate → worker marks the validate as failed in state.evidence, does not check the corresponding Done item, and if on_failure is abort, marks the spec as failed
- EC-06: Two feature specs both reference the same AC-* → audit command detects the overlap and ensures at least one spec remains responsible after sync
- EC-07: Diff review at W4 finds a file that was supposed to be created per the Files table but does not exist → worker reports the mismatch as an audit failure and does not proceed to W5

## Constraints

- Changes target the prompt templates in `src/templates/prompts/` and their expected content in `src/templates/index.test.ts`
- The block grammar (config, allowlist, state, action, decision, validate) is extended, not replaced — the `state` block gains an `evidence` field
- Existing tests in `src/templates/index.test.ts` and `src/commands/init.test.ts` must continue to pass
- The orchestrator/worker protocol version (S1–S7, W1–W6) is preserved; the changes strengthen existing steps rather than adding new phase numbers
- Universal compatibility across all supported agents (claude, opencode, cursor, gemini, antigravity, kilo) must be maintained — every agent gets the same updated prompt content
- No new dependencies; changes are confined to prompt text and test expectations

## Features

- F01: Structured Done-to-validate mapping [IMPLEMENTED]
- F02: Diff-review gate at W4 [IMPLEMENTED]
- F03: Fail-closed with auto-retry enforcement [IMPLEMENTED]
- F04: Validate evidence tracking in state block [IMPLEMENTED]
- F05: PRD-to-spec synchronization via audit [IMPLEMENTED]
- F06: Orchestrator handoff validation strengthening [IMPLEMENTED]
- F07: Fail-closed attestation rule in implement prompt [IMPLEMENTED]

## Done
- [ ] All acceptance criteria are testable
- [ ] All edge cases have expected behaviors
- [ ] No placeholders remain