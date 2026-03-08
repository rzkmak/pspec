import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getTemplates } from '../templates';
// Use require for enquirer to avoid commonjs/esm interop issues with its types
const { prompt } = require('enquirer');

export async function initCommand() {
  const mspecDir = path.join(process.cwd(), '.mspec');
  const configPath = path.join(mspecDir, 'mspec.json');
  
  let existingAgents: string[] = [];
  let config: any = {};

  if (fs.existsSync(mspecDir)) {
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

  const choices = ['claude', 'gemini', 'cursor', 'opencode', 'zed', 'generic'];
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
  if (!fs.existsSync(mspecDir)) {
    fs.mkdirSync(path.join(mspecDir, 'specs'), { recursive: true });
    fs.mkdirSync(path.join(mspecDir, 'tasks'), { recursive: true });
  }

  // Write mspec.json config
  const mspecConfig = {
    ...config,
    agents: selectedAgents,
    paths: config.paths || {
      specs: '.mspec/specs',
      tasks: '.mspec/tasks'
    }
  };
  // Remove legacy field
  delete mspecConfig.agent;
  
  fs.writeFileSync(configPath, JSON.stringify(mspecConfig, null, 2));

  // Write agent integration files for each selected agent
  for (const agent of selectedAgents) {
    const agentTemplates = getTemplates(agent);
    if (agentTemplates.length > 0) {
      for (const template of agentTemplates) {
        const targetDir = path.join(process.cwd(), template.dir);
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, template.file), template.content);
        console.log(chalk.green(`Updated integration file for ${agent} at ${path.join(template.dir, template.file)}`));
      }
    } else {
      console.log(chalk.yellow(`No specific integration template found for ${agent}. Setup completed with generic settings.`));
    }
  }

  console.log(chalk.green('mspec initialized/updated successfully!'));
}
