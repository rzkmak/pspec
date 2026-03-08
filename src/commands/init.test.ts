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
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mspec-test-init-'));
    process.cwd = () => tmpDir;
    mockPrompt.mockReset();
  });

  afterEach(() => {
    process.cwd = originalCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  const providers = [
    { agent: 'claude', expectedFiles: ['.claude/commands/mspec.spec.md', '.claude/commands/mspec.plan.md', '.claude/commands/mspec.implement.md', '.claude/commands/mspec.debug.md'] },
    { agent: 'gemini', expectedFiles: ['.gemini/commands/mspec.spec.toml', '.gemini/commands/mspec.plan.toml', '.gemini/commands/mspec.implement.toml', '.gemini/commands/mspec.debug.toml'] },
    { agent: 'cursor', expectedFiles: ['.cursor/rules/mspec.spec.mdc', '.cursor/rules/mspec.plan.mdc', '.cursor/rules/mspec.implement.mdc', '.cursor/rules/mspec.debug.mdc'] },
    { agent: 'opencode', expectedFiles: ['.opencode/commands/mspec.spec.md', '.opencode/commands/mspec.plan.md', '.opencode/commands/mspec.implement.md', '.opencode/commands/mspec.debug.md'] },
    { agent: 'zed', expectedFiles: ['.mspec/INSTRUCTIONS.md'] },
    { agent: 'generic', expectedFiles: ['.mspec/INSTRUCTIONS.md'] }
  ];

  providers.forEach(({ agent, expectedFiles }) => {
    it(`should initialize the .mspec environment for ${agent}`, async () => {
      mockPrompt.mockResolvedValueOnce({ agents: [agent] });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await initCommand();

      expect(fs.existsSync(path.join(tmpDir, '.mspec'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.mspec/specs'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.mspec/tasks'))).toBe(true);

      const configPath = path.join(tmpDir, '.mspec/mspec.json');
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

    const configPath = path.join(tmpDir, '.mspec/mspec.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.agents).toEqual(['claude', 'gemini']);

    expect(fs.existsSync(path.join(tmpDir, '.claude/commands/mspec.spec.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.gemini/commands/mspec.spec.toml'))).toBe(true);
  });

  it('should update and prompt even if .mspec directory already exists', async () => {
    const mspecDir = path.join(tmpDir, '.mspec');
    fs.mkdirSync(mspecDir);
    fs.mkdirSync(path.join(mspecDir, 'specs'));
    fs.mkdirSync(path.join(mspecDir, 'tasks'));
    fs.writeFileSync(path.join(mspecDir, 'mspec.json'), JSON.stringify({ agents: ['cursor'] }));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    mockPrompt.mockResolvedValueOnce({ agents: ['cursor', 'gemini'] });

    await initCommand();

    const configPath = path.join(tmpDir, '.mspec/mspec.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.agents).toEqual(['cursor', 'gemini']);
    
    expect(fs.existsSync(path.join(tmpDir, '.cursor/rules/mspec.spec.mdc'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.gemini/commands/mspec.spec.toml'))).toBe(true);
  });

  it('should handle legacy "agent" field and migrate to "agents"', async () => {
    const mspecDir = path.join(tmpDir, '.mspec');
    fs.mkdirSync(mspecDir);
    fs.writeFileSync(path.join(mspecDir, 'mspec.json'), JSON.stringify({ agent: 'claude' }));

    mockPrompt.mockResolvedValueOnce({ agents: ['claude', 'gemini'] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await initCommand();

    const configPath = path.join(tmpDir, '.mspec/mspec.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.agents).toEqual(['claude', 'gemini']);
    expect(config.agent).toBeUndefined();
  });

  it('should support running init multiple times to add/remove agents', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // 1st init: Select 'claude'
    mockPrompt.mockResolvedValueOnce({ agents: ['claude'] });
    await initCommand();
    
    let config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mspec/mspec.json'), 'utf-8'));
    expect(config.agents).toEqual(['claude']);
    expect(fs.existsSync(path.join(tmpDir, '.claude/commands/mspec.spec.md'))).toBe(true);

    // 2nd init: Add 'gemini', 'claude' should be pre-selected (enabled: true)
    mockPrompt.mockResolvedValueOnce({ agents: ['claude', 'gemini'] });
    await initCommand();

    // Verify prompt was called with 'claude' enabled
    expect(mockPrompt).toHaveBeenLastCalledWith(expect.objectContaining({
      choices: expect.arrayContaining([
        expect.objectContaining({ name: 'claude', enabled: true }),
        expect.objectContaining({ name: 'gemini', enabled: false })
      ])
    }));

    config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mspec/mspec.json'), 'utf-8'));
    expect(config.agents).toEqual(['claude', 'gemini']);
    expect(fs.existsSync(path.join(tmpDir, '.gemini/commands/mspec.spec.toml'))).toBe(true);

    // 3rd init: Remove 'claude', keep 'gemini'
    mockPrompt.mockResolvedValueOnce({ agents: ['gemini'] });
    await initCommand();

    config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mspec/mspec.json'), 'utf-8'));
    expect(config.agents).toEqual(['gemini']);
    // Note: mspec currently doesn't delete files of removed agents, which is fine for now
  });

  it('should handle prompt cancellation gracefully', async () => {
    mockPrompt.mockRejectedValueOnce(new Error('User cancelled'));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initialization cancelled.'));
    expect(fs.existsSync(path.join(tmpDir, '.mspec'))).toBe(false);
  });
  
  it('should handle missing template gracefully', async () => {
    mockPrompt.mockResolvedValueOnce({ agents: ['unknown-agent'] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();
    
    const configPath = path.join(tmpDir, '.mspec/mspec.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.agents).toContain('unknown-agent');
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No specific integration template found'));
  });
});
