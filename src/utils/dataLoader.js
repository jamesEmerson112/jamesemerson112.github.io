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

/**
 * Resolve a language display color for badges/charts
 * @param {string} language - Language name
 * @returns {string} Hex color string
 */
export function getLanguageColor(language) {
  return LANGUAGE_COLORS[language] || '#64748b';
}
