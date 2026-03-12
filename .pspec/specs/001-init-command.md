# pspec init Command

## Goal
Initialize the `pspec` environment in a project by prompting the user for their preferred AI agent and generating the appropriate configuration and custom instructions.

## Context
This command scaffolds the necessary directories and files to enable Spec-Driven Development (SDD) via AI agents. It ensures that the chosen agent (Claude, Gemini, Cursor, etc.) understands the `/pspec:spec`, `/pspec:plan`, and `/pspec:apply` workflows by injecting specific configuration files into the project.

## Logic Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant FS as File System
    
    User->>CLI: pspec init
    CLI->>FS: Check for existing .pspec/
    FS-->>CLI: Not found
    CLI->>User: Prompt: "Which AI agent are you using?" (Options: claude, gemini, cursor, opencode)
    User->>CLI: Selects [Agent]
    CLI->>FS: Create .pspec/specs/ & .pspec/tasks/
    CLI->>FS: Write pspec.json config
    CLI->>FS: Write agent-specific command/rules file based on template
    CLI-->>User: Success: Initialization complete
```

## Data Dictionary (pspec.json)

| Field | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `agent` | `string` | The user-selected AI agent. | Enum: `claude`, `gemini`, `cursor`, `opencode` |
| `paths.specs` | `string` | Relative path to specifications. | Default: `.pspec/specs` |
| `paths.tasks` | `string` | Relative path to implementation tasks. | Default: `.pspec/tasks` |

## Output Files by Agent

The `init` command must generate instructions tailored to the selected agent:

*   **claude:** `.claude/commands/pspec.md` (Markdown format)
*   **gemini:** `.gemini/commands/pspec.toml` (TOML format)
*   **cursor:** `.cursor/rules/pspec.mdc` (Markdown/MDC format)
*   **opencode:** `.opencode/commands/pspec.md` (Markdown format)
