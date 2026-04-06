import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface Template {
  dir: string;
  file: string;
  content: string;
}

export interface AgentTemplate {
  dir: string;
  file: string;
  content: string;
}

export interface AgentDefinition {
  name: string;
  description: string;
  role?: string;
  capabilities: string[];
  tools: {
    read?: boolean;
    modify?: boolean;
    verify?: boolean;
    delegate?: boolean;
  };
  constraints: string[];
  decision_rules?: string[];
  token_efficiency?: string[];
  guidelines?: string[];
  pattern_matching?: string[];
  completion_criteria?: string[];
  test_heuristics?: {
    boundary?: string;
    error_paths?: string;
    integration?: string;
  };
  communication: {
    style: string;
    format: string;
  };
}

const loadPrompt = (name: string): string => {
  const filePath = path.join(__dirname, 'prompts', `${name}.md`);
  if (!fs.existsSync(filePath)) {
    return `PROMPT_ERROR: ${name}.md not found at ${filePath}`;
  }
  return fs.readFileSync(filePath, 'utf-8').trim();
};

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
    desc: 'Implement tasks from a checklist using sub-agents',
    prompt: loadPrompt('pspec.implement')
  },
  'pspec.debug': {
    desc: 'Investigate and resolve errors in the project using sub-agents',
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
  roo: Object.entries(commandPrompts).map(([name, data]) => ({
    dir: '.roo/commands',
    file: `${name}.md`,
    content: `---
description: "${data.desc}"
---
${data.prompt}
`
  })),
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

export const AVAILABLE_AGENTS = [
  'architect',
  'task_planner',
  'generalist',
  'investigator',
  'debugger',
  'implementator',
  'test_planner'
] as const;

export type AgentName = typeof AVAILABLE_AGENTS[number];

export function getAgent(name: AgentName): AgentDefinition {
  const filePath = path.join(__dirname, 'agents', `${name}.yaml`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Agent template not found: ${name}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(content) as AgentDefinition;
}

function buildToolLines(tools: AgentDefinition['tools']): string[] {
  const lines: string[] = [];

  if (tools.read) {
    lines.push('- Read: read, glob, grep');
  }
  if (tools.modify) {
    lines.push('- Modify: edit, write');
  }
  if (tools.verify) {
    lines.push('- Verify: bash');
  }
  if (tools.delegate) {
    lines.push('- Delegate: task');
  }

  return lines;
}

function buildHeuristicLines(testHeuristics?: AgentDefinition['test_heuristics']): string[] {
  const lines: string[] = [];

  if (testHeuristics?.boundary) {
    lines.push(`- Boundary: ${testHeuristics.boundary}`);
  }
  if (testHeuristics?.error_paths) {
    lines.push(`- Error Paths: ${testHeuristics.error_paths}`);
  }
  if (testHeuristics?.integration) {
    lines.push(`- Integration: ${testHeuristics.integration}`);
  }

  return lines;
}

function buildExecutionNotes(agent: AgentDefinition): string[] {
  return [
    ...(agent.token_efficiency || []).map(note => `- ${note}`),
    ...(agent.guidelines || []).map(note => `- ${note}`),
    ...(agent.pattern_matching || []).map(note => `- ${note}`),
    ...(agent.completion_criteria || []).map(note => `- ${note}`),
    ...buildHeuristicLines(agent.test_heuristics)
  ];
}

function buildAgentBody(
  agent: AgentDefinition,
  options: {
    includeTitle?: boolean;
    fallbackRole?: boolean;
    toolsHeading?: string;
  } = {}
): string {
  const { includeTitle = false, fallbackRole = false, toolsHeading = '## Available Tools' } = options;
  const sections: string[] = [];
  const role = agent.role || (fallbackRole ? `You are an agent specialized in ${agent.description.toLowerCase()}.` : undefined);
  const toolLines = buildToolLines(agent.tools);
  const executionNotes = buildExecutionNotes(agent);

  if (includeTitle) {
    sections.push(`# ${agent.name.toUpperCase()}`);
  }

  if (role) {
    sections.push(role);
  }

  if (agent.capabilities.length > 0) {
    sections.push(`## Capabilities\n${agent.capabilities.map(c => `- ${c}`).join('\n')}`);
  }

  if (toolLines.length > 0) {
    sections.push(`${toolsHeading}\n${toolLines.join('\n')}`);
  }

  if (agent.constraints.length > 0) {
    sections.push(`## Constraints\n${agent.constraints.map(c => `- ${c}`).join('\n')}`);
  }

  if (agent.decision_rules && agent.decision_rules.length > 0) {
    sections.push(`## Decision Rules\n${agent.decision_rules.map(rule => `- ${rule}`).join('\n')}`);
  }

  if (executionNotes.length > 0) {
    sections.push(`## Execution Notes\n${executionNotes.join('\n')}`);
  }

  sections.push(`## Output Format\n**Style:** ${agent.communication.style}\n\n${agent.communication.format}`);

  return sections.join('\n\n');
}

export function getAgentPrompt(name: AgentName): string {
  const agent = getAgent(name);
  return buildAgentBody(agent, { includeTitle: true, fallbackRole: true });
}

export function listAgents(): string[] {
  return [...AVAILABLE_AGENTS];
}

// Agent Template Format Converters

function convertToClaudeFormat(agent: AgentDefinition): string {
  // Frontmatter
  const frontmatterLines = [
    `name: ${agent.name}`,
    `description: "${agent.description}"`,
    `capabilities: [${agent.capabilities.join(', ')}]`,
    `tools:`
  ];
  
  if (agent.tools.read) {
    frontmatterLines.push(`  read: true`);
  }
  if (agent.tools.modify) {
    frontmatterLines.push(`  modify: true`);
  }
  if (agent.tools.verify) {
    frontmatterLines.push(`  verify: true`);
  }
  if (agent.tools.delegate) {
    frontmatterLines.push(`  delegate: true`);
  }

  return ['---', frontmatterLines.join('\n'), '---', '', buildAgentBody(agent, { toolsHeading: '## Tools' })].join('\n');
}

function convertToGeminiFormat(agent: AgentDefinition): string {
  const lines: string[] = [];
  
  lines.push(`name = "${agent.name}"`);
  lines.push(`description = "${agent.description}"`);
  lines.push(`capabilities = [${agent.capabilities.map(c => `"${c}"`).join(', ')}]`);
  
  // Tools section
  lines.push('');
  lines.push('[tools]');
  if (agent.tools.read) {
    lines.push(`read = true`);
  }
  if (agent.tools.modify) {
    lines.push(`modify = true`);
  }
  if (agent.tools.verify) {
    lines.push(`verify = true`);
  }
  if (agent.tools.delegate) {
    lines.push(`delegate = true`);
  }
  
  // Communication
  lines.push('');
  lines.push('[communication]');
  lines.push(`style = "${agent.communication.style}"`);
  
  // Prompt content
  lines.push('');
  lines.push('prompt = """');
  lines.push(buildAgentBody(agent, { toolsHeading: '## Tools' }));
  
  lines.push('"""');
  
  return lines.join('\n');
}

function convertToCursorFormat(agent: AgentDefinition): string {
  // Cursor uses same format as Claude but with .mdc extension and globs
  const frontmatterLines = [
    `name: ${agent.name}`,
    `description: "${agent.description}"`,
    `globs: "*"`,
    `capabilities: [${agent.capabilities.join(', ')}]`,
    `tools:`
  ];
  
  if (agent.tools.read) {
    frontmatterLines.push(`  read: true`);
  }
  if (agent.tools.modify) {
    frontmatterLines.push(`  modify: true`);
  }
  if (agent.tools.verify) {
    frontmatterLines.push(`  verify: true`);
  }
  if (agent.tools.delegate) {
    frontmatterLines.push(`  delegate: true`);
  }
  
  return ['---', frontmatterLines.join('\n'), '---', '', buildAgentBody(agent, { toolsHeading: '## Tools' })].join('\n');
}

function convertToOpenCodeFormat(agent: AgentDefinition): string {
  // OpenCode uses same format as Claude
  return convertToClaudeFormat(agent);
}

function convertToKiloFormat(agent: AgentDefinition): string {
  // Kilo uses same format as Claude
  return convertToClaudeFormat(agent);
}

function convertToRoomodesFormat(agents: AgentDefinition[]): string {
  // Build Roo's YAML format with customModes array
  const lines: string[] = [];
  lines.push('customModes:');
  
  for (const agent of agents) {
    // Convert agent name to slug (match Roo naming convention)
    const slug = agent.name.toLowerCase().replace(/_/g, '-');
    
    // Build roleDefinition from role or fallback
    const roleDefinition = agent.role || `You are an agent specialized in ${agent.description.toLowerCase()}.`;
    
    // Build customInstructions from all agent sections
    const instructionParts: string[] = [];
    
    if (agent.capabilities.length > 0) {
      instructionParts.push('## Capabilities');
      agent.capabilities.forEach(c => instructionParts.push(`- ${c}`));
      instructionParts.push('');
    }
    
    if (agent.constraints.length > 0) {
      instructionParts.push('## Constraints');
      agent.constraints.forEach(c => instructionParts.push(`- ${c}`));
      instructionParts.push('');
    }
    
    if (agent.decision_rules && agent.decision_rules.length > 0) {
      instructionParts.push('## Decision Rules');
      agent.decision_rules.forEach(rule => instructionParts.push(`- ${rule}`));
      instructionParts.push('');
    }
    
    const executionNotes = buildExecutionNotes(agent);
    if (executionNotes.length > 0) {
      instructionParts.push('## Execution Notes');
      executionNotes.forEach(note => instructionParts.push(`- ${note}`));
      instructionParts.push('');
    }
    
    instructionParts.push('## Output Format');
    instructionParts.push(`**Style:** ${agent.communication.style}`);
    instructionParts.push('');
    instructionParts.push(agent.communication.format);
    
    const customInstructions = instructionParts.join('\n');
    
    // Build groups array based on tools
    // Mapping: read→read, modify→edit, verify→command, delegate→mcp
    const groups: string[] = [];
    if (agent.tools.read) groups.push('read');
    if (agent.tools.modify) groups.push('edit');
    if (agent.tools.verify) groups.push('command');
    if (agent.tools.delegate) groups.push('mcp');
    
    // Output YAML for this mode with proper indentation
    lines.push(`  - slug: "${slug}"`);
    lines.push(`    name: "${agent.name}"`);
    lines.push(`    roleDefinition: >-`);
    // Indent roleDefinition by 6 spaces
    roleDefinition.split('\n').forEach(line => {
      lines.push(`      ${line.trim()}`);
    });
    lines.push(`    customInstructions: >-`);
    // Indent customInstructions by 6 spaces
    customInstructions.split('\n').forEach(line => {
      lines.push(`      ${line}`);
    });
    lines.push(`    groups:`);
    groups.forEach(g => lines.push(`      - ${g}`));
  }
  
  return lines.join('\n');
}

function convertToZedFormat(agents: AgentDefinition[]): string {
  const sections: string[] = ['# pspec Agents\n'];
  
  agents.forEach(agent => {
    sections.push(`## ${agent.name}`);
    sections.push(`${agent.description}\n`);

    sections.push(buildAgentBody(agent, { toolsHeading: '### Tools' }));
    sections.push('');
  });
  
  return sections.join('\n');
}

export function getAgentTemplates(agent: string): AgentTemplate[] {
  const agents = AVAILABLE_AGENTS.map(name => getAgent(name));
  
  switch(agent) {
    case 'claude':
      return agents.map(a => ({
        dir: '.claude/agents',
        file: `${a.name}.md`,
        content: convertToClaudeFormat(a)
      }));
    case 'gemini':
      return agents.map(a => ({
        dir: '.gemini/agents',
        file: `${a.name}.toml`,
        content: convertToGeminiFormat(a)
      }));
    case 'cursor':
      return agents.map(a => ({
        dir: '.cursor/agents',
        file: `${a.name}.mdc`,
        content: convertToCursorFormat(a)
      }));
    case 'opencode':
      return agents.map(a => ({
        dir: '.opencode/agents',
        file: `${a.name}.md`,
        content: convertToOpenCodeFormat(a)
      }));
    case 'kilo':
      return agents.map(a => ({
        dir: '.kilo/agents',
        file: `${a.name}.md`,
        content: convertToKiloFormat(a)
      }));
    case 'roo':
      // Roo uses a single .roomodes file with all custom modes
      return [{
        dir: '.',
        file: '.roomodes',
        content: convertToRoomodesFormat(agents)
      }];
    default:
      return [];
  }
}
