const CATEGORY_ORDER = ['AI/ML', 'Web', 'Backend', 'Data', 'DevOps', 'Mobile'];

const LANGUAGE_WEIGHTS = {
  Python: { 'AI/ML': 0.9, Data: 0.6, Backend: 0.3 },
  Jupyter: { 'AI/ML': 1.0, Data: 0.9 },
  R: { 'AI/ML': 0.8, Data: 0.8 },
  SQL: { Data: 1.0, Backend: 0.3 },
  CSV: { Data: 0.8 },
  JavaScript: { Web: 0.9, Backend: 0.5 },
  TypeScript: { Web: 0.9, Backend: 0.6 },
  HTML: { Web: 1.0 },
  CSS: { Web: 1.0 },
  SCSS: { Web: 0.9 },
  Svelte: { Web: 1.0 },
  Vue: { Web: 1.0 },
  Go: { Backend: 0.9, DevOps: 0.4 },
  Rust: { Backend: 0.8, DevOps: 0.2 },
  Java: { Backend: 0.8, Mobile: 0.4 },
  Kotlin: { Mobile: 0.8, Backend: 0.5 },
  Swift: { Mobile: 1.0 },
  Dart: { Mobile: 1.0 },
  'Objective-C': { Mobile: 1.0 },
  'C#': { Backend: 0.8 },
  Shell: { DevOps: 1.0, Backend: 0.2 },
  Dockerfile: { DevOps: 1.0 },
  YAML: { DevOps: 0.7 },
  Makefile: { DevOps: 0.6 },
  HCL: { DevOps: 1.0 }
};

const KEYWORD_SCORES = {
  'AI/ML': [
    'ai', 'ml', 'machine learning', 'llm', 'nlp', 'vision', 'model',
    'pytorch', 'tensorflow', 'huggingface', 'embedding', 'prompt'
  ],
  Web: [
    'web', 'frontend', 'backend-for-frontend', 'dashboard', 'ui', 'react',
    'vue', 'svelte', 'next', 'vite'
  ],
  Backend: [
    'backend', 'api', 'service', 'server', 'microservice', 'auth',
    'graphql', 'grpc'
  ],
  Data: [
    'data', 'etl', 'analytics', 'pipeline', 'warehouse', 'feature store',
    'notebook', 'sql'
  ],
  DevOps: [
    'devops', 'infra', 'infrastructure', 'docker', 'kubernetes', 'k8s',
    'terraform', 'ansible', 'cicd', 'github actions', 'deployment'
  ],
  Mobile: [
    'mobile', 'ios', 'android', 'react-native', 'flutter'
  ]
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(metadata = {}) {
  return [
    metadata?.name || '',
    metadata?.description || '',
    ...(Array.isArray(metadata?.topics) ? metadata.topics : [])
  ]
    .join(' ')
    .toLowerCase();
}

function scoreFromLanguages(languages = [], scores) {
  const sanitized = Array.isArray(languages) ? languages : [];

  let totalShare = 0;
  for (const lang of sanitized) {
    const pct = toNumber(lang?.percentOfCode);
    if (pct > 0) {
      totalShare += pct;
    }
  }

  for (const lang of sanitized) {
    const langName = lang?.name;
    if (!langName) continue;

    const weights = LANGUAGE_WEIGHTS[langName];
    if (!weights) continue;

    const rawPct = toNumber(lang?.percentOfCode);
    const share = totalShare > 0
      ? rawPct / totalShare
      : 1 / Math.max(sanitized.length, 1);

    for (const [category, weight] of Object.entries(weights)) {
      scores[category] += share * weight;
    }
  }
}

function scoreFromKeywords(metadata = {}, scores) {
  const text = normalizeText(metadata);
  if (!text) return;

  for (const [category, keywords] of Object.entries(KEYWORD_SCORES)) {
    let hitCount = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        hitCount += 1;
      }
    }

    if (hitCount > 0) {
      // Keyword signal is supplementary to language signal.
      scores[category] += Math.min(0.45, hitCount * 0.1);
    }
  }
}

export function classifyProjectTags({ languages = [], metadata = {}, maxTags = 2 } = {}) {
  const scores = {
    'AI/ML': 0,
    Web: 0,
    Backend: 0,
    Data: 0,
    DevOps: 0,
    Mobile: 0
  };

  scoreFromLanguages(languages, scores);
  scoreFromKeywords(metadata, scores);

  const ranked = CATEGORY_ORDER
    .map((label) => ({ label, score: scores[label] || 0 }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label);
    });

  if (ranked.length === 0) {
    return [];
  }

  const selected = ranked.slice(0, Math.max(1, maxTags));
  const total = selected.reduce((sum, item) => sum + item.score, 0);

  return selected.map((item) => ({
    label: item.label,
    confidence: total > 0
      ? Number.parseFloat((item.score / total).toFixed(2))
      : 0
  }));
}
