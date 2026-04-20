import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getTemplates, getSubagentRoleTemplates, SUBAGENT_ROLE_NAMES } from '../templates';
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

  const choices = ['claude', 'gemini', 'cursor', 'opencode', 'roo', 'kilo'];
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

  // Create directories if they don't exist
  if (!fs.existsSync(pspecDir)) {
    fs.mkdirSync(path.join(pspecDir, 'specs'), { recursive: true });
    fs.mkdirSync(path.join(pspecDir, 'tasks'), { recursive: true });
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

  // Sync subagent role files to .pspec/subagent-roles/
  const roleTemplates = getSubagentRoleTemplates();
  const subagentRolesDir = path.join(process.cwd(), '.pspec/subagent-roles');
  fs.mkdirSync(subagentRolesDir, { recursive: true });

  // Read existing role files
  const existingFiles = fs.existsSync(subagentRolesDir)
    ? fs.readdirSync(subagentRolesDir).filter(f => f.endsWith('.md'))
    : [];

  // Identify and remove stale files (not in current SUBAGENT_ROLE_NAMES)
  const expectedFiles = SUBAGENT_ROLE_NAMES.map(name => `${name}.md`);
  const staleFiles = existingFiles.filter(f => !expectedFiles.includes(f));
  for (const staleFile of staleFiles) {
    fs.unlinkSync(path.join(subagentRolesDir, staleFile));
    console.log(chalk.yellow(`Removed stale role: ${staleFile}`));
  }

  // Write/update role files and track changes
  let addedCount = 0;
  let updatedCount = 0;
  for (const template of roleTemplates) {
    const filePath = path.join(subagentRolesDir, template.file);
    const existed = fs.existsSync(filePath);
    fs.writeFileSync(filePath, template.content);
    if (existed) {
      updatedCount++;
    } else {
      addedCount++;
    }
  }

  // Log summary
  const removedCount = staleFiles.length;
  const parts = [];
  if (addedCount > 0) parts.push(`${addedCount} added`);
  if (updatedCount > 0) parts.push(`${updatedCount} updated`);
  if (removedCount > 0) parts.push(`${removedCount} removed`);
  const summary = parts.length > 0 ? parts.join(', ') : 'no changes';
  console.log(chalk.green(`Synced subagent roles (${summary})`));

  console.log(chalk.green('pspec initialized/updated successfully!'));
}
