#!/usr/bin/env node

/**
 * GitHub Repository Scanner
 * Fetches repositories, scans with SCC, calculates metrics, and writes a
 * consistent master index + per-repo details for both full and incremental runs.
 */

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import {
  anonymizePrivateRepo,
  shouldIncludeRepo,
  generateRepoId,
  extractPrivateProjectIndex
} from './utils/anonymize.js';
import { classifyProjectTags } from './utils/project-classifier.js';
import { backfillSourceRefsInIndex, buildScanPlan } from './utils/scan-planner.js';
import { scanRepository, initScanner, cleanupScanner } from './scan-repo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const metricsDir = join(projectRoot, 'public', 'metrics');
const reposDir = join(metricsDir, 'repos');
const indexPath = join(metricsDir, 'index.json');

const args = process.argv.slice(2);
const isFullScan = args.includes('--full');
const isTestMode = args.includes('--test');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const repoLimit = limitArg ? Number.parseInt(limitArg.split('=')[1], 10) : null;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'portfolio-metrics-scanner/2.0'
});

async function ensureMetricsDirs() {
  await fs.mkdir(reposDir, { recursive: true });
}

async function verifyAuth() {
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    return user;
  } catch (error) {
    console.error('❌ Authentication failed!');
    console.error('   Make sure GITHUB_TOKEN is set. In GitHub Actions, map secrets.GH_PAT to GITHUB_TOKEN.');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
}

async function fetchAllRepos() {
  console.log('\n📥 Fetching repositories from GitHub...');

  const allRepos = [];
  let page = 1;

  while (true) {
    try {
      const { data } = await octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        page,
        type: 'all',
        sort: 'updated',
        direction: 'desc'
      });

      if (data.length === 0) {
        break;
      }

      allRepos.push(...data);
      console.log(`   Fetched page ${page}: ${data.length} repos (total: ${allRepos.length})`);
      page += 1;
    } catch (error) {
      console.error(`❌ Error fetching page ${page}: ${error.message}`);
      break;
    }
  }

  return allRepos;
}

function filterRepos(repos) {
  console.log('\n🔍 Filtering repositories...');
  const filtered = repos.filter(shouldIncludeRepo);

  const excluded = repos.length - filtered.length;
  const publicCount = filtered.filter((repo) => !repo.private).length;
  const privateCount = filtered.filter((repo) => repo.private).length;

  console.log(`   Total fetched: ${repos.length}`);
  console.log(`   Excluded (forks): ${excluded}`);
  console.log(`   Public repos: ${publicCount}`);
  console.log(`   Private repos: ${privateCount}`);
  console.log(`   Total to process: ${filtered.length}`);

  return filtered;
}

async function loadExistingIndex() {
  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    const parsed = JSON.parse(content);
    const { index: normalized, updated } = backfillSourceRefsInIndex(parsed);

    if (updated) {
      await fs.writeFile(indexPath, JSON.stringify(normalized, null, 2));
      console.log('   Backfilled sourceRef for inferable legacy index entries');
    }

    return normalized;
  } catch {
    return null;
  }
}

async function loadExistingDetailsSet() {
  try {
    const files = await fs.readdir(reposDir);
    return new Set(files.map((file) => `repos/${file}`));
  } catch {
    return new Set();
  }
}

function decorateScanPlan(planItems) {
  return planItems.map((item) => {
    const expectedRepoId = generateRepoId(item.repo, 0, item.sourceRef);
    const expectedDetailsFile = `repos/${expectedRepoId}.json`;

    const reasons = [...item.reasons];
    let needsRescan = item.needsRescan;

    // Migrate legacy private detail ids to stable sourceRef-based ids.
    if (
      item.repo.private &&
      item.existingEntry &&
      item.existingEntry.detailsFile &&
      item.existingEntry.detailsFile !== expectedDetailsFile
    ) {
      reasons.push('legacy-private-id');
      needsRescan = true;
    }

    return {
      ...item,
      expectedRepoId,
      expectedDetailsFile,
      reasons,
      needsRescan
    };
  });
}

