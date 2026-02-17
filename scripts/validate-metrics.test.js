// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { validateMetrics } from './validate-metrics.js';

async function createFixture({ index, detailsFiles }) {
  const root = await mkdtemp(join(tmpdir(), 'metrics-validate-'));
  const metricsDir = join(root, 'public', 'metrics');
  const reposDir = join(metricsDir, 'repos');

  await mkdir(reposDir, { recursive: true });
  await writeFile(join(metricsDir, 'index.json'), JSON.stringify(index, null, 2));

  for (const [filename, payload] of Object.entries(detailsFiles)) {
    await writeFile(join(reposDir, filename), JSON.stringify(payload, null, 2));
  }

  return root;
}

function baseIndex() {
  return {
    portfolioTotals: {
      totalLines: 100,
      totalCode: 80,
      totalFiles: 5,
      totalComplexity: 7
    },
    repos: [
      {
        id: 'repo-a',
        detailsFile: 'repos/repo-a.json',
        summary: {
          lines: 100,
          code: 80,
          files: 5,
          complexity: 7
        }
      }
    ]
  };
}

describe('validateMetrics', () => {
  it('returns valid true for a consistent index and details set', async () => {
    const index = baseIndex();
    const root = await createFixture({
      index,
      detailsFiles: {
        'repo-a.json': { id: 'repo-a' }
      }
    });

    const result = await validateMetrics(root);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when a referenced details file is missing', async () => {
    const root = await createFixture({
      index: baseIndex(),
      detailsFiles: {}
    });

    const result = await validateMetrics(root);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('Missing details file'))).toBe(true);
  });

  it('fails when an orphan details file exists', async () => {
    const root = await createFixture({
      index: baseIndex(),
      detailsFiles: {
        'repo-a.json': { id: 'repo-a' },
        'orphan.json': { id: 'orphan' }
      }
    });

    const result = await validateMetrics(root);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('Orphan details file'))).toBe(true);
  });

  it('fails when index totals do not match repo summaries', async () => {
    const index = baseIndex();
    index.portfolioTotals.totalCode = 999;

    const root = await createFixture({
      index,
      detailsFiles: {
        'repo-a.json': { id: 'repo-a' }
      }
    });

    const result = await validateMetrics(root);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('portfolioTotals.totalCode mismatch'))).toBe(true);
  });
});
