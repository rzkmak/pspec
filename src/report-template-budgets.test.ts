import { buildBudgetReport, countWords, estimateTokenCount, getCommandPromptBudgets, getCompiledAgentPromptBudgets } from './report-template-budgets';

describe('report-template-budgets', () => {
  it('should estimate tokens from character count', () => {
    expect(estimateTokenCount('1234')).toBe(1);
    expect(estimateTokenCount('12345')).toBe(2);
  });

  it('should count words safely', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('one two  three')).toBe(3);
  });

  it('should report budgets for all command prompts', () => {
    const rows = getCommandPromptBudgets();

    expect(rows.map(row => row.name)).toEqual([
      'pspec.commit-current-branch.md',
      'pspec.commit-raise-pr.md',
      'pspec.debug.md',
      'pspec.implement.md',
      'pspec.plan.md',
      'pspec.spec.md'
    ]);

    rows.forEach(row => {
      expect(row.chars).toBeGreaterThan(0);
      expect(row.words).toBeGreaterThan(0);
      expect(row.tokens).toBeGreaterThan(0);
    });
  });

  it('should report budgets for all compiled agent prompts', () => {
    const rows = getCompiledAgentPromptBudgets();

    expect(rows).toHaveLength(7);
    expect(rows.find(row => row.name === 'generalist')?.tokens).toBeLessThan(380);
    expect(rows.find(row => row.name === 'test_planner')?.tokens).toBeLessThan(380);
  });

  it('should build a readable report', () => {
    const report = buildBudgetReport();

    expect(report).toContain('Prompt Budget Report');
    expect(report).toContain('Command prompts');
    expect(report).toContain('Compiled agent prompts');
    expect(report).toContain('pspec.spec.md');
    expect(report).toContain('generalist');
    expect(report).toContain('TOTAL');
  });
});
