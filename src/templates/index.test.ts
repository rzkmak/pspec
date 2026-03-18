import { getTemplates, templates, getAgent, getAgentPrompt, listAgents, AVAILABLE_AGENTS, getAgentTemplates } from './index';

const wordCount = (text: string) => text.trim().split(/\s+/).length;
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

describe('templates', () => {
  it('should have templates for all supported agents', () => {
    const agents = ['claude', 'gemini', 'cursor', 'opencode'];
    agents.forEach(agent => {
      expect(templates).toHaveProperty(agent);
      expect(Array.isArray(templates[agent])).toBe(true);
      expect(templates[agent].length).toBeGreaterThan(0);
    });
  });

  describe('claude templates', () => {
    it('should be correctly formatted as markdown with frontmatter', () => {
      const claudeTemplates = getTemplates('claude');
      const specTemplate = claudeTemplates.find(t => t.file === 'pspec.spec.md');
      
      expect(specTemplate).toBeDefined();
      expect(specTemplate?.dir).toBe('.claude/commands');
      expect(specTemplate?.content).toContain('---');
      expect(specTemplate?.content).toContain('description: "Start an inquiry to create a new spec"');
      expect(specTemplate?.content).toContain('You are an AI Spec Architect using the pspec framework.');
    });
  });

  describe('gemini templates', () => {
    it('should be correctly formatted as toml', () => {
      const geminiTemplates = getTemplates('gemini');
      const planTemplate = geminiTemplates.find(t => t.file === 'pspec.plan.toml');
      
      expect(planTemplate).toBeDefined();
      expect(planTemplate?.dir).toBe('.gemini/commands');
      expect(planTemplate?.content).toContain('description = "Plan tasks for an existing spec"');
      expect(planTemplate?.content).toContain('prompt = """');
      expect(planTemplate?.content).toContain('You are an AI Technical Lead using the pspec framework.');
    });
  });

  describe('cursor templates', () => {
    it('should be correctly formatted as .mdc with rules', () => {
      const cursorTemplates = getTemplates('cursor');
      const implementTemplate = cursorTemplates.find(
        t => t.dir === '.cursor/rules' && t.file === 'pspec.implement.mdc'
      );
      const implementCommandTemplate = cursorTemplates.find(
        t => t.dir === '.cursor/commands' && t.file === 'pspec.implement.md'
      );
      
      expect(implementTemplate).toBeDefined();
      expect(implementTemplate?.dir).toBe('.cursor/rules');
      expect(implementTemplate?.content).toContain('globs: "*"');
      expect(implementTemplate?.content).toContain('You are a Senior Software Engineer and Orchestrator using the pspec framework.');

      expect(implementCommandTemplate).toBeDefined();
      expect(implementCommandTemplate?.dir).toBe('.cursor/commands');
      expect(implementCommandTemplate?.content).toContain('description: "Implement tasks from a checklist using sub-agents"');
      expect(implementCommandTemplate?.content).toContain('You are a Senior Software Engineer and Orchestrator using the pspec framework.');
    });
  });

  describe('debug templates', () => {
    it('should be correctly formatted as a general debugging tool', () => {
      const geminiTemplates = getTemplates('gemini');
      const debugTemplate = geminiTemplates.find(t => t.file === 'pspec.debug.toml');
      
      expect(debugTemplate).toBeDefined();
      expect(debugTemplate?.content).toContain('description = "Investigate and resolve errors in the project using sub-agents"');
      expect(debugTemplate?.content).toContain('You are an AI Debugging Expert using the pspec framework.');
    });
  });

  describe('getTemplates', () => {
    it('should return an empty array for unknown agents', () => {
      expect(getTemplates('unknown')).toEqual([]);
    });

    it('should return the correct templates for a known agent', () => {
      const t = getTemplates('opencode');
      expect(t.length).toBe(4);
      expect(t[0].file).toBe('pspec.spec.md');
      expect(t[0].content).toContain('AI Spec Architect');
    });

    it('should return both rule and command templates for cursor', () => {
      const t = getTemplates('cursor');
      expect(t.length).toBe(8);
      const dirs = t.map(template => template.dir);
      expect(dirs).toContain('.cursor/rules');
      expect(dirs).toContain('.cursor/commands');
    });

    it('should keep command prompts compact and direct-first', () => {
      const templates = getTemplates('opencode');
      const specs = [
        {
          file: 'pspec.spec.md',
          maxWords: 220,
          required: ['Draft immediately when the request is concrete.', 'Ask 0-3 targeted questions only when ambiguity would materially change the spec.'],
          forbidden: ['3 to 7', 'Approval Gate 1', 'Resource Cleanup']
        },
        {
          file: 'pspec.plan.md',
          maxWords: 320,
          required: ['Default to one planning pass.', 'Use `investigator` only when codebase patterns are unclear.'],
          forbidden: ['Spawn a `test_planner` agent', 'Resource Cleanup']
        },
        {
          file: 'pspec.implement.md',
          maxWords: 300,
          required: ['Default to direct execution.', 'Verify by risk, not by checkbox:'],
          forbidden: ['DO NOT read the task file details yourself', 'Run `build`, `test`, and `lint` for every task']
        },
        {
          file: 'pspec.debug.md',
          maxWords: 250,
          required: ['Start with direct triage.', 'Use parallel investigation only for distinct hypotheses'],
          forbidden: ['grep_search', 'Resource Cleanup']
        }
      ];

      specs.forEach(({ file, maxWords, required, forbidden }) => {
        const template = templates.find(t => t.file === file);

        expect(template).toBeDefined();
        expect(wordCount(template!.content)).toBeLessThan(maxWords);
        required.forEach(snippet => expect(template!.content).toContain(snippet));
        forbidden.forEach(snippet => expect(template!.content).not.toContain(snippet));
      });
    });
  });
});

