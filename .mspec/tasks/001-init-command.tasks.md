# mspec init - Implementation Tasks

Based on `.mspec/specs/001-init-command.md`

## Phase 1: Setup & Scaffolding
- [x] Initialize Node project (`npm init -y`) and install dependencies (`typescript`, `commander`, `enquirer`).
- [x] Configure TypeScript (`tsconfig.json`).
- [x] Create `src/index.ts` to set up `commander` CLI.
- [x] Create `src/commands/init.ts` for the `init` logic.

## Phase 2: Core Logic (`init.ts`)
- [x] Implement check for existing `.mspec/` directory.
- [x] Implement `enquirer` prompt to select the AI agent.
- [x] Implement logic to create `.mspec/specs/` and `.mspec/tasks/` directories.
- [x] Implement logic to generate `mspec.json`.

## Phase 3: Agent Integration
- [x] Create basic template content for `claude` (`.claude/commands/mspec.md`).
- [x] Create basic template content for `gemini` (`.gemini/commands/mspec.toml`).
- [x] Create basic template content for `cursor` (`.cursor/rules/mspec.mdc`).
- [x] Create basic template content for `opencode` (`.opencode/commands/mspec.md`).

- [x] Integrate template generation into `init.ts` based on selected agent.

## Phase 4: Validation
- [x] Build the project (`npx tsc`).
- [x] Run `node dist/index.js init` manually and test agent selection.
- [x] Verify directories and files are created correctly.