import { isNonProgrammingLanguage } from './languageUtils.ts';
import type { Repo, QualitySignal, QualityBand, AxisScore } from '../types.js';

export const CATEGORY_AXES = ['AI/ML', 'Web', 'Backend', 'Data', 'DevOps', 'Mobile'] as const;
const QUALITY_AXES = [
  'Scope',
  'Complexity Control',
  'Documentation',
  'Structure',
  'Breadth',
  'Freshness'
] as const;
const LANGUAGE_PROFICIENCY_AXES = [
  'JavaScript/TypeScript',
  'C/C++/Rust',
  'Python',
  'Web UI',
  'Data/SQL',
  'Other/Infra'
] as const;
const LANGUAGE_FAMILY_ALIASES = new Map<string, string>([
  ['javascript', 'JavaScript/TypeScript'],
  ['typescript', 'JavaScript/TypeScript'],
  ['jsx', 'JavaScript/TypeScript'],
  ['tsx', 'JavaScript/TypeScript'],
  ['typescript typings', 'JavaScript/TypeScript'],
  ['c', 'C/C++/Rust'],
  ['c++', 'C/C++/Rust'],
  ['rust', 'C/C++/Rust'],
  ['c header', 'C/C++/Rust'],
  ['python', 'Python'],
  ['jupyter', 'Python'],
  ['html', 'Web UI'],
  ['css', 'Web UI'],
  ['scss', 'Web UI'],
  ['less', 'Web UI'],
  ['svelte', 'Web UI'],
  ['sql', 'Data/SQL']
]);

interface Baseline {
  p10: number;
  p90: number;
}

interface Baselines {
  scope: Baseline;
  complexityIntensity: Baseline;
  documentation: Baseline;
  structure: Baseline;
  breadth: Baseline;
  freshness: Baseline;
}

interface RawSignals {
  scope: number;
  complexityIntensity: number;
  documentation: number;
  structure: number;
  breadth: number;
  freshness: number;
}

function safeNumber(value: unknown, fallback: number = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
}

