import { getTemplates, templates } from './index';

describe('templates', () => {
  it('should have templates for all supported agents', () => {
    const agents = ['claude', 'gemini', 'cursor', 'opencode', 'zed', 'generic'];
    agents.forEach(agent => {
      expect(templates).toHaveProperty(agent);
      expect(Array.isArray(templates[agent])).toBe(true);
      expect(templates[agent].length).toBeGreaterThan(0);
    });
  });

  describe('claude templates', () => {
    it('should be correctly formatted as markdown with frontmatter', () => {
      const claudeTemplates = getTemplates('claude');
      const specTemplate = claudeTemplates.find(t => t.file === 'mspec.spec.md');
      
      expect(specTemplate).toBeDefined();
      expect(specTemplate?.dir).toBe('.claude/commands');
      expect(specTemplate?.content).toContain('---');
      expect(specTemplate?.content).toContain('description: "Start an inquiry to create a new spec"');
      expect(specTemplate?.content).toContain('You are an AI Spec Architect using the mspec framework.');
    });
  });

  describe('gemini templates', () => {
    it('should be correctly formatted as toml', () => {
      const geminiTemplates = getTemplates('gemini');
      const planTemplate = geminiTemplates.find(t => t.file === 'mspec.plan.toml');
      
      expect(planTemplate).toBeDefined();
      expect(planTemplate?.dir).toBe('.gemini/commands');
      expect(planTemplate?.content).toContain('description = "Plan tasks for an existing spec"');
      expect(planTemplate?.content).toContain('prompt = """');
      expect(planTemplate?.content).toContain('You are an AI Technical Lead using the mspec framework.');
    });
  });

  describe('cursor templates', () => {
    it('should be correctly formatted as .mdc with rules', () => {
      const cursorTemplates = getTemplates('cursor');
      const implementTemplate = cursorTemplates.find(t => t.file === 'mspec.implement.mdc');
      
      expect(implementTemplate).toBeDefined();
      expect(implementTemplate?.dir).toBe('.cursor/rules');
      expect(implementTemplate?.content).toContain('globs: *');
      expect(implementTemplate?.content).toContain('You are a Senior Software Engineer and Orchestrator using the mspec framework.');
    });
  });

  describe('debug templates', () => {
    it('should be correctly formatted as a general debugging tool', () => {
      const geminiTemplates = getTemplates('gemini');
      const debugTemplate = geminiTemplates.find(t => t.file === 'mspec.debug.toml');
      
      expect(debugTemplate).toBeDefined();
      expect(debugTemplate?.content).toContain('description = "Investigate and resolve errors in the project using sub-agents"');
      expect(debugTemplate?.content).toContain('You are an AI Debugging Expert using the mspec framework.');
    });
  });

  describe('getTemplates', () => {
    it('should return an empty array for unknown agents', () => {
      expect(getTemplates('unknown')).toEqual([]);
    });

    it('should return the correct templates for a known agent', () => {
      const t = getTemplates('zed');
      expect(t.length).toBe(1);
      expect(t[0].file).toBe('INSTRUCTIONS.md');
      expect(t[0].content).toContain('# mspec Instructions');
    });
  });
});
