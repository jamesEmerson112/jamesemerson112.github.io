import { afterEach, describe, expect, it, vi } from 'vitest';
import { sortRepos } from './portfolioTransforms.js';

const repoFixture = [
  {
    name: 'Public Alpha',
    isPrivate: false,
    lastUpdated: '2026-02-01T00:00:00Z',
    summary: { lines: 1000, aiCost: 25000 }
  },
  {
    name: 'Private Omega',
    isPrivate: true,
    lastUpdated: '2026-02-15T00:00:00Z',
    summary: { lines: 9000, aiCost: 120000 }
  },
  {
    name: 'Public Zeta',
    isPrivate: false,
    lastUpdated: '2026-01-20T00:00:00Z',
    summary: { lines: 120, aiCost: 4500 }
  }
];

function assertPublicBeforePrivate(sorted) {
  const firstPrivateIndex = sorted.findIndex((repo) => repo.isPrivate === true);
  expect(firstPrivateIndex).toBeGreaterThanOrEqual(0);

  const publicAfterPrivate = sorted.slice(firstPrivateIndex + 1).some((repo) => repo.isPrivate !== true);
  expect(publicAfterPrivate).toBe(false);
}

describe('portfolioTransforms public-first sorting', () => {
  const sortByOptions = ['lines', 'name', 'updated', 'cost'];
  const sortOrders = ['asc', 'desc'];

  for (const by of sortByOptions) {
    for (const order of sortOrders) {
      it(`puts public repositories ahead of private repositories when sorting by ${by} (${order})`, () => {
        const sorted = sortRepos(repoFixture, by, order);
        assertPublicBeforePrivate(sorted);
      });
    }
  }

  it('uses deterministic name tie-breaker when sort metric values are equal', () => {
    const sorted = sortRepos(
      [
        {
          name: 'Public Beta',
          isPrivate: false,
          lastUpdated: '2026-02-01T00:00:00Z',
          summary: { lines: 500, aiCost: 7000 }
        },
        {
          name: 'Public Alpha',
          isPrivate: false,
          lastUpdated: '2026-02-01T00:00:00Z',
          summary: { lines: 500, aiCost: 7000 }
        }
      ],
      'lines',
      'desc'
    );

    expect(sorted.map((repo) => repo.name)).toEqual(['Public Alpha', 'Public Beta']);
  });

  it('supports recent mode with blended recency+size scoring and public-first grouping', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-18T00:00:00Z'));

    const sorted = sortRepos(
      [
        {
          name: 'Public New Small',
          isPrivate: false,
          lastUpdated: '2026-02-17T00:00:00Z',
          summary: { code: 120, lines: 140, aiCost: 300 }
        },
        {
          name: 'Public Mid Big',
          isPrivate: false,
          lastUpdated: '2025-10-01T00:00:00Z',
          summary: { code: 12000, lines: 12100, aiCost: 30000 }
        },
        {
          name: 'Private New Huge',
          isPrivate: true,
          lastUpdated: '2026-02-17T00:00:00Z',
          summary: { code: 40000, lines: 42000, aiCost: 90000 }
        }
      ],
      'recent',
      'desc'
    );

    // Public-first remains guaranteed, even if private repo has a stronger blended score.
    expect(sorted.map((repo) => repo.name)).toEqual([
      'Public Mid Big',
      'Public New Small',
      'Private New Huge'
    ]);
  });

  it('treats missing/invalid lastUpdated as very old in recent mode', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-18T00:00:00Z'));

    const sorted = sortRepos(
      [
        {
          name: 'Public With Date',
          isPrivate: false,
          lastUpdated: '2026-02-15T00:00:00Z',
          summary: { code: 1000, lines: 1000, aiCost: 1000 }
        },
        {
          name: 'Public Missing Date',
          isPrivate: false,
          lastUpdated: null,
          summary: { code: 1000, lines: 1000, aiCost: 1000 }
        }
      ],
      'recent',
      'desc'
    );

    expect(sorted.map((repo) => repo.name)).toEqual([
      'Public With Date',
      'Public Missing Date'
    ]);
  });

  it('keeps deterministic name tie-break in recent mode when scores are equal', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-18T00:00:00Z'));

    const sorted = sortRepos(
      [
        {
          name: 'Public Beta',
          isPrivate: false,
          lastUpdated: '2026-01-01T00:00:00Z',
          summary: { code: 1000, lines: 1000, aiCost: 1000 }
        },
        {
          name: 'Public Alpha',
          isPrivate: false,
          lastUpdated: '2026-01-01T00:00:00Z',
          summary: { code: 1000, lines: 1000, aiCost: 1000 }
        }
      ],
      'recent',
      'desc'
    );

    expect(sorted.map((repo) => repo.name)).toEqual(['Public Alpha', 'Public Beta']);
  });
});

afterEach(() => {
  vi.useRealTimers();
});
