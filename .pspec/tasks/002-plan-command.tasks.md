# Implementation Tasks: 002-plan-command

> **AI INSTRUCTION:** Read `.pspec/specs/002-plan-command.md`. Break down the requirements into granular, sequential implementation tasks below. Use checkboxes (`- [ ]`). Group by phases.

## Phase 1: Setup & Scaffolding
- [x] Create `src/commands/plan.ts` structure.
- [x] Register `plan` command in `src/index.ts` expecting a `<spec-name>` argument.

## Phase 2: Core Logic (`plan.ts`)
- [x] Resolve paths for the `.pspec/specs/<spec-name>.md` and `.pspec/tasks/<spec-name>.tasks.md`.
- [x] Implement check for spec file existence. Return error if not found.
- [x] Implement check for tasks file existence. Return warning if it already exists.
- [x] Implement boilerplate markdown generation.
- [x] Write boilerplate to `.pspec/tasks/<spec-name>.tasks.md`.

## Phase 3: Validation & Testing
- [x] Create `src/commands/plan.test.ts` using the sandboxed directory approach.
- [x] Write test case for missing spec file (should error).
- [x] Write test case for existing tasks file (should warn).
- [x] Write test case for successful scaffolding.
- [x] Run `npm test` and ensure all tests pass.
- [x] Build the project and test the executable manually.