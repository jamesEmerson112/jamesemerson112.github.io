<script>
  import {
    formatNumber,
    formatCurrency,
    formatDuration,
    getLanguageColor
  } from '../../utils/dataLoader.js';
  import { selectedRepo, qualityBaselines } from '../../stores/portfolioStore.js';
  import { computeRepoQualitySignals } from '../../utils/profileMetrics.js';
  import { computePercentShare } from '../../utils/spiderTransforms.js';

  export let repo;

  const QUICK_AXES = ['Scope', 'Complexity Control', 'Freshness'];

  function handleClick() {
    selectedRepo.set(repo);
  }

  function toPercent(value) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
    return Math.max(0, Math.min(100, safe));
  }

  $: savingsPercent = repo.summary.traditionalCost > 0
    ? Math.round(((repo.summary.traditionalCost - repo.summary.aiCost) / repo.summary.traditionalCost) * 100)
    : 0;

  $: languageColor = getLanguageColor(repo.primaryLanguage);
  $: topProjectTags = Array.isArray(repo.projectTags) ? repo.projectTags.slice(0, 2) : [];
  $: qualitySignals = computeRepoQualitySignals(repo, $qualityBaselines)
    .filter((signal) => QUICK_AXES.includes(signal.axis));
  $: qualityIndex = qualitySignals.length > 0
    ? Math.round(qualitySignals.reduce((sum, item) => sum + item.score, 0) / qualitySignals.length)
    : 0;

  $: rawShares = computePercentShare(repo.languages || [], 'code');
  $: topShares = rawShares.slice(0, 4);
  $: remainderShare = Math.max(0, 100 - topShares.reduce((sum, item) => sum + item.percent, 0));
  $: compositionShares = remainderShare > 0.4
    ? [...topShares, { name: 'Other', percent: remainderShare, code: 0, complexity: 0 }]
    : topShares;

  function signalTone(score) {
    if (score >= 75) return 'high';
    if (score >= 50) return 'moderate';
    return 'low';
  }
</script>

<button
  class="repo-card"
  type="button"
  on:click={handleClick}
  aria-label={`Open details for ${repo.name}`}