function percentile(sortedValues: number[], p: number): number {
  if (!Array.isArray(sortedValues) || sortedValues.length === 0) return 0;

  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sortedValues[lower];

  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function toDaysSince(dateValue: unknown): number {
  const timestamp = Date.parse(String(dateValue || ''));
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;

  const now = Date.now();
  return Math.max(0, (now - timestamp) / (1000 * 60 * 60 * 24));
}

function resolveLanguageFamily(name: string): string {
  const normalized = String(name || '').trim().toLowerCase();
  return LANGUAGE_FAMILY_ALIASES.get(normalized) || 'Other/Infra';
}

function initializeFamilyTotals(): Map<string, { code: number; complexity: number }> {
  return new Map(
    LANGUAGE_PROFICIENCY_AXES.map((axis) => [axis, { code: 0, complexity: 0 }])
  );
}

function collectFamilyTotals(repo: Partial<Repo>) {
  const familyTotals = initializeFamilyTotals();
  let codeTotal = 0;
  let complexityTotal = 0;

  for (const language of repo.languages || []) {
    const languageName = language?.name;
    if (!languageName || isNonProgrammingLanguage(languageName)) continue;

    const axis = resolveLanguageFamily(languageName);
    const code = Math.max(0, safeNumber((language as { code?: number; lines?: number }).code ?? (language as { lines?: number }).lines));
    const complexity = Math.max(0, safeNumber(language.complexity));
    const family = familyTotals.get(axis)!;
    family.code += code;
    family.complexity += complexity;
    codeTotal += code;
    complexityTotal += complexity;
  }

  return { familyTotals, codeTotal, complexityTotal };
}

function computeLanguageEntropy(languages: Array<{ code?: number; lines?: number }> = []): number {
  const sanitized = Array.isArray(languages) ? languages : [];
  const codeTotal = sanitized.reduce((sum, language) => (
    sum + Math.max(0, safeNumber((language as { code?: number }).code ?? (language as { lines?: number }).lines))
  ), 0);

  if (codeTotal <= 0 || sanitized.length <= 1) return 0;

  const shares = sanitized
    .map((language) => Math.max(0, safeNumber((language as { code?: number }).code ?? (language as { lines?: number }).lines)) / codeTotal)
    .filter((share) => share > 0);

  if (shares.length <= 1) return 0;

  const entropy = -shares.reduce((sum, share) => sum + (share * Math.log2(share)), 0);
  const normalizedEntropy = entropy / Math.log2(shares.length);
  return clamp01(normalizedEntropy);
}

function computeRawSignals(repo: Partial<Repo>): RawSignals {
  const code = Math.max(0, safeNumber(repo.summary?.code));
  const complexity = Math.max(0, safeNumber(repo.summary?.complexity));
  const files = Math.max(0, safeNumber(repo.summary?.files));
  const kloc = Math.max(code / 1000, 1);

  const comments = (repo.languages || []).reduce(
    (sum, language) => sum + Math.max(0, safeNumber(language.comments)),
    0
  );

  return {
    scope: Math.log1p(code),
    complexityIntensity: complexity / kloc,
    documentation: comments / Math.max(code + comments, 1),
    structure: files / kloc,
    breadth: computeLanguageEntropy(repo.languages || []),
    freshness: toDaysSince(repo.lastUpdated)
  };
}

function toBaseline(values: number[]): Baseline {
  const sorted = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (sorted.length === 0) return { p10: 0, p90: 1 };

  const p10 = percentile(sorted, 0.1);
  const p90 = percentile(sorted, 0.9);
  if (!Number.isFinite(p10) || !Number.isFinite(p90) || p90 <= p10) {
    return { p10: sorted[0], p90: sorted[sorted.length - 1] || sorted[0] + 1 };
  }

  return { p10, p90 };
}

function toBand(score: number): QualityBand {
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  return 'Very High';
}

export function normalizeRobust(value: unknown, { p10 = 0, p90 = 1, invert = false } = {}): number {
  const safeValue = safeNumber(value, 0);
  const safeP10 = safeNumber(p10, 0);
  const safeP90 = safeNumber(p90, safeP10 + 1);

  if (safeP90 <= safeP10) return 50;

  const normalized = clamp01((safeValue - safeP10) / (safeP90 - safeP10));
  const score = invert ? (1 - normalized) : normalized;
  return Number.parseFloat((score * 100).toFixed(2));
}

export function computeQualityBaselines(repos: Partial<Repo>[] = []): Baselines {
  const rows = (Array.isArray(repos) ? repos : []).map(computeRawSignals);

  return {
    scope: toBaseline(rows.map((row) => row.scope)),
    complexityIntensity: toBaseline(rows.map((row) => row.complexityIntensity)),
    documentation: toBaseline(rows.map((row) => row.documentation)),
    structure: toBaseline(rows.map((row) => row.structure)),
    breadth: toBaseline(rows.map((row) => row.breadth)),
    freshness: toBaseline(rows.map((row) => row.freshness))
  };
}

export function computeRepoQualitySignals(repo: Partial<Repo> = {}, baselines: Baselines = computeQualityBaselines([repo])): QualitySignal[] {
  const raw = computeRawSignals(repo);

  const signals = [
    { axis: 'Scope', score: normalizeRobust(raw.scope, baselines.scope) },
    { axis: 'Complexity Control', score: normalizeRobust(raw.complexityIntensity, { ...baselines.complexityIntensity, invert: true }) },
    { axis: 'Documentation', score: normalizeRobust(raw.documentation, baselines.documentation) },
    { axis: 'Structure', score: normalizeRobust(raw.structure, baselines.structure) },
    { axis: 'Breadth', score: normalizeRobust(raw.breadth, baselines.breadth) },
    { axis: 'Freshness', score: normalizeRobust(raw.freshness, { ...baselines.freshness, invert: true }) }
  ];

  return signals.map((signal) => ({
    ...signal,
    band: toBand(signal.score)
  }));
}

export function computeOverallCategorySpider(repos: Partial<Repo>[] = []): AxisScore[] {
  const list = Array.isArray(repos) ? repos : [];
  const totals = new Map(CATEGORY_AXES.map((axis) => [axis, { weighted: 0, weight: 0 }]));

  for (const repo of list) {
    const weight = Math.sqrt(Math.max(1, safeNumber(repo.summary?.code)));
    const confidenceByCategory = new Map(
      (repo.projectTags || []).map((tag) => [tag.label, safeNumber(tag.confidence)])
    );

    for (const axis of CATEGORY_AXES) {
      const bucket = totals.get(axis)!;
      bucket.weighted += weight * (confidenceByCategory.get(axis) || 0);
      bucket.weight += weight;
    }
  }

  return [...CATEGORY_AXES].map((axis) => {
    const bucket = totals.get(axis)!;
    const score = bucket.weight > 0 ? (bucket.weighted / bucket.weight) * 100 : 0;
    return { axis, score: Number.parseFloat(score.toFixed(2)) };
  });
}

export function computeOverallQualityStats(repos: Partial<Repo>[] = [], baselines: Baselines = computeQualityBaselines(repos)): QualitySignal[] {
  const list = Array.isArray(repos) ? repos : [];
  if (list.length === 0) {
    return [...QUALITY_AXES].map((axis) => ({ axis, score: 0, band: 'Low' as QualityBand }));
  }

  const aggregate = new Map<string, number>(QUALITY_AXES.map((axis) => [axis, 0]));

  for (const repo of list) {
    const signals = computeRepoQualitySignals(repo, baselines);
    for (const signal of signals) {
      aggregate.set(signal.axis, (aggregate.get(signal.axis) || 0) + signal.score);
    }
  }

  return [...QUALITY_AXES].map((axis) => {
    const score = (aggregate.get(axis) || 0) / list.length;
    return {
      axis,
      score: Number.parseFloat(score.toFixed(2)),
      band: toBand(score)
    };
  });
}

export function computeOverallLanguageProficiencySpider(repos: Partial<Repo>[] = []): AxisScore[] {
  const list = Array.isArray(repos) ? repos : [];
  const totals = new Map(
    LANGUAGE_PROFICIENCY_AXES.map((axis) => [axis, { weighted: 0, weight: 0 }])
  );

  for (const repo of list) {
    const { familyTotals, codeTotal, complexityTotal } = collectFamilyTotals(repo);
    const daysSince = toDaysSince(repo?.lastUpdated);
    const recencyFactor = clamp(1 - (Math.min(daysSince, 1095) / 1095), 0.25, 1.0);
    const repoWeight = Math.sqrt(Math.max(1, safeNumber(repo.summary?.code))) * recencyFactor;

    for (const axis of LANGUAGE_PROFICIENCY_AXES) {
      const family = familyTotals.get(axis)!;
      const familyCodeShare = codeTotal > 0 ? family.code / codeTotal : 0;
      const familyComplexityShare = complexityTotal > 0
        ? family.complexity / complexityTotal
        : familyCodeShare;
      const familyRepoSignal = (0.7 * familyCodeShare) + (0.3 * familyComplexityShare);

      const bucket = totals.get(axis)!;
      bucket.weighted += repoWeight * familyRepoSignal;
      bucket.weight += repoWeight;
    }
  }

  return [...LANGUAGE_PROFICIENCY_AXES].map((axis) => {
    const bucket = totals.get(axis)!;
    const score = bucket.weight > 0 ? (bucket.weighted / bucket.weight) * 100 : 0;
    return { axis, score: Number.parseFloat(score.toFixed(2)) };
  });
}
