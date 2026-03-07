import fs from 'fs';
import path from 'path';
import os from 'os';
import { implementCommand } from './implement';

describe('implementCommand', () => {
  let originalCwd: () => string;
  let tmpDir: string;
  let mockExit: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockConsoleLog: jest.SpyInstance;

  beforeAll(() => {
    originalCwd = process.cwd;
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mspec-test-implement-'));
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
    await implementCommand('../outside-spec', {});
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Invalid spec name'));
  });

  it('should reject absolute paths in spec name', async () => {
    await implementCommand('/etc/passwd', {});
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Invalid spec name'));
  });

  it('should exit with error if tasks file does not exist', async () => {
    await implementCommand('missing-spec', {});
    
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error: Tasks file not found'));
  });

  it('should warn if no incomplete tasks are found', async () => {
    const tasksDir = path.join(tmpDir, '.mspec', 'tasks');
    fs.mkdirSync(tasksDir, { recursive: true });
    
    fs.writeFileSync(path.join(tasksDir, 'done-spec.tasks.md'), '- [x] task 1\n- [x] task 2');

    await implementCommand('done-spec', {});

    expect(mockExit).not.toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Warning: No incomplete tasks found'));
  });

  it('should handle empty task files gracefully', async () => {
    const tasksDir = path.join(tmpDir, '.mspec', 'tasks');
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(path.join(tasksDir, 'empty.tasks.md'), '');

    await implementCommand('empty', {});

    expect(mockExit).not.toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Warning: No incomplete tasks found'));
  });

  it('should generate one-by-one execution prompt by default', async () => {
    const tasksDir = path.join(tmpDir, '.mspec', 'tasks');
    fs.mkdirSync(tasksDir, { recursive: true });
    
    fs.writeFileSync(path.join(tasksDir, 'active-spec.tasks.md'), '- [x] task 1\n- [ ] task 2');

    await implementCommand('active-spec', {});

    expect(mockExit).not.toHaveBeenCalled();
    const promptOutput = mockConsoleLog.mock.calls[1][0];
    
    expect(promptOutput).toContain('mspec execution directive:');
    expect(promptOutput).toContain('active-spec.tasks.md');
    expect(promptOutput).toContain('Stop and wait for my approval before moving to the next task');
  });

  it('should generate batch execution prompt when --batch is true', async () => {
    const tasksDir = path.join(tmpDir, '.mspec', 'tasks');
    fs.mkdirSync(tasksDir, { recursive: true });
    
    fs.writeFileSync(path.join(tasksDir, 'batch-spec.tasks.md'), '- [ ] task 1\n- [ ] task 2');

    await implementCommand('batch-spec', { batch: true });

    expect(mockExit).not.toHaveBeenCalled();
    const promptOutput = mockConsoleLog.mock.calls[1][0];
    
    expect(promptOutput).toContain('mspec execution directive:');
    expect(promptOutput).toContain('Continue to the next task until all tasks');
  });

  it('should support nested spec names like feature/001-auth', async () => {
    const tasksDir = path.join(tmpDir, '.mspec', 'tasks', 'feature');
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(path.join(tasksDir, '001-auth.tasks.md'), '- [ ] task 1');

    await implementCommand('feature/001-auth', {});

    expect(mockExit).not.toHaveBeenCalled();
    const promptOutput = mockConsoleLog.mock.calls[1][0];
    expect(promptOutput).toContain('feature/001-auth.tasks.md');
  });
});
