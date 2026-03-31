import type { SpiderDataPoint } from '../types.js';

const DEFAULT_MAX_AXES = 8;

type MetricType = 'code' | 'complexity';

interface LanguageInput {
  name?: string;
  code?: number;
  lines?: number;
  complexity?: number;
}

interface NormalizedLang {
  name: string;
  code: number;
  complexity: number;
  isOther?: boolean;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeMetric(metric: string): MetricType {
  return metric === 'complexity' ? 'complexity' : 'code';
}

function metricValue(language: NormalizedLang, metric: MetricType): number {
  return metric === 'complexity' ? language.complexity : language.code;
}

function normalizeLanguage(language: LanguageInput): NormalizedLang {
  return {
    name: language?.name || 'Unknown',
    code: toNumber(language?.code ?? language?.lines),
    complexity: toNumber(language?.complexity)
  };
}

export function rankLanguages(languages: LanguageInput[] = [], metric: string = 'code'): NormalizedLang[] {
  const activeMetric = normalizeMetric(metric);
  const normalized = Array.isArray(languages) ? languages.map(normalizeLanguage) : [];

  return normalized.sort((a, b) => {
    const metricDelta = metricValue(b, activeMetric) - metricValue(a, activeMetric);
    if (metricDelta !== 0) return metricDelta;

    const codeDelta = b.code - a.code;
    if (codeDelta !== 0) return codeDelta;

    return a.name.localeCompare(b.name);
  });
}

export function computePercentShare(languages: LanguageInput[] = [], metric: string = 'code') {
  const activeMetric = normalizeMetric(metric);
  const ranked = rankLanguages(languages, activeMetric);
  const total = ranked.reduce((sum, language) => sum + metricValue(language, activeMetric), 0);

  return ranked.map((language) => ({
    ...language,
    percent: total > 0 ? (metricValue(language, activeMetric) / total) * 100 : 0
  }));
}

interface SpiderDatasetOptions {
  metric?: string;
  maxAxes?: number;
  aggregateOther?: boolean;
}

export function buildSpiderDataset(languages: LanguageInput[] = [], options: SpiderDatasetOptions = {}): SpiderDataPoint[] {
  const metric = normalizeMetric(options.metric || 'code');
  const maxAxes = Number.isFinite(Number(options.maxAxes))
    ? Math.max(1, Math.floor(Number(options.maxAxes)))
    : DEFAULT_MAX_AXES;
  const aggregateOther = options.aggregateOther !== false;

  const ranked = rankLanguages(languages, metric);
  if (ranked.length === 0) return [];

  const totalCode = ranked.reduce((sum, language) => sum + language.code, 0);
  const totalComplexity = ranked.reduce((sum, language) => sum + language.complexity, 0);

  let selected: NormalizedLang[] = ranked;
  if (aggregateOther && ranked.length > maxAxes) {
    const head = ranked.slice(0, maxAxes);
    const tail = ranked.slice(maxAxes);
    const other = tail.reduce<NormalizedLang>(
      (acc, language) => {
        acc.code += language.code;
        acc.complexity += language.complexity;
        return acc;
      },
      { name: 'Other', code: 0, complexity: 0, isOther: true }
    );
    selected = [...head, other];
  } else if (ranked.length > maxAxes) {
    selected = ranked.slice(0, maxAxes);
  }

  return selected.map((language) => {
    const codePercent = totalCode > 0 ? (language.code / totalCode) * 100 : 0;
    const complexityPercent = totalComplexity > 0
      ? (language.complexity / totalComplexity) * 100
      : 0;
    const valuePercent = metric === 'complexity' ? complexityPercent : codePercent;

    return {
      ...language,
      codePercent,
      complexityPercent,
      valuePercent
    };
  });
}
