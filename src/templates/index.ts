export interface Template {
  dir: string;
  file: string;
  content: string;
}

const commands = [
  { name: 'mspec.spec', desc: 'Create a new spec' },
  { name: 'mspec.plan', desc: 'Plan tasks for a spec' },
  { name: 'mspec.apply', desc: 'Implement tasks for a spec' }
];

export const templates: Record<string, Template[]> = {
  claude: commands.map(cmd => ({
    dir: '.claude/commands',
    file: `${cmd.name}.md`,
    content: `---
description: "${cmd.desc} using mspec"
---
You are an AI assistant using the mspec framework.
When asked to /${cmd.name}, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  })),
  gemini: commands.map(cmd => ({
    dir: '.gemini/commands',
    file: `${cmd.name}.toml`,
    content: `description = "${cmd.desc} using mspec"
prompt = """
You are an AI assistant using the mspec framework.
When asked to /${cmd.name}, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
"""
`
  })),
  cursor: commands.map(cmd => ({
    dir: '.cursor/rules',
    file: `${cmd.name}.mdc`,
    content: `---
description: ${cmd.desc} using mspec
globs: *
---
You are an AI assistant using the mspec framework.
When asked to /${cmd.name}, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  })),
  opencode: commands.map(cmd => ({
    dir: '.opencode/commands',
    file: `${cmd.name}.md`,
    content: `---
description: "${cmd.desc} using mspec"
---
You are an AI assistant using the mspec framework.
When asked to /${cmd.name}, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  })),
  zed: [{
    dir: '.mspec',
    file: 'INSTRUCTIONS.md',
    content: `# mspec Instructions

You are an AI assistant using the mspec framework.
When asked to /mspec.spec, /mspec.plan, or /mspec.apply, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  }],
  generic: [{
    dir: '.mspec',
    file: 'INSTRUCTIONS.md',
    content: `# mspec Instructions

You are an AI assistant using the mspec framework.
When asked to /mspec.spec, /mspec.plan, or /mspec.apply, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  }]
};

export function getTemplates(agent: string): Template[] {
  return templates[agent] || [];
}
