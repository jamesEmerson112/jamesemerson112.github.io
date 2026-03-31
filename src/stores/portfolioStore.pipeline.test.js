import { get } from 'svelte/store';
import { describe, expect, it, beforeEach } from 'vitest';
import {
  portfolio,
  portfolioTotals,
  repos,
  languages,
  filteredRepos,
  availableLanguages,
  availableCategories,
  overallCategoryStats,
  overallLanguageProficiencyStats,
  overallQualityStats,
  searchTerm,
  languageFilter,
  categoryFilter,
  resetFilters
} from './portfolioStore.ts';

/**
 * Fixture derived from real public/metrics/index.json shapes.
 * Tests the full store pipeline with production-representative data.
 */
const REAL_DATA_FIXTURE = {
  portfolioTotals: {
    totalLines: 96000,
    totalCode: 84000,
    totalComments: 5400,
    totalBlanks: 6600,
    totalFiles: 300,
    totalBytes: 5000000,
    totalComplexity: 1200,
    estimatedValue: {
      standardCost: 450000,
      totalEffort: 95,
      avgTime: 8,
      avgPeople: 0
    },
    soloDeveloper: {
      fullTimeMonths: 95,
      fullTimeYears: 7.9,
      fullTimeWeeks: 412,
      description: 'Total time if developed alone, full-time'
    },
    languages: {
      JavaScript: { repos: 2, totalLines: 5100, totalCode: 4200, percentOfTotal: 5, averagePerRepo: 2100 },
      Python: { repos: 1, totalLines: 3500, totalCode: 2800, percentOfTotal: 3.3, averagePerRepo: 2800 },
      Svelte: { repos: 1, totalLines: 4500, totalCode: 3900, percentOfTotal: 4.6, averagePerRepo: 3900 }
    }
  },
  repos: [
    {
      id: 'portfolio-site',
      sourceRef: 'public:user/portfolio-site',
      name: 'portfolio-site',
      url: 'https://github.com/user/portfolio-site',
      description: 'Personal portfolio with metrics',
      lastUpdated: '2026-03-16T03:13:51Z',
      primaryLanguage: 'JSON',
      isPrivate: false,
      isAnonymized: false,
      projectTags: [
        { label: 'Web', confidence: 0.8 },
        { label: 'Backend', confidence: 0.2 }
      ],
      languages: [
        { name: 'JSON', lines: 74000, code: 74000, comments: 0, blanks: 0, bytes: 1700000, files: 200, complexity: 0, percentOfLines: 86, percentOfCode: 88 },
        { name: 'JavaScript', lines: 5100, code: 4200, comments: 240, blanks: 660, bytes: 156000, files: 36, complexity: 318, percentOfLines: 6, percentOfCode: 5 },
        { name: 'Svelte', lines: 4500, code: 3900, comments: 30, blanks: 530, bytes: 128000, files: 16, complexity: 45, percentOfLines: 5.3, percentOfCode: 4.7 },
        { name: 'CSS', lines: 950, code: 780, comments: 20, blanks: 150, bytes: 24000, files: 3, complexity: 0, percentOfLines: 1.1, percentOfCode: 0.9 }
      ],
      summary: { lines: 85600, code: 83800, files: 260, complexity: 370 },
      detailsFile: 'repos/portfolio-site.json'
    },
    {
      id: 'ml-notebook',
      sourceRef: 'public:user/ml-notebook',
      name: 'ml-notebook',
      url: 'https://github.com/user/ml-notebook',
      description: 'Machine learning experiments',
      lastUpdated: '2026-03-20T15:54:15Z',
      primaryLanguage: 'Jupyter',
      isPrivate: false,
      isAnonymized: false,
      projectTags: [
        { label: 'AI/ML', confidence: 0.54 },
        { label: 'Data', confidence: 0.46 }
      ],
      languages: [
        { name: 'Jupyter', lines: 6300, code: 6300, comments: 0, blanks: 0, bytes: 380000, files: 4, complexity: 0, percentOfLines: 58, percentOfCode: 64 },
        { name: 'Python', lines: 3500, code: 2800, comments: 400, blanks: 300, bytes: 100000, files: 8, complexity: 150, percentOfLines: 32, percentOfCode: 28 }
      ],
      summary: { lines: 10800, code: 9600, files: 14, complexity: 160 },
      detailsFile: 'repos/ml-notebook.json'
    },
    {
      id: 'private-abc123',
      sourceRef: 'private:abc123',
      name: 'Private Project 1',
      url: null,
      description: 'Private repository',
      lastUpdated: '2026-03-22T23:26:23Z',
      primaryLanguage: 'Markdown',
      isPrivate: true,
      isAnonymized: true,
      projectTags: [],
      languages: [
        { name: 'Markdown', lines: 1600, code: 1200, comments: 0, blanks: 400, bytes: 75000, files: 26, complexity: 0, percentOfLines: 98, percentOfCode: 97 }
      ],
      summary: { lines: 1700, code: 1300, files: 28, complexity: 5 },
      detailsFile: 'repos/private-abc123.json'
    }
  ]
};