>
  <div class="card-header">
    <div class="repo-title">
      {#if repo.isPrivate}
        <span class="privacy-badge" title="Private Repository">🔒</span>
      {/if}
      <h3>{repo.name}</h3>
    </div>
    {#if repo.primaryLanguage}
      <span class="language-badge" style="background-color: {languageColor}1f; border-color: {languageColor}">
        <span class="language-dot" style="background-color: {languageColor}"></span>
        {repo.primaryLanguage}
      </span>
    {/if}
  </div>

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

  <section class="quality-snapshot" aria-label="Quality snapshot">
    <div class="quality-header">
      <h4>Quality Snapshot</h4>
      <span class="quality-index">{qualityIndex}/100</span>
    </div>
    {#each qualitySignals as signal}
      <div class="quality-row">
        <div class="quality-meta">
          <span class="axis">{signal.axis}</span>
          <span class="score">{Math.round(signal.score)}</span>
        </div>
        <div class="quality-track" aria-hidden="true">
          <div
            class="quality-fill {signalTone(signal.score)}"
            style="width: {toPercent(signal.score)}%"
          ></div>
        </div>
      </div>
    {/each}
  </section>

  {#if compositionShares.length > 0}
    <section class="language-composition" aria-label="Language composition">
      <div class="composition-label">Language composition</div>
      <div class="composition-track" role="img" aria-label="Top language composition by code share">
        {#each compositionShares as language}
          <div
            class="composition-segment"
            title={`${language.name} ${language.percent.toFixed(1)}%`}
            style="width: {toPercent(language.percent)}%; background-color: {language.name === 'Other' ? '#475569' : getLanguageColor(language.name)}"
          ></div>
        {/each}
      </div>
      <div class="composition-legend">
        {#each compositionShares as language}
          <span class="legend-item">
            <span
              class="legend-dot"
              style="background-color: {language.name === 'Other' ? '#475569' : getLanguageColor(language.name)}"
            ></span>
            {language.name} {language.percent.toFixed(0)}%
          </span>
        {/each}
      </div>
    </section>
  {/if}

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

  <div class="time-estimate">
    <span class="time-icon">⏱️</span>
    <span class="time-value">{formatDuration(repo.summary.aiMonths)}</span>
    <span class="time-label">with AI</span>
  </div>

  <div class="card-footer">
    <span class="view-details">View Details →</span>
  </div>
</button>

<style>
  .repo-card {
    background: linear-gradient(160deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.4));
    border: 1px solid rgba(148, 163, 184, 0.26);
    border-radius: 14px;
    padding: 1.25rem;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    cursor: pointer;
    text-align: left;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
  }

  .repo-card:hover {
    transform: translateY(-3px);
    border-color: rgba(56, 189, 248, 0.62);
    box-shadow: 0 10px 24px rgba(2, 6, 23, 0.45);
  }

  .repo-card:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 3px;
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
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .language-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.7rem;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 600;
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
    gap: 0.45rem;
  }

  .project-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.52rem;
    border-radius: 999px;
    font-size: 0.7rem;
    color: #d1fae5;
    background: rgba(16, 185, 129, 0.16);
    border: 1px solid rgba(16, 185, 129, 0.32);
  }

  .repo-stats {
    display: flex;
    gap: 0.75rem;
    padding: 0.68rem;
    background: rgba(2, 6, 23, 0.62);
    border-radius: 8px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex: 1;
    min-width: 0;
  }

  .stat-icon {
    font-size: 0.95rem;
  }

  .stat-value {
    font-weight: 700;
    font-size: 0.84rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-label {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .quality-snapshot {
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 10px;
    padding: 0.7rem;
    background: rgba(15, 23, 42, 0.38);
  }

  .quality-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.45rem;
  }

  .quality-header h4 {
    margin: 0;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
  }

  .quality-index {
    font-weight: 700;
    color: #93c5fd;
    font-size: 0.84rem;
  }

  .quality-row {
    margin-top: 0.45rem;
  }

  .quality-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.74rem;
    margin-bottom: 0.2rem;
    color: var(--text-secondary);
  }

  .quality-track {
    height: 7px;
    border-radius: 999px;
    background: rgba(71, 85, 105, 0.45);
    overflow: hidden;
  }

  .quality-fill {
    height: 100%;
    border-radius: inherit;
  }

  .quality-fill.low {
    background: linear-gradient(90deg, #f59e0b, #f97316);
  }

  .quality-fill.moderate {
    background: linear-gradient(90deg, #22c55e, #16a34a);
  }

  .quality-fill.high {
    background: linear-gradient(90deg, #38bdf8, #2563eb);
  }

  .language-composition {
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 10px;
    padding: 0.7rem;
    background: rgba(15, 23, 42, 0.3);
  }

  .composition-label {
    margin-bottom: 0.35rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
  }

  .composition-track {
    display: flex;
    width: 100%;
    border-radius: 999px;
    overflow: hidden;
    height: 10px;
    background: rgba(2, 6, 23, 0.6);
  }

  .composition-segment {
    height: 100%;
  }

  .composition-legend {
    margin-top: 0.45rem;
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    font-size: 0.68rem;
    color: var(--text-secondary);
  }

  .legend-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
  }

  .cost-comparison {
    padding: 0.7rem;
    background: rgba(37, 99, 235, 0.08);
    border: 1px solid rgba(96, 165, 250, 0.22);
    border-radius: 8px;
  }

  .cost-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.42rem;
    font-size: 0.82rem;
  }

  .cost-row:last-of-type {
    margin-bottom: 0.65rem;
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
    opacity: 0.58;
  }

  .cost-value.ai {
    color: #34d399;
  }

  .cost-row.highlight {
    padding: 0.2rem 0;
  }

  .savings-badge {
    display: inline-block;
    padding: 0.22rem 0.65rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.26);
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #34d399;
  }

  .time-estimate {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.48rem 0.58rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.35);
    border-radius: 8px;
    font-size: 0.82rem;
  }

  .time-value {
    font-weight: 700;
    color: #c4b5fd;
  }

  .time-label {
    color: var(--text-secondary);
  }

  .card-footer {
    border-top: 1px solid rgba(148, 163, 184, 0.16);
    padding-top: 0.7rem;
    margin-top: 0.05rem;
  }

  .view-details {
    color: #60a5fa;
    font-weight: 600;
    font-size: 1rem;
  }

  @media (max-width: 560px) {
    .repo-card {
      padding: 1rem;
    }

    .repo-stats {
      flex-wrap: wrap;
    }

    .stat {
      min-width: 40%;
    }
  }
</style>
