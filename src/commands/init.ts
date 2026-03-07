import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { getTemplate } from '../templates';
// Use require for enquirer to avoid commonjs/esm interop issues with its types
const { prompt } = require('enquirer');

export async function initCommand() {
  const mspecDir = path.join(process.cwd(), '.mspec');

  if (fs.existsSync(mspecDir)) {
    console.log(chalk.yellow('.mspec directory already exists. Initialization skipped.'));
    return;
  }

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

  const agent = response.agent as string;

  // Create directories
  fs.mkdirSync(path.join(mspecDir, 'specs'), { recursive: true });
  fs.mkdirSync(path.join(mspecDir, 'tasks'), { recursive: true });

  // Write mspec.json config
  const mspecConfig = {
    agent,
    paths: {
      specs: '.mspec/specs',
      tasks: '.mspec/tasks'
    }
  };
  fs.writeFileSync(path.join(mspecDir, 'mspec.json'), JSON.stringify(mspecConfig, null, 2));

  // Write agent integration file
  const template = getTemplate(agent);
  if (template) {
    const targetDir = path.join(process.cwd(), template.dir);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, template.file), template.content);
    console.log(chalk.green(`Created integration file for ${agent} at ${path.join(template.dir, template.file)}`));
  } else {
    console.log(chalk.yellow(`No specific integration template found for ${agent}. Setup completed with generic settings.`));
  }

  console.log(chalk.green('mspec initialized successfully!'));
}
