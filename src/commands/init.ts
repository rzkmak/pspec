import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getTemplates } from '../templates';
// Use require for enquirer to avoid commonjs/esm interop issues with its types
const { prompt } = require('enquirer');

export async function initCommand() {
  const mspecDir = path.join(process.cwd(), '.mspec');
  const configPath = path.join(mspecDir, 'mspec.json');
  
  let existingAgent = '';

  if (fs.existsSync(mspecDir)) {
    console.log(chalk.blue('Existing .mspec directory found. Updating integration files...'));
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config && config.agent) {
          existingAgent = config.agent;
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }

  let agent = existingAgent;

  if (!agent) {
    let response;
    try {
      response = await prompt({
        type: 'select',
        name: 'agent',
        message: 'Which AI agent are you using?',
        choices: ['claude', 'gemini', 'cursor', 'opencode', 'zed', 'generic'],
      });
    } catch (error) {
      console.log(chalk.yellow('\nInitialization cancelled.'));
      return;
    }
    agent = response.agent as string;
  }

  // Create directories if they don't exist
  if (!fs.existsSync(mspecDir)) {
    fs.mkdirSync(path.join(mspecDir, 'specs'), { recursive: true });
    fs.mkdirSync(path.join(mspecDir, 'tasks'), { recursive: true });
  }

  // Write mspec.json config
  const mspecConfig = {
    agent,
    paths: {
      specs: '.mspec/specs',
      tasks: '.mspec/tasks'
    }
  };
  fs.writeFileSync(configPath, JSON.stringify(mspecConfig, null, 2));

  // Write agent integration files
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

  console.log(chalk.green('mspec initialized/updated successfully!'));
}
