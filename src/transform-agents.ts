#!/usr/bin/env node

/**
 * Agent Transformer - Converts OpenCode YAML agents to other CLI formats
 * 
 * Supports:
 * - OpenCode YAML (source) - src/templates/agents/*.yaml
 * - Claude Code Markdown - .claude/agents/*.md
 * - Codex CLI JSON - .codex/agents.json
 * - Gemini CLI TOML - .gemini/agents/*.toml
 * - Cursor - .cursorrules
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface OpenCodeAgent {
  name: string;
  description: string;
  role?: string;
  capabilities?: string[];
  tools?: {
    read?: boolean;
    modify?: boolean;
    verify?: boolean;
    delegate?: boolean;
  };
  constraints?: string[];
  decision_rules?: string[];
  token_efficiency?: string[];
  guidelines?: string[];
  completion_criteria?: string[];
  pattern_matching?: string[];
  test_heuristics?: Record<string, string>;
  communication?: {
    style: string;
    format?: string;
  };
}

export interface ClaudeCodeAgent {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
  disallowedTools?: string[];
  permissionMode?: string;
  hooks?: Record<string, unknown>;
  skills?: string[];
  mcpServers?: string[];
  maxTurns?: number;
  memory?: string;
  background?: boolean;
  isolation?: string;
}

export interface CodexAgent {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
  tool_choice?: string;
  parallel_tool_calls?: boolean;
}

export interface GeminiCommand {
  description: string;
  prompt: string;
}

/**
 * Tool mapping from OpenCode to other formats
 */
export const toolMapping: Record<string, Record<string, string[]>> = {
  opencode: {
    read: ['read', 'glob', 'grep'],
    modify: ['edit', 'write'],
    verify: ['bash'],
    delegate: ['task']
  },
  claude: {
    read: ['Read', 'Glob', 'Grep'],
    modify: ['Edit', 'Write'],
    verify: ['Bash'],
    delegate: ['Agent']
  },
  codex: {
    read: ['read_file', 'list_dir', 'search'],
    modify: ['edit_file', 'write_file'],
    verify: ['run_command'],
    delegate: []
  },
  gemini: {
    // Gemini doesn't have explicit tool lists in custom commands
    // Tools are automatically available based on context
    read: [],
    modify: [],
    verify: [],
    delegate: []
  }
};

/**
 * Parse OpenCode YAML agent
 */
export function parseOpenCodeAgent(content: string): OpenCodeAgent {
  return yaml.load(content) as OpenCodeAgent;
}

function buildToolPromptLines(
  tools: OpenCodeAgent['tools'],
  target: keyof typeof toolMapping,
  forCursor = false
): string[] {
  const lines: string[] = [];

  if (!tools) {
    return lines;
  }

  if (forCursor) {
    if (tools.read) lines.push('- File reading (read, glob, grep)');
    if (tools.modify) lines.push('- File modification (edit, write)');
    if (tools.verify) lines.push('- Verification (bash)');
    if (tools.delegate) lines.push('- Task delegation');
    return lines;
  }

  if (tools.read) {
    lines.push(`- Read: ${toolMapping[target].read.join(', ')}`);
  }
  if (tools.modify) {
    lines.push(`- Modify: ${toolMapping[target].modify.join(', ')}`);
  }
  if (tools.verify) {
    lines.push(`- Verify: ${toolMapping[target].verify.join(', ')}`);
  }
  if (tools.delegate && toolMapping[target].delegate.length > 0) {
    lines.push(`- Delegate: ${toolMapping[target].delegate.join(', ')}`);
  }

  return lines;
}