describe('portfolioStore pipeline with real-shaped data', () => {
  beforeEach(() => {
    portfolio.reset();
    resetFilters();
  });

  it('hydrates and exposes portfolioTotals with expected shape', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    const totals = get(portfolioTotals);
    expect(totals).not.toBeNull();
    expect(totals.totalLines).toBe(96000);
    expect(totals.totalCode).toBe(84000);
    expect(totals.totalComplexity).toBe(1200);
    expect(totals.estimatedValue.standardCost).toBe(450000);
    expect(totals.soloDeveloper.fullTimeMonths).toBe(95);
  });

  it('exposes repos array with correct count', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    expect(get(repos)).toHaveLength(3);
  });

  it('exposes languages from portfolioTotals', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    const langs = get(languages);
    expect(langs).toHaveProperty('JavaScript');
    expect(langs).toHaveProperty('Python');
    expect(langs.JavaScript.repos).toBe(2);
  });

  it('filteredRepos returns all repos with default filters', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    expect(get(filteredRepos)).toHaveLength(3);
  });

  it('searchTerm filters repos by name', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    searchTerm.set('notebook');
    const filtered = get(filteredRepos);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('ml-notebook');
  });

  it('categoryFilter narrows repos by tag', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    categoryFilter.set('AI/ML');
    const filtered = get(filteredRepos);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('ml-notebook');
  });

  it('availableLanguages derives from repo data', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    const langs = get(availableLanguages);
    expect(Array.isArray(langs)).toBe(true);
    expect(langs.length).toBeGreaterThan(0);
  });

  it('availableCategories extracts unique tags in canonical order', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    const cats = get(availableCategories);
    expect(cats).toContain('Web');
    expect(cats).toContain('AI/ML');
    expect(cats.indexOf('AI/ML')).toBeLessThan(cats.indexOf('Web'));
  });

  it('overallCategoryStats produces numeric scores for each axis', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    const stats = get(overallCategoryStats);
    expect(Array.isArray(stats)).toBe(true);
    for (const item of stats) {
      expect(item).toHaveProperty('axis');
      expect(typeof item.score).toBe('number');
      expect(Number.isFinite(item.score)).toBe(true);
    }
  });

  it('overallLanguageProficiencyStats produces entries with axis and score', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    const stats = get(overallLanguageProficiencyStats);
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
    for (const item of stats) {
      expect(item).toHaveProperty('axis');
      expect(typeof item.score).toBe('number');
    }
  });

  it('overallQualityStats produces entries with axis, score, and band', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    const stats = get(overallQualityStats);
    expect(Array.isArray(stats)).toBe(true);
    for (const item of stats) {
      expect(item).toHaveProperty('axis');
      expect(typeof item.score).toBe('number');
      expect(typeof item.band).toBe('string');
    }
  });

  it('resetFilters clears search and filter state', () => {
    portfolio.hydrate(REAL_DATA_FIXTURE);
    searchTerm.set('xyz');
    languageFilter.set('Python');
    categoryFilter.set('AI/ML');
    expect(get(filteredRepos).length).toBeLessThan(3);

    resetFilters();
    expect(get(searchTerm)).toBe('');
    expect(get(languageFilter)).toBe('all');
    expect(get(categoryFilter)).toBe('all');
    expect(get(filteredRepos)).toHaveLength(3);
  });
});
