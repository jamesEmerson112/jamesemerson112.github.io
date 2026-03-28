/**
 * Data Loader Utility
 * Fetches portfolio metrics from the generated JSON files
 */

// Re-export formatters for backward compatibility during migration
export { formatNumber, formatCurrency, formatYears, formatDuration } from './formatters.js';

/**
 * Fetch the master portfolio index
 * @returns {Promise<Object>} Portfolio index data
 */
export async function fetchPortfolioIndex() {
  try {
    const response = await fetch('/metrics/index.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio index: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading portfolio index:', error);
    throw error;
  }
}

/**
 * Fetch detailed metrics for a specific repository
 * @param {string} detailsFile - Path to the repo details file (e.g., "repos/repo-001.json")
 * @returns {Promise<Object>} Repository details
 */
export async function fetchRepoDetails(detailsFile) {
  if (!/^repos\/[a-zA-Z0-9_-]+\.json$/.test(detailsFile)) {
    throw new Error(`Invalid details file path: ${detailsFile}`);
  }
  try {
    const response = await fetch(`/metrics/${detailsFile}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch repo details: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading repo details from ${detailsFile}:`, error);
    throw error;
  }
}


const LANGUAGE_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  Svelte: '#ff3e00',
  HTML: '#e34f26',
  CSS: '#1572b6',
  Shell: '#89e051',
  Markdown: '#083fa1',
  JSON: '#f5f5f5',
  SQL: '#336791',
  C: '#a8b9cc',
  'C++': '#00599c',
  Go: '#00add8',
  Rust: '#dea584',
  Java: '#b07219',
  Swift: '#f05138'
};

const NON_PROGRAMMING_LANGUAGE_NAMES = new Set([
  'plain text',
  'markdown',
  'json',
  'csv',
  'license',
  'yaml',
  'yml',
  'toml',
  'xml',
  'tex'
]);

/**
 * Resolve a language display color for badges/charts
 * @param {string} language - Language name
 * @returns {string} Hex color string
 */
export function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || '#64748b';
}

/**
 * Whether a language/file type is non-programming for badge display.
 * @param {string} language - Language name
 * @returns {boolean}
 */
export function isNonProgrammingLanguage(language) {
  const normalized = String(language || '').trim().toLowerCase();
  return NON_PROGRAMMING_LANGUAGE_NAMES.has(normalized);
}

/**
 * Display-safe top language label for recruiter-facing cards/panels.
 * @param {string} language - Raw top language label
 * @param {Array<Object>} languages - Language breakdown for fallback scan
 * @returns {string} Display label
 */
export function getDisplayPrimaryLanguage(language, languages = []) {
  return resolveDominantProgrammingLanguage(language, languages);
}

function toMetricNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeLanguageEntry(language) {
  if (language && typeof language === 'object') {
    return {
      name: String(language.name || '').trim(),
      code: toMetricNumber(language.code ?? language.lines),
      lines: toMetricNumber(language.lines),
      complexity: toMetricNumber(language.complexity)
    };
  }

  return {
    name: '',
    code: 0,
    lines: 0,
    complexity: 0
  };
}

function toLanguageEntryList(languages) {
  if (Array.isArray(languages)) {
    return languages
      .map(normalizeLanguageEntry)
      .filter((language) => language.name.length > 0);
  }

  if (languages && typeof languages === 'object') {
    return Object.entries(languages)
      .map(([name, details]) => normalizeLanguageEntry({
        ...(details && typeof details === 'object' ? details : {}),
        name
      }))
      .filter((language) => language.name.length > 0);
  }

  return [];
}

function compareLanguageEntriesByDominance(a, b) {
  const codeDelta = b.code - a.code;
  if (codeDelta !== 0) {
    return codeDelta;
  }

  const linesDelta = b.lines - a.lines;
  if (linesDelta !== 0) {
    return linesDelta;
  }

  return a.name.localeCompare(b.name);
}

/**
 * Build recruiter-facing composition shares from language data.
 * Programming languages are kept, and non-programming/tail share is bucketed into "Other".
 * @param {Array<Object>|Object} languages - Repo language breakdown
 * @param {Object} options - Composition options
 * @param {number} options.maxProgrammingLanguages - Max programming entries to keep
 * @param {number} options.otherThresholdPercent - Minimum percent to render Other
 * @returns {Array<Object>} Composition rows with code and complexity shares
 */
