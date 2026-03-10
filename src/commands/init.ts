import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getTemplates, getAgentTemplates } from '../templates';
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

  const choices = ['claude', 'gemini', 'cursor', 'opencode'];
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
    }
  }

  // Deploy agent definition files
  await deployAgentFiles(selectedAgents);

  console.log(chalk.green('mspec initialized/updated successfully!'));
}

async function deployAgentFiles(selectedAgents: string[]) {
  for (const agent of selectedAgents) {
    const agentDefinitions = getAgentTemplates(agent);
    
    if (agentDefinitions.length === 0) {
      continue;
    }

    // Check if any agent files already exist
    const existingFiles: string[] = [];
    for (const template of agentDefinitions) {
      const targetPath = path.join(process.cwd(), template.dir, template.file);
      if (fs.existsSync(targetPath)) {
        existingFiles.push(path.join(template.dir, template.file));
      }
    }

    // If files exist, ask user what to do
    let overwrite = true;
    if (existingFiles.length > 0) {
      console.log(chalk.yellow(`\nExisting agent files found for ${agent}:`));
      existingFiles.forEach(f => console.log(chalk.yellow(`  - ${f}`)));
      
      try {
        const response = await prompt({
          type: 'select',
          name: 'action',
          message: `Agent files already exist for ${agent}. What would you like to do?`,
          choices: [
            { name: 'overwrite', message: 'Overwrite (replace with new definitions)' },
            { name: 'preserve', message: 'Preserve (keep existing customizations)' }
          ]
        });
        overwrite = response.action === 'overwrite';
      } catch (error) {
        console.log(chalk.yellow('\nAgent deployment cancelled. Initialization incomplete.'));
        throw new Error('Agent deployment cancelled by user');
      }
    }

    // Deploy agent files
    for (const template of agentDefinitions) {
      const targetDir = path.join(process.cwd(), template.dir);
      const targetPath = path.join(targetDir, template.file);
      
      // Skip if preserving and file exists
      if (!overwrite && fs.existsSync(targetPath)) {
        console.log(chalk.blue(`Preserving existing agent file: ${path.join(template.dir, template.file)}`));
        continue;
      }
      
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetPath, template.content);
        
        if (overwrite && existingFiles.includes(path.join(template.dir, template.file))) {
          console.log(chalk.green(`Overwritten agent file for ${agent} at ${path.join(template.dir, template.file)}`));
        } else {
          console.log(chalk.green(`Created agent file for ${agent} at ${path.join(template.dir, template.file)}`));
        }
      } catch (error) {
        console.log(chalk.red(`Failed to create agent file for ${agent} at ${path.join(template.dir, template.file)}`));
        throw error; // Fail entirely as requested
      }
    }
  }
}
