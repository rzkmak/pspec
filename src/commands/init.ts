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

  // Sync subagent role files to .pspec/subagent-roles/
  const roleTemplates = getSubagentRoleTemplates();
  const subagentRolesDir = path.join(process.cwd(), '.pspec/subagent-roles');
  fs.mkdirSync(subagentRolesDir, { recursive: true });

  // Write/update role files and track changes
  // Note: We don't delete stale files to avoid accidentally removing custom user roles.
  // Users can manually delete old pspec roles if needed.
  let addedCount = 0;
  let updatedCount = 0;
  for (const template of roleTemplates) {
    const filePath = path.join(subagentRolesDir, template.file);
    const existed = fs.existsSync(filePath);
    if (existed) {
      // Check if content actually changed
      const existingContent = fs.readFileSync(filePath, 'utf-8');
      if (existingContent !== template.content) {
        fs.writeFileSync(filePath, template.content);
        updatedCount++;
      }
      // If content matches, don't count as updated (no-op)
    } else {
      fs.writeFileSync(filePath, template.content);
      addedCount++;
    }
  }

  // Log summary
  const parts = [];
  if (addedCount > 0) parts.push(`${addedCount} added`);
  if (updatedCount > 0) parts.push(`${updatedCount} updated`);
  const summary = parts.length > 0 ? parts.join(', ') : 'no changes';
  console.log(chalk.green(`Synced subagent roles (${summary})`));

  console.log(chalk.green('pspec initialized/updated successfully!'));
}
