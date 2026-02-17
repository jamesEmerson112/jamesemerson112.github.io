/**
 * SCC Repository Scanner
 * Clones and scans individual repositories with SCC
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { calculateCOCOMO, calculateLanguagePercentages, generateSummary } from './utils/cocomo.js';
import { classifyProjectTags } from './utils/project-classifier.js';

const execAsync = promisify(exec);

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
// Use system scc command instead of bundled .exe
const sccPath = 'scc';
const tempDir = join(projectRoot, '.temp-repos');

/**
 * Ensure temp directory exists
 */
async function ensureTempDir() {
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
}

/**
 * Clean up temp directory
 */
async function cleanupTempDir() {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn('   Warning: Could not clean temp directory:', error.message);
  }
}

/**
 * Clone a repository
 * @param {string} cloneUrl - Git clone URL
 * @param {string} targetPath - Where to clone to
 * @param {string} token - GitHub token for authentication
 * @returns {Promise<boolean>} Success status
 */
async function cloneRepo(cloneUrl, targetPath, token) {
  try {
    // Inject token into URL for authentication (works for both public and private)
    const authenticatedUrl = cloneUrl.replace(
      'https://github.com',
      `https://${token}@github.com`
    );

    // Shallow clone (depth=1) to save time and space
    const { stdout, stderr } = await execAsync(
      `git clone --depth 1 --quiet "${authenticatedUrl}" "${targetPath}"`,
      { timeout: 60000 } // 60 second timeout
    );

    return true;
  } catch (error) {
    console.error(`   ❌ Clone failed: ${error.message}`);
    return false;
  }
}

/**
 * Run SCC on a directory
 * @param {string} repoPath - Path to repository
 * @returns {Promise<Array>} SCC data
 */
async function runSCC(repoPath) {
  try {
    const { stdout } = await execAsync(
      `${sccPath} --format json "${repoPath}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    const sccData = JSON.parse(stdout);
    return sccData;
  } catch (error) {
    console.error(`   ❌ SCC failed: ${error.message}`);
    return [];
  }
}

/**
 * Scan a repository and calculate metrics
 * @param {object} repo - Repository object from GitHub API
 * @param {object} metadata - Processed metadata (anonymized if private)
 * @param {string} repoId - Repository ID for filenames
 * @param {string} token - GitHub token
 * @returns {Promise<object|null>} Complete metrics or null if failed
 */
export async function scanRepository(repo, metadata, repoId, token) {
  const repoPath = join(tempDir, repoId);

  try {
    // Step 1: Clone the repository
    console.log(`   📥 Cloning...`);
    const cloned = await cloneRepo(repo.clone_url, repoPath, token);

    if (!cloned) {
      return null;
    }

    // Step 2: Run SCC
    console.log(`   🔍 Scanning with SCC...`);
    const sccData = await runSCC(repoPath);

    if (!sccData || sccData.length === 0) {
      console.warn(`   ⚠️  No code found or scan failed`);
      return null;
    }

    // Step 3: Calculate metrics
    console.log(`   📊 Calculating metrics...`);

    const summary = generateSummary(sccData);
    const languages = calculateLanguagePercentages(sccData);
    const cocomo = calculateCOCOMO(summary.totalCode);
    const projectTags = classifyProjectTags({ languages, metadata });

    // Step 4: Build complete metrics object
    const metrics = {
      id: repoId,
      scannedAt: new Date().toISOString(),
      metadata,
      sccRaw: sccData,
      computed: {
        summary,
        languages,
        projectTags,
        cocomo
      }
    };

    console.log(`   ✅ Scanned: ${summary.totalLines.toLocaleString()} lines, ${summary.totalFiles} files`);

    return metrics;

  } catch (error) {
    console.error(`   ❌ Scan error: ${error.message}`);
    return null;
  } finally {
    // Clean up cloned repo
    try {
      await fs.rm(repoPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Initialize scanner (create temp directory)
 */
export async function initScanner() {
  await ensureTempDir();
}

/**
 * Cleanup scanner (remove temp directory)
 */
export async function cleanupScanner() {
  await cleanupTempDir();
}
