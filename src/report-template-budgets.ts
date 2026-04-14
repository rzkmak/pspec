import fs from 'fs';
import path from 'path';

export interface BudgetRow {
  name: string;
  chars: number;
  words: number;
  tokens: number;
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function formatRow(row: BudgetRow): string {
  return `${row.name.padEnd(32)} chars=${String(row.chars).padStart(4)} words=${String(row.words).padStart(4)} tokens~=${String(row.tokens).padStart(4)}`;
}

function summarize(rows: BudgetRow[]): BudgetRow {
  return rows.reduce(
    (acc, row) => ({
      name: 'TOTAL',
      chars: acc.chars + row.chars,
      words: acc.words + row.words,
      tokens: acc.tokens + row.tokens
    }),
    { name: 'TOTAL', chars: 0, words: 0, tokens: 0 }
  );
}

export function getCommandPromptBudgets(): BudgetRow[] {
  const promptsDir = path.join(__dirname, 'templates', 'prompts');

  return fs.readdirSync(promptsDir)
    .filter(file => file.endsWith('.md'))
    .sort()
    .map(file => {
      const content = fs.readFileSync(path.join(promptsDir, file), 'utf-8');
      return {
        name: file,
        chars: content.length,
        words: countWords(content),
        tokens: estimateTokenCount(content)
      };
    });
}

export function buildBudgetReport(): string {
  const commandRows = getCommandPromptBudgets();

  return [
    'Prompt Budget Report',
    '',
    'Command prompts',
    ...commandRows.map(formatRow),
    formatRow(summarize(commandRows))
  ].join('\n');
}

if (require.main === module) {
  console.log(buildBudgetReport());
}
