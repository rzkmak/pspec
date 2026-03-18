import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  parseOpenCodeAgent,
  convertToClaudeCode,
  convertToCodex,
  convertToGemini,
  convertToCursor,
  generateClaudeCodeMarkdown,
  generateGeminiToml,
  transformAgents,
  toolMapping
} from './transform-agents';

// Mock fs module
jest.mock('fs');

describe('transform-agents', () => {
  const mockArchitectYaml = `name: architect
description: Designs system architecture and creates comprehensive specifications
role: |
  Design system architecture from requirements. Output: data models, API contracts,
  system boundaries. Include Mermaid diagrams for complex flows.

capabilities:
  - read_files
  - analyze_codebase
  - design_architecture
  - create_specs

tools:
  read: true
  modify: true
  verify: true

constraints:
  - Focus on clarity and completeness in specifications
  - Always consider edge cases and failure modes

decision_rules:
  - "IF requirements are ambiguous → ask for clarification before designing"
  - "IF similar feature exists in codebase → reference its architecture as baseline"

token_efficiency:
  - "VERBOSE: This agent needs detailed output for specifications"
  - "Include complete data models with all fields and types"

communication:
  style: structured
  format: |
    ## Architecture Overview
    [High-level design with component interactions]

    ## Data Model
    [Complete tables/interfaces with all fields, types, constraints]
`;

  const mockDebuggerYaml = `name: debugger
description: Isolated error reproduction and fixing specialist
role: |
  Reproduce bugs, identify root causes, implement minimal fixes.

capabilities:
  - reproduce_errors
  - analyze_logs
  - implement_fixes

tools:
  read: true
  modify: true
  verify: true
  delegate: true

constraints:
  - Create minimal reproduction before fixing

communication:
  style: precise
  format: |
    ## Root Cause
    [One sentence explanation]
`;

  const mockInvestigatorYaml = `name: investigator
description: Deep codebase analysis and pattern discovery specialist
capabilities:
  - search_codebase
  - analyze_patterns

tools:
  read: true
  delegate: true

constraints:
  - Be thorough but efficient in searches

communication:
  style: analytical
  format: |
    ## Investigation Summary
    [What was searched]
`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseOpenCodeAgent', () => {
    it('should parse a valid YAML agent definition', () => {
      const agent = parseOpenCodeAgent(mockArchitectYaml);
      
      expect(agent.name).toBe('architect');
      expect(agent.description).toBe('Designs system architecture and creates comprehensive specifications');
      expect(agent.role).toContain('Design system architecture');
      expect(agent.capabilities).toEqual(['read_files', 'analyze_codebase', 'design_architecture', 'create_specs']);
      expect(agent.tools?.read).toBe(true);
      expect(agent.tools?.modify).toBe(true);
      expect(agent.tools?.verify).toBe(true);
      expect(agent.constraints).toHaveLength(2);
      expect(agent.decision_rules).toHaveLength(2);
      expect(agent.token_efficiency).toHaveLength(2);
      expect(agent.communication?.style).toBe('structured');
      expect(agent.communication?.format).toContain('Architecture Overview');
    });

    it('should parse agent with all tool types', () => {
      const agent = parseOpenCodeAgent(mockDebuggerYaml);
      
      expect(agent.name).toBe('debugger');
      expect(agent.tools?.read).toBe(true);
      expect(agent.tools?.modify).toBe(true);
      expect(agent.tools?.verify).toBe(true);
      expect(agent.tools?.delegate).toBe(true);
    });

    it('should parse agent with minimal tools', () => {
      const agent = parseOpenCodeAgent(mockInvestigatorYaml);
      
      expect(agent.name).toBe('investigator');
      expect(agent.tools?.read).toBe(true);
      expect(agent.tools?.delegate).toBe(true);
      expect(agent.tools?.modify).toBeUndefined();
      expect(agent.tools?.verify).toBeUndefined();
    });
  });

  describe('toolMapping', () => {
    it('should have correct tool mappings for all formats', () => {
      expect(toolMapping.opencode.read).toContain('read');
      expect(toolMapping.opencode.read).toContain('glob');
      expect(toolMapping.opencode.read).toContain('grep');
      
      expect(toolMapping.claude.read).toContain('Read');
      expect(toolMapping.claude.read).toContain('Glob');
      expect(toolMapping.claude.modify).toContain('Edit');
      expect(toolMapping.claude.verify).toContain('Bash');
      
      expect(toolMapping.codex.read).toContain('read_file');
      expect(toolMapping.codex.modify).toContain('edit_file');
      expect(toolMapping.codex.verify).toContain('run_command');
    });
  });

  describe('convertToClaudeCode', () => {
    it('should convert architect agent to Claude Code format', () => {
      const openCodeAgent = parseOpenCodeAgent(mockArchitectYaml);
      const claudeAgent = convertToClaudeCode(openCodeAgent);
      
      expect(claudeAgent.name).toBe('architect');
      expect(claudeAgent.description).toBe('Designs system architecture and creates comprehensive specifications');
      expect(claudeAgent.tools).toContain('Read');
      expect(claudeAgent.tools).toContain('Glob');
      expect(claudeAgent.tools).toContain('Grep');
      expect(claudeAgent.tools).toContain('Edit');
      expect(claudeAgent.tools).toContain('Write');
      expect(claudeAgent.tools).toContain('Bash');
      expect(claudeAgent.model).toBe('inherit');
      expect(claudeAgent.prompt).toContain('Design system architecture');
      expect(claudeAgent.prompt).toContain('## Capabilities');
      expect(claudeAgent.prompt).toContain('## Tools');
      expect(claudeAgent.prompt).toContain('## Constraints');
      expect(claudeAgent.prompt).toContain('## Decision Rules');
      expect(claudeAgent.prompt).toContain('## Execution Notes');
    });

    it('should convert investigator agent with limited tools', () => {
      const openCodeAgent = parseOpenCodeAgent(mockInvestigatorYaml);
      const claudeAgent = convertToClaudeCode(openCodeAgent);
      
      expect(claudeAgent.tools).toContain('Read');
      expect(claudeAgent.tools).toContain('Agent');
      expect(claudeAgent.tools).not.toContain('Edit');
      expect(claudeAgent.tools).not.toContain('Write');
      expect(claudeAgent.tools).not.toContain('Bash');
    });

    it('should handle agent without optional fields', () => {
      const minimalYaml = `name: minimal
description: A minimal agent
tools:
  read: true
communication:
  style: concise
`;
      const openCodeAgent = parseOpenCodeAgent(minimalYaml);
      const claudeAgent = convertToClaudeCode(openCodeAgent);
      
      expect(claudeAgent.name).toBe('minimal');
      expect(claudeAgent.tools).toEqual(['Read', 'Glob', 'Grep']);
      expect(claudeAgent.prompt).toContain('## Tools');
      expect(claudeAgent.prompt).not.toContain('## Constraints');
    });
  });

  describe('convertToCodex', () => {
    it('should convert architect agent to Codex CLI format', () => {
      const openCodeAgent = parseOpenCodeAgent(mockArchitectYaml);
      const codexAgent = convertToCodex(openCodeAgent);
      
      expect(codexAgent.name).toBe('architect');
      expect(codexAgent.description).toBe('Designs system architecture and creates comprehensive specifications');
      expect(codexAgent.tools).toContain('read_file');
      expect(codexAgent.tools).toContain('list_dir');
      expect(codexAgent.tools).toContain('search');
      expect(codexAgent.tools).toContain('edit_file');
      expect(codexAgent.tools).toContain('write_file');
      expect(codexAgent.tools).toContain('run_command');
      expect(codexAgent.model).toBe('o4-mini');
      expect(codexAgent.prompt).toContain('Design system architecture');
      expect(codexAgent.prompt).toContain('## Capabilities');
    });

    it('should convert investigator agent with limited tools', () => {
      const openCodeAgent = parseOpenCodeAgent(mockInvestigatorYaml);
      const codexAgent = convertToCodex(openCodeAgent);
      
      expect(codexAgent.tools).toContain('read_file');
      expect(codexAgent.tools).not.toContain('edit_file');
      expect(codexAgent.tools).not.toContain('run_command');
    });
  });

  describe('convertToGemini', () => {
    it('should convert architect agent to Gemini CLI format', () => {
      const openCodeAgent = parseOpenCodeAgent(mockArchitectYaml);
      const geminiCommand = convertToGemini(openCodeAgent);
      
      expect(geminiCommand.description).toBe('Designs system architecture and creates comprehensive specifications');
      expect(geminiCommand.prompt).toContain('Design system architecture');
      expect(geminiCommand.prompt).toContain('## Capabilities');
      expect(geminiCommand.prompt).toContain('## Tools');
      expect(geminiCommand.prompt).toContain('## Constraints');
    });

    it('should escape double quotes in prompt for TOML', () => {
      const yamlWithQuotes = `name: quoted
description: Agent with "quotes"
role: Say "hello" to the user
communication:
  style: normal
  format: "Test format"
tools:
  read: true
`;
      const openCodeAgent = parseOpenCodeAgent(yamlWithQuotes);
      const geminiCommand = convertToGemini(openCodeAgent);
      
      expect(geminiCommand.prompt).toContain('Say \\"hello\\"');
    });
  });

  describe('convertToCursor', () => {
    it('should convert multiple agents to Cursor .cursorrules format', () => {
      const agents = [
        parseOpenCodeAgent(mockArchitectYaml),
        parseOpenCodeAgent(mockDebuggerYaml)
      ];
      const cursorContent = convertToCursor(agents);
      
      expect(cursorContent).toContain('# AI Agent Rules');
      expect(cursorContent).toContain('## architect');
      expect(cursorContent).toContain('## debugger');
      expect(cursorContent).toContain('**Description:** Designs system architecture');
      expect(cursorContent).toContain('## Capabilities');
      expect(cursorContent).toContain('- read_files');
      expect(cursorContent).toContain('## Tools');
      expect(cursorContent).toContain('- File reading (read, glob, grep)');
      expect(cursorContent).toContain('## Constraints');
      expect(cursorContent).toContain('## Decision Rules');
      expect(cursorContent).toContain('## Output Format');
    });

    it('should handle agent with all tool categories', () => {
      const agents = [parseOpenCodeAgent(mockDebuggerYaml)];
      const cursorContent = convertToCursor(agents);
      
      expect(cursorContent).toContain('- File reading (read, glob, grep)');
      expect(cursorContent).toContain('- File modification (edit, write)');
      expect(cursorContent).toContain('- Verification (bash)');
      expect(cursorContent).toContain('- Task delegation');
    });

    it('should handle agent with minimal tools', () => {
      const agents = [parseOpenCodeAgent(mockInvestigatorYaml)];
      const cursorContent = convertToCursor(agents);
      
      expect(cursorContent).toContain('- File reading (read, glob, grep)');
      expect(cursorContent).toContain('- Task delegation');
      expect(cursorContent).not.toContain('- File modification (edit, write)');
      expect(cursorContent).not.toContain('- Verification (bash)');
    });
  });

  describe('generateClaudeCodeMarkdown', () => {
    it('should generate valid markdown with YAML frontmatter', () => {
      const claudeAgent = {
        name: 'test-agent',
        description: 'A test agent',
        prompt: 'This is the system prompt.',
        tools: ['Read', 'Edit', 'Bash'],
        model: 'inherit'
      };
      
      const markdown = generateClaudeCodeMarkdown(claudeAgent);
      
      expect(markdown).toContain('---');
      expect(markdown).toContain('name: test-agent');
      expect(markdown).toContain('description: A test agent');
      expect(markdown).toContain('tools:');
      expect(markdown).toContain('Read');
      expect(markdown).toContain('Edit');
      expect(markdown).toContain('Bash');
      expect(markdown).toContain('model: inherit');
      expect(markdown).toContain('This is the system prompt.');
    });

    it('should handle agent without tools', () => {
      const claudeAgent = {
        name: 'minimal-agent',
        description: 'A minimal agent',
        prompt: 'Simple prompt.'
      };
      
      const markdown = generateClaudeCodeMarkdown(claudeAgent);
      
      expect(markdown).toContain('name: minimal-agent');
      expect(markdown).not.toContain('tools:');
    });
  });

  describe('generateGeminiToml', () => {
    it('should generate valid TOML with proper escaping', () => {
      const geminiCommand = {
        description: 'Test description',
        prompt: 'Test prompt with "quotes" and \\\\ backslashes'
      };
      
      const toml = generateGeminiToml(geminiCommand, 'test-agent');
      
      expect(toml).toContain('description = "Test description"');
      expect(toml).toContain('prompt = """');
      expect(toml).toContain('Test prompt with \\"quotes\\"');
      expect(toml).toContain('\\\\\\\\ backslashes');
    });

    it('should handle multi-line prompts', () => {
      const geminiCommand = {
        description: 'Multi-line agent',
        prompt: 'Line 1\nLine 2\nLine 3'
      };
      
      const toml = generateGeminiToml(geminiCommand, 'multi');
      
      expect(toml).toContain('"""');
      expect(toml).toContain('Line 1');
      expect(toml).toContain('Line 2');
      expect(toml).toContain('Line 3');
    });
  });

  describe('transformAgents (integration)', () => {
    const mockFiles = {
      'architect.yaml': mockArchitectYaml,
      'debugger.yaml': mockDebuggerYaml,
      'investigator.yaml': mockInvestigatorYaml
    };

    beforeEach(() => {
      // Setup fs mocks
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        if (p.includes('source')) return true;
        return false;
      });
      
      (fs.readdirSync as jest.Mock).mockReturnValue(['architect.yaml', 'debugger.yaml', 'investigator.yaml']);
      
      (fs.readFileSync as jest.Mock).mockImplementation((p: string) => {
        const fileName = path.basename(p);
        return mockFiles[fileName as keyof typeof mockFiles] || '';
      });
      
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    });

    it('should transform all agents to all formats by default', async () => {
      await transformAgents('source', 'output');
      
      expect(fs.readdirSync).toHaveBeenCalledWith('source');
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      
      // Check that files were written for all formats
      const writeCalls = (fs.writeFileSync as jest.Mock).mock.calls;
      const writtenPaths = writeCalls.map((call: any[]) => call[0]);
      
      // Claude format
      expect(writtenPaths.some((p: string) => p.includes('claude/agents/architect.md'))).toBe(true);
      expect(writtenPaths.some((p: string) => p.includes('claude/agents/debugger.md'))).toBe(true);
      
      // Codex format
      expect(writtenPaths.some((p: string) => p.includes('codex/architect.json'))).toBe(true);
      expect(writtenPaths.some((p: string) => p.includes('codex/agents.json'))).toBe(true);
      
      // Gemini format
      expect(writtenPaths.some((p: string) => p.includes('.gemini/agents/architect.toml'))).toBe(true);
      
      // Cursor format
      expect(writtenPaths.some((p: string) => p.includes('.cursorrules'))).toBe(true);
    });

    it('should only transform specified formats', async () => {
      await transformAgents('source', 'output', ['claude', 'cursor']);
      
      const writeCalls = (fs.writeFileSync as jest.Mock).mock.calls;
      const writtenPaths = writeCalls.map((call: any[]) => call[0]);
      
      // Claude and Cursor should exist
      expect(writtenPaths.some((p: string) => p.includes('claude/'))).toBe(true);
      expect(writtenPaths.some((p: string) => p.includes('.cursorrules'))).toBe(true);
      
      // Codex and Gemini should NOT exist
      expect(writtenPaths.some((p: string) => p.includes('codex/'))).toBe(false);
      expect(writtenPaths.some((p: string) => p.includes('gemini/'))).toBe(false);
    });

    it('should throw error when no YAML files found', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      
      await expect(transformAgents('empty', 'output')).rejects.toThrow('No YAML files found');
    });

    it('should create output directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        if (p === 'source') return true;
        if (p === 'new-output') return false;
        return true;
      });
      
      await transformAgents('source', 'new-output');
      
      expect(fs.mkdirSync).toHaveBeenCalledWith('new-output', { recursive: true });
    });

    it('should generate valid codex agents.json', async () => {
      await transformAgents('source', 'output');
      
      const writeCalls = (fs.writeFileSync as jest.Mock).mock.calls;
      const agentsJsonCall = writeCalls.find((call: any[]) => call[0].includes('codex/agents.json'));
      
      expect(agentsJsonCall).toBeDefined();
      
      const jsonContent = agentsJsonCall[1];
      const parsed = JSON.parse(jsonContent);
      
      expect(parsed.agents).toBeInstanceOf(Array);
      expect(parsed.agents).toHaveLength(3);
      expect(parsed.agents[0]).toHaveProperty('name');
      expect(parsed.agents[0]).toHaveProperty('description');
      expect(parsed.agents[0]).toHaveProperty('prompt');
      expect(parsed.agents[0]).toHaveProperty('tools');
      expect(parsed.agents[0]).toHaveProperty('model');
    });
  });

  describe('edge cases', () => {
    it('should handle agent with empty capabilities array', () => {
      const yaml = `name: empty
description: Empty agent
capabilities: []
tools:
  read: true
communication:
  style: normal
`;
      const agent = parseOpenCodeAgent(yaml);
      const claude = convertToClaudeCode(agent);
      
      expect(claude.prompt).not.toContain('## Capabilities');
    });

    it('should handle agent with no tools object', () => {
      const yaml = `name: no-tools
description: Agent without tools
communication:
  style: normal
`;
      const agent = parseOpenCodeAgent(yaml);
      const claude = convertToClaudeCode(agent);
      
      expect(claude.tools).toBeUndefined();
    });

    it('should handle agent with special characters in description', () => {
      const yaml = `name: special
description: 'Agent with <special> & "characters"'
communication:
  style: normal
tools:
  read: true
`;
      const agent = parseOpenCodeAgent(yaml);
      expect(agent.description).toBe('Agent with <special> & "characters"');
    });

    it('should handle agent with very long format string', () => {
      const longFormat = 'A'.repeat(5000);
      const yaml = `name: long-format
description: Agent with long format
communication:
  style: normal
  format: |
    ${longFormat}
tools:
  read: true
`;
      const agent = parseOpenCodeAgent(yaml);
      expect(agent.communication?.format).toContain('A'.repeat(100));
    });
  });
});