function buildHeuristicLines(testHeuristics?: Record<string, string>): string[] {
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

function buildExecutionNotes(agent: OpenCodeAgent): string[] {
  return [
    ...(agent.token_efficiency || []).map(note => `- ${note}`),
    ...(agent.guidelines || []).map(note => `- ${note}`),
    ...(agent.pattern_matching || []).map(note => `- ${note}`),
    ...(agent.completion_criteria || []).map(note => `- ${note}`),
    ...buildHeuristicLines(agent.test_heuristics)
  ];
}

function buildAgentPrompt(
  agent: OpenCodeAgent,
  target: keyof typeof toolMapping,
  options: {
    fallbackRole?: boolean;
    toolsHeading?: string;
    forCursor?: boolean;
  } = {}
): string {
  const { fallbackRole = false, toolsHeading = '## Tools', forCursor = false } = options;
  const sections: string[] = [];
  const role = agent.role || (fallbackRole ? `You are an agent specialized in ${agent.description.toLowerCase()}.` : undefined);
  const toolLines = buildToolPromptLines(agent.tools, target, forCursor);
  const executionNotes = buildExecutionNotes(agent);

  if (role) {
    sections.push(role);
  }

  if (agent.capabilities && agent.capabilities.length > 0) {
    sections.push(`## Capabilities\n${agent.capabilities.map(c => `- ${c}`).join('\n')}`);
  }

  if (toolLines.length > 0) {
    sections.push(`${toolsHeading}\n${toolLines.join('\n')}`);
  }

  if (agent.constraints && agent.constraints.length > 0) {
    sections.push(`## Constraints\n${agent.constraints.map(c => `- ${c}`).join('\n')}`);
  }

  if (agent.decision_rules && agent.decision_rules.length > 0) {
    sections.push(`## Decision Rules\n${agent.decision_rules.map(r => `- ${r}`).join('\n')}`);
  }

  if (executionNotes.length > 0) {
    sections.push(`## Execution Notes\n${executionNotes.join('\n')}`);
  }

  if (agent.communication?.format) {
    sections.push(`## Output Format\n**Style:** ${agent.communication.style}\n\n${agent.communication.format}`);
  }

  return sections.join('\n\n');
}

/**
 * Convert to Claude Code format
 */
export function convertToClaudeCode(agent: OpenCodeAgent): ClaudeCodeAgent {
  const tools: string[] = [];
  
  if (agent.tools?.read) {
    tools.push(...toolMapping.claude.read);
  }
  if (agent.tools?.modify) {
    tools.push(...toolMapping.claude.modify);
  }
  if (agent.tools?.verify) {
    tools.push(...toolMapping.claude.verify);
  }
  if (agent.tools?.delegate) {
    tools.push(...toolMapping.claude.delegate);
  }

  const prompt = buildAgentPrompt(agent, 'claude');

  return {
    name: agent.name,
    description: agent.description,
    prompt,
    tools: tools.length > 0 ? tools : undefined,
    model: 'inherit'
  };
}

/**
 * Convert to Codex CLI format
 */
export function convertToCodex(agent: OpenCodeAgent): CodexAgent {
  const tools: string[] = [];
  
  if (agent.tools?.read) {
    tools.push(...toolMapping.codex.read);
  }
  if (agent.tools?.modify) {
    tools.push(...toolMapping.codex.modify);
  }
  if (agent.tools?.verify) {
    tools.push(...toolMapping.codex.verify);
  }

  return {
    name: agent.name,
    description: agent.description,
    prompt: buildAgentPrompt(agent, 'codex'),
    tools: tools.length > 0 ? tools : undefined,
    model: 'o4-mini'
  };
}

/**
 * Convert to Gemini CLI TOML format
 */
export function convertToGemini(agent: OpenCodeAgent): GeminiCommand {
  // Escape TOML special characters
  const prompt = buildAgentPrompt(agent, 'gemini').replace(/"/g, '\\"');

  return {
    description: agent.description,
    prompt
  };
}

/**
 * Convert to Cursor .cursorrules format
 */
export function convertToCursor(agents: OpenCodeAgent[]): string {
  const sections: string[] = [
    '# AI Agent Rules',
    '',
    'This project uses specialized AI agents for different tasks.',
    ''
  ];
  
  for (const agent of agents) {
    sections.push(`## ${agent.name}`);
    sections.push('');
    sections.push(`**Description:** ${agent.description}`);
    sections.push('');
    sections.push(buildAgentPrompt(agent, 'opencode', { forCursor: true }));
    sections.push('');
    
    sections.push('---');
    sections.push('');
  }
  
  return sections.join('\n');
}

/**
 * Generate Claude Code agent markdown file
 */
export function generateClaudeCodeMarkdown(agent: ClaudeCodeAgent): string {
  const frontmatter: Record<string, unknown> = {
    name: agent.name,
    description: agent.description
  };
  
  if (agent.tools && agent.tools.length > 0) {
    frontmatter.tools = agent.tools.join(', ');
  }
  
  if (agent.model) {
    frontmatter.model = agent.model;
  }

  const yamlFrontmatter = yaml.dump(frontmatter, { 
    lineWidth: -1,
    noRefs: true 
  }).trim();

  return `---\n${yamlFrontmatter}\n---\n\n${agent.prompt}`;
}

/**
 * Generate Gemini CLI TOML file
 */
export function generateGeminiToml(command: GeminiCommand, name: string): string {
  // Escape special TOML characters in prompt
  const escapedPrompt = command.prompt
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  
  return `description = "${command.description}"\nprompt = """${escapedPrompt}"""`;
}

/**
 * Transform agents from OpenCode to all other formats
 */
export async function transformAgents(
  sourceDir: string,
  outputDir: string,
  formats: string[] = ['claude', 'codex', 'gemini', 'cursor']
): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all YAML files from source
  const files = fs.readdirSync(sourceDir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  if (files.length === 0) {
    throw new Error(`No YAML files found in ${sourceDir}`);
  }

  console.log(`Found ${files.length} agent files to transform`);

  const allAgents: OpenCodeAgent[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(sourceDir, file), 'utf-8');
    const agent = parseOpenCodeAgent(content);
    allAgents.push(agent);

    console.log(`Processing: ${agent.name}`);

    // Claude Code format
    if (formats.includes('claude')) {
      const claudeDir = path.join(outputDir, 'claude', 'agents');
      fs.mkdirSync(claudeDir, { recursive: true });
      
      const claudeAgent = convertToClaudeCode(agent);
      const claudeMarkdown = generateClaudeCodeMarkdown(claudeAgent);
      fs.writeFileSync(path.join(claudeDir, `${agent.name}.md`), claudeMarkdown);
    }

    // Codex CLI format (collect all into one JSON file)
    if (formats.includes('codex')) {
      const codexDir = path.join(outputDir, 'codex');
      fs.mkdirSync(codexDir, { recursive: true });
      
      // Write individual agent JSON
      const codexAgent = convertToCodex(agent);
      fs.writeFileSync(
        path.join(codexDir, `${agent.name}.json`),
        JSON.stringify(codexAgent, null, 2)
      );
    }

    // Gemini CLI format
    if (formats.includes('gemini')) {
      const geminiDir = path.join(outputDir, '.gemini', 'agents');
      fs.mkdirSync(geminiDir, { recursive: true });
      
      const geminiCommand = convertToGemini(agent);
      const geminiToml = generateGeminiToml(geminiCommand, agent.name);
      fs.writeFileSync(path.join(geminiDir, `${agent.name}.toml`), geminiToml);
    }
  }

  // Cursor format (all agents in one file)
  if (formats.includes('cursor')) {
    const cursorContent = convertToCursor(allAgents);
    fs.writeFileSync(path.join(outputDir, '.cursorrules'), cursorContent);
  }

  // Write Codex agents.json (all agents in one file)
  if (formats.includes('codex')) {
    const codexAgents = allAgents.map(convertToCodex);
    fs.writeFileSync(
      path.join(outputDir, 'codex', 'agents.json'),
      JSON.stringify({ agents: codexAgents }, null, 2)
    );
  }

  console.log('\nTransformation complete!');
  console.log(`Output directory: ${outputDir}`);
  console.log(`Formats generated: ${formats.join(', ')}`);
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: ts-node transform-agents.ts <source-dir> <output-dir> [formats]');
    console.log('');
    console.log('Arguments:');
    console.log('  source-dir    Directory containing OpenCode YAML agent files');
    console.log('  output-dir    Directory to write transformed files');
    console.log('  formats       Comma-separated list of formats (default: claude,codex,gemini,cursor)');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node transform-agents.ts ./src/templates/agents ./dist/agents');
    console.log('  ts-node transform-agents.ts ./agents ./output claude,gemini');
    process.exit(1);
  }

  const [sourceDir, outputDir, formatsArg] = args;
  const formats = formatsArg ? formatsArg.split(',') : ['claude', 'codex', 'gemini', 'cursor'];

  transformAgents(sourceDir, outputDir, formats)
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

export default transformAgents;
