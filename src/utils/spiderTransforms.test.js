import { describe, expect, it } from 'vitest';
import {
  buildSpiderDataset,
  computePercentShare,
  rankLanguages
} from './spiderTransforms.js';

const fixtureLanguages = [
  { name: 'TypeScript', code: 500, complexity: 80 },
  { name: 'JavaScript', code: 300, complexity: 10 },
  { name: 'Svelte', code: 100, complexity: 5 },
  { name: 'JSON', code: 75, complexity: 0 },
  { name: 'HTML', code: 25, complexity: 0 }
];

describe('spiderTransforms', () => {
  it('ranks languages by metric descending', () => {
    const ranked = rankLanguages(fixtureLanguages, 'code');

    expect(ranked.map((item) => item.name)).toEqual([
      'TypeScript',
      'JavaScript',
      'Svelte',
      'JSON',
      'HTML'
    ]);
  });

  it('computes percent shares for code and complexity', () => {
    const codeShares = computePercentShare(fixtureLanguages, 'code');
    const complexityShares = computePercentShare(fixtureLanguages, 'complexity');

    const typeScriptCode = codeShares.find((item) => item.name === 'TypeScript');
    const javaScriptComplexity = complexityShares.find((item) => item.name === 'JavaScript');

    expect(typeScriptCode.percent).toBeCloseTo(50, 4);
    expect(javaScriptComplexity.percent).toBeCloseTo(10.5263, 3);
  });

  it('builds top-n plus other and preserves full totals', () => {
    const dataset = buildSpiderDataset(fixtureLanguages, {
      metric: 'code',
      maxAxes: 3,
      aggregateOther: true
    });

    expect(dataset).toHaveLength(4);
    expect(dataset.map((item) => item.name)).toEqual([
      'TypeScript',
      'JavaScript',
      'Svelte',
      'Other'
    ]);
    expect(dataset.reduce((sum, item) => sum + item.code, 0)).toBe(1000);
    expect(dataset.reduce((sum, item) => sum + item.valuePercent, 0)).toBeCloseTo(100, 6);
  });

  it('handles all-zero metrics without NaN or Infinity', () => {
    const dataset = buildSpiderDataset(
      [
        { name: 'A', code: 0, complexity: 0 },
        { name: 'B', code: 0, complexity: 0 }
      ],
      { metric: 'complexity', maxAxes: 8, aggregateOther: true }
    );

    expect(dataset).toHaveLength(2);
    for (const item of dataset) {
      expect(Number.isFinite(item.valuePercent)).toBe(true);
      expect(item.valuePercent).toBe(0);
    }
  });
});
