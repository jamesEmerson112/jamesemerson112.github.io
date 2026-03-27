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

describe('buildProgrammingComposition edge cases', () => {
  it('returns empty array for empty input', () => {
    expect(dataLoader.buildProgrammingComposition([])).toEqual([]);
  });

  it('returns empty array for undefined input', () => {
    expect(dataLoader.buildProgrammingComposition()).toEqual([]);
  });

  it('returns single language at 100% without Other bucket', () => {
    const rows = dataLoader.buildProgrammingComposition([
      { name: 'Python', code: 500, complexity: 30 }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Python');
    expect(rows[0].percent).toBeCloseTo(100, 6);
  });

  it('buckets all non-programming languages into Other', () => {
    const rows = dataLoader.buildProgrammingComposition([
      { name: 'JSON', code: 400, complexity: 0 },
      { name: 'Markdown', code: 300, complexity: 0 },
      { name: 'YAML', code: 100, complexity: 0 }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Other');
    expect(rows[0].percent).toBeCloseTo(100, 6);
  });

  it('handles entries with missing code and complexity fields', () => {
    const rows = dataLoader.buildProgrammingComposition([
      { name: 'TypeScript' },
      { name: 'Python', code: 200 }
    ]);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.find((r) => r.name === 'Python')).toBeTruthy();
  });

  it('accepts object-shaped language maps', () => {
    const rows = dataLoader.buildProgrammingComposition({
      TypeScript: { code: 500, complexity: 40 },
      Python: { code: 300, complexity: 20 }
    });
    expect(rows.map((r) => r.name)).toContain('TypeScript');
    expect(rows.map((r) => r.name)).toContain('Python');
    const totalPercent = rows.reduce((sum, r) => sum + r.percent, 0);
    expect(totalPercent).toBeCloseTo(100, 6);
  });
});

describe('resolveDominantProgrammingLanguage edge cases', () => {
  it('returns N/A for empty string primary and empty languages', () => {
    expect(dataLoader.resolveDominantProgrammingLanguage('', [])).toBe('N/A');
  });

  it('returns N/A for null primary', () => {
    expect(dataLoader.resolveDominantProgrammingLanguage(null)).toBe('N/A');
  });

  it('returns N/A for undefined primary', () => {
    expect(dataLoader.resolveDominantProgrammingLanguage(undefined)).toBe('N/A');
  });

  it('returns valid primary without needing language list', () => {
    expect(dataLoader.resolveDominantProgrammingLanguage('Rust')).toBe('Rust');
  });
});

describe('formatDuration edge cases', () => {
  it('returns 0 mo for zero', () => {
    expect(dataLoader.formatDuration(0)).toBe('0 mo');
  });

  it('returns 0 mo for negative values', () => {
    expect(dataLoader.formatDuration(-5)).toBe('0 mo');
  });

  it('returns 0 mo for NaN', () => {
    expect(dataLoader.formatDuration(NaN)).toBe('0 mo');
  });

  it('formats sub-month values as weeks', () => {
    const result = dataLoader.formatDuration(0.5);
    expect(result).toMatch(/\d+ wk/);
  });

  it('formats months with one decimal', () => {
    expect(dataLoader.formatDuration(6)).toBe('6.0 mo');
  });

  it('formats 24 months as years', () => {
    expect(dataLoader.formatDuration(24)).toBe('2.0 yrs');
  });

  it('rounds large year values', () => {
    expect(dataLoader.formatDuration(120)).toBe('10 yrs');
  });
});
