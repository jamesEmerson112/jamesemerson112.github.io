import { writable, derived } from 'svelte/store';
import { fetchPortfolioIndex } from '../utils/dataLoader.js';
import { filterAndSortRepos, getAvailableLanguages } from '../utils/portfolioTransforms.js';
import {
  computeQualityBaselines,
  computeOverallCategorySpider,
  computeOverallQualityStats
} from '../utils/profileMetrics.js';

/**
 * Portfolio Store
 * Manages portfolio metrics state
 */

// Create a writable store for the portfolio data
function createPortfolioStore() {
  const { subscribe, set, update } = writable({
    data: null,
    loading: true,
    error: null
  });

  return {
    subscribe,

    // Load portfolio data from the API
    async load() {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const data = await fetchPortfolioIndex();
        set({ data, loading: false, error: null });
      } catch (error) {
        set({ data: null, loading: false, error: error.message });
      }
    },

    // Reset the store
    reset() {
      set({ data: null, loading: false, error: null });
    },

    // Test/support helper for deterministic state initialization
    hydrate(data) {
      set({ data, loading: false, error: null });
    }
  };
}

export const portfolio = createPortfolioStore();

// Derived stores for easy access to specific data
export const portfolioTotals = derived(
  portfolio,
  $portfolio => $portfolio.data?.portfolioTotals || null
);

export const repos = derived(
  portfolio,
  $portfolio => $portfolio.data?.repos || []
);

export const languages = derived(
  portfolio,
  $portfolio => $portfolio.data?.portfolioTotals?.languages || {}
);

export const isLoading = derived(
  portfolio,
  $portfolio => $portfolio.loading
);

export const hasError = derived(
  portfolio,
  $portfolio => $portfolio.error
);

// Compatibility aliases for advanced portfolio components
export const loading = isLoading;
export const error = hasError;

// UI state for filters and sorting
export const searchTerm = writable('');
export const languageFilter = writable('all');
export const categoryFilter = writable('all');
export const sortBy = writable('lines');
export const sortOrder = writable('desc');
export const selectedRepo = writable(null);

export const availableLanguages = derived(
  repos,
  ($repos) => getAvailableLanguages($repos)
);

const CATEGORY_ORDER = ['AI/ML', 'Web', 'Backend', 'Data', 'DevOps', 'Mobile'];

export const availableCategories = derived(
  repos,
  ($repos) => {
    const set = new Set();
    for (const repo of $repos || []) {
      for (const tag of repo.projectTags || []) {
        if (tag?.label) {
          set.add(tag.label);
        }
      }
    }

    return [...set].sort((a, b) => {
      const aIdx = CATEGORY_ORDER.indexOf(a);
      const bIdx = CATEGORY_ORDER.indexOf(b);
      const safeA = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
      const safeB = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;
      if (safeA !== safeB) return safeA - safeB;
      return a.localeCompare(b);
    });
  }
);

export const filteredRepos = derived(
  [repos, searchTerm, languageFilter, categoryFilter, sortBy, sortOrder],
  ([$repos, $searchTerm, $languageFilter, $categoryFilter, $sortBy, $sortOrder]) => filterAndSortRepos(
    $repos,
    {
      searchTerm: $searchTerm,
      languageFilter: $languageFilter,
      categoryFilter: $categoryFilter,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    }
  )
);

export const categoryFilteredRepos = filteredRepos;

export const qualityBaselines = derived(
  repos,
  ($repos) => computeQualityBaselines($repos)
);

export const overallCategoryStats = derived(
  repos,
  ($repos) => computeOverallCategorySpider($repos)
);

export const overallQualityStats = derived(
  [repos, qualityBaselines],
  ([$repos, $qualityBaselines]) => computeOverallQualityStats($repos, $qualityBaselines)
);

export async function loadPortfolioData() {
  await portfolio.load();
}

export function toggleSortOrder() {
  sortOrder.update((current) => (current === 'desc' ? 'asc' : 'desc'));
}

export function resetFilters() {
  searchTerm.set('');
  languageFilter.set('all');
  categoryFilter.set('all');
  sortBy.set('lines');
  sortOrder.set('desc');
}