describe('agents', () => {
  describe('AVAILABLE_AGENTS', () => {
    it('should contain all 7 hardcoded agents', () => {
      expect(AVAILABLE_AGENTS).toHaveLength(7);
      expect(AVAILABLE_AGENTS).toContain('architect');
      expect(AVAILABLE_AGENTS).toContain('task_planner');
      expect(AVAILABLE_AGENTS).toContain('generalist');
      expect(AVAILABLE_AGENTS).toContain('investigator');
      expect(AVAILABLE_AGENTS).toContain('debugger');
      expect(AVAILABLE_AGENTS).toContain('implementator');
      expect(AVAILABLE_AGENTS).toContain('test_planner');
    });
  });

  describe('listAgents', () => {
    it('should return all available agent names', () => {
      const agents = listAgents();
      expect(agents).toHaveLength(7);
      expect(agents).toEqual(expect.arrayContaining(AVAILABLE_AGENTS));
    });
  });

  describe('getAgent', () => {
    it('should load architect agent correctly', () => {
      const agent = getAgent('architect');
      expect(agent.name).toBe('architect');
      expect(agent.description).toBeDefined();
      expect(agent.capabilities).toBeInstanceOf(Array);
      expect(agent.tools).toBeInstanceOf(Object);
      expect(agent.constraints).toBeInstanceOf(Array);
      expect(agent.communication).toBeDefined();
      expect(agent.communication.style).toBeDefined();
      expect(agent.communication.format).toBeDefined();
    });

    it('should load all 7 agents successfully', () => {
      AVAILABLE_AGENTS.forEach(agentName => {
        const agent = getAgent(agentName);
        expect(agent.name).toBe(agentName);
        expect(agent.description).toBeDefined();
        expect(agent.capabilities.length).toBeGreaterThan(0);
        expect(agent.tools).toBeInstanceOf(Object);
        // Check that at least one tool category is enabled
        const hasTools = Object.values(agent.tools).some(
          enabled => enabled === true
        );
        expect(hasTools).toBe(true);
        expect(agent.constraints.length).toBeGreaterThan(0);
      });
    });

    it('should throw error for unknown agent', () => {
      expect(() => getAgent('unknown_agent' as any)).toThrow('Agent template not found');
    });
  });

  describe('getAgentPrompt', () => {
    it('should return formatted prompt string', () => {
      const prompt = getAgentPrompt('generalist');
      expect(prompt).toContain('# GENERALIST');
      expect(prompt).toContain('## Capabilities');
      expect(prompt).toContain('## Available Tools');
      expect(prompt).toContain('## Constraints');
      expect(prompt).toContain('## Decision Rules');
      expect(prompt).toContain('## Execution Notes');
      expect(prompt).toContain('## Output Format');
    });

    it('should include all agents required sections', () => {
      AVAILABLE_AGENTS.forEach(agentName => {
        const prompt = getAgentPrompt(agentName);
        expect(prompt).toContain(`# ${agentName.toUpperCase()}`);
        expect(prompt).toContain('## Capabilities');
        expect(prompt).toContain('## Available Tools');
        expect(prompt).toContain('## Constraints');
        expect(prompt).toContain('## Decision Rules');
        expect(prompt).toContain('## Execution Notes');
        expect(prompt).toContain('## Output Format');
      });
    });

    it('should keep compiled prompts within lean token budgets', () => {
      const perAgentBudget = 380;
      const totalBudget = 2300;

      const tokenCounts = AVAILABLE_AGENTS.map(agentName => estimateTokens(getAgentPrompt(agentName)));

      tokenCounts.forEach(count => expect(count).toBeLessThan(perAgentBudget));
      expect(tokenCounts.reduce((sum, count) => sum + count, 0)).toBeLessThan(totalBudget);
    });
  });
});

