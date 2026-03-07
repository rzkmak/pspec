import fs from 'fs';
import path from 'path';
import os from 'os';
import { planCommand } from './plan';

describe('planCommand', () => {
  let originalCwd: () => string;
  let tmpDir: string;
  let mockExit: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;

  beforeAll(() => {
    originalCwd = process.cwd;
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mspec-test-plan-'));
    process.cwd = () => tmpDir;
    
    mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.cwd = originalCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('should reject path traversal in spec name', async () => {
    await planCommand('../outside-spec');
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Invalid spec name'));
  });

  it('should reject absolute paths in spec name', async () => {
    await planCommand('/etc/passwd');
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Invalid spec name'));
  });

  it('should exit with error if spec file does not exist', async () => {
    await planCommand('missing-spec');
    
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error: Spec file not found'));
  });

  it('should skip generation if tasks file already exists', async () => {
    const specsDir = path.join(tmpDir, '.mspec', 'specs');
    const tasksDir = path.join(tmpDir, '.mspec', 'tasks');
    fs.mkdirSync(specsDir, { recursive: true });
    fs.mkdirSync(tasksDir, { recursive: true });
    
    fs.writeFileSync(path.join(specsDir, 'test-spec.md'), '# Spec');
    fs.writeFileSync(path.join(tasksDir, 'test-spec.tasks.md'), '# Existing Tasks');

    await planCommand('test-spec');

    expect(mockExit).not.toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Warning: Tasks file already exists'));
    
    const content = fs.readFileSync(path.join(tasksDir, 'test-spec.tasks.md'), 'utf-8');
    expect(content).toBe('# Existing Tasks');
  });

  it('should scaffold boilerplate if spec exists and tasks do not', async () => {
    const specsDir = path.join(tmpDir, '.mspec', 'specs');
    fs.mkdirSync(specsDir, { recursive: true });
    fs.writeFileSync(path.join(specsDir, 'test-spec.md'), '# Spec');

    await planCommand('test-spec');

    expect(mockExit).not.toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Success: Scaffolded tasks file'));

    const tasksPath = path.join(tmpDir, '.mspec', 'tasks', 'test-spec.tasks.md');
    expect(fs.existsSync(tasksPath)).toBe(true);
  });

  it('should support nested spec names like feature/001-auth', async () => {
    const specsDir = path.join(tmpDir, '.mspec', 'specs', 'feature');
    fs.mkdirSync(specsDir, { recursive: true });
    fs.writeFileSync(path.join(specsDir, '001-auth.md'), '# Spec');

    await planCommand('feature/001-auth');

    expect(mockExit).not.toHaveBeenCalled();
    const tasksPath = path.join(tmpDir, '.mspec', 'tasks', 'feature', '001-auth.tasks.md');
    expect(fs.existsSync(tasksPath)).toBe(true);
  });
});
