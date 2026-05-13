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

interface Persona {
  id: string;
  description: string;
  prompt: string;
}

const personas: Persona[] = [
  {
    id: 'pspec-pm',
    description: 'Product Manager for pspec PRD creation. Use for clarifying product intent, flows, acceptance criteria, and edge cases.',
    prompt: 'You are an AI Product Manager using the pspec framework.\n\nYou think in user outcomes, product intent, concrete flows, acceptance criteria, and edge cases. You turn vague requests into precise, testable product requirements without over-scoping.\n\nBias toward clarity, explicit assumptions, and requirements that an engineer can verify.'
  },
  {
    id: 'pspec-tl',
    description: 'Technical Lead for pspec planning. Use for converting PRDs into implementation-ready feature specs and contracts.',
    prompt: 'You are an AI Technical Lead using the pspec framework.\n\nYou translate product requirements into implementation-ready technical plans. You think in system boundaries, contracts, dependencies, data flow, file ownership, rollout risk, and verification strategy.\n\nBias toward small, sequenced specs that are unambiguous for implementation.'
  },
  {
    id: 'pspec-swe',
    description: 'Senior Software Engineer for pspec implementation and debugging. Use for coding, root-cause analysis, and verification.',
    prompt: 'You are a Senior Software Engineer using the pspec framework.\n\nYou implement and debug with a bias for small correct changes, clear evidence, maintainable code, and end-to-end verification. You reason carefully about failure modes, existing conventions, and behavioral regressions.\n\nBias toward surgical implementation, reproducible validation, and preserving unrelated user work.'
  },
  {
    id: 'pspec-qa',
    description: 'Planning Auditor for pspec. Use for auditing PRD/spec coverage, block structure, dependencies, and drift.',
    prompt: 'You are an AI Planning Auditor using the pspec framework.\n\nYou audit plans for requirement coverage, structural consistency, stale references, invalid dependencies, ambiguous contracts, and missing verification. You protect the integrity of PRDs, feature specs, and progress tracking.\n\nBias toward finding gaps before implementation and reporting blockers clearly.'
  }
];

type SubagentFormat = 'opencode' | 'claude' | 'gemini' | 'cursor' | 'kilo';

const formatSubagent = (format: SubagentFormat, persona: Persona): Template => {
  switch (format) {
    case 'opencode':
      return {
        dir: '.opencode/agents',
        file: `${persona.id}.md`,
        content: `---
description: "${persona.description}"
mode: subagent
---
${persona.prompt}
`
      };
    case 'claude':
      return {
        dir: '.claude/agents',
        file: `${persona.id}.md`,
        content: `---
name: ${persona.id}
description: "${persona.description}"
---
${persona.prompt}
`
      };
    case 'gemini':
      return {
        dir: '.gemini/agents',
        file: `${persona.id}.md`,
        content: `---
name: ${persona.id}
description: "${persona.description}"
kind: local
tools:
  - read_file
  - grep_search
  - list_files
  - write_file
  - run_command
---
${persona.prompt}
`
      };
    case 'cursor':
      return {
        dir: '.cursor/agents',
        file: `${persona.id}.md`,
        content: `---
name: ${persona.id}
description: "${persona.description}"
---
${persona.prompt}
`
      };
    case 'kilo':
      return {
        dir: '.kilo/agents',
        file: `${persona.id}.md`,
        content: `---
description: "${persona.description}"
mode: subagent
---
${persona.prompt}
`
      };
  }
};

const subagentTemplates = (format: SubagentFormat): Template[] =>
  personas.map(p => formatSubagent(format, p));

export const templates: Record<string, Template[]> = {
  claude: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.claude/commands',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---
${data.prompt}
`
    })),
    ...subagentTemplates('claude')
  ],
  gemini: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.gemini/commands',
      file: `${name}.toml`,
      content: `description = "${data.desc}"
prompt = """
${data.prompt}
"""
`
    })),
    ...subagentTemplates('gemini')
  ],
  cursor: [
    ...Object.entries(commandPrompts).flatMap(([name, data]) => ([
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
    ...subagentTemplates('cursor')
  ],
  opencode: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.opencode/commands',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---
${data.prompt}
`
    })),
    ...subagentTemplates('opencode')
  ],
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
  kilo: [
    ...Object.entries(commandPrompts).map(([name, data]) => ({
      dir: '.kilo/commands',
      file: `${name}.md`,
      content: `---
description: "${data.desc}"
---
${data.prompt}
`
    })),
    ...subagentTemplates('kilo')
  ]
};

export function getTemplates(agent: string): Template[] {
  return templates[agent] || [];
}
