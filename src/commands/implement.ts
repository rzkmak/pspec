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
> 1. Analyze the incomplete tasks marked with \`- [ ]\`.
> 2. CRITICAL: Delegate the actual coding to a sub-agent to preserve your context.
> 3. If tasks are independent (e.g., backend/frontend), run multiple sub-agents in parallel. Otherwise, pick the first task.
> 4. Instruct the sub-agent to implement the task, empirically verify it (run tests/build), and fix errors autonomously.
> 5. Once the sub-agent succeeds, change the task to \`- [x]\` in the file.
> 6. ${isBatch 
      ? 'Continue delegating the next task(s) until all tasks in the current phase are complete.' 
      : 'Stop and wait for my approval before moving to the next task.'}`;

  // 4. Output the prompt
  console.log(chalk.magenta('\n=== Copy the text below and paste it to your AI agent ===\n'));
  console.log(executionPrompt);
  console.log(chalk.magenta('\n==========================================================\n'));
}
