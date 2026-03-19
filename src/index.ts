#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
const pkg = require('../package.json');

export function createProgram() {
  const program = new Command();

  program
    .name('pspec')
    .description('Minimalist Spec-Driven Development CLI')
    .version(pkg.version)
    .action(initCommand);

  return program;
}

if (require.main === module) {
  createProgram().parse(process.argv);
}
