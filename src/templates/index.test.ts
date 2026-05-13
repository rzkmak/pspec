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

    it('should include subagent files', () => {
      const claudeTemplates = getTemplates('claude');
      const subagentDirs = claudeTemplates.filter(t => t.dir === '.claude/agents');
      expect(subagentDirs.length).toBe(4);
      
      const pmAgent = claudeTemplates.find(t => t.file === 'pspec-pm.md');
      expect(pmAgent).toBeDefined();
      expect(pmAgent?.dir).toBe('.claude/agents');
      expect(pmAgent?.content).toContain('name: pspec-pm');
      expect(pmAgent?.content).toContain('AI Product Manager');
      expect(pmAgent?.content).toContain('description:');
      
      const tlAgent = claudeTemplates.find(t => t.file === 'pspec-tl.md');
      expect(tlAgent).toBeDefined();
      expect(tlAgent?.content).toContain('name: pspec-tl');
      expect(tlAgent?.content).toContain('AI Technical Lead');
      
      const sweAgent = claudeTemplates.find(t => t.file === 'pspec-swe.md');
      expect(sweAgent).toBeDefined();
      expect(sweAgent?.content).toContain('name: pspec-swe');
      expect(sweAgent?.content).toContain('Senior Software Engineer');
      
      const qaAgent = claudeTemplates.find(t => t.file === 'pspec-qa.md');
      expect(qaAgent).toBeDefined();
      expect(qaAgent?.content).toContain('name: pspec-qa');
      expect(qaAgent?.content).toContain('AI Planning Auditor');
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

    it('should include subagent files with kind local', () => {
      const geminiTemplates = getTemplates('gemini');
      const pmAgent = geminiTemplates.find(t => t.file === 'pspec-pm.md' && t.dir === '.gemini/agents');
      expect(pmAgent).toBeDefined();
      expect(pmAgent?.content).toContain('name: pspec-pm');
      expect(pmAgent?.content).toContain('kind: local');
      expect(pmAgent?.content).toContain('tools:');
      expect(pmAgent?.content).toContain('AI Product Manager');
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

    it('should include subagent files with name and description', () => {
      const cursorTemplates = getTemplates('cursor');
      const sweAgent = cursorTemplates.find(t => t.file === 'pspec-swe.md' && t.dir === '.cursor/agents');
      expect(sweAgent).toBeDefined();
      expect(sweAgent?.content).toContain('name: pspec-swe');
      expect(sweAgent?.content).toContain('Senior Software Engineer');
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

    it('should not include subagent files', () => {
      const antigravityTemplates = getTemplates('antigravity');
      const agentDirs = antigravityTemplates.filter(t => t.dir === '.agent/agents');
      expect(agentDirs.length).toBe(0);
    });
  });

  describe('kilo templates', () => {
    it('should include subagent files with mode subagent', () => {
      const kiloTemplates = getTemplates('kilo');
      const sweAgent = kiloTemplates.find(t => t.file === 'pspec-swe.md' && t.dir === '.kilo/agents');
      expect(sweAgent).toBeDefined();
      expect(sweAgent?.content).toContain('mode: subagent');
      expect(sweAgent?.content).toContain('Senior Software Engineer');
    });
  });

  describe('getTemplates', () => {
    it('should return an empty array for unknown agents', () => {
      expect(getTemplates('unknown')).toEqual([]);
    });

    it('should return the correct template count for each agent', () => {
      expect(getTemplates('opencode').length).toBe(9);
      expect(getTemplates('claude').length).toBe(9);
      expect(getTemplates('gemini').length).toBe(9);
      expect(getTemplates('cursor').length).toBe(14);
      expect(getTemplates('antigravity').length).toBe(6);
      expect(getTemplates('kilo').length).toBe(9);
    });

    it('should return both rule and command templates for cursor', () => {
      const t = getTemplates('cursor');
      const dirs = t.map(template => template.dir);
      expect(dirs).toContain('.cursor/rules');
      expect(dirs).toContain('.cursor/commands');
      expect(dirs).toContain('.cursor/agents');
    });

    it('should include subagent templates with correct directories for each agent', () => {
      const agentDirs: Record<string, string> = {
        opencode: '.opencode/agents',
        claude: '.claude/agents',
        gemini: '.gemini/agents',
        cursor: '.cursor/agents',
        kilo: '.kilo/agents'
      };

      Object.entries(agentDirs).forEach(([agent, expectedDir]) => {
        const t = getTemplates(agent);
        const agentTemplates = t.filter(temp => temp.dir === expectedDir);
        expect(agentTemplates.length).toBe(4);
        const ids = agentTemplates.map(a => a.file);
        expect(ids).toContain('pspec-pm.md');
        expect(ids).toContain('pspec-tl.md');
        expect(ids).toContain('pspec-swe.md');
        expect(ids).toContain('pspec-qa.md');
      });
    });

    it('should generate subagents with persona-only prompts', () => {
      const opencodeTemplates = getTemplates('opencode');
      const processTerms = ['## Phase', '## Worker Protocol', 'W1 - Load', 'Checkpointing', 'Return Contract'];

      const pmAgent = opencodeTemplates.find(t => t.file === 'pspec-pm.md' && t.dir === '.opencode/agents');
      expect(pmAgent).toBeDefined();
      expect(pmAgent?.content).toContain('AI Product Manager');
      expect(pmAgent?.content).toContain('user outcomes');
      expect(pmAgent?.content).toContain('acceptance criteria');

      const tlAgent = opencodeTemplates.find(t => t.file === 'pspec-tl.md' && t.dir === '.opencode/agents');
      expect(tlAgent).toBeDefined();
      expect(tlAgent?.content).toContain('AI Technical Lead');
      expect(tlAgent?.content).toContain('system boundaries');
      expect(tlAgent?.content).toContain('contracts');

      const sweAgent = opencodeTemplates.find(t => t.file === 'pspec-swe.md' && t.dir === '.opencode/agents');
      expect(sweAgent).toBeDefined();
      expect(sweAgent?.content).toContain('Senior Software Engineer');
      expect(sweAgent?.content).toContain('small correct changes');
      expect(sweAgent?.content).toContain('behavioral regressions');

      const qaAgent = opencodeTemplates.find(t => t.file === 'pspec-qa.md' && t.dir === '.opencode/agents');
      expect(qaAgent).toBeDefined();
      expect(qaAgent?.content).toContain('AI Planning Auditor');
      expect(qaAgent?.content).toContain('requirement coverage');
      expect(qaAgent?.content).toContain('stale references');

      [pmAgent, tlAgent, sweAgent, qaAgent].forEach(agent => {
        processTerms.forEach(term => expect(agent?.content).not.toContain(term));
      });
    });

    it('should generate opencode subagents with mode subagent', () => {
      const opencodeTemplates = getTemplates('opencode');
      const subagents = opencodeTemplates.filter(t => t.dir === '.opencode/agents');
      subagents.forEach(sa => {
        expect(sa.content).toContain('mode: subagent');
        expect(sa.content).toContain('description:');
      });
    });

    it('should keep command prompts workflow-aligned', () => {
      const templates = getTemplates('claude');
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
            'primary source of truth',
            '@pspec-pm'
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
            'Merge `.pspec/CONTEXT.md`',
            'evidence',
            '@pspec-tl'
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
            'refresh PROGRESS.md frontmatter context',
            'PRD change detection',
            'unmapped requirement',
            'at least one spec',
            'stale requirement references',
            'create new pending specs',
            '@pspec-qa'
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
            'workers must not rely on it as sole truth',
            'Fail-Closed Rules',
            'done-to-validate',
            'state.evidence',
            'skipped-with-reason',
            'batch-fix',
            'no evidence',
            'Files table and Contracts section',
            'Attestation before done',
            'Never mark a Done item or a validate as passed unless you executed it and captured evidence',
            'Never check a Done item if no mapped validate',
            '### Checkpointing',
            '### Return Contract',
            'phase_reached',
            'context limit',
            're-dispatch',
            'resume directive',
            'partial with saved state is better than empty',
            'protocol violation',
            'Returning without persisting state',
            'No direct implementation',
            'MUST NOT write product code',
            'MUST NOT fall back to implementing the spec directly until 3 dispatches',
            'After 3 failed dispatches',
            'read @pspec-swe',
            '@pspec-swe'
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
            '.pspec/CONTEXT.md',
            '@pspec-swe'
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
