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
    { agent: 'claude', expectedFiles: ['.claude/commands/mspec.spec.md', '.claude/commands/mspec.plan.md', '.claude/commands/mspec.implement.md'] },
    { agent: 'gemini', expectedFiles: ['.gemini/commands/mspec.spec.toml', '.gemini/commands/mspec.plan.toml', '.gemini/commands/mspec.implement.toml'] },
    { agent: 'cursor', expectedFiles: ['.cursor/rules/mspec.spec.mdc', '.cursor/rules/mspec.plan.mdc', '.cursor/rules/mspec.implement.mdc'] },
    { agent: 'opencode', expectedFiles: ['.opencode/commands/mspec.spec.md', '.opencode/commands/mspec.plan.md', '.opencode/commands/mspec.implement.md'] },
    { agent: 'zed', expectedFiles: ['.mspec/INSTRUCTIONS.md'] },
    { agent: 'generic', expectedFiles: ['.mspec/INSTRUCTIONS.md'] }
  ];

  providers.forEach(({ agent, expectedFiles }) => {
    it(`should initialize the .mspec environment for ${agent}`, async () => {
      mockPrompt.mockResolvedValueOnce({ agent });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await initCommand();

      expect(fs.existsSync(path.join(tmpDir, '.mspec'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.mspec/specs'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.mspec/tasks'))).toBe(true);

      const configPath = path.join(tmpDir, '.mspec/mspec.json');
      expect(fs.existsSync(configPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.agent).toBe(agent);

      for (const expectedFile of expectedFiles) {
        const integrationPath = path.join(tmpDir, expectedFile);
        expect(fs.existsSync(integrationPath)).toBe(true);
      }
    });
  });

  it('should skip initialization if .mspec directory already exists', async () => {
    const mspecDir = path.join(tmpDir, '.mspec');
    fs.mkdirSync(mspecDir);

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await initCommand();

    expect(fs.existsSync(path.join(mspecDir, 'specs'))).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initialization skipped.'));
  });

  it('should handle prompt cancellation gracefully', async () => {
    mockPrompt.mockRejectedValueOnce(new Error('User cancelled'));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initialization cancelled.'));
    expect(fs.existsSync(path.join(tmpDir, '.mspec'))).toBe(false);
  });
  
  it('should handle missing template gracefully', async () => {
    mockPrompt.mockResolvedValueOnce({ agent: 'unknown-agent' });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await initCommand();
    
    const configPath = path.join(tmpDir, '.mspec/mspec.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config.agent).toBe('unknown-agent');
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No specific integration template found'));
  });
});
