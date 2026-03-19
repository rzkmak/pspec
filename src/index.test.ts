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

  it('should not register an "init" subcommand', () => {
    const program = createProgram();
    const commandNames = program.commands.map(cmd => cmd.name());
    expect(commandNames).not.toContain('init');
  });

  it('should call initCommand when running "pspec" with no subcommand', async () => {
    const program = createProgram();
    program.exitOverride();
    
    await program.parseAsync(['node', 'pspec']);
    
    expect(initCommand).toHaveBeenCalled();
  });
});
