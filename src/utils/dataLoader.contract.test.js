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

  it('maps non-programming top languages to a recruiter-safe display label', () => {
    expect(dataLoader.getDisplayPrimaryLanguage('Plain Text')).toBe('Programming Language');
    expect(dataLoader.getDisplayPrimaryLanguage('JSON')).toBe('Programming Language');
    expect(dataLoader.getDisplayPrimaryLanguage('TypeScript')).toBe('TypeScript');
  });
});
