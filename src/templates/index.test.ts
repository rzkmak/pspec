import { getTemplates, templates } from './index';

const wordCount = (text: string) => text.trim().split(/\s+/).length;

describe('templates', () => {
  it('should have templates for all supported agents', () => {
    const agents = ['claude', 'gemini', 'cursor', 'opencode', 'roo', 'kilo'];
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
      const commitTemplate = claudeTemplates.find(t => t.file === 'pspec.commit-raise-pr.md');
      
      expect(specTemplate).toBeDefined();
      expect(specTemplate?.dir).toBe('.claude/commands');
      expect(specTemplate?.content).toContain('---');
      expect(specTemplate?.content).toContain('description: "Start an inquiry to create a new spec"');
      expect(specTemplate?.content).toContain('You are an AI Spec Architect using the pspec framework.');

      expect(commitTemplate).toBeDefined();
      expect(commitTemplate?.content).toContain('description: "Commit current work on a new branch and open a PR"');
      expect(commitTemplate?.content).toContain('You are a Git workflow assistant using the pspec framework.');
    });
  });

  describe('gemini templates', () => {
    it('should be correctly formatted as toml', () => {
      const geminiTemplates = getTemplates('gemini');
      const planTemplate = geminiTemplates.find(t => t.file === 'pspec.plan.toml');
      const currentBranchTemplate = geminiTemplates.find(t => t.file === 'pspec.commit-current-branch.toml');
      
      expect(planTemplate).toBeDefined();
      expect(planTemplate?.dir).toBe('.gemini/commands');
      expect(planTemplate?.content).toContain('description = "Plan tasks for an existing spec"');
      expect(planTemplate?.content).toContain('prompt = """');
      expect(planTemplate?.content).toContain('You are an AI Technical Lead using the pspec framework.');

      expect(currentBranchTemplate).toBeDefined();
      expect(currentBranchTemplate?.content).toContain('description = "Commit current work on the current branch and push"');
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
      expect(implementTemplate?.content).toContain('You are a Senior Software Engineer using the pspec framework.');

      expect(implementCommandTemplate).toBeDefined();
      expect(implementCommandTemplate?.dir).toBe('.cursor/commands');
      expect(implementCommandTemplate?.content).toContain('description: "Implement tasks from a checklist"');
      expect(implementCommandTemplate?.content).toContain('You are a Senior Software Engineer using the pspec framework.');

      expect(cursorTemplates.some(t => t.file === 'pspec.commit-raise-pr.mdc')).toBe(true);
      expect(cursorTemplates.some(t => t.file === 'pspec.commit-current-branch.md')).toBe(true);
    });
  });

  describe('debug templates', () => {
    it('should be correctly formatted as a debugging tool', () => {
      const geminiTemplates = getTemplates('gemini');
      const debugTemplate = geminiTemplates.find(t => t.file === 'pspec.debug.toml');
      
      expect(debugTemplate).toBeDefined();
      expect(debugTemplate?.content).toContain('description = "Investigate and resolve errors in the project"');
      expect(debugTemplate?.content).toContain('You are an AI Debugging Expert using the pspec framework.');
    });
  });

  describe('getTemplates', () => {
    it('should return an empty array for unknown agents', () => {
      expect(getTemplates('unknown')).toEqual([]);
    });

    it('should return the correct templates for a known agent', () => {
      const t = getTemplates('opencode');
      expect(t.length).toBe(6);
      expect(t[0].file).toBe('pspec.commit-current-branch.md');
      expect(t[0].content).toContain('Git workflow assistant');
    });

    it('should return both rule and command templates for cursor', () => {
      const t = getTemplates('cursor');
      expect(t.length).toBe(12);
      const dirs = t.map(template => template.dir);
      expect(dirs).toContain('.cursor/rules');
      expect(dirs).toContain('.cursor/commands');
    });

    it('should keep command prompts compact and direct-first', () => {
      const templates = getTemplates('opencode');
      const specs = [
        {
          file: 'pspec.commit-current-branch.md',
          maxWords: 210,
          required: ['Commit the current work on the current branch now.', 'Stay on the current branch.', 'Stage all safe tracked and untracked files before committing.', 'push with upstream tracking', 'Use `gh` CLI for every GitHub operation in pspec.'],
          forbidden: ['Do you want me to', 'Commit staged files only.', 'When asked to /pspec.commit-current-branch']
        },
        {
          file: 'pspec.commit-raise-pr.md',
          maxWords: 240,
          required: ['Package the current work into a new branch and open a PR now.', 'Use `gh` CLI for every GitHub operation in pspec', 'Create a new branch from the current HEAD before committing.', 'Infer a concise kebab-case branch name', 'Stage all safe tracked and untracked files before committing.', 'Create a PR against the detected default branch'],
          forbidden: ['Commit staged files only.', 'ask for permission before pushing', 'When asked to /pspec.commit-raise-pr']
        },
        {
          file: 'pspec.spec.md',
          maxWords: 280,
          required: ['Draft immediately when the request is concrete.', 'Ask 0-3 targeted questions only when ambiguity would materially change the spec.', '<epoch-ms>-<slug>.md', 'copy-pasteable command with that stem'],
          forbidden: ['3 to 7', 'Approval Gate 1', 'Resource Cleanup']
        },
        {
          file: 'pspec.plan.md',
          maxWords: 380,
          required: ['Default to one planning pass.', 'reuse its `<epoch-ms>-<slug>` stem', 'copy-pasteable command using that exact stem'],
          forbidden: ['Spawn a `test_planner` agent', 'Resource Cleanup']
        },
        {
          file: 'pspec.implement.md',
          maxWords: 380,
          required: ['Default to direct execution.', 'AGENTS.md` or `CLAUDE.md`', 'Verify by risk, not by checkbox:', 'same `<epoch-ms>-<slug>` stem'],
          forbidden: ['DO NOT read the task file details yourself', 'Run `build`, `test`, and `lint` for every task']
        },
        {
          file: 'pspec.debug.md',
          maxWords: 320,
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