function buildPrivateIndexAllocator(planItems) {
  const used = new Set();

  for (const item of planItems) {
    if (!item.repo.private) continue;
    const parsed = extractPrivateProjectIndex(item.existingEntry?.name);
    if (parsed) {
      used.add(parsed);
    }
  }

  let nextIndex = 1;

  return function allocate(existingEntry) {
    const parsed = extractPrivateProjectIndex(existingEntry?.name);
    if (parsed) {
      used.add(parsed);
      return parsed;
    }

    while (used.has(nextIndex)) {
      nextIndex += 1;
    }

    const allocated = nextIndex;
    used.add(allocated);
    nextIndex += 1;
    return allocated;
  };
}

async function loadExistingMetrics(detailsFile) {
  const filePath = join(metricsDir, detailsFile);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

async function persistMetrics(metrics, detailsFile) {
  const filePath = join(metricsDir, detailsFile);
  await fs.writeFile(filePath, JSON.stringify(metrics, null, 2));
}

async function cleanupOrphanedDetailsFiles(referencedDetailsFiles) {
  const files = await fs.readdir(reposDir);
  let removed = 0;

  for (const file of files) {
    const detailsFile = `repos/${file}`;
    if (!referencedDetailsFiles.has(detailsFile)) {
      await fs.rm(join(reposDir, file), { force: true });
      removed += 1;
    }
  }

  return removed;
}

function ensureProjectTags(metrics) {
  const existingTags = metrics?.computed?.projectTags;
  if (Array.isArray(existingTags) && existingTags.length > 0) {
    return metrics;
  }

  const projectTags = classifyProjectTags({
    languages: metrics?.computed?.languages || [],
    metadata: metrics?.metadata || {}
  });

  return {
    ...metrics,
    computed: {
      ...metrics.computed,
      projectTags
    }
  };
}

function buildMasterIndex(allRepos, existingIndex, scannedCount, reusedCount) {
  const totals = allRepos.reduce((acc, repo) => ({
    totalLines: acc.totalLines + repo.computed.summary.totalLines,
    totalCode: acc.totalCode + repo.computed.summary.totalCode,
    totalComments: acc.totalComments + repo.computed.summary.totalComments,
    totalBlanks: acc.totalBlanks + repo.computed.summary.totalBlanks,
    totalFiles: acc.totalFiles + repo.computed.summary.totalFiles,
    totalBytes: acc.totalBytes + repo.computed.summary.totalBytes,
    totalComplexity: acc.totalComplexity + repo.computed.summary.totalComplexity,
    totalCost: acc.totalCost + repo.computed.cocomo.traditional.cost,
    totalEffort: acc.totalEffort + repo.computed.cocomo.traditional.effort,
    aiCost: acc.aiCost + repo.computed.cocomo.aiAssisted.cost,
    aiEffort: acc.aiEffort + repo.computed.cocomo.aiAssisted.effort
  }), {
    totalLines: 0,
    totalCode: 0,
    totalComments: 0,
    totalBlanks: 0,
    totalFiles: 0,
    totalBytes: 0,
    totalComplexity: 0,
    totalCost: 0,
    totalEffort: 0,
    aiCost: 0,
    aiEffort: 0
  });

  const languageMap = new Map();

  for (const repo of allRepos) {
    for (const lang of repo.computed.languages) {
      if (!languageMap.has(lang.name)) {
        languageMap.set(lang.name, {
          repos: new Set(),
          totalLines: 0,
          totalCode: 0
        });
      }

      const langData = languageMap.get(lang.name);
      langData.repos.add(repo.id);
      langData.totalLines += lang.lines;
      langData.totalCode += lang.code;
    }
  }

  const languages = {};
  languageMap.forEach((data, name) => {
    languages[name] = {
      repos: data.repos.size,
      totalLines: data.totalLines,
      totalCode: data.totalCode,
      percentOfTotal: totals.totalLines > 0
        ? Number.parseFloat(((data.totalLines / totals.totalLines) * 100).toFixed(1))
        : 0,
      averagePerRepo: Math.round(data.totalLines / data.repos.size)
    };
  });

  const publicCount = allRepos.filter((repo) => !repo.metadata.isPrivate).length;
  const privateCount = allRepos.filter((repo) => repo.metadata.isPrivate).length;

  return {
    version: '1.1.0',
    generatedAt: new Date().toISOString(),
    lastFullScan: isFullScan
      ? new Date().toISOString()
      : (existingIndex?.lastFullScan || new Date().toISOString()),
    lastIncrementalScan: new Date().toISOString(),
    reposScannedThisRun: scannedCount,
    reposReusedThisRun: reusedCount,
    totalPublicRepos: publicCount,
    totalPrivateRepos: privateCount,
    totalRepos: allRepos.length,

    portfolioTotals: {
      totalLines: totals.totalLines,
      totalCode: totals.totalCode,
      totalComments: totals.totalComments,
      totalBlanks: totals.totalBlanks,
      totalFiles: totals.totalFiles,
      totalBytes: totals.totalBytes,
      totalComplexity: totals.totalComplexity,

      estimatedValue: {
        standardCost: totals.totalCost,
        totalEffort: Number.parseFloat(totals.totalEffort.toFixed(2)),
        avgTime: allRepos.length > 0
          ? Number.parseFloat((totals.totalEffort / allRepos.length).toFixed(2))
          : 0,
        avgPeople: 0
      },

      soloDeveloper: {
        fullTimeMonths: Number.parseFloat(totals.totalEffort.toFixed(2)),
        fullTimeYears: Math.round(totals.totalEffort / 12),
        fullTimeWeeks: Math.round(totals.totalEffort * 4.33),
        description: 'Total time if developed alone, full-time'
      },

      languages
    },

    repos: allRepos.map((repo) => ({
      id: repo.id,
      sourceRef: repo.metadata.sourceRef || null,
      name: repo.metadata.name,
      url: repo.metadata.url,
      description: repo.metadata.description,
      lastUpdated: repo.metadata.lastUpdated,
      primaryLanguage: repo.computed.summary.primaryLanguage,
      isPrivate: repo.metadata.isPrivate,
      isAnonymized: repo.metadata.isAnonymized,
      projectTags: repo.computed.projectTags || [],
      languages: repo.computed.languages,
      summary: {
        lines: repo.computed.summary.totalLines,
        code: repo.computed.summary.totalCode,
        files: repo.computed.summary.totalFiles,
        complexity: repo.computed.summary.totalComplexity,
        traditionalCost: repo.computed.cocomo.traditional.cost,
        aiCost: repo.computed.cocomo.aiAssisted.cost,
        traditionalMonths: repo.computed.cocomo.singleDeveloper.traditional.fullTime.months,
        aiMonths: repo.computed.cocomo.singleDeveloper.aiAssisted.fullTime.months
      },
      detailsFile: `repos/${repo.id}.json`
    }))
  };
}

export async function runScan() {
  console.log('🚀 Portfolio Metrics Scanner');
  console.log('============================\n');

  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ ERROR: GITHUB_TOKEN not found!');
    console.error('   In local development, define it in .env.');
    console.error('   In GitHub Actions, map secrets.GH_PAT -> GITHUB_TOKEN.\n');
    process.exit(1);
  }

  await ensureMetricsDirs();

  if (isTestMode) {
    console.log(`🧪 Test mode: limiting to ${repoLimit || 5} repos\n`);
  } else if (isFullScan) {
    console.log('🔄 Full scan mode: all repositories\n');
  } else {
    console.log('⚡ Incremental scan mode: merge unchanged + rescan changed\n');
  }

  await verifyAuth();

  const allRepos = await fetchAllRepos();
  const filtered = filterRepos(allRepos);

  let reposToProcess = filtered;
  if (isTestMode && repoLimit) {
    reposToProcess = filtered.slice(0, repoLimit);
    console.log(`\n🧪 Test mode active: ${reposToProcess.length} repositories selected`);
  }

  const existingIndex = await loadExistingIndex();
  const existingDetails = await loadExistingDetailsSet();

  const initialPlan = buildScanPlan({
    repos: reposToProcess,
    existingIndex,
    existingDetails,
    forceFullScan: isFullScan
  });

  const scanPlan = decorateScanPlan(initialPlan);
  const allocatePrivateIndex = buildPrivateIndexAllocator(scanPlan);

  for (const item of scanPlan) {
    item.privateDisplayIndex = item.repo.private
      ? allocatePrivateIndex(item.existingEntry)
      : null;
  }

  const reposToScan = scanPlan.filter((item) => item.needsRescan);
  const scannedBySourceRef = new Map();

  console.log(`\n📋 Scan plan: ${reposToScan.length} to scan, ${scanPlan.length - reposToScan.length} to reuse`);

  let scanSuccessCount = 0;
  let scanFailCount = 0;

  if (reposToScan.length > 0) {
    console.log('\n🔧 Initializing scanner...');
    await initScanner();

    try {
      for (let i = 0; i < reposToScan.length; i++) {
        const item = reposToScan[i];
        const progress = `[${i + 1}/${reposToScan.length}]`;

        const metadata = anonymizePrivateRepo(
          item.repo,
          item.privateDisplayIndex,
          item.sourceRef
        );

        // Preserve existing private label when available
        if (item.repo.private && item.existingEntry?.name) {
          metadata.name = item.existingEntry.name;
        }

        console.log(`${progress} ${metadata.name} (${item.repo.language || 'Unknown'})`);

        const metrics = await scanRepository(
          item.repo,
          metadata,
          item.expectedRepoId,
          process.env.GITHUB_TOKEN
        );

        if (!metrics) {
          console.log(`   ⚠️  Scan failed; will try reusing previous details if present`);
          scanFailCount += 1;
          continue;
        }

        // Ensure sourceRef and normalized id are persisted.
        metrics.id = item.expectedRepoId;
        metrics.metadata = {
          ...metrics.metadata,
          sourceRef: item.sourceRef
        };

        await persistMetrics(metrics, item.expectedDetailsFile);
        scannedBySourceRef.set(item.sourceRef, metrics);
        scanSuccessCount += 1;
      }
    } finally {
      console.log('\n🧹 Cleaning up scanner temp directory...');
      await cleanupScanner();
    }
  }

  console.log('\n📦 Building merged metrics set...');

  const mergedRepos = [];
  let reusedCount = 0;

  for (const item of scanPlan) {
    const scanned = scannedBySourceRef.get(item.sourceRef);
    if (scanned) {
      mergedRepos.push(scanned);
      continue;
    }

    if (item.existingEntry?.detailsFile && existingDetails.has(item.existingEntry.detailsFile)) {
      try {
        const existingMetrics = await loadExistingMetrics(item.existingEntry.detailsFile);
        const metadata = anonymizePrivateRepo(
          item.repo,
          item.privateDisplayIndex,
          item.sourceRef
        );

        if (item.repo.private && item.existingEntry?.name) {
          metadata.name = item.existingEntry.name;
        }

        const reusedMetrics = {
          ...existingMetrics,
          id: item.expectedRepoId,
          metadata: {
            ...existingMetrics.metadata,
            ...metadata,
            sourceRef: item.sourceRef
          }
        };

        const normalizedMetrics = ensureProjectTags(reusedMetrics);

        // Persist reused metrics under normalized details filename.
        await persistMetrics(normalizedMetrics, item.expectedDetailsFile);

        mergedRepos.push(normalizedMetrics);
        reusedCount += 1;
      } catch (error) {
        console.warn(`   ⚠️  Could not reuse ${item.existingEntry.detailsFile}: ${error.message}`);
      }
    }
  }

  const masterIndex = buildMasterIndex(mergedRepos, existingIndex, scanSuccessCount, reusedCount);

  await fs.writeFile(indexPath, JSON.stringify(masterIndex, null, 2));

  const referenced = new Set(masterIndex.repos.map((repo) => repo.detailsFile));
  const removedOrphans = await cleanupOrphanedDetailsFiles(referenced);

  console.log('\n✅ Scan complete');
  console.log(`   Scanned successfully: ${scanSuccessCount}`);
  console.log(`   Reused: ${reusedCount}`);
  console.log(`   Scan failures: ${scanFailCount}`);
  console.log(`   Total in index: ${masterIndex.totalRepos}`);
  console.log(`   Orphan detail files removed: ${removedOrphans}`);
  console.log(`   Index written: ${indexPath}`);
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  runScan().catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}
