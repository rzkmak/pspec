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
          required: [
            'Product Requirements Document (PRD)',
            'You are an AI Product Manager using the pspec framework.',
            'Ask questions only in the first response',
            'finish the full PRD in one pass',
            'Do not stop mid-draft',
            'Use the agent\'s native question tool',
            'AC-01',
            'EC-01',
            'kind: prd',
            '## Intent',
            '## Flow',
            '## Acceptance Criteria',
            '## Edge Cases',
            '## Features',
            '→',
            'F01',
            'save-time checklist',
            'Do not save placeholder text',
            '<epoch-ms>-<slug>.md',
            '/pspec.plan .pspec/specs/',
            'CONTEXT.md',
            'primary source of truth'
          ],
          forbidden: [
            'Ask 0-3 targeted questions',
            'Approval Gate 1',
            'Draft immediately when the request is concrete.',
            'not confident enough to assume'
          ]
        },
        {
          file: 'pspec.plan.md',
          required: [
            'create a feature-spec directory from a PRD',
            'Ask questions only in the first response',
            'finish the full plan in one pass',
            'Do not stop mid-plan',
            '## Registry',
            '## Coverage',
            '## Active',
            'pending',
            'active',
            'done',
            'blocked',
            '### Data',
            '### API',
            '### UI',
            '## Contracts',
            '## Actions',
            '## Decisions',
            '## Validates',
            '## Allowlists',
            '## Done',
            'data-testid',
            'kind: feature',
            'feature_ref',
            'Save-Time Checklist',
            'If no spec path is given',
            'PRD not found',
            'Run `/pspec.spec` first',
            'Do not proceed without a confirmed PRD file',
            '/pspec.implement .pspec/tasks/<stem>/PROGRESS.md',
            'config block',
            'state block',
            'allowlist block',
            'allow_other',
            'other_validation',
            'other_normalize',
            'Deny-by-default',
            'Read `.pspec/CONTEXT.md`',
            'Merge `.pspec/CONTEXT.md`'
          ],
          forbidden: [
            'parallelizable',
            'subtasks',
            'aggregate_result',
            'token_budget',
            'Ask for approval only once',
            'not confident enough to assume',
            'files.create',
            '## Data Model',
            '## API Contracts',
            '## UI States',
            '## User Interactions',
            '## Data Test IDs',
            '## Active Work',
            '## Coverage Map',
            '## Feature Specs',
            '## Definition Of Done',
            '## Approach',
            '## Steps',
            '## Verification',
            'from_allowlist'
          ]
        },
        {
          file: 'pspec.audit.md',
          required: [
            'audit and sync a feature-spec directory against its PRD',
            'It must not implement product code',
            '## Phase 3 - Sync',
            'keep specs that still cover correct requirements',
            'downgrade to `pending`',
            'Never claim the directory is clean if coverage, schema, or placeholder issues remain',
            'Registry parity',
            'Coverage parity',
            'Active section',
            'config block',
            'action',
            'decision',
            'validate',
            'allowlist',
            'no cycles in the depends_on graph',
            '.pspec/CONTEXT.md',
            'refresh PROGRESS.md frontmatter context'
          ],
          forbidden: [
            'parallelizable',
            'subagent',
            'token_budget',
            '## Active Work',
            '## Coverage Map',
            '## Feature Specs',
            '## Data Model',
            '## Definition Of Done'
          ]
        },
        {
          file: 'pspec.implement.md',
          required: [
            'orchestrator loop',
            'dispatches one subagent per feature spec',
            'S1 - Read Context',
            'S5 - Validate Handoff',
            '## Worker Protocol',
            '## Orchestrator Protocol',
            'Registry',
            'Coverage table',
            'Never tell the user to rerun `/pspec.implement`',
            'PROGRESS.md is the write-ahead log',
            'data-testid',
            'Task directory not found',
            'Run `/pspec.plan` first',
            'Only one subagent active at a time',
            'Never leave a subagent running after it has returned',
            'Gate: zero mismatches',
            'Never use partial/blocked for voluntary handoff',
            'Block Parsing',
            'Allowlist Enforcement',
            'Decision Resolution',
            'ask_user',
            'allow_other',
            'other_validation',
            'other_normalize',
            'Topologically sort actions',
            'config block exists',
            'allowlist entries',
            'state block',
            'action',
            'decision',
            'validate',
            '.pspec/CONTEXT.md',
            'Refresh PROGRESS.md frontmatter context',
            'Context Freshness',
            'workers must not rely on it as sole truth'
          ],
          forbidden: [
            'parallelizable',
            'token_budget',
            'subagents in parallel',
            '## Worker Instructions',
            '## Orchestrator Flow',
            '## Active Work',
            '## Coverage Map',
            '## Feature Specs',
            '## Definition Of Done',
            '## Steps',
            '## Verification',
            '## Approach',
            'from_allowlist'
          ]
        },
        {
          file: 'pspec.debug.md',
          required: [
            '## Phase 1 - Reproduce',
            'No parallel investigation',
            'If you cannot reproduce',
            'Never claim fixed unless reproduction or regression check passes',
            'state block',
            'failed actions',
            '.pspec/CONTEXT.md'
          ],
          forbidden: [
            'grep_search',
            'Resource Cleanup',
            'spawn one subagent per hypothesis'
          ]
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