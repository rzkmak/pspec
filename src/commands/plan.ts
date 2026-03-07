import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export async function planCommand(specName: string) {
  if (typeof specName !== 'string' || specName.includes('..') || path.isAbsolute(specName)) {
    console.error(chalk.red(`Error: Invalid spec name. Path traversal is not allowed.`));
    process.exit(1);
    return;
  }

  const mspecDir = path.join(process.cwd(), '.mspec');
  const specPath = path.join(mspecDir, 'specs', `${specName}.md`);
  const tasksPath = path.join(mspecDir, 'tasks', `${specName}.tasks.md`);

  // 1. Check if the spec file exists
  if (!fs.existsSync(specPath)) {
    console.error(chalk.red(`Error: Spec file not found at ${specPath}`));
    console.log(chalk.yellow(`Make sure you have created the spec first using your AI agent or manually.`));
    process.exit(1);
    return;
  }

  // 2. Check if the tasks file already exists
  if (fs.existsSync(tasksPath)) {
    console.log(chalk.yellow(`Warning: Tasks file already exists at ${tasksPath}`));
    console.log(chalk.gray(`Skipping generation to prevent overwriting your existing plan.`));
    return;
  }

  // 3. Generate the boilerplate markdown
  const boilerplate = `# Implementation Tasks: ${specName}

> **AI INSTRUCTION:** Read \`.mspec/specs/${specName}.md\`. Break down the requirements into granular, sequential implementation tasks below. Use checkboxes (\`- [ ]\`). Group by phases.

## Phase 1: Setup & Scaffolding
- [ ] ...

## Phase 2: Core Logic
- [ ] ...

## Phase 3: Validation
- [ ] ...
`;

  // Ensure tasks directory exists in case it was somehow deleted or it's a nested spec (e.g. 'auth/login')
  fs.mkdirSync(path.dirname(tasksPath), { recursive: true });

  // 4. Write the file
  fs.writeFileSync(tasksPath, boilerplate, 'utf-8');

  console.log(chalk.green(`Success: Scaffolded tasks file at ${tasksPath}`));
  console.log(chalk.blue(`Next Step: Ask your AI agent to "fill out the tasks for ${specName}"`));
}
