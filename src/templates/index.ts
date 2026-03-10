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
    read?: string[];
    modify?: string[];
    verify?: string[];
    delegate?: string[];
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

export function getAgentPrompt(name: AgentName): string {
  const agent = getAgent(name);
  const role = agent.role || `You are a ${agent.description}`;
  
  // Build tools list from categorized tools
  const toolsList: string[] = [];
  if (agent.tools.read && agent.tools.read.length > 0) {
    toolsList.push(`- Read: ${agent.tools.read.join(', ')}`);
  }
  if (agent.tools.modify && agent.tools.modify.length > 0) {
    toolsList.push(`- Modify: ${agent.tools.modify.join(', ')}`);
  }
  if (agent.tools.verify && agent.tools.verify.length > 0) {
    toolsList.push(`- Verify: ${agent.tools.verify.join(', ')}`);
  }
  if (agent.tools.delegate && agent.tools.delegate.length > 0) {
    toolsList.push(`- Delegate: ${agent.tools.delegate.join(', ')}`);
  }
  
  return `# ${agent.name.toUpperCase()}

${role}

## Capabilities
${agent.capabilities.map(c => `- ${c}`).join('\n')}

## Available Tools
${toolsList.join('\n')}

## Constraints
${agent.constraints.map(c => `- ${c}`).join('\n')}

## Output Format
${agent.communication.format}`;
}

export function listAgents(): string[] {
  return [...AVAILABLE_AGENTS];
}

// Agent Template Format Converters

function convertToClaudeFormat(agent: AgentDefinition): string {
  const sections: string[] = [];
  
  // Frontmatter
  const frontmatterLines = [
    `name: ${agent.name}`,
    `description: "${agent.description}"`,
    `capabilities: [${agent.capabilities.join(', ')}]`,
    `tools:`
  ];
  
  if (agent.tools.read && agent.tools.read.length > 0) {
    frontmatterLines.push(`  read: [${agent.tools.read.join(', ')}]`);
  }
  if (agent.tools.modify && agent.tools.modify.length > 0) {
    frontmatterLines.push(`  modify: [${agent.tools.modify.join(', ')}]`);
  }
  if (agent.tools.verify && agent.tools.verify.length > 0) {
    frontmatterLines.push(`  verify: [${agent.tools.verify.join(', ')}]`);
  }
  if (agent.tools.delegate && agent.tools.delegate.length > 0) {
    frontmatterLines.push(`  delegate: [${agent.tools.delegate.join(', ')}]`);
  }
  
  sections.push('---');
  sections.push(frontmatterLines.join('\n'));
  sections.push('---');
  
  // Role
  if (agent.role) {
    sections.push(`# Role\n${agent.role}`);
  }
  
  // Capabilities
  sections.push(`## Capabilities\n${agent.capabilities.map(c => `- ${c}`).join('\n')}`);
  
  // Tools
  const toolLines: string[] = [];
  if (agent.tools.read && agent.tools.read.length > 0) {
    toolLines.push(`- Read: ${agent.tools.read.join(', ')}`);
  }
  if (agent.tools.modify && agent.tools.modify.length > 0) {
    toolLines.push(`- Modify: ${agent.tools.modify.join(', ')}`);
  }
  if (agent.tools.verify && agent.tools.verify.length > 0) {
    toolLines.push(`- Verify: ${agent.tools.verify.join(', ')}`);
  }
  if (agent.tools.delegate && agent.tools.delegate.length > 0) {
    toolLines.push(`- Delegate: ${agent.tools.delegate.join(', ')}`);
  }
  sections.push(`## Tools\n${toolLines.join('\n')}`);
  
  // Constraints
  sections.push(`## Constraints\n${agent.constraints.map(c => `- ${c}`).join('\n')}`);
  
  // Decision Rules
  if (agent.decision_rules && agent.decision_rules.length > 0) {
    sections.push(`## Decision Rules\n${agent.decision_rules.map(r => `- ${r}`).join('\n')}`);
  }
  
  // Token Efficiency
  if (agent.token_efficiency && agent.token_efficiency.length > 0) {
    sections.push(`## Token Efficiency\n${agent.token_efficiency.map(t => `- ${t}`).join('\n')}`);
  }
  
  // Guidelines
  if (agent.guidelines && agent.guidelines.length > 0) {
    sections.push(`## Guidelines\n${agent.guidelines.map(g => `- ${g}`).join('\n')}`);
  }
  
  // Pattern Matching
  if (agent.pattern_matching && agent.pattern_matching.length > 0) {
    sections.push(`## Pattern Matching\n${agent.pattern_matching.map(p => `- ${p}`).join('\n')}`);
  }
  
  // Completion Criteria
  if (agent.completion_criteria && agent.completion_criteria.length > 0) {
    sections.push(`## Completion Criteria\n${agent.completion_criteria.map(c => `- ${c}`).join('\n')}`);
  }
  
  // Test Heuristics
  if (agent.test_heuristics) {
    const heuristics: string[] = [];
    if (agent.test_heuristics.boundary) heuristics.push(`- Boundary: ${agent.test_heuristics.boundary}`);
    if (agent.test_heuristics.error_paths) heuristics.push(`- Error Paths: ${agent.test_heuristics.error_paths}`);
    if (agent.test_heuristics.integration) heuristics.push(`- Integration: ${agent.test_heuristics.integration}`);
    if (heuristics.length > 0) {
      sections.push(`## Test Heuristics\n${heuristics.join('\n')}`);
    }
  }
  
  // Communication
  sections.push(`## Communication\n**Style:** ${agent.communication.style}\n\n**Format:**\n${agent.communication.format}`);
  
  return sections.join('\n\n');
}

