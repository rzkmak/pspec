---
prd: .pspec/specs/1778033088000-subagent-correctness.md
stem: 1778033088000-subagent-correctness
created: 2026-05-06T12:00:00Z
context:
  key_files:
    - src/templates/prompts/
    - src/templates/index.ts
    - src/templates/index.test.ts
    - src/commands/init.ts
    - AGENTS.md
  patterns:
    - Prompt templates in src/templates/prompts/ are the single source of truth for all agent commands
    - Each agent (claude, gemini, cursor, opencode, antigravity, kilo) gets the same prompt content formatted differently
    - Tests in index.test.ts enforce workflow alignment via required/forbidden string checks
    - Block grammar uses fenced code blocks with language tags: config, allowlist, state, action, decision, validate
    - State block fields: status, completed, failed, decisions, artifacts, current_action, started_at, finished_at
  commands:
    test: npx jest src/templates/index.test.ts --no-coverage
    lint: npx eslint src/
    build: npx tsc
  conventions:
    naming: kebab-case for filenames and action IDs, PascalCase for allowlist entry names
    exports: Named exports only via getTemplates function
---

# Progress

## Registry

| ID | File | Title | Tag | Status | Depends |
|----|------|-------|-----|--------|---------|
| 01 | 01-implement-prompt-correctness.md | Add fail-closed worker rules and Done-to-validate mapping to implement prompt | CRITICAL | done | — |
| 02 | 02-state-evidence-field.md | Add evidence field to state block grammar and update plan prompt | CRITICAL | done | 01 |
| 03 | 03-audit-prd-to-spec-sync.md | Strengthen audit prompt for PRD-to-spec synchronization | CRITICAL | done | 02 |

## Coverage

| Requirement | Specs |
|-------------|-------|
| AC-01 | 01 |
| AC-02 | 01 |
| AC-03 | 01 |
| AC-04 | 01 |
| AC-05 | 03 |
| AC-06 | 03 |
| AC-07 | 01 |
| AC-08 | 02 |
| EC-01 | 01 |
| EC-02 | 03 |
| EC-03 | 03 |
| EC-04 | 01, 02 |
| EC-05 | 01, 02 |
| EC-06 | 03 |
| EC-07 | 01 |

## Active

- Spec: `None`
- Phase: `idle`
- Resume: `All specs complete.`
- Updated: `2026-05-06T14:15:00Z`

## Notes
- Spec 01 is the foundation: implement prompt changes for fail-closed rules, diff review, Done-to-validate mapping, and evidence capture
- Spec 02 builds on 01 to extend the state block grammar with the evidence field
- Spec 03 builds on 02 to strengthen audit and orchestrator handoff
- All changes are confined to prompt text and test expectations — no runtime code changes