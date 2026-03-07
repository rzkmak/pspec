# mspec

> **A minimalist Spec-Driven Development (SDD) toolkit for solo developers and AI agents.**

`mspec` is a lightweight alternative to heavy SDD frameworks like `spec-kit` or `get-shit-done`. It removes the "enterprise theater" (branch-per-feature, complex state files, and heavy daemon processes) and focuses strictly on **intent** (the Spec) and **execution** (the Tasks) using simple Markdown files.

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

The workflow follows a simple three-step loop: **Initialize -> Plan -> Apply**.

### Step 1: Initialize the Project
Run this command in the root of your project:
```bash
npx mspec init
```
- It will prompt you for your preferred AI agent (Claude, Gemini, Cursor, etc.).
- It will create the `.mspec/specs/` and `.mspec/tasks/` directories.
- It will automatically inject custom commands into your project (e.g., `.gemini/commands/mspec.plan.toml` or `.cursor/rules/mspec.apply.mdc`) so your AI agent natively understands the framework and provides autocomplete commands like `/mspec.spec`.

*(Note: After running `init`, you may need to restart your AI agent session so it can detect the new slash commands).*

### Step 2: The Inquiry (Creating a Spec)
Use the native slash command in your AI agent to start drafting a specification.

**Command:**
```text
/mspec.spec Let's create a spec for a new authentication feature. Save it to .mspec/specs/001-auth.md. Include a markdown description, a mermaid sequence diagram for login, and a markdown data dictionary for the user object.
```
The AI will use the `mspec` standard to output a clean, visual-first specification file.

### Step 3: Scaffold the Plan
Once you are happy with the `001-auth.md` spec, use the planning command to break it down.

**Command:**
```text
/mspec.plan Read .mspec/specs/001-auth.md and break it down into a granular checklist in .mspec/tasks/001-auth.tasks.md
```
*(Alternatively, you can run `npx mspec plan 001-auth` in your terminal to scaffold the exact boilerplate, and then tell the AI to fill it out).*

### Step 4: Implement and Execute
Once the checklist is generated, it's time to hand the wheel over to the AI to execute the tasks sequentially.

**Command:**
```text
/mspec.apply Please implement the tasks for 001-auth sequentially. Stop after each task for my review.
```
- *What the AI does:* It will read the `.tasks.md` file, pick the first unchecked `- [ ]` task, implement the code, run your tests, change the checkbox to `- [x]`, and then **stop** to wait for your review.

#### Terminal Execution (Optional)
If you prefer, you can use the terminal CLI to generate a strict execution prompt that you can paste to your AI:
```bash
# Generate the prompt for one-by-one execution
npx mspec implement 001-auth

# Generate the prompt for batch execution (don't stop for review)
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
├── .gemini/                       # (Or .claude / .cursor depending on your agent)
│   └── commands/
│       ├── mspec.spec.toml
│       ├── mspec.plan.toml
│       └── mspec.apply.toml
├── src/                           # Your actual code
└── package.json
```
