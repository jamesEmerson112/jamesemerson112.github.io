import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import * as store from './portfolioStore.js';

describe('portfolioStore public contract', () => {
  it('exports the advanced portfolio API used by portfolio components', () => {
    expect(store.portfolio).toBeDefined();
    expect(store.portfolioTotals).toBeDefined();
    expect(store.repos).toBeDefined();
    expect(store.languages).toBeDefined();
    expect(store.isLoading).toBeDefined();
    expect(store.hasError).toBeDefined();

    // Compatibility exports used by PortfolioOverview/SearchFilter/RepoCard
    expect(store.loading).toBeDefined();
    expect(store.error).toBeDefined();
    expect(store.filteredRepos).toBeDefined();
    expect(store.availableLanguages).toBeDefined();
    expect(store.searchTerm).toBeDefined();
    expect(store.languageFilter).toBeDefined();
    expect(store.categoryFilter).toBeDefined();
    expect(store.sortBy).toBeDefined();
    expect(store.sortOrder).toBeDefined();
    expect(store.selectedRepo).toBeDefined();
    expect(store.availableCategories).toBeDefined();
    expect(store.overallCategoryStats).toBeDefined();
    expect(store.overallLanguageProficiencyStats).toBeDefined();
    expect(store.overallQualityStats).toBeDefined();
    expect(typeof store.loadPortfolioData).toBe('function');
    expect(typeof store.toggleSortOrder).toBe('function');
    expect(typeof store.resetFilters).toBe('function');
    expect(get(store.sortBy)).toBe('recent');
  });
});
