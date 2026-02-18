const DEFAULT_MAX_AXES = 8;

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeMetric(metric) {
  return metric === 'complexity' ? 'complexity' : 'code';
}

function metricValue(language, metric) {
  if (metric === 'complexity') {
    return toNumber(language.complexity);
  }

  // Prefer code for charting, with lines as a backward-compat fallback.
  return toNumber(language.code ?? language.lines);
}

function normalizeLanguage(language) {
  return {
    name: language?.name || 'Unknown',
    code: toNumber(language?.code ?? language?.lines),
    complexity: toNumber(language?.complexity)
  };
}

export function rankLanguages(languages = [], metric = 'code') {
  const activeMetric = normalizeMetric(metric);
  const normalized = Array.isArray(languages) ? languages.map(normalizeLanguage) : [];

  return normalized.sort((a, b) => {
    const metricDelta = metricValue(b, activeMetric) - metricValue(a, activeMetric);
    if (metricDelta !== 0) {
      return metricDelta;
    }

    const codeDelta = b.code - a.code;
    if (codeDelta !== 0) {
      return codeDelta;
    }

    return a.name.localeCompare(b.name);
  });
}

export function computePercentShare(languages = [], metric = 'code') {
  const activeMetric = normalizeMetric(metric);
  const ranked = rankLanguages(languages, activeMetric);
  const total = ranked.reduce((sum, language) => sum + metricValue(language, activeMetric), 0);

  return ranked.map((language) => ({
    ...language,
    percent: total > 0 ? (metricValue(language, activeMetric) / total) * 100 : 0
  }));
}

export function buildSpiderDataset(languages = [], options = {}) {
  const metric = normalizeMetric(options.metric);
  const maxAxes = Number.isFinite(Number(options.maxAxes))
    ? Math.max(1, Math.floor(Number(options.maxAxes)))
    : DEFAULT_MAX_AXES;
  const aggregateOther = options.aggregateOther !== false;

  const ranked = rankLanguages(languages, metric);
  if (ranked.length === 0) {
    return [];
  }

  const totalCode = ranked.reduce((sum, language) => sum + language.code, 0);
  const totalComplexity = ranked.reduce((sum, language) => sum + language.complexity, 0);

  let selected = ranked;
  if (aggregateOther && ranked.length > maxAxes) {
    const head = ranked.slice(0, maxAxes);
    const tail = ranked.slice(maxAxes);
    const other = tail.reduce(
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