describe('getAgentTemplates', () => {
  it('should return agent templates in claude format', () => {
    const templates = getAgentTemplates('claude');
    expect(templates.length).toBe(7);
    
    const architectTemplate = templates.find(t => t.file === 'architect.md');
    expect(architectTemplate).toBeDefined();
    expect(architectTemplate?.dir).toBe('.claude/agents');
    expect(architectTemplate?.content).toContain('name: architect');
    expect(architectTemplate?.content).toContain('## Capabilities');
    expect(architectTemplate?.content).toContain('## Tools');
    expect(architectTemplate?.content).toContain('## Constraints');
  });

  it('should return agent templates in gemini format', () => {
    const templates = getAgentTemplates('gemini');
    expect(templates.length).toBe(7);
    
    const architectTemplate = templates.find(t => t.file === 'architect.toml');
    expect(architectTemplate).toBeDefined();
    expect(architectTemplate?.dir).toBe('.gemini/agents');
    expect(architectTemplate?.content).toContain('name = "architect"');
    expect(architectTemplate?.content).toContain('[tools]');
    expect(architectTemplate?.content).toContain('[communication]');
  });

  it('should return agent templates in cursor format', () => {
    const templates = getAgentTemplates('cursor');
    expect(templates.length).toBe(7);
    
    const architectTemplate = templates.find(t => t.file === 'architect.mdc');
    expect(architectTemplate).toBeDefined();
    expect(architectTemplate?.dir).toBe('.cursor/agents');
    expect(architectTemplate?.content).toContain('globs: "*"');
  });

  it('should return agent templates in opencode format', () => {
    const templates = getAgentTemplates('opencode');
    expect(templates.length).toBe(7);
    
    const architectTemplate = templates.find(t => t.file === 'architect.md');
    expect(architectTemplate).toBeDefined();
    expect(architectTemplate?.dir).toBe('.opencode/agents');
  });

  it('should return empty array for unknown agent', () => {
    const templates = getAgentTemplates('unknown');
    expect(templates).toEqual([]);
  });

  it('should include all agent fields in claude format', () => {
    const templates = getAgentTemplates('claude');
    const generalistTemplate = templates.find(t => t.file === 'generalist.md');
    
    expect(generalistTemplate?.content).toContain('## Decision Rules');
    expect(generalistTemplate?.content).toContain('## Execution Notes');
    expect(generalistTemplate?.content).toContain('Match naming and export conventions exactly');
  });

  it('should include test heuristics for test_planner in gemini format', () => {
    const templates = getAgentTemplates('gemini');
    const testPlannerTemplate = templates.find(t => t.file === 'test_planner.toml');
    
    expect(testPlannerTemplate?.content).toContain('Boundary:');
  });

  it('should match snapshots for representative agent outputs across targets', () => {
    const targets = ['claude', 'gemini', 'cursor', 'opencode'] as const;
    const agents = ['architect', 'generalist', 'test_planner'] as const;

    const snapshots = Object.fromEntries(
      targets.map(target => {
        const templates = getAgentTemplates(target);
        return [
          target,
          Object.fromEntries(
            agents.map(agentName => {
              const ext = target === 'gemini' ? 'toml' : target === 'cursor' ? 'mdc' : 'md';
              const template = templates.find(t => t.file === `${agentName}.${ext}`);
              return [agentName, template?.content];
            })
          )
        ];
      })
    );

    expect(snapshots).toMatchSnapshot();
  });

  describe('edge cases', () => {
    it('should handle agent with missing optional fields gracefully', () => {
      // task_planner doesn't have role, pattern_matching, completion_criteria, or test_heuristics
      const templates = getAgentTemplates('claude');
      const taskPlannerTemplate = templates.find(t => t.file === 'task_planner.md');
      
      expect(taskPlannerTemplate).toBeDefined();
      // Should still have required fields
      expect(taskPlannerTemplate?.content).toContain('name: task_planner');
      expect(taskPlannerTemplate?.content).toContain('## Capabilities');
      expect(taskPlannerTemplate?.content).toContain('## Constraints');
      // Should have guidelines since it's defined
      expect(taskPlannerTemplate?.content).toContain('## Execution Notes');
    });

    it('should handle agent with empty tool categories', () => {
      // investigator only has read and delegate tools, no modify or verify
      const agent = getAgent('investigator');
      
      expect(agent.tools.modify).toBeUndefined();
      expect(agent.tools.verify).toBeUndefined();
      expect(agent.tools.read).toBe(true);
      expect(agent.tools.delegate).toBe(true);
      
      // Template generation should handle missing categories
      const templates = getAgentTemplates('claude');
      const investigatorTemplate = templates.find(t => t.file === 'investigator.md');
      expect(investigatorTemplate?.content).toContain('## Tools');
      expect(investigatorTemplate?.content).toContain('- Read: read, glob, grep');
      expect(investigatorTemplate?.content).toContain('- Delegate: task');
    });

    it('should handle agent with all optional fields', () => {
      // generalist has pattern_matching
      const agent = getAgent('generalist');
      
      expect(agent.pattern_matching).toBeDefined();
      expect(agent.pattern_matching?.length).toBeGreaterThan(0);
      
      const templates = getAgentTemplates('claude');
      const generalistTemplate = templates.find(t => t.file === 'generalist.md');
      expect(generalistTemplate?.content).toContain('Match local test structure and assertion style');
    });

    it('should handle agent with completion_criteria', () => {
      // implementator has completion_criteria
      const agent = getAgent('implementator');
      
      expect(agent.completion_criteria).toBeDefined();
      expect(agent.completion_criteria?.length).toBeGreaterThan(0);
      
      const templates = getAgentTemplates('claude');
      const implementorTemplate = templates.find(t => t.file === 'implementator.md');
      expect(implementorTemplate?.content).toContain('Relevant existing tests still pass');
    });

    it('should handle agent with test_heuristics', () => {
      // test_planner has test_heuristics
      const agent = getAgent('test_planner');
      
      expect(agent.test_heuristics).toBeDefined();
      
      const templates = getAgentTemplates('claude');
      const testPlannerTemplate = templates.find(t => t.file === 'test_planner.md');
      expect(testPlannerTemplate?.content).toContain('Boundary:');
    });

    it('should handle agent with role field', () => {
      // architect has role
      const agent = getAgent('architect');
      
      expect(agent.role).toBeDefined();
      expect(agent.role?.length).toBeGreaterThan(0);
      
      const templates = getAgentTemplates('claude');
      const architectTemplate = templates.find(t => t.file === 'architect.md');
      expect(architectTemplate?.content).toContain('Design the minimum architecture needed');
    });

    it('should handle agent without role field', () => {
      // task_planner doesn't have role
      const agent = getAgent('task_planner');
      
      expect(agent.role).toBeUndefined();
      
      // getAgentPrompt should use description as fallback
      const prompt = getAgentPrompt('task_planner');
      expect(prompt).toContain('You are an agent specialized in');
    });

    it('should generate valid TOML for gemini format without syntax errors', () => {
      const templates = getAgentTemplates('gemini');
      
      templates.forEach(template => {
        // Check for proper TOML structure
        expect(template.content).toContain('name = ');
        expect(template.content).toContain('description = ');
        expect(template.content).toContain('[tools]');
        expect(template.content).toContain('[communication]');
        expect(template.content).toContain('prompt = """');
        expect(template.content).toContain('"""');
        
        // Should not have YAML-style key: value outside prompt block
        const lines = template.content.split('\n');
        let inPromptBlock = false;
        lines.forEach(line => {
          if (line.includes('prompt = """')) {
            inPromptBlock = true;
          } else if (line === '"""') {
            inPromptBlock = false;
          } else if (!inPromptBlock && line.trim() && !line.startsWith('#')) {
            // Outside prompt block should use TOML format
            expect(line).toMatch(/^\w+\s*=|^\[|^\s*$|^#/);
          }
        });
      });
    });

    it('should generate valid Markdown with frontmatter for claude format', () => {
      const templates = getAgentTemplates('claude');
      
      templates.forEach(template => {
        // Should start with ---
        expect(template.content.startsWith('---')).toBe(true);
        // Should have YAML frontmatter structure
        expect(template.content).toContain('name:');
        expect(template.content).toContain('description:');
        // Should have sections after frontmatter
        expect(template.content).toContain('## Capabilities');
      });
    });

    it('should handle getAgentPrompt for all agents without errors', () => {
      AVAILABLE_AGENTS.forEach(agentName => {
        const prompt = getAgentPrompt(agentName);
        
        // Should have required sections
        expect(prompt).toContain(`# ${agentName.toUpperCase()}`);
        expect(prompt).toContain('## Capabilities');
        expect(prompt).toContain('## Available Tools');
        expect(prompt).toContain('## Constraints');
        expect(prompt).toContain('## Decision Rules');
        expect(prompt).toContain('## Execution Notes');
        expect(prompt).toContain('## Output Format');
        
        // Should not be empty
        expect(prompt.length).toBeGreaterThan(100);
      });
    });
  });
});
