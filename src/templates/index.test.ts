import { getTemplates, templates } from './index';

describe('templates', () => {
  it('should have templates for all supported agents', () => {
    const agents = ['claude', 'gemini', 'cursor', 'opencode', 'antigravity', 'kilo'];
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
      expect(specTemplate?.content).toContain('description: "Start an inquiry to create a new PRD"');
      expect(specTemplate?.content).toContain('You are an AI Product Manager using the pspec framework.');
    });
  });

  describe('gemini templates', () => {
    it('should be correctly formatted as toml', () => {
      const geminiTemplates = getTemplates('gemini');
      const planTemplate = geminiTemplates.find(t => t.file === 'pspec.plan.toml');
      const auditTemplate = geminiTemplates.find(t => t.file === 'pspec.audit.toml');
      
      expect(planTemplate).toBeDefined();
      expect(planTemplate?.dir).toBe('.gemini/commands');
      expect(planTemplate?.content).toContain('description = "Generate feature specs for an existing PRD"');
      expect(planTemplate?.content).toContain('prompt = """');
      expect(planTemplate?.content).toContain('You are an AI Technical Lead using the pspec framework.');

      expect(auditTemplate).toBeDefined();
      expect(auditTemplate?.content).toContain('description = "Audit and sync feature specs with the PRD"');
      expect(auditTemplate?.content).toContain('You are an AI Planning Auditor using the pspec framework.');
    });
  });

  describe('cursor templates', () => {
    it('should be correctly formatted as .mdc with rules', () => {
      const cursorTemplates = getTemplates('cursor');
      const implementTemplate = cursorTemplates.find(
        t => t.dir === '.cursor/rules' && t.file === 'pspec.implement.mdc'
      );
      const auditTemplate = cursorTemplates.find(
        t => t.dir === '.cursor/rules' && t.file === 'pspec.audit.mdc'
      );
      const auditCommandTemplate = cursorTemplates.find(
        t => t.dir === '.cursor/commands' && t.file === 'pspec.audit.md'
      );
      const implementCommandTemplate = cursorTemplates.find(
        t => t.dir === '.cursor/commands' && t.file === 'pspec.implement.md'
      );
      
      expect(implementTemplate).toBeDefined();
      expect(implementTemplate?.dir).toBe('.cursor/rules');
      expect(implementTemplate?.content).toContain('globs: "*"');
      expect(implementTemplate?.content).toContain('You are a Senior Software Engineer using the pspec framework.');

      expect(implementCommandTemplate).toBeDefined();
      expect(implementCommandTemplate?.dir).toBe('.cursor/commands');
      expect(implementCommandTemplate?.content).toContain('description: "Implement planned feature specs"');
      expect(implementCommandTemplate?.content).toContain('You are a Senior Software Engineer using the pspec framework.');

      expect(auditTemplate).toBeDefined();
      expect(auditTemplate?.content).toContain('You are an AI Planning Auditor using the pspec framework.');

      expect(auditCommandTemplate).toBeDefined();
      expect(auditCommandTemplate?.dir).toBe('.cursor/commands');
      expect(auditCommandTemplate?.content).toContain('description: "Audit and sync feature specs with the PRD"');
    });
  });

  describe('debug templates', () => {
    it('should be correctly formatted as a debugging tool', () => {
      const geminiTemplates = getTemplates('gemini');
      const debugTemplate = geminiTemplates.find(t => t.file === 'pspec.debug.toml');
      const auditTemplate = geminiTemplates.find(t => t.file === 'pspec.audit.toml');
      
      expect(debugTemplate).toBeDefined();
      expect(debugTemplate?.content).toContain('description = "Investigate and resolve errors in the project"');
      expect(debugTemplate?.content).toContain('You are an AI Debugging Expert using the pspec framework.');

      expect(auditTemplate).toBeDefined();
      expect(auditTemplate?.content).toContain('Audit and sync feature specs with the PRD');
    });
  });

  describe('antigravity templates', () => {
    it('should be correctly formatted as Workflows and Skills', () => {
      const antigravityTemplates = getTemplates('antigravity');
      const specTemplate = antigravityTemplates.find(t => t.file === 'pspec.spec.md');
      const skillTemplate = antigravityTemplates.find(t => t.file === 'SKILL.md');
      
      expect(specTemplate).toBeDefined();
      expect(specTemplate?.dir).toBe('.agent/workflows');
      expect(specTemplate?.content).toContain('---');
      expect(specTemplate?.content).toContain('description: "Start an inquiry to create a new PRD"');
      expect(specTemplate?.content).toContain('# Pspec spec');
      expect(specTemplate?.content).toContain('You are an AI Product Manager using the pspec framework.');

      expect(skillTemplate).toBeDefined();
      expect(skillTemplate?.dir).toBe('.agent/skills/pspec');
      expect(skillTemplate?.content).toContain('name: pspec');
      expect(skillTemplate?.content).toContain('Spec-Driven Development (SDD) toolkit');
    });
  });

  describe('antigravity templates', () => {
    it('should be correctly formatted as Workflows and Skills', () => {
      const antigravityTemplates = getTemplates('antigravity');
      const specTemplate = antigravityTemplates.find(t => t.file === 'pspec.spec.md');
      const skillTemplate = antigravityTemplates.find(t => t.file === 'SKILL.md');
      
      expect(specTemplate).toBeDefined();
      expect(specTemplate?.dir).toBe('.agent/workflows');
      expect(specTemplate?.content).toContain('---');
      expect(specTemplate?.content).toContain('description: "Start an inquiry to create a new PRD"');
      expect(specTemplate?.content).toContain('# Pspec spec');
      expect(specTemplate?.content).toContain('You are an AI Product Manager using the pspec framework.');

      expect(skillTemplate).toBeDefined();
      expect(skillTemplate?.dir).toBe('.agent/skills/pspec');
      expect(skillTemplate?.content).toContain('name: pspec');
      expect(skillTemplate?.content).toContain('Spec-Driven Development (SDD) toolkit');
    });
  });

  describe('getTemplates', () => {
    it('should return an empty array for unknown agents', () => {
      expect(getTemplates('unknown')).toEqual([]);
    });

    it('should return the correct templates for a known agent', () => {
      const t = getTemplates('opencode');
      expect(t.length).toBe(5);
      expect(t[0].file).toBe('pspec.spec.md');
      expect(t[0].content).toContain('AI Product Manager');
    });

    it('should return both rule and command templates for cursor', () => {
      const t = getTemplates('cursor');
      expect(t.length).toBe(10);
      const dirs = t.map(template => template.dir);
      expect(dirs).toContain('.cursor/rules');
      expect(dirs).toContain('.cursor/commands');
    });

    it('should keep command prompts workflow-aligned', () => {
      const templates = getTemplates('opencode');
      const specs = [
        {
          file: 'pspec.spec.md',
          required: ['Product Requirements Document (PRD)', 'You are an AI Product Manager using the pspec framework.', 'In the first response, ask questions only. Do not write the PRD in the same response.', 'finish the full PRD drafting run in one pass', 'Do not stop in the middle of Phase 2 to hand back a partial PRD', 'Reply using Q1/Q2/...', 'AC-01', 'EC-01', 'Do not save placeholder text', '<epoch-ms>-<slug>.md', '/pspec.plan .pspec/specs/'],
          forbidden: ['Ask 0-3 targeted questions', 'Approval Gate 1', 'Resource Cleanup', 'Draft immediately when the request is concrete.', 'not confident enough to assume']
        },
        {
          file: 'pspec.plan.md',
          required: ['generate a feature-spec directory', 'Do not write the feature-spec directory in the same response where you ask questions.', 'finish the full planning run in one pass', 'Do not stop in the middle of Phase 2 to hand back a partial directory, draft files, TODO list, checkpoint, or "next steps"', '## Feature Specs', '## Active Work', '## Coverage Map', '`[>]` in progress', '## Data Model', '## API Contracts', '## UI States', '## User Interactions', '## Data Test IDs', 'request and response shapes', 'loading, empty, error, and success states', 'data-testid', '/pspec.implement .pspec/tasks/<spec-stem>/PROGRESS.md'],
          forbidden: ['parallelizable', 'subtasks', 'aggregate_result', 'token_budget', 'Ask for approval only once', 'not confident enough to assume', 'files.create']
        },
        {
          file: 'pspec.audit.md',
          required: ['audit and sync a feature-spec directory against its PRD', 'This command may update planning artifacts, but it must not implement product code.', '## Phase 3 - Sync Plan Artifacts', 'keep valid feature spec files when they still cover the right requirements', 'keep it in progress and preserve or refresh its resume note', 'downgrade it to `[ ]` and add a short note in `PROGRESS.md`', 'Do not change application source code, tests, or runtime configuration.', 'Never claim the directory is clean if coverage, schema, or placeholder issues remain'],
          forbidden: ['parallelizable', 'subagent', 'token_budget']
        },
        {
          file: 'pspec.implement.md',
          required: ['treat the task directory as a feature-spec directory', 'Run the entire implementation loop from Phase 1 through Phase 6', 'Do not stop in the middle of the run to hand back a plan, TODO list, checkpoint, or "next steps"', '## Feature Specs', '## Active Work', 'If `PROGRESS.md` already has one `[>]` feature spec, resume it before any new work', 'mark the feature spec `[>]`', 'implemented API endpoints still match the planned request/response shapes', 'implemented UI states, interactions, and `data-testid` values still match the feature spec', 'Check every bullet in `## Definition Of Done` one by one.', 'Do not return `done` while any `[ ]`, `[>]`, or `[~]` remains.', 'Do not use `partial` or `blocked` for a voluntary mid-run handoff.'],
          forbidden: ['parallelizable', 'subagent', 'token_budget', 'log it and proceed to the next task', 'confidence is low']
        },
        {
          file: 'pspec.debug.md',
          required: ['## Phase 1 - Reproduce', 'Do not use parallel investigation or subagents.', 'If you cannot reproduce the bug, say so plainly and report what you tried.', 'Never claim the bug is fixed unless the reproduction or a relevant regression check passes.'],
          forbidden: ['grep_search', 'Resource Cleanup', 'spawn one subagent per hypothesis']
        }
      ];

      specs.forEach(({ file, required, forbidden }: { file: string, required: string[], forbidden: string[] }) => {
        const template = templates.find(t => t.file === file);

        expect(template).toBeDefined();
        required.forEach(snippet => expect(template!.content).toContain(snippet));
        forbidden.forEach(snippet => expect(template!.content).not.toContain(snippet));
      });
    });
  });
});
