/**
 * Pure helpers for portfolio filtering and sorting.
 */

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function safeDate(value) {
  const ts = Date.parse(value || '');
  return Number.isFinite(ts) ? ts : 0;
}

export function filterRepos(repoList, search = '', language = 'all', category = 'all') {
  const normalizedSearch = (search || '').trim().toLowerCase();
  const normalizedLanguage = (language || 'all').toLowerCase();
  const normalizedCategory = (category || 'all').toLowerCase();

  return (repoList || []).filter((repo) => {
    if (normalizedLanguage !== 'all') {
      const primary = (repo.primaryLanguage || '').toLowerCase();
      if (primary !== normalizedLanguage) {
        return false;
      }
    }

    if (normalizedCategory !== 'all') {
      const categories = Array.isArray(repo.projectTags) ? repo.projectTags : [];
      const hasCategory = categories.some(
        (tag) => (tag?.label || '').toLowerCase() === normalizedCategory
      );
      if (!hasCategory) {
        return false;
      }
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      repo.name,
      repo.description,
      repo.primaryLanguage
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

export function sortRepos(repoList, by = 'lines', order = 'desc') {
  const direction = order === 'asc' ? 1 : -1;

  return [...(repoList || [])].sort((a, b) => {
    switch (by) {
      case 'name': {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        return aName.localeCompare(bName) * direction;
      }
      case 'updated': {
        return (safeDate(a.lastUpdated) - safeDate(b.lastUpdated)) * direction;
      }
      case 'cost': {
        const aCost = safeNumber(a.summary?.aiCost);
        const bCost = safeNumber(b.summary?.aiCost);
        return (aCost - bCost) * direction;
      }
      case 'lines':
      default: {
        const aLines = safeNumber(a.summary?.lines);
        const bLines = safeNumber(b.summary?.lines);
        return (aLines - bLines) * direction;
      }
    }
  });
}

export function filterAndSortRepos(repoList, options = {}) {
  const {
    searchTerm = '',
    languageFilter = 'all',
    categoryFilter = 'all',
    sortBy = 'lines',
    sortOrder = 'desc'
  } = options;

  const filtered = filterRepos(repoList, searchTerm, languageFilter, categoryFilter);
  return sortRepos(filtered, sortBy, sortOrder);
}

export function getAvailableLanguages(repoList) {
  const set = new Set();

  for (const repo of repoList || []) {
    if (repo?.primaryLanguage) {
      set.add(repo.primaryLanguage);
    }
  }

  return [...set].sort((a, b) => a.localeCompare(b));
}
