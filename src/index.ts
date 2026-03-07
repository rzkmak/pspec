#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { planCommand } from './commands/plan';
import { implementCommand } from './commands/implement';

const program = new Command();

program
  .name('mspec')
  .description('Minimalist Spec-Driven Development CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize mspec in the current directory')
  .action(initCommand);

program
  .command('plan <spec-name>')
  .description('Scaffold a tasks file for a given spec')
  .action(planCommand);

program
  .command('implement <spec-name>')
  .description('Generate execution instructions for the AI agent to implement a spec')
  .option('-b, --batch', 'Instruct the AI to complete all tasks without stopping for approval', false)
  .action(implementCommand);

program.parse(process.argv);
