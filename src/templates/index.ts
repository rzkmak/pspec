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

const commandPrompts: Record<string, { desc: string, prompt: string }> = {
  'pspec.spec': {
    desc: 'Start an inquiry to create a new PRD',
    prompt: loadPrompt('pspec.spec')
  },
  'pspec.plan': {
    desc: 'Generate feature specs for an existing PRD',
    prompt: loadPrompt('pspec.plan')
  },
  'pspec.audit': {
    desc: 'Audit and sync feature specs with the PRD',
    prompt: loadPrompt('pspec.audit')
  },
  'pspec.implement': {
    desc: 'Implement planned feature specs',
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
1. **PRDs** (\`.pspec/specs/\`) — Product requirement documents
2. **Feature Spec Directories** (\`.pspec/tasks/<stem>/\`) — Implementation-ready feature specs plus \`PROGRESS.md\`
3. **Agent Commands** — Generated slash commands that guide spec, planning, implementation, debugging, and git flow

## Commands
- \`/pspec.spec\`: Create a new PRD
- \`/pspec.plan\`: Generate feature specs from a PRD
- \`/pspec.audit\`: Audit and sync feature specs with the PRD
- \`/pspec.implement\`: Implement planned feature specs
- \`/pspec.debug\`: Investigate and fix errors
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
