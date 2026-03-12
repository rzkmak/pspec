import { createProgram } from './index';
import { initCommand } from './commands/init';

jest.mock('./commands/init', () => ({
  initCommand: jest.fn()
}));

describe('CLI index', () => {
  it('should have correct name, description and version', () => {
    const program = createProgram();
    expect(program.name()).toBe('pspec');
    expect(program.description()).toBe('Minimalist Spec-Driven Development CLI');
    const pkg = require('../package.json');
    expect(program.version()).toBe(pkg.version);
  });

  it('should have an "init" command', () => {
    const program = createProgram();
    const commandNames = program.commands.map(cmd => cmd.name());
    expect(commandNames).toContain('init');
    
    const initCmd = program.commands.find(cmd => cmd.name() === 'init');
    expect(initCmd?.description()).toBe('Initialize pspec in the current directory');
  });

  it('should call initCommand when running "init"', async () => {
    const program = createProgram();
    // In commander, we can parse arguments to trigger actions.
    // We override exitOverride to prevent the test process from exiting.
    program.exitOverride();
    
    await program.parseAsync(['node', 'pspec', 'init']);
    
    expect(initCommand).toHaveBeenCalled();
  });
});
