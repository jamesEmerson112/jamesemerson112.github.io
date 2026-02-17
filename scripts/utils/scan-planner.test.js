// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  buildSourceRef,
  inferSourceRefFromIndexEntry,
  backfillSourceRefsInIndex,
  buildScanPlan
} from './scan-planner.js';

describe('scan planner', () => {
  it('builds deterministic sourceRef values for public and private repositories', () => {
    const publicRepo = {
      private: false,
      full_name: 'James/Portfolio'
    };
    const privateRepo = {
      private: true,
      node_id: 'R_kgDOExampleNode'
    };

    expect(buildSourceRef(publicRepo)).toBe('public:james/portfolio');
    expect(buildSourceRef(privateRepo)).toMatch(/^private:[a-f0-9]{16}$/);
  });

  it('infers sourceRef for legacy public index entries', () => {
    const entry = {
      name: 'portfolio',
      url: 'https://github.com/james/portfolio'
    };

    expect(inferSourceRefFromIndexEntry(entry)).toBe('public:james/portfolio');
  });

  it('backfills inferable sourceRef entries while leaving non-inferable entries unchanged', () => {
    const existingIndex = {
      repos: [
        {
          name: 'public-project',
          url: 'https://github.com/james/public-project'
        },
        {
          name: 'private-project',
          isPrivate: true,
          url: null
        }
      ]
    };

    const result = backfillSourceRefsInIndex(existingIndex);

    expect(result.updated).toBe(true);
    expect(result.index.repos[0].sourceRef).toBe('public:james/public-project');
    expect(result.index.repos[1].sourceRef).toBeUndefined();
  });

  it('marks repos for rescan when sourceRef is missing, details are missing, or repo is updated', () => {
    const repos = [
      {
        id: 1,
        name: 'portfolio',
        full_name: 'james/portfolio',
        private: false,
        updated_at: '2026-02-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'api',
        full_name: 'james/api',
        private: false,
        updated_at: '2026-02-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'infra',
        full_name: 'james/infra',
        private: false,
        updated_at: '2026-02-05T00:00:00Z'
      }
    ];

    const existingIndex = {
      repos: [
        {
          name: 'portfolio',
          sourceRef: 'public:james/portfolio',
          lastUpdated: '2026-02-01T00:00:00Z',
          detailsFile: 'repos/portfolio.json'
        },
        {
          name: 'api',
          // legacy entry without sourceRef should trigger rescan
          lastUpdated: '2026-02-01T00:00:00Z',
          detailsFile: 'repos/api.json',
          url: 'https://github.com/james/api'
        },
        {
          name: 'infra',
          sourceRef: 'public:james/infra',
          lastUpdated: '2026-01-01T00:00:00Z',
          detailsFile: 'repos/infra.json'
        }
      ]
    };

    const existingDetails = new Set([
      'repos/portfolio.json',
      // repos/api.json intentionally missing to force self-healing rescan
      'repos/infra.json'
    ]);

    const plan = buildScanPlan({
      repos,
      existingIndex,
      existingDetails,
      forceFullScan: false
    });

    const byRef = new Map(plan.map((item) => [item.sourceRef, item]));

    expect(byRef.get('public:james/portfolio').needsRescan).toBe(false);
    expect(byRef.get('public:james/api').needsRescan).toBe(true);
    expect(byRef.get('public:james/api').reasons).toContain('missing-details-file');
    expect(byRef.get('public:james/infra').needsRescan).toBe(true);
    expect(byRef.get('public:james/infra').reasons).toContain('repo-updated');
  });
});
