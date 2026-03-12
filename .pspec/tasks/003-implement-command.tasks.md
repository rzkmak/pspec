# Implementation Tasks: 003-implement-command

> **AI INSTRUCTION:** Read `.pspec/specs/003-implement-command.md`. Break down the requirements into granular, sequential implementation tasks below. Use checkboxes (`- [ ]`). Group by phases.

## Phase 1: Setup & Scaffolding
- [x] Create `src/commands/implement.ts` structure.
- [x] Register `implement` command in `src/index.ts` expecting a `<spec-name>` argument and an optional `--batch` flag.

## Phase 2: Core Logic (`implement.ts`)
- [x] Resolve path for `.pspec/tasks/<spec-name>.tasks.md`.
- [x] Implement check for tasks file existence. Return error if not found.
- [x] Read the content of the tasks file.
- [x] Parse the file to determine if there are any unchecked tasks (`- [ ]`). Return warning if all are done.
- [x] Generate the "execution prompt" string based on the `--batch` flag.
- [x] Output the final string to the console using `chalk` for formatting.

## Phase 3: Validation & Testing
- [x] Create `src/commands/implement.test.ts` using the sandboxed directory approach.
- [x] Write test case for missing tasks file (should error).
- [x] Write test case for tasks file with no remaining tasks (should warn).
- [x] Write test case for successful prompt generation (one-by-one mode).
- [x] Write test case for successful prompt generation (batch mode).
- [x] Run `npm test` and ensure all tests pass.