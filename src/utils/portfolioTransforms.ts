import type { Repo, SortKey, SortOrder } from '../types.js';

function safeNumber(value: unknown, fallback: number = 0): number {
  return Number.isFinite(value) ? value as number : fallback;
}

function safeDate(value: unknown): number {
  const ts = Date.parse(String(value || ''));
  return Number.isFinite(ts) ? ts : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function compareNames(a: Repo, b: Repo): number {
  const aName = (a?.name || '').toLowerCase();
  const bName = (b?.name || '').toLowerCase();
  return aName.localeCompare(bName);
}

function isPrivateRepo(repo: Repo): boolean {
  return repo?.isPrivate === true;
}

function getPrivacyBucket(repo: Repo): 'public' | 'private' {
  return isPrivateRepo(repo) ? 'private' : 'public';
}

function getRepoCode(repo: Repo): number {
  const summary = repo?.summary || {} as Repo['summary'];
  const code = safeNumber(summary.code, safeNumber(summary.lines));
  return Math.max(0, code);
}

function getRecentBlendScore(repo: Repo, nowTimestamp: number, maxCode: number): number {
  const lastUpdated = safeDate(repo?.lastUpdated);
  const daysSince = lastUpdated > 0
    ? Math.max(0, (nowTimestamp - lastUpdated) / 86400000)
    : Number.POSITIVE_INFINITY;
  const recencyScore = clamp(1 - (Math.min(daysSince, 730) / 730), 0, 1);
  const sizeScore = clamp(
    Math.log1p(getRepoCode(repo)) / Math.log1p(Math.max(maxCode, 1)),
    0,
    1
  );
  return (0.7 * recencyScore) + (0.3 * sizeScore);
}

function buildRecentScoreMap(repoList: Repo[], nowTimestamp: number): Map<Repo, number> {
  const maxCodeByBucket = new Map<string, number>([
    ['public', 1],
    ['private', 1]
  ]);

  for (const repo of repoList) {
    const bucket = getPrivacyBucket(repo);
    const currentMax = maxCodeByBucket.get(bucket) || 1;
    maxCodeByBucket.set(bucket, Math.max(currentMax, getRepoCode(repo)));
  }

  return new Map(
    repoList.map((repo) => {
      const bucket = getPrivacyBucket(repo);
      const maxCode = maxCodeByBucket.get(bucket) || 1;
      return [repo, getRecentBlendScore(repo, nowTimestamp, maxCode)] as const;
    })
  );
}

export function filterRepos(repoList: Repo[], search: string = '', language: string = 'all', category: string = 'all'): Repo[] {
  const normalizedSearch = (search || '').trim().toLowerCase();
  const normalizedLanguage = (language || 'all').toLowerCase();
  const normalizedCategory = (category || 'all').toLowerCase();

  return (repoList || []).filter((repo) => {
    if (normalizedLanguage !== 'all') {
      const primary = (repo.primaryLanguage || '').toLowerCase();
      if (primary !== normalizedLanguage) return false;
    }

    if (normalizedCategory !== 'all') {
      const categories = Array.isArray(repo.projectTags) ? repo.projectTags : [];
      const hasCategory = categories.some(
        (tag) => (tag?.label || '').toLowerCase() === normalizedCategory
      );
      if (!hasCategory) return false;
    }

    if (!normalizedSearch) return true;

    const haystack = [repo.name, repo.description, repo.primaryLanguage]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

export function sortRepos(repoList: Repo[], by: SortKey = 'lines', order: SortOrder = 'desc'): Repo[] {
  const direction = order === 'asc' ? 1 : -1;
  const sortable = [...(repoList || [])];
  const nowTimestamp = Date.now();
  const recentScoreMap = buildRecentScoreMap(sortable, nowTimestamp);

  return sortable.sort((a, b) => {
    const privacyDelta = (isPrivateRepo(a) ? 1 : 0) - (isPrivateRepo(b) ? 1 : 0);
    if (privacyDelta !== 0) return privacyDelta;

    let metricDelta = 0;
    switch (by) {
      case 'name':
        metricDelta = compareNames(a, b);
        break;
      case 'updated':
        metricDelta = safeDate(a?.lastUpdated) - safeDate(b?.lastUpdated);
        break;
      case 'recent':
        metricDelta = (recentScoreMap.get(a) || 0) - (recentScoreMap.get(b) || 0);
        break;
      case 'cost':
        metricDelta = safeNumber(a?.summary?.aiCost) - safeNumber(b?.summary?.aiCost);
        break;
      case 'lines':
      default:
        metricDelta = safeNumber(a?.summary?.lines) - safeNumber(b?.summary?.lines);
        break;
    }

    if (metricDelta !== 0) return metricDelta * direction;

    if (by === 'recent') {
      const lastUpdatedDelta = safeDate(a?.lastUpdated) - safeDate(b?.lastUpdated);
      if (lastUpdatedDelta !== 0) return lastUpdatedDelta * direction;
    }

    return compareNames(a, b);
  });
}

interface FilterAndSortOptions {
  searchTerm?: string;
  languageFilter?: string;
  categoryFilter?: string;
  sortBy?: SortKey;
  sortOrder?: SortOrder;
}

export function filterAndSortRepos(repoList: Repo[], options: FilterAndSortOptions = {}): Repo[] {
  const {
    searchTerm = '',
    languageFilter = 'all',
    categoryFilter = 'all',
    sortBy = 'recent',
    sortOrder = 'desc'
  } = options;

  const filtered = filterRepos(repoList, searchTerm, languageFilter, categoryFilter);
  return sortRepos(filtered, sortBy, sortOrder);
}

export function getAvailableLanguages(repoList: Repo[]): string[] {
  const set = new Set<string>();

  for (const repo of repoList || []) {
    if (repo?.primaryLanguage) {
      set.add(repo.primaryLanguage);
    }
  }

  return [...set].sort((a, b) => a.localeCompare(b));
}
