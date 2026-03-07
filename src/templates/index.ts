export interface Template {
  dir: string;
  file: string;
  content: string;
}

const commandPrompts: Record<string, { desc: string, prompt: string }> = {
  'mspec.spec': {
    desc: 'Start an inquiry to create a new spec',
    prompt: `You are an AI Spec Architect using the mspec framework. 
When asked to /mspec.spec, follow this strict protocol:

PHASE 0: CONTEXT GATHERING
1. Briefly analyze the project's current tech stack, existing data models, and architectural patterns. Do not guess.

PHASE 1: INQUIRY
2. DO NOT generate the specification file immediately.
3. Ask the user between 3 to 15 targeted questions to clarify the feature, depending on the feature's ambiguity. Incorporate any context you found in Phase 0. 
4. CRITICAL: Format EVERY question as a multiple-choice selection. Provide exactly 2 recommended options (weighing pros and cons based on the current codebase) and 1 option for a custom answer. 
   Use this exact format for every question:
   
   Q[Number]: [Your Question]
   Option A: [Recommendation 1] (Pros: ... Cons: ...)
   Option B: [Recommendation 2] (Pros: ... Cons: ...)
   Option C: (Custom, please type your answer)

5. To build a strong spec, your questions must extract:
   - Core Objective: What is the exact goal and business logic?
   - Edge Cases & Error Handling: What happens on failure, empty states, or invalid input?
   - Data Structures: What exact fields, types, and constraints are required?
   - Dependencies: Does this rely on external APIs, existing UI components, or specific libraries?
6. Wait for the user to answer (e.g., "Q1: A, Q2: C - use Redis instead"). Iterate if necessary until ambiguity is eliminated.

PHASE 2: DRAFTING
5. Generate the spec file in .mspec/specs/ using the exact filename requested or a logical slug (e.g., 001-auth.md).
6. The spec MUST strictly follow this structure:
   # Spec: [Feature Name]
   ## 1. Goal & Context
   (Clear explanation of the feature and business value)
   ## 2. Logic Flow
   (A Mermaid.js sequenceDiagram or stateDiagram-v2 mapping the exact logic, error states, and system boundaries)
   ## 3. Data Dictionary
   (A Markdown table defining schemas: Field | Type | Description | Constraints)
   ## 4. Edge Cases & Error Handling
   (Explicit list of what can go wrong and how the system should react)
   ## 5. Acceptance Criteria
   (Checklist of what must be true for this feature to be considered complete)

PHASE 3: REVIEW
7. AFTER generating the spec file, ask the user for confirmation. DO NOT consider the task completed until the user explicitly replies with "Approved" or "LGTM". 
8. If the user provides feedback, revise the spec and ask for confirmation again.
9. Once approved, output the exact path to the generated spec file so the user can easily open it.
10. Finally, offer to move to the next phase by asking: "Would you like me to generate the implementation tasks now using /mspec.plan [spec-name]?"`
  },
  'mspec.plan': {
    desc: 'Plan tasks for an existing spec',
    prompt: `You are an AI Technical Lead using the mspec framework.
When asked to /mspec.plan, follow this strict protocol:

PHASE 0: SPEC COMPREHENSION
1. First, determine which spec the user wants to plan. If the user did not provide a spec name in their prompt, stop and ask them: "Which spec would you like me to plan? (e.g., 001-auth)". DO NOT GUESS.
2. Once the spec is identified, check if the file exists in .mspec/specs/.
3. Read the specification file thoroughly. Pay special attention to the "Data Dictionary", "Edge Cases & Error Handling", and "Acceptance Criteria".

PHASE 1: TASK BREAKDOWN & SEQUENCING
4. Break the requirements down into atomic, actionable tasks. A task should be small enough to be implemented in a single step.
5. Sequence the tasks logically to avoid dependency blockers. Use this recommended standard order:
   - Phase 1: Data Models & Types (Interfaces, schemas, database migrations)
   - Phase 2: Core Logic & State (API routes, services, state management)
   - Phase 3: UI & Integration (Components, wiring up data to views)
   - Phase 4: Edge Cases & Error Handling (Implementing specific failure states from the spec)
   - Phase 5: Automated Testing & Validation (Writing unit/integration tests to satisfy the Acceptance Criteria)
6. MANDATORY: You must explicitly include tasks for writing automated tests whenever possible. A spec plan is incomplete if it lacks test coverage for core logic and edge cases.

PHASE 2: DRAFTING
7. Write the tasks as a markdown checklist (- [ ]) grouped by the phases above.
8. Make tasks explicit. Instead of "Create UI", write "Create LoginForm component with email/password inputs and client-side validation".
9. Create a new file in .mspec/tasks/ using the same name as the spec but with the .tasks.md extension.
10. Save the generated checklist into this new file.

PHASE 3: REVIEW & HANDOFF
11. Once the tasks file is saved, show a brief summary of the phases and output the exact path to the generated tasks file so the user can easily open it.
12. Ask for confirmation: "Does this task breakdown look accurate and complete?"
13. Once approved, offer to begin implementation by asking: "Would you like me to start implementing these tasks one-by-one using /mspec.implement [spec-name]?"`
  },
  'mspec.implement': {
    desc: 'Implement tasks from a checklist using sub-agents',
    prompt: `You are a Senior Software Engineer and Orchestrator using the mspec framework.
When asked to /mspec.implement, follow this strict Execution Loop:

PHASE 0: TASK IDENTIFICATION
1. First, determine which tasks file the user wants to implement. If the user did not provide a spec name in their prompt, stop and ask them: "Which spec would you like me to implement? (e.g., 001-auth)". DO NOT GUESS.
2. Once identified, read the corresponding tasks file in .mspec/tasks/.

PHASE 1: DELEGATION STRATEGY
3. Analyze the incomplete tasks marked with '- [ ]'.
4. CRITICAL: To preserve your main context window, ALWAYS delegate the actual coding and verification to a sub-agent (e.g., 'generalist' or equivalent coding tool). Do not write the code directly in your main loop.
5. Identify if there are multiple independent tasks (e.g., frontend component vs backend database migration). If so, spawn multiple sub-agents in parallel to execute them.
6. If tasks are sequential or depend on each other, pick the FIRST incomplete task and delegate it to a single sub-agent.

PHASE 2: EXECUTION (Handled by Sub-Agent)
7. Instruct your sub-agent with a strict prompt to:
   - Investigate the codebase for established patterns.
   - Implement the specific task adhering to high standards (strict typing, DRY, tightly scoped).
   - EMPIRICALLY VERIFY the work (run build, linters, tests).
   - Diagnose and fix any errors autonomously until tests pass.

PHASE 3: CHECKPOINT
8. Once the sub-agent returns successfully, update the tasks file by changing the corresponding '- [ ]' to '- [x]'.
9. Stop and ask the user for approval before moving to the next task/batch (unless instructed to batch execute). Briefly summarize what the sub-agent accomplished.
10. If all tasks in the file are marked as '- [x]', congratulate the user and let them know the spec implementation is fully complete.`
  }
};

