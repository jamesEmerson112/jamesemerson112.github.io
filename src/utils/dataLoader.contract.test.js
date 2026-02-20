import { describe, expect, it } from 'vitest';
import * as dataLoader from './dataLoader.js';

describe('dataLoader public contract', () => {
  it('exports formatter helpers used by repository cards and metrics screens', () => {
    expect(typeof dataLoader.fetchPortfolioIndex).toBe('function');
    expect(typeof dataLoader.fetchRepoDetails).toBe('function');
    expect(typeof dataLoader.formatNumber).toBe('function');
    expect(typeof dataLoader.formatCurrency).toBe('function');
    expect(typeof dataLoader.formatYears).toBe('function');
    expect(typeof dataLoader.getTopLanguages).toBe('function');

    // Compatibility exports used by RepoCard
    expect(typeof dataLoader.formatDuration).toBe('function');
    expect(typeof dataLoader.getLanguageColor).toBe('function');
    expect(typeof dataLoader.getContrastTextColor).toBe('function');
    expect(typeof dataLoader.getDisplayPrimaryLanguage).toBe('function');
    expect(typeof dataLoader.resolveDominantProgrammingLanguage).toBe('function');
    expect(typeof dataLoader.buildProgrammingComposition).toBe('function');
    expect(typeof dataLoader.isNonProgrammingLanguage).toBe('function');
  });

  it('returns dark text for bright language colors', () => {
    expect(dataLoader.getContrastTextColor('#f7df1e')).toBe('#0f172a');
  });

  it('returns light text for dark language colors', () => {
    expect(dataLoader.getContrastTextColor('#1e293b')).toBe('#f8fafc');
  });

  it('falls back safely for invalid colors', () => {
    expect(dataLoader.getContrastTextColor('invalid-color')).toBe('#f8fafc');
  });

  it('resolves dominant programming language by scanning language list when primary is non-programming', () => {
    expect(
      dataLoader.resolveDominantProgrammingLanguage('JSON', [
        { name: 'JSON', code: 400 },
        { name: 'Plain Text', code: 300 },
        { name: 'Python', code: 200 }
      ])
    ).toBe('Python');
  });

  it('falls back to lines and deterministic name tie-break when code values are equal', () => {
    expect(
      dataLoader.resolveDominantProgrammingLanguage('Plain Text', [
        { name: 'TypeScript', code: 100, lines: 120 },
        { name: 'JavaScript', code: 100, lines: 120 }
      ])
    ).toBe('JavaScript');
  });

  it('returns N/A when no programming language exists', () => {
    expect(
      dataLoader.resolveDominantProgrammingLanguage('JSON', [
        { name: 'JSON', code: 300 },
        { name: 'Plain Text', code: 200 },
        { name: 'Markdown', code: 100 }
      ])
    ).toBe('N/A');
  });

  it('supports object-shaped language maps and still selects programming fallback', () => {
    expect(
      dataLoader.resolveDominantProgrammingLanguage('', {
        JSON: { code: 700 },
        Python: { lines: 500 },
        Markdown: { code: 200 }
      })
    ).toBe('Python');
  });

  it('builds programming composition with non-programming and tail bucketed into Other', () => {
    const rows = dataLoader.buildProgrammingComposition([
      { name: 'TypeScript', code: 400, complexity: 40 },
      { name: 'Python', code: 300, complexity: 30 },
      { name: 'Go', code: 200, complexity: 20 },
      { name: 'Rust', code: 100, complexity: 10 },
      { name: 'JSON', code: 200, complexity: 0 }
    ], { maxProgrammingLanguages: 2, otherThresholdPercent: 0.5 });

    expect(rows.map((row) => row.name)).toEqual(['TypeScript', 'Python', 'Other']);
    const totalPercent = rows.reduce((sum, row) => sum + row.percent, 0);
    expect(totalPercent).toBeCloseTo(100, 6);
  });

  it('maps display primary language using dominant programming resolver', () => {
    expect(dataLoader.getDisplayPrimaryLanguage('TypeScript')).toBe('TypeScript');
    expect(
      dataLoader.getDisplayPrimaryLanguage('Plain Text', [
        { name: 'JSON', code: 400 },
        { name: 'Python', code: 300 }
      ])
    ).toBe('Python');
    expect(dataLoader.getDisplayPrimaryLanguage('Plain Text')).toBe('N/A');
  });
});
