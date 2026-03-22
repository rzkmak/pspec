import fs from 'fs';
import path from 'path';
import os from 'os';
import { initCommand } from './init';

const mockPrompt = jest.fn();
jest.mock('enquirer', () => ({
  prompt: (...args: any[]) => mockPrompt(...args)
}));

describe('initCommand', () => {
  let originalCwd: () => string;
  let tmpDir: string;

  beforeAll(() => {
    originalCwd = process.cwd;
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pspec-test-init-'));
    process.cwd = () => tmpDir;
    mockPrompt.mockReset();
  });

  afterEach(() => {
    process.cwd = originalCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  const providers = [
    { agent: 'claude', expectedFiles: ['.claude/commands/pspec.commit-current-branch.md', '.claude/commands/pspec.commit-raise-pr.md', '.claude/commands/pspec.spec.md', '.claude/commands/pspec.plan.md', '.claude/commands/pspec.implement.md', '.claude/commands/pspec.debug.md'] },
    { agent: 'gemini', expectedFiles: ['.gemini/commands/pspec.commit-current-branch.toml', '.gemini/commands/pspec.commit-raise-pr.toml', '.gemini/commands/pspec.spec.toml', '.gemini/commands/pspec.plan.toml', '.gemini/commands/pspec.implement.toml', '.gemini/commands/pspec.debug.toml'] },
    {
      agent: 'cursor',
      expectedFiles: [
        '.cursor/rules/pspec.commit-current-branch.mdc',
        '.cursor/rules/pspec.commit-raise-pr.mdc',
        '.cursor/rules/pspec.spec.mdc',
        '.cursor/rules/pspec.plan.mdc',
        '.cursor/rules/pspec.implement.mdc',
        '.cursor/rules/pspec.debug.mdc',
        '.cursor/commands/pspec.commit-current-branch.md',
        '.cursor/commands/pspec.commit-raise-pr.md',
        '.cursor/commands/pspec.spec.md',
        '.cursor/commands/pspec.plan.md',
        '.cursor/commands/pspec.implement.md',
        '.cursor/commands/pspec.debug.md'
      ]
    },
    { agent: 'opencode', expectedFiles: ['.opencode/commands/pspec.commit-current-branch.md', '.opencode/commands/pspec.commit-raise-pr.md', '.opencode/commands/pspec.spec.md', '.opencode/commands/pspec.plan.md', '.opencode/commands/pspec.implement.md', '.opencode/commands/pspec.debug.md'] }
  ];

  providers.forEach(({ agent, expectedFiles }) => {
    it(`should initialize the .pspec environment for ${agent}`, async () => {
      mockPrompt.mockResolvedValueOnce({ agents: [agent] });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await initCommand();

      expect(fs.existsSync(path.join(tmpDir, '.pspec'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.pspec/specs'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.pspec/tasks'))).toBe(true);

      const configPath = path.join(tmpDir, '.pspec/pspec.json');
      expect(fs.existsSync(configPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.agents).toContain(agent);

      for (const expectedFile of expectedFiles) {
        const integrationPath = path.join(tmpDir, expectedFile);
        expect(fs.existsSync(integrationPath)).toBe(true);
      }
    });
  });

  it('should initialize multiple agents at once', async () => {
    mockPrompt.mockResolvedValueOnce({ agents: ['claude', 'gemini'] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();

    const configPath = path.join(tmpDir, '.pspec/pspec.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.agents).toEqual(['claude', 'gemini']);

    expect(fs.existsSync(path.join(tmpDir, '.claude/commands/pspec.spec.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.gemini/commands/pspec.spec.toml'))).toBe(true);
  });

  it('should update and prompt even if .pspec directory already exists', async () => {
    const pspecDir = path.join(tmpDir, '.pspec');
    fs.mkdirSync(pspecDir);
    fs.mkdirSync(path.join(pspecDir, 'specs'));
    fs.mkdirSync(path.join(pspecDir, 'tasks'));
    fs.writeFileSync(path.join(pspecDir, 'pspec.json'), JSON.stringify({ agents: ['cursor'] }));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    mockPrompt.mockResolvedValueOnce({ agents: ['cursor', 'gemini'] });

    await initCommand();

    const configPath = path.join(tmpDir, '.pspec/pspec.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.agents).toEqual(['cursor', 'gemini']);
    
    expect(fs.existsSync(path.join(tmpDir, '.cursor/rules/pspec.spec.mdc'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.gemini/commands/pspec.spec.toml'))).toBe(true);
  });

  it('should handle legacy "agent" field and migrate to "agents"', async () => {
    const pspecDir = path.join(tmpDir, '.pspec');
    fs.mkdirSync(pspecDir);
    fs.writeFileSync(path.join(pspecDir, 'pspec.json'), JSON.stringify({ agent: 'claude' }));

    mockPrompt.mockResolvedValueOnce({ agents: ['claude', 'gemini'] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await initCommand();

    const configPath = path.join(tmpDir, '.pspec/pspec.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.agents).toEqual(['claude', 'gemini']);
    expect(config.agent).toBeUndefined();
  });

  it('should support running init multiple times to add/remove agents', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // 1st init: Select 'claude'
    mockPrompt.mockResolvedValueOnce({ agents: ['claude'] });
    await initCommand();
    
    let config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.pspec/pspec.json'), 'utf-8'));
    expect(config.agents).toEqual(['claude']);
    expect(fs.existsSync(path.join(tmpDir, '.claude/commands/pspec.spec.md'))).toBe(true);

    // 2nd init: Add 'gemini', 'claude' should be pre-selected (enabled: true)
    // Also need to mock overwrite prompts for existing claude agent files
    mockPrompt
      .mockResolvedValueOnce({ agents: ['claude', 'gemini'] })
      .mockResolvedValueOnce({ action: 'overwrite' });
    await initCommand();

    // Verify prompt was called with 'claude' enabled (check all calls for the agents selection)
    const agentSelectionCalls = mockPrompt.mock.calls.filter(
      call => call[0].name === 'agents'
    );
    expect(agentSelectionCalls.length).toBeGreaterThanOrEqual(2);
    
    // The second agents selection should have claude enabled and gemini not enabled
    const secondAgentCall = agentSelectionCalls[1];
    expect(secondAgentCall[0].choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'claude', enabled: true }),
        expect.objectContaining({ name: 'gemini', enabled: false })
      ])
    );

    config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.pspec/pspec.json'), 'utf-8'));
    expect(config.agents).toEqual(['claude', 'gemini']);
    expect(fs.existsSync(path.join(tmpDir, '.gemini/commands/pspec.spec.toml'))).toBe(true);

    // 3rd init: Remove 'claude', keep 'gemini'
    // Need to mock overwrite prompts for existing gemini agent files
    mockPrompt
      .mockResolvedValueOnce({ agents: ['gemini'] })
      .mockResolvedValueOnce({ action: 'overwrite' });
    await initCommand();

    config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.pspec/pspec.json'), 'utf-8'));
    expect(config.agents).toEqual(['gemini']);
    // Note: pspec currently doesn't delete files of removed agents, which is fine for now
  });

  it('should handle prompt cancellation gracefully', async () => {
    mockPrompt.mockRejectedValueOnce(new Error('User cancelled'));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initialization cancelled.'));
    expect(fs.existsSync(path.join(tmpDir, '.pspec'))).toBe(false);
  });
  
});

describe('initCommand agent files', () => {
  let originalCwd: () => string;
  let tmpDir: string;

  beforeAll(() => {
    originalCwd = process.cwd;
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pspec-test-agents-'));
    process.cwd = () => tmpDir;
    mockPrompt.mockReset();
  });

  afterEach(() => {
    process.cwd = originalCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('should create agent definition files for claude', async () => {
    mockPrompt.mockResolvedValueOnce({ agents: ['claude'] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();

    // Check that agent files were created
    expect(fs.existsSync(path.join(tmpDir, '.claude/agents/architect.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/agents/debugger.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/agents/task_planner.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/agents/generalist.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/agents/investigator.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/agents/implementator.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/agents/test_planner.md'))).toBe(true);

    // Verify content
    const architectContent = fs.readFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'utf-8');
    expect(architectContent).toContain('name: architect');
    expect(architectContent).toContain('## Capabilities');
    expect(architectContent).toContain('## Tools');
    expect(architectContent).toContain('## Constraints');
    expect(architectContent).toContain('## Decision Rules');
    expect(architectContent).toContain('## Execution Notes');
  });

  it('should create agent definition files for gemini', async () => {
    mockPrompt.mockResolvedValueOnce({ agents: ['gemini'] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();

    expect(fs.existsSync(path.join(tmpDir, '.gemini/agents/architect.toml'))).toBe(true);
    
    const architectContent = fs.readFileSync(path.join(tmpDir, '.gemini/agents/architect.toml'), 'utf-8');
    expect(architectContent).toContain('name = "architect"');
    expect(architectContent).toContain('[tools]');
    expect(architectContent).toContain('[communication]');
    expect(architectContent).toContain('prompt = """');
  });

  it('should create agent definition files for cursor', async () => {
    mockPrompt.mockResolvedValueOnce({ agents: ['cursor'] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();

    expect(fs.existsSync(path.join(tmpDir, '.cursor/agents/architect.mdc'))).toBe(true);
    
    const architectContent = fs.readFileSync(path.join(tmpDir, '.cursor/agents/architect.mdc'), 'utf-8');
    expect(architectContent).toContain('globs: "*"');
    expect(architectContent).toContain('name: architect');
  });

  it('should ask user when agent files already exist', async () => {
    // Create existing agent files
    fs.mkdirSync(path.join(tmpDir, '.claude/agents'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'custom content');
    
    // First prompt: select agents, second prompt: overwrite choice
    mockPrompt
      .mockResolvedValueOnce({ agents: ['claude'] })
      .mockResolvedValueOnce({ action: 'overwrite' });
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();

    // Should have overwritten
    const architectContent = fs.readFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'utf-8');
    expect(architectContent).toContain('name: architect');
    expect(architectContent).not.toContain('custom content');
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Existing agent files found'));
  });

  it('should preserve existing agent files when user chooses preserve', async () => {
    // Create existing agent files
    fs.mkdirSync(path.join(tmpDir, '.claude/agents'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'custom content');
    
    // First prompt: select agents, second prompt: preserve choice
    mockPrompt
      .mockResolvedValueOnce({ agents: ['claude'] })
      .mockResolvedValueOnce({ action: 'preserve' });
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();

    // Should have preserved
    const architectContent = fs.readFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'utf-8');
    expect(architectContent).toBe('custom content');
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Preserving existing agent file'));
  });

  it('should fail entirely when agent deployment fails', async () => {
    mockPrompt.mockResolvedValueOnce({ agents: ['claude'] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock fs.writeFileSync to throw error
    const originalWriteFile = fs.writeFileSync;
    fs.writeFileSync = jest.fn(() => {
      throw new Error('Permission denied');
    }) as any;
    
    await expect(initCommand()).rejects.toThrow('Permission denied');
    
    fs.writeFileSync = originalWriteFile;
  });

  describe('edge cases', () => {
    it('should handle user cancellation during overwrite/preserve prompt', async () => {
      // Create existing agent files
      fs.mkdirSync(path.join(tmpDir, '.claude/agents'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'custom content');
      
      // First prompt: select agents, second prompt: user cancels
      mockPrompt
        .mockResolvedValueOnce({ agents: ['claude'] })
        .mockRejectedValueOnce(new Error('User cancelled'));
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await expect(initCommand()).rejects.toThrow('Agent deployment cancelled by user');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Agent deployment cancelled'));
    });

    it('should handle missing agent definition directory creation', async () => {
      mockPrompt.mockResolvedValueOnce({ agents: ['claude'] });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await initCommand();

      // Verify all agent directories were created
      expect(fs.existsSync(path.join(tmpDir, '.claude/agents'))).toBe(true);
      
      // Should have created all 7 agent files
      const agentFiles = fs.readdirSync(path.join(tmpDir, '.claude/agents'));
      expect(agentFiles.length).toBe(7);
      expect(agentFiles).toContain('architect.md');
      expect(agentFiles).toContain('task_planner.md');
      expect(agentFiles).toContain('generalist.md');
      expect(agentFiles).toContain('investigator.md');
      expect(agentFiles).toContain('debugger.md');
      expect(agentFiles).toContain('implementator.md');
      expect(agentFiles).toContain('test_planner.md');
    });

    it('should handle mixed existing and new agent files', async () => {
      // Create only some existing agent files
      fs.mkdirSync(path.join(tmpDir, '.claude/agents'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'custom architect');
      fs.writeFileSync(path.join(tmpDir, '.claude/agents/debugger.md'), 'custom debugger');
      // Other 5 agents don't exist yet
      
      mockPrompt
        .mockResolvedValueOnce({ agents: ['claude'] })
        .mockResolvedValueOnce({ action: 'preserve' });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await initCommand();

      // Should preserve existing
      const architectContent = fs.readFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'utf-8');
      expect(architectContent).toBe('custom architect');
      
      const debuggerContent = fs.readFileSync(path.join(tmpDir, '.claude/agents/debugger.md'), 'utf-8');
      expect(debuggerContent).toBe('custom debugger');
      
      // Should create new ones
      const generalistContent = fs.readFileSync(path.join(tmpDir, '.claude/agents/generalist.md'), 'utf-8');
      expect(generalistContent).toContain('name: generalist');
    });

    it('should handle multiple agents with different file locations', async () => {
      mockPrompt.mockResolvedValueOnce({ agents: ['claude', 'gemini'] });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await initCommand();

      // Claude agents
      expect(fs.existsSync(path.join(tmpDir, '.claude/agents/architect.md'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.claude/agents/debugger.md'))).toBe(true);
      
      // Gemini agents
      expect(fs.existsSync(path.join(tmpDir, '.gemini/agents/architect.toml'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.gemini/agents/debugger.toml'))).toBe(true);
      
      // Verify formats are different
      const claudeContent = fs.readFileSync(path.join(tmpDir, '.claude/agents/architect.md'), 'utf-8');
      const geminiContent = fs.readFileSync(path.join(tmpDir, '.gemini/agents/architect.toml'), 'utf-8');
      
      expect(claudeContent).toContain('name: architect');
      expect(geminiContent).toContain('name = "architect"');
    });

    it('should handle empty directories correctly', async () => {
      // Pre-create empty directories
      fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, '.claude/agents'), { recursive: true });
      
      mockPrompt.mockResolvedValueOnce({ agents: ['claude'] });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await initCommand();

      // Should still create all agent files
      const agentFiles = fs.readdirSync(path.join(tmpDir, '.claude/agents'));
      expect(agentFiles.length).toBe(7);
    });

  });
});
