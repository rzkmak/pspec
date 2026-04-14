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
    { agent: 'opencode', expectedFiles: ['.opencode/commands/pspec.commit-current-branch.md', '.opencode/commands/pspec.commit-raise-pr.md', '.opencode/commands/pspec.spec.md', '.opencode/commands/pspec.plan.md', '.opencode/commands/pspec.implement.md', '.opencode/commands/pspec.debug.md'] },
    { agent: 'roo', expectedFiles: ['.roo/commands/pspec.commit-current-branch.md', '.roo/commands/pspec.commit-raise-pr.md', '.roo/commands/pspec.spec.md', '.roo/commands/pspec.plan.md', '.roo/commands/pspec.implement.md', '.roo/commands/pspec.debug.md'] },
    { agent: 'kilo', expectedFiles: ['.kilo/commands/pspec.commit-current-branch.md', '.kilo/commands/pspec.commit-raise-pr.md', '.kilo/commands/pspec.spec.md', '.kilo/commands/pspec.plan.md', '.kilo/commands/pspec.implement.md', '.kilo/commands/pspec.debug.md'] }
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
    mockPrompt.mockResolvedValueOnce({ agents: ['claude', 'gemini'] });
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
    mockPrompt.mockResolvedValueOnce({ agents: ['gemini'] });
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
