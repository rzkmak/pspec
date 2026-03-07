export interface Template {
  dir: string;
  file: string;
  content: string;
}

export const templates: Record<string, Template> = {
  claude: {
    dir: '.claude/commands',
    file: 'mspec.md',
    content: `---
description: "Commands for Spec-Driven Development using mspec"
---
You are an AI assistant using the mspec framework.
When asked to /mspec:spec, /mspec:plan, or /mspec:apply, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  },
  gemini: {
    dir: '.gemini/commands',
    file: 'mspec.toml',
    content: `description = "Commands for Spec-Driven Development using mspec"
prompt = """
You are an AI assistant using the mspec framework.
When asked to /mspec:spec, /mspec:plan, or /mspec:apply, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
"""
`
  },
  cursor: {
    dir: '.cursor/rules',
    file: 'mspec.mdc',
    content: `---
description: Commands for Spec-Driven Development using mspec
globs: *
---
You are an AI assistant using the mspec framework.
When asked to /mspec:spec, /mspec:plan, or /mspec:apply, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  },
  opencode: {
    dir: '.opencode/commands',
    file: 'mspec.md',
    content: `---
description: "Commands for Spec-Driven Development using mspec"
---
You are an AI assistant using the mspec framework.
When asked to /mspec:spec, /mspec:plan, or /mspec:apply, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  },
  zed: {
    dir: '.mspec',
    file: 'INSTRUCTIONS.md',
    content: `# mspec Instructions

You are an AI assistant using the mspec framework.
When asked to /mspec:spec, /mspec:plan, or /mspec:apply, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  },
  generic: {
    dir: '.mspec',
    file: 'INSTRUCTIONS.md',
    content: `# mspec Instructions

You are an AI assistant using the mspec framework.
When asked to /mspec:spec, /mspec:plan, or /mspec:apply, follow the minimalist spec-driven development guidelines.
Specs are in .mspec/specs. Tasks are in .mspec/tasks.
`
  }
};

export function getTemplate(agent: string): Template | undefined {
  return templates[agent];
}
