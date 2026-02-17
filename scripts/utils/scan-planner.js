import { createHash } from 'crypto';

function stableHash(input, length = 16) {
  return createHash('sha256').update(String(input || '')).digest('hex').slice(0, length);
}

function normalizeFullName(fullName) {
  return String(fullName || '').trim().toLowerCase();
}

function parseGitHubUrl(url) {
  if (!url) return null;
  const match = String(url).match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)(?:[/?#].*)?$/i);
  if (!match) return null;
  return `${match[1]}/${match[2]}`.toLowerCase();
}

export function buildSourceRef(repo) {
  if (!repo) return null;
  if (repo.private) {
    return `private:${stableHash(repo.node_id || repo.id || repo.name)}`;
  }

  const fullName = normalizeFullName(repo.full_name || '');
  if (!fullName) return null;
  return `public:${fullName}`;
}

export function inferSourceRefFromIndexEntry(entry) {
  if (!entry) return null;
  if (entry.sourceRef) return entry.sourceRef;

  // Public entries can be inferred from URL
  const fromUrl = parseGitHubUrl(entry.url);
  if (fromUrl) return `public:${fromUrl}`;

  return null;
}

export function backfillSourceRefsInIndex(existingIndex) {
  if (!existingIndex || !Array.isArray(existingIndex.repos)) {
    return {
      index: existingIndex,
      updated: false
    };
  }

  let updated = false;
  const repos = existingIndex.repos.map((entry) => {
    if (entry.sourceRef) {
      return entry;
    }

    const inferred = inferSourceRefFromIndexEntry(entry);
    if (!inferred) {
      return entry;
    }

    updated = true;
    return {
      ...entry,
      sourceRef: inferred
    };
  });

  if (!updated) {
    return {
      index: existingIndex,
      updated: false
    };
  }

  return {
    index: {
      ...existingIndex,
      repos
    },
    updated: true
  };
}

function getExistingEntries(existingIndex) {
  const repos = existingIndex?.repos || [];
  return repos.map((entry) => ({
    ...entry,
    sourceRef: inferSourceRefFromIndexEntry(entry)
  }));
}

function findLegacyEntry(existingEntries, repo) {
  if (!repo?.private) {
    const publicMatch = existingEntries.find((entry) => {
      return !entry.isPrivate && entry.name === repo.name;
    });
    if (publicMatch) return publicMatch;
  }

  // Private legacy matching is best-effort for migration.
  return existingEntries.find((entry) => {
    return entry.isPrivate && !entry.sourceRef && entry.lastUpdated === repo.updated_at;
  }) || null;
}

export function buildScanPlan({
  repos,
  existingIndex,
  existingDetails,
  forceFullScan = false
}) {
  const existingEntries = getExistingEntries(existingIndex);
  const bySourceRef = new Map(
    existingEntries
      .filter((entry) => entry.sourceRef)
      .map((entry) => [entry.sourceRef, entry])
  );

  const detailsSet = existingDetails instanceof Set ? existingDetails : new Set(existingDetails || []);

  return (repos || []).map((repo) => {
    const sourceRef = buildSourceRef(repo);
    const existingEntry = bySourceRef.get(sourceRef) || findLegacyEntry(existingEntries, repo);
    const reasons = [];

    if (forceFullScan) {
      reasons.push('full-scan');
    }

    if (!existingEntry) {
      reasons.push('new-repo');
    } else {
      if (!existingEntry.sourceRef) {
        reasons.push('missing-source-ref');
      }

      if (!existingEntry.detailsFile || !detailsSet.has(existingEntry.detailsFile)) {
        reasons.push('missing-details-file');
      }

      const repoUpdated = Date.parse(repo.updated_at || '');
      const lastScanned = Date.parse(existingEntry.lastUpdated || '');
      if (Number.isFinite(repoUpdated) && Number.isFinite(lastScanned) && repoUpdated > lastScanned) {
        reasons.push('repo-updated');
      }
    }

    return {
      repo,
      sourceRef,
      existingEntry,
      needsRescan: reasons.length > 0,
      reasons
    };
  });
}
