import fs from 'fs';
import path from 'path';

export interface Template {
  dir: string;
  file: string;
  content: string;
}

const loadPrompt = (name: string): string => {
  const filePath = path.join(__dirname, 'prompts', `${name}.md`);
  if (!fs.existsSync(filePath)) {
    return `PROMPT_ERROR: ${name}.md not found at ${filePath}`;
  }
  return fs.readFileSync(filePath, 'utf-8').trim();
};

export const SUBAGENT_ROLE_NAMES = [
  '_base',
  'typescript-engineer',
  'kotlin-engineer',
  'test-creator',
  'debugger',
  'security-analyst',
  'investigator',
];

const loadSubagentRole = (name: string): string => {
  const filePath = path.join(__dirname, '..', 'subagent', 'roles', `${name}.md`);
  if (!fs.existsSync(filePath)) {
    return `SUBAGENT_ROLE_ERROR: ${name}.md not found at ${filePath}`;
  }
  return fs.readFileSync(filePath, 'utf-8').trim();
};

export const subagentRoleTemplates: Template[] = SUBAGENT_ROLE_NAMES.map((name) => ({
  dir: '.pspec/subagent-roles',
  file: `${name}.md`,
  content: loadSubagentRole(name),
}));

const commandPrompts: Record<string, { desc: string, prompt: string }> = {
  'pspec.commit-current-branch': {
    desc: 'Commit current work on the current branch and push',
    prompt: loadPrompt('pspec.commit-current-branch')
  },
  'pspec.commit-raise-pr': {
    desc: 'Commit current work on a new branch and open a PR',
    prompt: loadPrompt('pspec.commit-raise-pr')
  },
  'pspec.spec': {
    desc: 'Start an inquiry to create a new spec',
    prompt: loadPrompt('pspec.spec')
  },
  'pspec.plan': {
    desc: 'Plan tasks for an existing spec',
    prompt: loadPrompt('pspec.plan')
  },
  'pspec.implement': {
    desc: 'Implement tasks from a checklist',
    prompt: loadPrompt('pspec.implement')
  },
  'pspec.debug': {
    desc: 'Investigate and resolve errors in the project',
    prompt: loadPrompt('pspec.debug')
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
  cursor: Object.entries(commandPrompts).flatMap(([name, data]) => ([
    {
      dir: '.cursor/rules',
      file: `${name}.mdc`,
      content: `---
description: "${data.desc}"
globs: "*"
---
${data.prompt}
`
    },
    {
      dir: '.cursor/commands',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---
${data.prompt}
`
    }
  ])),
  opencode: Object.entries(commandPrompts).map(([name, data]) => ({
    dir: '.opencode/commands',
    file: `${name}.md`,
    content: `---
description: "${data.desc}"
---
${data.prompt}
`
  })),
  antigravity: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.agent/workflows',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---

# ${name.replace('pspec.', 'Pspec ')}

${data.prompt}
`
    })),
    {
      dir: '.agent/skills/pspec',
      file: 'SKILL.md',
      content: `---
name: pspec
description: Spec-Driven Development (SDD) toolkit for AI agents.
---

# pspec

pspec is a toolkit for Spec-Driven Development. It uses:
1. **Specs** (\`.pspec/specs/\`) — Intent documents
2. **Tasks** (\`.pspec/tasks/\`) — Execution checklists
3. **Subagent Roles** (\`.pspec/subagent-roles/\`) — Expertise prompts

## Commands
- \`/pspec.spec\`: Create a new spec
- \`/pspec.plan\`: Plan tasks for a spec
- \`/pspec.implement\`: Implement planned tasks
- \`/pspec.debug\`: Investigate and fix errors
- \`/pspec.commit-current-branch\`: Commit to current branch
- \`/pspec.commit-raise-pr\`: Commit and raise PR
`
    }
  ],
  kilo: Object.entries(commandPrompts).map(([name, data]) => ({
    dir: '.kilo/commands',
    file: `${name}.md`,
    content: `---
description: "${data.desc}"
---
${data.prompt}
`
  }))
};

export function getTemplates(agent: string): Template[] {
  return templates[agent] || [];
}

export function getSubagentRoleTemplates(): Template[] {
  return subagentRoleTemplates;
}
