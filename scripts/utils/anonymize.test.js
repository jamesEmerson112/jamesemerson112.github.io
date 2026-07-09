import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import {
  anonymizePrivateRepo,
  shouldIncludeRepo,
  generateRepoId,
  getDisplayName,
  getVisibility,
  extractPrivateProjectIndex
} from './anonymize.js';

const PRIVATE_REPO = {
  private: true,
  name: 'secret-thesis',
  full_name: 'user/secret-thesis',
  description: 'Very secret work',
  html_url: 'https://github.com/user/secret-thesis',
  homepage: 'https://secret.example.com',
  topics: ['research'],
  updated_at: '2026-05-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  stargazers_count: 42,
  language: 'Python',
  fork: false,
  archived: false,
  node_id: 'MDEwOlJlcG9zaXRvcnkx'
};

const PUBLIC_REPO = {
  private: false,
  name: 'open-project',
  full_name: 'user/open-project',
  description: 'Open source work',
  html_url: 'https://github.com/user/open-project',
  homepage: null,
  topics: ['svelte'],
  updated_at: '2026-04-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  stargazers_count: 5,
  language: 'TypeScript',
  fork: false,
  archived: false
};

describe('anonymizePrivateRepo', () => {
  it('redacts all identifying fields of a private repo', () => {
    const result = anonymizePrivateRepo(PRIVATE_REPO, 7, 'private:abc123');

    expect(result.name).toBe('Private Project 7');
    expect(result.fullName).toBeNull();
    expect(result.description).toBe('Private repository');
    expect(result.url).toBeNull();
    expect(result.homepage).toBeNull();
    expect(result.topics).toEqual([]);
    expect(result.createdAt).toBeNull();
    expect(result.stars).toBe(0);
    expect(result.isAnonymized).toBe(true);
    expect(result.isPrivate).toBe(true);
  });

  it('preserves fields needed for metrics and incremental scanning', () => {
    const result = anonymizePrivateRepo(PRIVATE_REPO, 7, 'private:abc123');

    expect(result.lastUpdated).toBe(PRIVATE_REPO.updated_at);
    expect(result.language).toBe('Python');
    expect(result.sourceRef).toBe('private:abc123');
  });

  it('passes public repos through unredacted', () => {
    const result = anonymizePrivateRepo(PUBLIC_REPO, 3, 'public:user/open-project');

    expect(result.name).toBe('open-project');
    expect(result.fullName).toBe('user/open-project');
    expect(result.url).toBe('https://github.com/user/open-project');
    expect(result.description).toBe('Open source work');
    expect(result.stars).toBe(5);
    expect(result.isAnonymized).toBe(false);
    expect(result.isPrivate).toBe(false);
    expect(result.sourceRef).toBe('public:user/open-project');
  });
});

describe('shouldIncludeRepo', () => {
  it('excludes forks', () => {
    expect(shouldIncludeRepo({ ...PUBLIC_REPO, fork: true })).toBe(false);
  });

  it('includes archived repos and regular repos', () => {
    expect(shouldIncludeRepo({ ...PUBLIC_REPO, archived: true })).toBe(true);
    expect(shouldIncludeRepo(PUBLIC_REPO)).toBe(true);
  });
});

describe('generateRepoId', () => {
  it('derives the private id from the sourceRef hash slug', () => {
    expect(generateRepoId(PRIVATE_REPO, 0, 'private:abcdef1234567890')).toBe('private-abcdef123456');
  });

  it('falls back to a node_id hash when no sourceRef exists', () => {
    const expectedHash = createHash('sha256')
      .update(PRIVATE_REPO.node_id)
      .digest('hex')
      .slice(0, 12);
    expect(generateRepoId(PRIVATE_REPO, 0, null)).toBe(`private-${expectedHash}`);
  });

  it('falls back to a padded index when neither sourceRef nor node_id exists', () => {
    const repo = { ...PRIVATE_REPO, node_id: undefined };
    expect(generateRepoId(repo, 7, null)).toBe('private-007');
  });

  it('sanitizes public repo names into filename-safe ids', () => {
    expect(generateRepoId({ ...PUBLIC_REPO, name: 'My Repo!!' })).toBe('my-repo');
    expect(generateRepoId({ ...PUBLIC_REPO, name: 'already-safe_name' })).toBe('already-safe_name');
  });
});

describe('getDisplayName / getVisibility', () => {
  it('hides identifying fields for anonymized metadata but always shows metrics', () => {
    const metadata = anonymizePrivateRepo(PRIVATE_REPO, 1, 'private:abc');
    const visibility = getVisibility(metadata);

    expect(getDisplayName(metadata)).toBe('Private Project 1');
    expect(visibility.showName).toBe(false);
    expect(visibility.showDescription).toBe(false);
    expect(visibility.showUrl).toBe(false);
    expect(visibility.showHomepage).toBe(false);
    expect(visibility.showTopics).toBe(false);
    expect(visibility.showStars).toBe(false);
    expect(visibility.showMetrics).toBe(true);
  });

  it('shows public metadata', () => {
    const metadata = anonymizePrivateRepo(PUBLIC_REPO, 1, 'public:user/open-project');
    const visibility = getVisibility(metadata);

    expect(visibility.showName).toBe(true);
    expect(visibility.showUrl).toBe(true);
    expect(visibility.showTopics).toBe(true);
    expect(visibility.showStars).toBe(true);
  });
});

describe('extractPrivateProjectIndex', () => {
  it('parses the index from a private project label', () => {
    expect(extractPrivateProjectIndex('Private Project 12')).toBe(12);
  });

  it('returns null for non-matching labels', () => {
    expect(extractPrivateProjectIndex('open-project')).toBeNull();
    expect(extractPrivateProjectIndex('Private Project')).toBeNull();
    expect(extractPrivateProjectIndex(null)).toBeNull();
  });
});
