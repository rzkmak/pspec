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
    // Fallback for cases where files are missing during dev/testing
    return `PROMPT_ERROR: ${name}.md not found at ${filePath}`;
  }
  return fs.readFileSync(filePath, 'utf-8').trim();
};

const commandPrompts: Record<string, { desc: string, prompt: string }> = {
  'mspec.spec': {
    desc: 'Start an inquiry to create a new spec',
    prompt: loadPrompt('mspec.spec')
  },
  'mspec.plan': {
    desc: 'Plan tasks for an existing spec',
    prompt: loadPrompt('mspec.plan')
  },
  'mspec.implement': {
    desc: 'Implement tasks from a checklist using sub-agents',
    prompt: loadPrompt('mspec.implement')
  },
  'mspec.debug': {
    desc: 'Investigate and resolve errors in the project using sub-agents',
    prompt: loadPrompt('mspec.debug')
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
description: "${data.desc}"
globs: "*"
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