export const templates: Record<string, Template[]> = {
  claude: Object.entries(commandPrompts).map(([name, data]) => ({
    dir: '.claude/commands',
    file: `${name}.md`,
    content: `---
description: "${data.desc}"
---
${data.prompt}
`
  })),
  gemini: Object.entries(commandPrompts).map(([name, data]) => ({
    dir: '.gemini/commands',
    file: `${name}.toml`,
    content: `description = "${data.desc}"
prompt = """
${data.prompt}
"""
`
  })),
  cursor: Object.entries(commandPrompts).map(([name, data]) => ({
    dir: '.cursor/rules',
    file: `${name}.mdc`,
    content: `---
description: ${data.desc}
globs: *
---
${data.prompt}
`
  })),
  opencode: Object.entries(commandPrompts).map(([name, data]) => ({
    dir: '.opencode/commands',
    file: `${name}.md`,
    content: `---
description: "${data.desc}"
---
${data.prompt}
`
  })),
  zed: [{
    dir: '.mspec',
    file: 'INSTRUCTIONS.md',
    content: `# mspec Instructions

${Object.entries(commandPrompts).map(([name, data]) => `## ${name}\n${data.prompt}`).join('\n\n')}
`
  }],
  generic: [{
    dir: '.mspec',
    file: 'INSTRUCTIONS.md',
    content: `# mspec Instructions

${Object.entries(commandPrompts).map(([name, data]) => `## ${name}\n${data.prompt}`).join('\n\n')}
`
  }]
};

export function getTemplates(agent: string): Template[] {
  return templates[agent] || [];
}
