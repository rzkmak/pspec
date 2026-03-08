#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';

const program = new Command();

program
  .name('mspec')
  .description('Minimalist Spec-Driven Development CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize mspec in the current directory')
  .action(initCommand);

program.parse(process.argv);
