<script>
  import { formatNumber, formatCurrency, formatDuration, getLanguageColor } from '../../utils/dataLoader.js';
  import { selectedRepo } from '../../stores/portfolioStore.js';
  import LanguageSpider from './LanguageSpider.svelte';

  export let repo;

  function handleClick() {
    selectedRepo.set(repo);
  }

  // Calculate savings percentage
  $: savingsPercent = repo.summary.traditionalCost > 0
    ? Math.round(((repo.summary.traditionalCost - repo.summary.aiCost) / repo.summary.traditionalCost) * 100)
    : 0;

  $: languageColor = getLanguageColor(repo.primaryLanguage);
  $: topProjectTags = Array.isArray(repo.projectTags) ? repo.projectTags.slice(0, 2) : [];
</script>

<button
  class="repo-card"
  type="button"
  on:click={handleClick}
  aria-label={`Open details for ${repo.name}`}
>
  <!-- Header -->
  <div class="card-header">
    <div class="repo-title">
      {#if repo.isPrivate}
        <span class="privacy-badge" title="Private Repository">🔒</span>
      {/if}
      <h3>{repo.name}</h3>
    </div>
    {#if repo.primaryLanguage}
      <span class="language-badge" style="background-color: {languageColor}20; border-color: {languageColor}">
        <span class="language-dot" style="background-color: {languageColor}"></span>
        {repo.primaryLanguage}
      </span>
    {/if}
  </div>

  <!-- Description -->
  {#if repo.description && !repo.isAnonymized}
    <p class="repo-description">{repo.description}</p>
  {:else if repo.isAnonymized}
    <p class="repo-description muted">Private repository</p>
  {/if}

  {#if topProjectTags.length > 0}
    <div class="project-tags" aria-label="Project type signals">
      {#each topProjectTags as tag}
        <span class="project-tag">
          {tag.label} {Math.round((tag.confidence || 0) * 100)}%
        </span>
      {/each}
    </div>
  {/if}

  <!-- Stats -->
  <div class="repo-stats">
    <div class="stat">
      <span class="stat-icon">📊</span>
      <span class="stat-value">{formatNumber(repo.summary.lines)}</span>
      <span class="stat-label">lines</span>
    </div>
    <div class="stat">
      <span class="stat-icon">📁</span>
      <span class="stat-value">{repo.summary.files}</span>
      <span class="stat-label">files</span>
    </div>
    <div class="stat">
      <span class="stat-icon">🧮</span>
      <span class="stat-value">{repo.summary.complexity}</span>
      <span class="stat-label">complexity</span>
    </div>
  </div>

  <!-- Language Spider Chart -->
  {#if repo.languages && repo.languages.length > 0}
    <div class="language-spider-container">
      <LanguageSpider languages={repo.languages} size={140} />
    </div>
  {/if}

  <!-- Cost Comparison -->
  <div class="cost-comparison">
    <div class="cost-row">
      <span class="cost-label">Traditional:</span>
      <span class="cost-value traditional">{formatCurrency(repo.summary.traditionalCost)}</span>
    </div>
    <div class="cost-row highlight">
      <span class="cost-label">AI-Assisted:</span>
      <span class="cost-value ai">{formatCurrency(repo.summary.aiCost)}</span>
    </div>
    <div class="savings-badge">
      💰 {savingsPercent}% savings
    </div>
  </div>

  <!-- Time Estimate -->
  <div class="time-estimate">
    <span class="time-icon">⏱️</span>
    <span class="time-value">{formatDuration(repo.summary.aiMonths)}</span>
    <span class="time-label">with AI</span>
  </div>

  <!-- View Details -->
  <div class="card-footer">
    <span class="view-details">View Details →</span>
  </div>
</button>

<style>
  .repo-card {
    background: var(--card-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    cursor: pointer;
    text-align: left;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .repo-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .repo-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .privacy-badge {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .repo-title h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .language-badge {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .language-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .repo-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .repo-description.muted {
    font-style: italic;
    color: var(--text-muted);
  }

  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .project-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    color: var(--text-primary);
    background: rgba(16, 185, 129, 0.14);
    border: 1px solid rgba(16, 185, 129, 0.28);
  }

  .repo-stats {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex: 1;
  }

  .stat-icon {
    font-size: 1rem;
  }

  .stat-value {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .cost-comparison {
    padding: 0.75rem;
    background: rgba(59, 130, 246, 0.05);
    border: 1px solid rgba(59, 130, 246, 0.1);
    border-radius: 8px;
  }

  .cost-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .cost-row:last-of-type {
    margin-bottom: 0.75rem;
  }

  .cost-label {
    color: var(--text-secondary);
  }

  .cost-value {
    font-weight: 600;
    color: var(--text-primary);
  }

  .cost-value.traditional {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .cost-value.ai {
    color: #10b981;
  }

  .cost-row.highlight {
    padding: 0.25rem 0;
  }

  .savings-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #10b981;
  }

  .time-estimate {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .time-icon {
    font-size: 1rem;
  }

  .time-value {
    font-weight: 600;
    color: #8b5cf6;
  }

  .time-label {
    color: var(--text-secondary);
  }

  .language-spider-container {
    display: flex;
    justify-content: center;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    min-height: 100px;
  }

  .card-footer {
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  }

  .view-details {
    font-size: 0.875rem;
    font-weight: 500;
    color: #3b82f6;
    transition: transform 0.2s;
    display: inline-block;
  }

  .repo-card:hover .view-details {
    transform: translateX(4px);
  }

  @media (max-width: 640px) {
    .repo-card {
      padding: 1rem;
    }

    .repo-stats {
      flex-direction: column;
      gap: 0.5rem;
    }

    .stat {
      justify-content: space-between;
    }
  }
</style>
