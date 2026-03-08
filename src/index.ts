#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
const pkg = require('../package.json');

export function createProgram() {
  const program = new Command();

  program
    .name('mspec')
    .description('Minimalist Spec-Driven Development CLI')
    .version(pkg.version);

  program
    .command('init')
    .description('Initialize mspec in the current directory')
    .action(initCommand);

  return program;
}

if (require.main === module) {
  createProgram().parse(process.argv);
}
