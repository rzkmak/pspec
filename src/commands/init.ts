import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getTemplates } from '../templates';
// Use require for enquirer to avoid commonjs/esm interop issues with its types
const { prompt } = require('enquirer');

export async function initCommand() {
  const pspecDir = path.join(process.cwd(), '.pspec');
  const configPath = path.join(pspecDir, 'pspec.json');
  
  let existingAgents: string[] = [];
  let config: any = {};

  if (fs.existsSync(pspecDir)) {
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config && config.agents && Array.isArray(config.agents)) {
          existingAgents = config.agents;
        } else if (config && config.agent) {
          existingAgents = [config.agent];
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }

  const choices = ['claude', 'gemini', 'cursor', 'opencode', 'antigravity', 'kilo'];
  let selectedAgents: string[] = [];

  try {
    const response = await prompt({
      type: 'multiselect',
      name: 'agents',
      message: 'Which AI agents would you like to configure? (Space to toggle, Enter to confirm)',
      choices: choices.map(c => ({
        name: c,
        enabled: existingAgents.includes(c)
      }))
    });
    selectedAgents = response.agents;
  } catch (error) {
    console.log(chalk.yellow('\nInitialization cancelled.'));
    return;
  }

  if (!selectedAgents || selectedAgents.length === 0) {
    console.log(chalk.yellow('No agents selected. Setup incomplete.'));
    return;
  }

  fs.mkdirSync(path.join(pspecDir, 'specs'), { recursive: true });
  fs.mkdirSync(path.join(pspecDir, 'tasks'), { recursive: true });

  // Create CONTEXT.md stub if it doesn't exist
  const contextPath = path.join(pspecDir, 'CONTEXT.md');
  if (!fs.existsSync(contextPath)) {
    fs.writeFileSync(contextPath, '# Project Context\n\nAdd project-specific context here. When present, /pspec.spec treats this file as the primary source of truth.\n');
  }

  // Write pspec.json config
  const pspecConfig = {
    ...config,
    agents: selectedAgents,
    paths: config.paths || {
      specs: '.pspec/specs',
      tasks: '.pspec/tasks'
    }
  };
  // Remove legacy field
  delete pspecConfig.agent;
  
  fs.writeFileSync(configPath, JSON.stringify(pspecConfig, null, 2));

  // Write command templates for each selected agent
  for (const agent of selectedAgents) {
    const agentTemplates = getTemplates(agent);
    if (agentTemplates.length > 0) {
      for (const template of agentTemplates) {
        const targetDir = path.join(process.cwd(), template.dir);
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, template.file), template.content);
        console.log(chalk.green(`Updated command file for ${agent} at ${path.join(template.dir, template.file)}`));
      }
    }
  }

  console.log(chalk.green('pspec initialized/updated successfully!'));
}
