#!/usr/bin/env node

import fs from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const defaultRootDir = join(__dirname, '..');

function getTotalsFromIndexRepos(indexRepos) {
  return (indexRepos || []).reduce((acc, repo) => ({
    totalLines: acc.totalLines + (repo.summary?.lines || 0),
    totalCode: acc.totalCode + (repo.summary?.code || 0),
    totalFiles: acc.totalFiles + (repo.summary?.files || 0),
    totalComplexity: acc.totalComplexity + (repo.summary?.complexity || 0)
  }), {
    totalLines: 0,
    totalCode: 0,
    totalFiles: 0,
    totalComplexity: 0
  });
}

export async function validateMetrics(rootDir = defaultRootDir) {
  const metricsDir = join(rootDir, 'public', 'metrics');
  const reposDir = join(metricsDir, 'repos');
  const indexPath = join(metricsDir, 'index.json');

  const errors = [];

  let index;
  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    index = JSON.parse(content);
  } catch (error) {
    return {
      valid: false,
      errors: [`Unable to read index.json: ${error.message}`]
    };
  }

  const referencedDetails = new Set((index.repos || []).map((repo) => repo.detailsFile).filter(Boolean));

  let detailsFiles = [];
  try {
    detailsFiles = await fs.readdir(reposDir);
  } catch (error) {
    errors.push(`Unable to read repos directory: ${error.message}`);
  }

  for (const detailsFile of referencedDetails) {
    try {
      await fs.access(join(metricsDir, detailsFile));
    } catch {
      errors.push(`Missing details file referenced by index: ${detailsFile}`);
    }
  }

  for (const file of detailsFiles) {
    const detailsPath = `repos/${file}`;
    if (!referencedDetails.has(detailsPath)) {
      errors.push(`Orphan details file not referenced by index: ${detailsPath}`);
    }
  }

  const recomputed = getTotalsFromIndexRepos(index.repos || []);
  const declared = index.portfolioTotals || {};

  const totalChecks = [
    ['totalLines', recomputed.totalLines, declared.totalLines],
    ['totalCode', recomputed.totalCode, declared.totalCode],
    ['totalFiles', recomputed.totalFiles, declared.totalFiles],
    ['totalComplexity', recomputed.totalComplexity, declared.totalComplexity]
  ];

  for (const [key, expected, actual] of totalChecks) {
    if ((actual || 0) !== expected) {
      errors.push(`portfolioTotals.${key} mismatch: expected ${expected}, got ${actual || 0}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

async function main() {
  const result = await validateMetrics(defaultRootDir);
  if (!result.valid) {
    console.error('❌ Metrics validation failed:');
    for (const error of result.errors) {
      console.error(`   - ${error}`);
    }
    process.exit(1);
  }

  console.log('✅ Metrics validation passed');
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  main().catch((error) => {
    console.error('❌ Metrics validation error:', error);
    process.exit(1);
  });
}