function convertToGeminiFormat(agent: AgentDefinition): string {
  const lines: string[] = [];
  
  lines.push(`name = "${agent.name}"`);
  lines.push(`description = "${agent.description}"`);
  lines.push(`capabilities = [${agent.capabilities.map(c => `"${c}"`).join(', ')}]`);
  
  // Tools section
  lines.push('');
  lines.push('[tools]');
  if (agent.tools.read && agent.tools.read.length > 0) {
    lines.push(`read = [${agent.tools.read.map(t => `"${t}"`).join(', ')}]`);
  }
  if (agent.tools.modify && agent.tools.modify.length > 0) {
    lines.push(`modify = [${agent.tools.modify.map(t => `"${t}"`).join(', ')}]`);
  }
  if (agent.tools.verify && agent.tools.verify.length > 0) {
    lines.push(`verify = [${agent.tools.verify.map(t => `"${t}"`).join(', ')}]`);
  }
  if (agent.tools.delegate && agent.tools.delegate.length > 0) {
    lines.push(`delegate = [${agent.tools.delegate.map(t => `"${t}"`).join(', ')}]`);
  }
  
  // Communication
  lines.push('');
  lines.push('[communication]');
  lines.push(`style = "${agent.communication.style}"`);
  
  // Prompt content
  lines.push('');
  lines.push('prompt = """');
  
  if (agent.role) {
    lines.push(`# Role`);
    lines.push(agent.role);
    lines.push('');
  }
  
  lines.push(`## Capabilities`);
  agent.capabilities.forEach(c => lines.push(`- ${c}`));
  lines.push('');
  
  lines.push(`## Constraints`);
  agent.constraints.forEach(c => lines.push(`- ${c}`));
  lines.push('');
  
  if (agent.decision_rules && agent.decision_rules.length > 0) {
    lines.push(`## Decision Rules`);
    agent.decision_rules.forEach(r => lines.push(`- ${r}`));
    lines.push('');
  }
  
  if (agent.token_efficiency && agent.token_efficiency.length > 0) {
    lines.push(`## Token Efficiency`);
    agent.token_efficiency.forEach(t => lines.push(`- ${t}`));
    lines.push('');
  }
  
  if (agent.guidelines && agent.guidelines.length > 0) {
    lines.push(`## Guidelines`);
    agent.guidelines.forEach(g => lines.push(`- ${g}`));
    lines.push('');
  }
  
  if (agent.pattern_matching && agent.pattern_matching.length > 0) {
    lines.push(`## Pattern Matching`);
    agent.pattern_matching.forEach(p => lines.push(`- ${p}`));
    lines.push('');
  }
  
  if (agent.completion_criteria && agent.completion_criteria.length > 0) {
    lines.push(`## Completion Criteria`);
    agent.completion_criteria.forEach(c => lines.push(`- ${c}`));
    lines.push('');
  }
  
  if (agent.test_heuristics) {
    const heuristics: string[] = [];
    if (agent.test_heuristics.boundary) heuristics.push(`- Boundary: ${agent.test_heuristics.boundary}`);
    if (agent.test_heuristics.error_paths) heuristics.push(`- Error Paths: ${agent.test_heuristics.error_paths}`);
    if (agent.test_heuristics.integration) heuristics.push(`- Integration: ${agent.test_heuristics.integration}`);
    if (heuristics.length > 0) {
      lines.push(`## Test Heuristics`);
      heuristics.forEach(h => lines.push(h));
      lines.push('');
    }
  }
  
  lines.push(`## Output Format`);
  lines.push(agent.communication.format);
  
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
  
  if (agent.tools.read && agent.tools.read.length > 0) {
    frontmatterLines.push(`  read: [${agent.tools.read.join(', ')}]`);
  }
  if (agent.tools.modify && agent.tools.modify.length > 0) {
    frontmatterLines.push(`  modify: [${agent.tools.modify.join(', ')}]`);
  }
  if (agent.tools.verify && agent.tools.verify.length > 0) {
    frontmatterLines.push(`  verify: [${agent.tools.verify.join(', ')}]`);
  }
  if (agent.tools.delegate && agent.tools.delegate.length > 0) {
    frontmatterLines.push(`  delegate: [${agent.tools.delegate.join(', ')}]`);
  }
  
  const sections: string[] = [
    '---',
    frontmatterLines.join('\n'),
    '---'
  ];
  
  if (agent.role) {
    sections.push(`# Role\n${agent.role}`);
  }
  
  sections.push(`## Capabilities\n${agent.capabilities.map(c => `- ${c}`).join('\n')}`);
  
  const toolLines: string[] = [];
  if (agent.tools.read && agent.tools.read.length > 0) {
    toolLines.push(`- Read: ${agent.tools.read.join(', ')}`);
  }
  if (agent.tools.modify && agent.tools.modify.length > 0) {
    toolLines.push(`- Modify: ${agent.tools.modify.join(', ')}`);
  }
  if (agent.tools.verify && agent.tools.verify.length > 0) {
    toolLines.push(`- Verify: ${agent.tools.verify.join(', ')}`);
  }
  if (agent.tools.delegate && agent.tools.delegate.length > 0) {
    toolLines.push(`- Delegate: ${agent.tools.delegate.join(', ')}`);
  }
  sections.push(`## Tools\n${toolLines.join('\n')}`);
  
  sections.push(`## Constraints\n${agent.constraints.map(c => `- ${c}`).join('\n')}`);
  
  if (agent.decision_rules && agent.decision_rules.length > 0) {
    sections.push(`## Decision Rules\n${agent.decision_rules.map(r => `- ${r}`).join('\n')}`);
  }
  
  if (agent.token_efficiency && agent.token_efficiency.length > 0) {
    sections.push(`## Token Efficiency\n${agent.token_efficiency.map(t => `- ${t}`).join('\n')}`);
  }
  
  if (agent.guidelines && agent.guidelines.length > 0) {
    sections.push(`## Guidelines\n${agent.guidelines.map(g => `- ${g}`).join('\n')}`);
  }
  
  if (agent.pattern_matching && agent.pattern_matching.length > 0) {
    sections.push(`## Pattern Matching\n${agent.pattern_matching.map(p => `- ${p}`).join('\n')}`);
  }
  
  if (agent.completion_criteria && agent.completion_criteria.length > 0) {
    sections.push(`## Completion Criteria\n${agent.completion_criteria.map(c => `- ${c}`).join('\n')}`);
  }
  
  if (agent.test_heuristics) {
    const heuristics: string[] = [];
    if (agent.test_heuristics.boundary) heuristics.push(`- Boundary: ${agent.test_heuristics.boundary}`);
    if (agent.test_heuristics.error_paths) heuristics.push(`- Error Paths: ${agent.test_heuristics.error_paths}`);
    if (agent.test_heuristics.integration) heuristics.push(`- Integration: ${agent.test_heuristics.integration}`);
    if (heuristics.length > 0) {
      sections.push(`## Test Heuristics\n${heuristics.join('\n')}`);
    }
  }
  
  sections.push(`## Communication\n**Style:** ${agent.communication.style}\n\n**Format:**\n${agent.communication.format}`);
  
  return sections.join('\n\n');
}

