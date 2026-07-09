import { describe, expect, it } from 'vitest';
import { calculateCOCOMO, calculateLanguagePercentages, generateSummary } from './cocomo.js';

const SCC_FIXTURE = [
  { Name: 'JavaScript', Lines: 6000, Code: 4800, Comment: 600, Blank: 600, Bytes: 180000, Count: 40, Complexity: 320 },
  { Name: 'Svelte', Lines: 3000, Code: 2600, Comment: 100, Blank: 300, Bytes: 90000, Count: 15, Complexity: 60 },
  { Name: 'CSS', Lines: 1000, Code: 850, Comment: 50, Blank: 100, Bytes: 30000, Count: 5, Complexity: 0 }
];

describe('calculateCOCOMO', () => {
  it('applies the organic-model formulas for the traditional estimate', () => {
    const wage = 60000;
    const result = calculateCOCOMO(10000, wage);

    const expectedEffort = 2.4 * Math.pow(10, 1.05);
    const expectedTime = 2.5 * Math.pow(expectedEffort, 0.38);

    expect(result.traditional.kloc).toBe(10);
    expect(result.traditional.effort).toBeCloseTo(expectedEffort, 2);
    expect(result.traditional.time).toBeCloseTo(expectedTime, 2);
    expect(result.traditional.people).toBeCloseTo(expectedEffort / expectedTime, 2);
    expect(result.traditional.cost).toBe(Math.round(expectedEffort * (wage / 12)));
    expect(result.traditional.model).toBe('organic');
  });

  it('scales the AI-assisted estimate by the weighted task multiplier', () => {
    const result = calculateCOCOMO(10000);

    // Weighted multiplier from AI_TASK_MULTIPLIERS: 0.05*0.1 + 0.1*0.4 + 0.3*0.15 + 0.5*0.15 + 0.7*0.1 + 0.2*0.1
    expect(result.aiAssisted.effectiveMultiplier).toBeCloseTo(0.255, 3);
    expect(result.aiAssisted.effort).toBeCloseTo(result.traditional.effort * 0.255, 1);
    expect(result.aiAssisted.effort).toBeLessThan(result.traditional.effort);
    expect(result.aiAssisted.cost).toBeLessThan(result.traditional.cost);
  });

  it('reports comparison percentages as strings', () => {
    const result = calculateCOCOMO(5000);

    expect(result.comparison.effortReduction).toMatch(/^\d+%$/);
    expect(result.comparison.timeReduction).toMatch(/^\d+%$/);
    expect(result.comparison.costReduction).toMatch(/^\d+%$/);
    expect(result.comparison.speedup).toMatch(/^\d+(\.\d+)?x$/);
  });

  it('produces consistent solo-developer breakdowns', () => {
    const result = calculateCOCOMO(20000);

    expect(result.singleDeveloper.traditional.fullTime.months).toBeCloseTo(result.traditional.effort, 2);
    expect(result.singleDeveloper.aiAssisted.fullTime.months).toBeCloseTo(result.aiAssisted.effort, 2);
    expect(result.singleDeveloper.traditional.fullTime.cost).toBe(result.traditional.cost);
    expect(result.singleDeveloper.aiAssisted.fullTime.cost).toBe(result.aiAssisted.cost);
  });
});

describe('calculateLanguagePercentages', () => {
  it('computes per-language percentages and sorts by code descending', () => {
    const result = calculateLanguagePercentages(SCC_FIXTURE);

    expect(result.map((lang) => lang.name)).toEqual(['JavaScript', 'Svelte', 'CSS']);
    expect(result[0].percentOfLines).toBeCloseTo(60, 1);
    expect(result[0].percentOfCode).toBeCloseTo((4800 / 8250) * 100, 1);
    expect(result[0].files).toBe(40);
    expect(result[0].comments).toBe(600);
  });

  it('returns an empty array for empty input', () => {
    expect(calculateLanguagePercentages([])).toEqual([]);
  });
});

describe('generateSummary', () => {
  it('aggregates totals and identifies the primary language', () => {
    const summary = generateSummary(SCC_FIXTURE);

    expect(summary.totalLines).toBe(10000);
    expect(summary.totalCode).toBe(8250);
    expect(summary.totalComments).toBe(750);
    expect(summary.totalBlanks).toBe(1000);
    expect(summary.totalFiles).toBe(60);
    expect(summary.totalComplexity).toBe(380);
    expect(summary.totalLanguages).toBe(3);
    expect(summary.primaryLanguage).toBe('JavaScript');
    expect(summary.primaryLanguagePercent).toBeCloseTo((4800 / 8250) * 100, 1);
  });

  it('handles empty input with zeroed totals', () => {
    const summary = generateSummary([]);

    expect(summary.totalLines).toBe(0);
    expect(summary.totalCode).toBe(0);
    expect(summary.primaryLanguage).toBe('Unknown');
    expect(summary.primaryLanguagePercent).toBe(0);
  });
});
