import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { filterAndSortRepos, getAvailableLanguages } from '../utils/portfolioTransforms.ts';
import {
  CATEGORY_AXES,
  computeQualityBaselines,
  computeOverallCategorySpider,
  computeOverallLanguageProficiencySpider,
  computeOverallQualityStats
} from '../utils/profileMetrics.ts';
import type { PortfolioIndex, Repo, SortKey, SortOrder, PortfolioStoreState } from '../types.js';

function createPortfolioStore() {
  const { subscribe, set, update } = writable<PortfolioStoreState>({
    data: null,
    loading: true,
    error: null
  });

  return {
    subscribe,

    async load() {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch('/metrics/index.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio index: ${response.status}`);
        }
        const data: PortfolioIndex = await response.json();
        set({ data, loading: false, error: null });
      } catch (err) {
        set({ data: null, loading: false, error: (err as Error).message });
      }
    },

    reset() {
      set({ data: null, loading: false, error: null });
    },

    hydrate(data: PortfolioIndex) {
      set({ data, loading: false, error: null });
    }
  };
}

export const portfolio = createPortfolioStore();

export const repos: Readable<Repo[]> = derived(
  portfolio,
  $portfolio => $portfolio.data?.repos || []
);

export const isLoading: Readable<boolean> = derived(
  portfolio,
  $portfolio => $portfolio.loading
);

export const hasError: Readable<string | null> = derived(
  portfolio,
  $portfolio => $portfolio.error
);

export const searchTerm: Writable<string> = writable('');
export const languageFilter: Writable<string> = writable('all');
export const categoryFilter: Writable<string> = writable('all');
export const sortBy: Writable<SortKey> = writable<SortKey>('recent');
export const sortOrder: Writable<SortOrder> = writable<SortOrder>('desc');
export const selectedRepo: Writable<Repo | null> = writable<Repo | null>(null);

export const availableLanguages: Readable<string[]> = derived(
  repos,
  ($repos) => getAvailableLanguages($repos)
);

const CATEGORY_ORDER: readonly string[] = CATEGORY_AXES;

export const availableCategories: Readable<string[]> = derived(
  repos,
  ($repos) => {
    const set = new Set<string>();
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

export const filteredRepos: Readable<Repo[]> = derived(
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

export const qualityBaselines = derived(
  repos,
  ($repos) => computeQualityBaselines($repos)
);

export const overallCategoryStats = derived(
  repos,
  ($repos) => computeOverallCategorySpider($repos)
);

export const overallLanguageProficiencyStats = derived(
  repos,
  ($repos) => computeOverallLanguageProficiencySpider($repos)
);

export const overallQualityStats = derived(
  [repos, qualityBaselines],
  ([$repos, $qualityBaselines]) => computeOverallQualityStats($repos, $qualityBaselines)
);

export async function loadPortfolioData(): Promise<void> {
  await portfolio.load();
}

export function toggleSortOrder(): void {
  sortOrder.update((current) => (current === 'desc' ? 'asc' : 'desc'));
}

export function resetFilters(): void {
  searchTerm.set('');
  languageFilter.set('all');
  categoryFilter.set('all');
  sortBy.set('recent');
  sortOrder.set('desc');
}
