import { describe, expect, it } from 'vitest';
import {
  normalizeRobust,
  computeQualityBaselines,
  computeRepoQualitySignals,
  computeOverallCategorySpider,
  computeOverallQualityStats
} from './profileMetrics.js';

const reposFixture = [
  {
    id: 'a',
    lastUpdated: '2026-02-10T00:00:00Z',
    summary: { code: 1000, files: 12, complexity: 90 },
    projectTags: [
      { label: 'Web', confidence: 0.8 },
      { label: 'Backend', confidence: 0.2 }
    ],
    languages: [
      { name: 'TypeScript', code: 700, comments: 140, complexity: 70 },
      { name: 'Svelte', code: 300, comments: 60, complexity: 20 }
    ]
  },
  {
    id: 'b',
    lastUpdated: '2025-12-20T00:00:00Z',
    summary: { code: 10000, files: 80, complexity: 220 },
    projectTags: [
      { label: 'Data', confidence: 0.6 },
      { label: 'AI/ML', confidence: 0.4 }
    ],
    languages: [
      { name: 'Python', code: 9000, comments: 900, complexity: 210 },
      { name: 'Shell', code: 1000, comments: 100, complexity: 10 }
    ]
  }
];

describe('profileMetrics utilities', () => {
  it('normalizes values with clipping and invert support', () => {
    expect(normalizeRobust(30, { p10: 10, p90: 50, invert: false })).toBeCloseTo(50, 3);
    expect(normalizeRobust(30, { p10: 10, p90: 50, invert: true })).toBeCloseTo(50, 3);
    expect(normalizeRobust(100, { p10: 10, p90: 50, invert: false })).toBe(100);
    expect(normalizeRobust(-10, { p10: 10, p90: 50, invert: false })).toBe(0);
  });

  it('builds p10/p90 baselines for quality axes', () => {
    const baselines = computeQualityBaselines(reposFixture);

    expect(baselines.scope.p10).toBeLessThanOrEqual(baselines.scope.p90);
    expect(baselines.documentation.p10).toBeLessThanOrEqual(baselines.documentation.p90);
    expect(baselines.freshness.p10).toBeLessThanOrEqual(baselines.freshness.p90);
  });

  it('computes project quality signals on a 0-100 scale', () => {
    const baselines = computeQualityBaselines(reposFixture);
    const signals = computeRepoQualitySignals(reposFixture[0], baselines);

    expect(signals).toHaveLength(6);
    expect(signals.map((item) => item.axis)).toEqual([
      'Scope',
      'Complexity Control',
      'Documentation',
      'Structure',
      'Breadth',
      'Freshness'
    ]);
    for (const signal of signals) {
      expect(signal.score).toBeGreaterThanOrEqual(0);
      expect(signal.score).toBeLessThanOrEqual(100);
    }
  });

  it('computes weighted overall category spider stats', () => {
    const stats = computeOverallCategorySpider(reposFixture);

    expect(stats).toHaveLength(6);
    const web = stats.find((item) => item.axis === 'Web');
    const mobile = stats.find((item) => item.axis === 'Mobile');
    expect(web.score).toBeGreaterThan(0);
    expect(mobile.score).toBe(0);
  });

  it('aggregates portfolio quality stats with band labels', () => {
    const baselines = computeQualityBaselines(reposFixture);
    const overall = computeOverallQualityStats(reposFixture, baselines);

    expect(overall).toHaveLength(6);
    expect(overall[0]).toHaveProperty('band');
    expect(['Low', 'Moderate', 'High', 'Very High']).toContain(overall[0].band);
  });
});