function convertToOpenCodeFormat(agent: AgentDefinition): string {
  // OpenCode uses same format as Claude
  return convertToClaudeFormat(agent);
}

function convertToZedFormat(agents: AgentDefinition[]): string {
  const sections: string[] = ['# mspec Agents\n'];
  
  agents.forEach(agent => {
    sections.push(`## ${agent.name}`);
    sections.push(`${agent.description}\n`);
    
    if (agent.role) {
      sections.push(`### Role`);
      sections.push(`${agent.role}\n`);
    }
    
    sections.push(`### Capabilities`);
    agent.capabilities.forEach(c => sections.push(`- ${c}`));
    sections.push('');
    
    sections.push(`### Tools`);
    if (agent.tools.read && agent.tools.read.length > 0) {
      sections.push(`- Read: ${agent.tools.read.join(', ')}`);
    }
    if (agent.tools.modify && agent.tools.modify.length > 0) {
      sections.push(`- Modify: ${agent.tools.modify.join(', ')}`);
    }
    if (agent.tools.verify && agent.tools.verify.length > 0) {
      sections.push(`- Verify: ${agent.tools.verify.join(', ')}`);
    }
    if (agent.tools.delegate && agent.tools.delegate.length > 0) {
      sections.push(`- Delegate: ${agent.tools.delegate.join(', ')}`);
    }
    sections.push('');
    
    sections.push(`### Constraints`);
    agent.constraints.forEach(c => sections.push(`- ${c}`));
    sections.push('');
    
    if (agent.decision_rules && agent.decision_rules.length > 0) {
      sections.push(`### Decision Rules`);
      agent.decision_rules.forEach(r => sections.push(`- ${r}`));
      sections.push('');
    }
    
    if (agent.token_efficiency && agent.token_efficiency.length > 0) {
      sections.push(`### Token Efficiency`);
      agent.token_efficiency.forEach(t => sections.push(`- ${t}`));
      sections.push('');
    }
    
    if (agent.guidelines && agent.guidelines.length > 0) {
      sections.push(`### Guidelines`);
      agent.guidelines.forEach(g => sections.push(`- ${g}`));
      sections.push('');
    }
    
    if (agent.pattern_matching && agent.pattern_matching.length > 0) {
      sections.push(`### Pattern Matching`);
      agent.pattern_matching.forEach(p => sections.push(`- ${p}`));
      sections.push('');
    }
    
    if (agent.completion_criteria && agent.completion_criteria.length > 0) {
      sections.push(`### Completion Criteria`);
      agent.completion_criteria.forEach(c => sections.push(`- ${c}`));
      sections.push('');
    }
    
    if (agent.test_heuristics) {
      const heuristics: string[] = [];
      if (agent.test_heuristics.boundary) heuristics.push(`- Boundary: ${agent.test_heuristics.boundary}`);
      if (agent.test_heuristics.error_paths) heuristics.push(`- Error Paths: ${agent.test_heuristics.error_paths}`);
      if (agent.test_heuristics.integration) heuristics.push(`- Integration: ${agent.test_heuristics.integration}`);
      if (heuristics.length > 0) {
        sections.push(`### Test Heuristics`);
        heuristics.forEach(h => sections.push(h));
        sections.push('');
      }
    }
    
    sections.push(`### Output Format`);
    sections.push(`**Style:** ${agent.communication.style}\n`);
    sections.push(`${agent.communication.format}\n`);
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
    case 'zed':
    case 'generic':
      return [{
        dir: '.mspec',
        file: 'AGENTS.md',
        content: convertToZedFormat(agents)
      }];
    default:
      return [];
  }
}