export function buildProgrammingComposition(languages = [], options = {}) {
  const maxProgrammingLanguages = Number.isFinite(Number(options.maxProgrammingLanguages))
    ? Math.max(0, Math.floor(Number(options.maxProgrammingLanguages)))
    : Number.POSITIVE_INFINITY;
  const otherThresholdPercent = Number.isFinite(Number(options.otherThresholdPercent))
    ? Math.max(0, Number(options.otherThresholdPercent))
    : 0.5;

  const sortedEntries = toLanguageEntryList(languages)
    .sort(compareLanguageEntriesByDominance);
  const totalCode = sortedEntries.reduce((sum, entry) => sum + entry.code, 0);

  if (totalCode <= 0) {
    return [];
  }

  const totalComplexity = sortedEntries.reduce((sum, entry) => sum + entry.complexity, 0);
  const sharedEntries = sortedEntries.map((entry) => ({
    ...entry,
    percent: (entry.code / totalCode) * 100,
    complexityPercent: totalComplexity > 0
      ? (entry.complexity / totalComplexity) * 100
      : 0
  }));

  const keptProgrammingEntries = sharedEntries
    .filter((entry) => !isNonProgrammingLanguage(entry.name))
    .slice(0, maxProgrammingLanguages);
  const keptProgrammingNames = new Set(keptProgrammingEntries.map((entry) => entry.name));
  const keptProgrammingShare = keptProgrammingEntries
    .reduce((sum, entry) => sum + entry.percent, 0);
  const otherShare = Math.max(0, 100 - keptProgrammingShare);

  if (otherShare < otherThresholdPercent) {
    return keptProgrammingEntries;
  }

  const otherEntries = sharedEntries.filter((entry) => !keptProgrammingNames.has(entry.name));
  const otherCode = otherEntries.reduce((sum, entry) => sum + entry.code, 0);
  const otherComplexity = otherEntries.reduce((sum, entry) => sum + entry.complexity, 0);
  const otherComplexityPercent = totalComplexity > 0
    ? (otherComplexity / totalComplexity) * 100
    : 0;

  return [
    ...keptProgrammingEntries,
    {
      name: 'Other',
      code: otherCode,
      lines: 0,
      complexity: otherComplexity,
      percent: otherShare,
      complexityPercent: otherComplexityPercent
    }
  ];
}

/**
 * Resolve dominant programming language for recruiter-facing labels.
 * @param {string} primaryLanguage - Repo primary language
 * @param {Array<Object>} languages - Repo language breakdown
 * @returns {string} Dominant programming language or "N/A"
 */
export function resolveDominantProgrammingLanguage(primaryLanguage, languages = []) {
  const normalizedPrimary = String(primaryLanguage || '').trim();
  if (normalizedPrimary && !isNonProgrammingLanguage(normalizedPrimary)) {
    return normalizedPrimary;
  }

  const rankedLanguages = toLanguageEntryList(languages)
    .sort(compareLanguageEntriesByDominance);

  const firstProgrammingLanguage = rankedLanguages
    .find((language) => !isNonProgrammingLanguage(language.name));

  return firstProgrammingLanguage?.name || 'N/A';
}

function normalizeHexColor(input) {
  const value = String(input || '').trim();
  const hex = value.startsWith('#') ? value.slice(1) : value;

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return hex
      .split('')
      .map((part) => part + part)
      .join('')
      .toLowerCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }

  return null;
}

/**
 * Resolve readable foreground text for colored badges.
 * Uses WCAG relative luminance on the source color.
 * @param {string} hexColor - Hex color string
 * @returns {string} Foreground color hex
 */
export function getContrastTextColor(hexColor) {
  const normalized = normalizeHexColor(hexColor);
  if (!normalized) {
    return '#f8fafc';
  }

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const linear = (channel) => (
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  );

  const luminance = (0.2126 * linear(r)) + (0.7152 * linear(g)) + (0.0722 * linear(b));

  return luminance > 0.45 ? '#0f172a' : '#f8fafc';
}
