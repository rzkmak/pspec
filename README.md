# pspec

<p align="center">
  <img src="./pspec-logo.jpg" alt="pspec logo" width="220" />
</p>

> **A minimalist Spec-Driven Development (SDD) toolkit for solo developers and AI agents.**

`pspec` (picospec) is a lightweight alternative to heavy SDD frameworks. It is the smallest specification workflow for a solo developer. It removes the "enterprise theater" (branch-per-feature, complex state files, and heavy daemon processes) and focuses strictly on **intent** (the Spec) and **execution** (the Tasks) using simple Markdown files.

It is designed to work seamlessly alongside your favorite AI coding agents: Claude Code, Gemini CLI, Cursor, and OpenCode.

## Philosophy
- **Token Efficient:** Uses a single spec `*.md` and task `*.tasks.md` file for context instead of massive chat histories.
- **Visual-First:** Encourages Mermaid.js diagrams over long, confusing paragraphs.
- **Data Dictionaries:** Uses simple Markdown tables for data modeling instead of strict, unreadable JSON schemas.
- **Sub-Agent Orchestration:** It instructs your main AI agent to act as an orchestrator, delegating implementation to parallel sub-agents to preserve your context window.

---

## Installation

We recommend running `pspec` directly via `npx` so you always get the freshest, most up-to-date prompts for your AI agents when initializing a new project.

```bash
npx pspec@latest
```

---

## How to Use

The workflow follows a simple three-step loop: **Initialize -> Plan -> Implement**.

### Step 1: Initialize the Project
Run this command in the root of your project:
```bash
npx pspec@latest
```
- It will prompt you for your preferred AI agent (Claude, Gemini, Cursor, etc.).
- It will create the `.pspec/specs/` and `.pspec/tasks/` directories.
- It will automatically inject custom commands into your project (e.g., `.gemini/commands/pspec.plan.toml` or `.cursor/rules/pspec.implement.mdc`) so your AI agent natively understands the framework and provides autocomplete commands like `/pspec.spec`.
- **Note:** If you already have `.pspec` in your project, running this command will **update** your local AI instructions to the latest version without overwriting your specs or tasks.

*(Note: After running `init`, you may need to restart your AI agent session so it can detect the new slash commands).*

### Step 2: The Inquiry (Creating a Spec)
Use the native slash command in your AI agent to start drafting a specification.

**Command:**
```text
/pspec.spec Let's create a spec for a new authentication feature.
```
- **Context Gathering:** The AI will automatically look at your existing codebase to understand your current architecture before answering.
- **The Inquiry:** It will not guess. Instead, it will ask you multiple-choice questions to define the core logic, edge cases, and data models.
  
  *Example Interaction:*
  > **AI:** Q1: How should we handle session storage?
  > Option A: JWT in HTTP-only cookies (Pros: Secure against XSS. Cons: Harder to invalidate).
  > Option B: Redis-backed sessions (Pros: Easy to revoke. Cons: Requires setting up Redis).
  > Option C: (Custom, please type your answer)
  >
  > **You:** Q1: A
  
- **Approval Checkpoint 1:** After you answer, the AI will ask: *"Are you ready for me to draft the specification based on these answers? (Please reply 'Approved' or 'LGTM')"*
- **Drafting:** Once approved, it will generate a highly structured `.pspec/specs/1742451234567-auth.md` file featuring a Mermaid diagram and an Acceptance Criteria checklist.
- **Approval Checkpoint 2:** It will output the file path for your review and wait for you to say **"Approved"** or **"LGTM"** again before automatically offering the next command.

### Step 3: Scaffold the Plan
Once you are happy with the spec, use the planning command to break it down.

**Command:**
```text
/pspec.plan 1742451234567-auth
```
- If you don't provide a spec name, the AI will choose the most relevant recent spec.
- **Sequencing:** The AI will read the spec and create a strict, logically sequenced checklist in `.pspec/tasks/1742451234567-auth.tasks.md` (Data -> Logic -> UI -> Edge Cases -> Automated Tests).
- **Naming:** Spec files use the format `<epoch-ms>-<slug>.md`, and task files reuse the same stem as `<epoch-ms>-<slug>.tasks.md`.
- It will show you the exact file path so you can review the generated tasks and ask for your approval before proceeding.

### Step 4: Implement and Execute
Once the checklist is generated, hand the wheel over to the AI to orchestrate the implementation.

**Command:**
```text
/pspec.implement 1742451234567-auth
```
- If you don't provide a spec name, the AI will use the most recently updated matching task file.
- **Sub-Agent Delegation:** To prevent context bloat, the AI will read the first `- [ ]` task and delegate the actual coding to a sub-agent.
- **Parallelization:** If tasks are independent (e.g., backend and frontend), it will spawn multiple sub-agents to execute them simultaneously!
- **Empirical Verification:** The sub-agent will write the code, autonomously run your tests/linters, fix any errors, and only report back when the build is green.
- It will change the checkbox to `- [x]` and stop to wait for your review.

### Step 5: Debugging and Maintenance
If you encounter bugs, compile errors, or failing tests (whether during implementation or in normal development), use the debug command.

**Command:**
```text
/pspec.debug [error log or description]
```
- **Context Isolation:** The AI will automatically search the codebase for the error's source and spawn an isolated sub-agent to find a fix.
- **Repro-First:** It will create a minimal reproduction script to confirm the bug before applying a fix.
- **Parallel Hypotheses:** If there are multiple potential causes, it can investigate them in parallel to find the solution faster!
- **PSpec-Aware:** It will check if the bug is related to any active tasks or existing specs to ensure consistency.


---

## Directory Structure
A project using `pspec` will look like this:

```text
your-project/
├── .pspec/
│   ├── pspec.json                 # Auto-generated config
│   ├── specs/
│   │   └── 1742451234567-auth.md  # The "Intent" (Markdown/Mermaid)
│   └── tasks/
│       └── 1742451234567-auth.tasks.md # The "Execution" (Checklists)
├── .opencode/                     # Default agent integration
│   ├── agents/
│   │   ├── architect.md
│   │   ├── debugger.md
│   │   └── ...
│   └── commands/
│       ├── pspec.spec.md
│       ├── pspec.plan.md
│       └── pspec.implement.md
├── .gemini/                       # Optional: alternative agent integration
│   ├── agents/
│   │   ├── architect.toml
│   │   ├── debugger.toml
│   │   └── ...
│   └── commands/
│       ├── pspec.spec.toml
│       ├── pspec.plan.toml
│       └── pspec.implement.toml
├── .claude/                       # Optional: alternative agent integration
│   ├── agents/
│   │   ├── architect.md
│   │   ├── debugger.md
│   │   └── ...
│   └── commands/
│       ├── pspec.spec.md
│       ├── pspec.plan.md
│       └── pspec.implement.md
├── .cursor/                       # Optional: alternative agent integration
│   ├── agents/
│   │   ├── architect.mdc
│   │   ├── debugger.mdc
│   │   └── ...
│   ├── commands/
│   │   ├── pspec.spec.md
│   │   ├── pspec.plan.md
│   │   └── pspec.implement.md
│   └── rules/
│       ├── pspec.spec.mdc
│       ├── pspec.plan.mdc
│       └── pspec.implement.mdc
├── src/                           # Your actual code
└── package.json
```
