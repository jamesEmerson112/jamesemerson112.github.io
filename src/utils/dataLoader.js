/**
 * Data Loader Utility
 * Fetches portfolio metrics from the generated JSON files
 */

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

/**
 * Format large numbers with commas for readability
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

/**
 * Format currency values
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency (e.g., "$2.8M")
 */
export function formatCurrency(amount) {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

/**
 * Format time periods
 * @param {number} years - Years to format
 * @returns {string} Formatted time period
 */
export function formatYears(years) {
  if (years >= 1) {
    return `${Math.round(years)} year${years !== 1 ? 's' : ''}`;
  }
  const months = Math.round(years * 12);
  return `${months} month${months !== 1 ? 's' : ''}`;
}

/**
 * Get top N languages by percentage
 * @param {Object} languages - Languages object from portfolio data
 * @param {number} count - Number of top languages to return
 * @returns {Array} Array of language objects sorted by percentage
 */
export function getTopLanguages(languages, count = 8) {
  return Object.entries(languages)
    .map(([name, data]) => ({
      name,
      ...data
    }))
    .sort((a, b) => b.percentOfTotal - a.percentOfTotal)
    .slice(0, count);
}

/**
 * Format months into a short duration label
 * @param {number} months - Duration in months
 * @returns {string} Formatted duration (e.g., "8 mo", "1.5 yrs")
 */
export function formatDuration(months) {
  if (!Number.isFinite(months) || months <= 0) {
    return '0 mo';
  }

  if (months >= 12) {
    const years = months / 12;
    return years >= 10 ? `${Math.round(years)} yrs` : `${years.toFixed(1)} yrs`;
  }

  if (months < 1) {
    const weeks = Math.max(1, Math.round(months * 4.33));
    return `${weeks} wk${weeks === 1 ? '' : 's'}`;
  }

  return `${months.toFixed(1)} mo`;
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
 * @returns {string} Display label
 */
export function getDisplayPrimaryLanguage(language) {
  if (!language) {
    return '';
  }

  return isNonProgrammingLanguage(language) ? 'Programming Language' : language;
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
