/**
 * Data Loader Utility
 * Fetches portfolio metrics from the generated JSON files
 */

// Re-export for backward compatibility during migration
export { formatNumber, formatCurrency, formatYears, formatDuration } from './formatters.js';
export {
  getLanguageColor,
  isNonProgrammingLanguage,
  getDisplayPrimaryLanguage,
  buildProgrammingComposition,
  resolveDominantProgrammingLanguage,
  getContrastTextColor
} from './languageUtils.js';

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
