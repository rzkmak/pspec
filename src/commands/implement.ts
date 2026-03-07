import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export async function implementCommand(specName: string, options: { batch?: boolean }) {
  if (typeof specName !== 'string' || specName.includes('..') || path.isAbsolute(specName)) {
    console.error(chalk.red(`Error: Invalid spec name. Path traversal is not allowed.`));
    process.exit(1);
    return;
  }

  const mspecDir = path.join(process.cwd(), '.mspec');
  const tasksPath = path.join(mspecDir, 'tasks', `${specName}.tasks.md`);

  // 1. Check if the tasks file exists
  if (!fs.existsSync(tasksPath)) {
    console.error(chalk.red(`Error: Tasks file not found at ${tasksPath}`));
    console.log(chalk.yellow(`Run 'mspec plan ${specName}' and have your AI fill it out first.`));
    process.exit(1);
    return;
  }

  // 2. Read the file and check for remaining tasks
  const tasksContent = fs.readFileSync(tasksPath, 'utf-8');
  if (!tasksContent.includes('- [ ]')) {
    console.log(chalk.yellow(`Warning: No incomplete tasks found in ${specName}.tasks.md.`));
    console.log(chalk.green(`It looks like this spec is already fully implemented!`));
    return;
  }

  // 3. Generate the execution prompt
  const isBatch = options.batch === true;
  
  const executionPrompt = `> **mspec execution directive:**
> Please read \`.mspec/tasks/${specName}.tasks.md\`. 
> 1. Find the first incomplete task marked with \`- [ ]\`.
> 2. Implement the requirements for that specific task.
> 3. Verify your implementation (run tests/build).
> 4. If successful, change the task to \`- [x]\` in the file.
> 5. ${isBatch 
      ? 'Continue to the next task until all tasks in the current phase are complete.' 
      : 'Stop and wait for my approval before moving to the next task.'}`;

  // 4. Output the prompt
  console.log(chalk.magenta('\n=== Copy the text below and paste it to your AI agent ===\n'));
  console.log(executionPrompt);
  console.log(chalk.magenta('\n==========================================================\n'));
}
