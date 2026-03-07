# mspec

> **A minimalist Spec-Driven Development (SDD) toolkit for solo developers and AI agents.**

`mspec` is a lightweight alternative to heavy SDD frameworks. It removes the "enterprise theater" (branch-per-feature, complex state files, and heavy daemon processes) and focuses strictly on **intent** (the Spec) and **execution** (the Tasks) using simple Markdown files.

It is designed to work seamlessly alongside your favorite AI coding agents: Claude Code, Gemini CLI, Cursor, OpenCode, or Zed.

## Philosophy
- **Token Efficient:** Uses a single `SPEC.md` for context instead of massive chat histories.
- **Visual-First:** Encourages Mermaid.js diagrams over long, confusing paragraphs.
- **Data Dictionaries:** Uses simple Markdown tables for data modeling instead of strict, unreadable JSON schemas.
- **Agent Handoff:** You design the spec; the AI breaks down the tasks; the AI implements the tasks sequentially.

---

## Installation

You can run `mspec` directly via `npx` (recommended) or install it globally.

### Running via npx (No install required)
```bash
npx mspec <command>
```

### Global Installation
```bash
npm install -g mspec
```

*(Note: If you are cloning this repository locally for development, run `npm install`, then `npm run build`, and finally `npm link` to make the `mspec` command available globally on your machine).*

---

## How to Use

The workflow follows a simple three-step loop: **Initialize -> Plan -> Implement**.

### Step 1: Initialize the Project
Run this command in the root of your project:
```bash
npx mspec init
```
- It will prompt you for your preferred AI agent (Claude, Gemini, Cursor, etc.).
- It will create the `.mspec/specs/` and `.mspec/tasks/` directories.
- It will automatically inject a custom command/instruction file into your project (e.g., `.gemini/commands/mspec.toml` or `.cursor/rules/mspec.mdc`) so your AI agent understands the framework.

### Step 2: The Inquiry (Creating a Spec)
Talk to your AI agent and ask it to draft a specification using the `mspec` standard.

**Example Prompt to your AI:**
> "Let's create a spec for a new authentication feature. Save it to `.mspec/specs/001-auth.md`. Include a markdown description, a mermaid sequence diagram for login, and a markdown data dictionary for the user object."

### Step 3: Scaffold the Plan
Once you are happy with the `001-auth.md` spec, run:
```bash
npx mspec plan 001-auth
```
- This validates that the spec exists.
- It generates a boilerplate `.mspec/tasks/001-auth.tasks.md` file containing strict instructions for the AI.
- **Next Action:** Tell your AI agent: *"Please read the spec and fill out the tasks file for 001-auth."* The AI will break the spec down into granular checkboxes.

### Step 4: Implement and Execute
Once the checklist is generated, it's time to hand the wheel over to the AI.
```bash
npx mspec implement 001-auth
```
- This command analyzes the task list.
- It outputs a highly structured prompt to your terminal. 
- **Next Action:** Copy the outputted prompt and paste it to your AI agent. 
  - *What the AI does:* It will read the `.tasks.md` file, pick the first unchecked `- [ ]` task, implement the code, run your tests, change the checkbox to `- [x]`, and then **stop** to wait for your review.

#### Batch Execution
If you trust the AI and want it to burn through the whole checklist without stopping for your approval between tasks, use the `--batch` flag:
```bash
npx mspec implement 001-auth --batch
```

---

## Directory Structure
A project using `mspec` will look like this:

```text
your-project/
├── .mspec/
│   ├── mspec.json                 # Auto-generated config
│   ├── specs/
│   │   └── 001-auth.md            # The "Intent" (Markdown/Mermaid)
│   └── tasks/
│       └── 001-auth.tasks.md      # The "Execution" (Checklists)
├── src/                           # Your actual code
└── package.json
```
