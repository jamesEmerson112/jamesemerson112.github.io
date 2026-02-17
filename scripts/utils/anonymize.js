/**
 * Private Repository Anonymization Utility
 * Sanitizes private repository data while preserving metrics
 */
import { createHash } from 'crypto';

function stableHash(input, length = 16) {
  return createHash('sha256').update(String(input || '')).digest('hex').slice(0, length);
}

function sourceRefToPrivateSlug(sourceRef) {
  if (!sourceRef || !sourceRef.startsWith('private:')) {
    return null;
  }
  return sourceRef.replace('private:', '').slice(0, 12);
}

/**
 * Anonymize a private repository's metadata
 * @param {object} repo - Repository object from GitHub API
 * @param {number} index - Index number for naming (e.g., "Private Project 5")
 * @param {string|null} sourceRef - Stable repo source reference
 * @returns {object} Anonymized repository metadata
 */
export function anonymizePrivateRepo(repo, index, sourceRef = null) {
  // If not private, return original metadata
  if (!repo.private) {
    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      url: repo.html_url,
      homepage: repo.homepage || null,
      topics: repo.topics || [],
      lastUpdated: repo.updated_at,
      createdAt: repo.created_at,
      stars: repo.stargazers_count || 0,
      language: repo.language || 'Unknown',
      isPrivate: false,
      isFork: repo.fork,
      isArchived: repo.archived,
      isAnonymized: false,
      sourceRef
    };
  }

  // Anonymize private repository
  return {
    name: `Private Project ${index}`,
    fullName: null,
    description: 'Private repository',
    url: null,
    homepage: null,
    topics: [],
    lastUpdated: repo.updated_at, // Keep this for incremental scanning
    createdAt: null,
    stars: 0,
    language: repo.language || 'Unknown', // Keep language for filtering
    isPrivate: true,
    isFork: repo.fork,
    isArchived: repo.archived,
    isAnonymized: true,
    sourceRef
  };
}

/**
 * Check if a repository should be included in scanning
 * @param {object} repo - Repository object from GitHub API
 * @returns {boolean} True if repo should be scanned
 */
export function shouldIncludeRepo(repo) {
  // Only exclude forks - archived repos are still our work!
  return !repo.fork;
}

/**
 * Generate a safe repository ID for filenames
 * @param {object} repo - Repository object
 * @param {number} privateIndex - Index for private repos
 * @param {string|null} sourceRef - Stable sourceRef when available
 * @returns {string} Safe filename-compatible ID
 */
export function generateRepoId(repo, privateIndex = 0, sourceRef = null) {
  if (repo.private) {
    const refSlug = sourceRefToPrivateSlug(sourceRef);
    if (refSlug) {
      return `private-${refSlug}`;
    }

    if (repo.node_id) {
      return `private-${stableHash(repo.node_id, 12)}`;
    }

    return `private-${String(privateIndex).padStart(3, '0')}`;
  }

  // For public repos, use sanitized name
  return repo.name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get display name for a repository
 * @param {object} metadata - Repository metadata (anonymized or not)
 * @returns {string} Display name
 */
export function getDisplayName(metadata) {
  return metadata.isAnonymized
    ? metadata.name // "Private Project 5"
    : metadata.name; // Original name
}

/**
 * Check if repository details should be publicly visible
 * @param {object} metadata - Repository metadata
 * @returns {object} Visibility flags
 */
export function getVisibility(metadata) {
  return {
    showName: !metadata.isAnonymized,
    showDescription: !metadata.isAnonymized,
    showUrl: !metadata.isAnonymized && metadata.url !== null,
    showHomepage: !metadata.isAnonymized && metadata.homepage !== null,
    showTopics: !metadata.isAnonymized && metadata.topics.length > 0,
    showStars: !metadata.isAnonymized && metadata.stars > 0,
    showMetrics: true // Always show metrics
  };
}

/**
 * Extract private project display index from label
 * @param {string|null} name - Display label
 * @returns {number|null} Parsed index
 */
export function extractPrivateProjectIndex(name) {
  const match = String(name || '').match(/^Private Project (\d+)$/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}
