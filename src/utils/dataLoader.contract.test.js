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
  });
});
