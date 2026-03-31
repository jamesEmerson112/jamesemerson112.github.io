<script>
  import { formatNumber } from '../../utils/formatters.ts';
  import {
    buildProgrammingComposition,
    getDisplayPrimaryLanguage,
    getLanguageColor
  } from '../../utils/languageUtils.js';
  import { selectedRepo } from '../../stores/portfolioStore.js';

  export let repo;
  const PROGRAMMING_LANGUAGE_LIMIT = 4;
  const OTHER_THRESHOLD_PERCENT = 0.5;
  const OTHER_COLOR = 'var(--mono-tone-5)';

  function handleClick() {
    selectedRepo.set(repo);
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  $: displayPrimaryLanguage = getDisplayPrimaryLanguage(repo.primaryLanguage, repo.languages || []);
  $: topProjectTags = Array.isArray(repo.projectTags) ? repo.projectTags.slice(0, 2) : [];

  $: compositionShares = buildProgrammingComposition(repo.languages || [], {
    maxProgrammingLanguages: PROGRAMMING_LANGUAGE_LIMIT,
    otherThresholdPercent: OTHER_THRESHOLD_PERCENT
  });
  $: repoUrl = repo?.url || repo?.htmlUrl || null;
  $: canShowRepoLink = repo?.isPrivate !== true && Boolean(repoUrl);

  function toPercent(value) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
    return Math.max(0, Math.min(100, safe));
  }

  function compositionColor(name) {
    if (name === 'Other') {
      return OTHER_COLOR;
    }
    return getLanguageColor(name);
  }
</script>

<div
  class="repo-card"
  data-name="RepoCard"
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={handleKeydown}
  aria-label={`Open details for ${repo.name}`}
>
  <div class="card-header" data-name="RepoCardDiv1">
    <div class="repo-title" data-name="RepoCardDiv2">
      {#if repo.isPrivate}
        <span class="privacy-badge" title="Private Repository" data-name="RepoCardSpan3">🔒</span>
      {/if}
      <h3 data-name="RepoCardH34">{repo.name}</h3>
    </div>
    {#if displayPrimaryLanguage}
      <span class="language-badge" data-name="RepoCardSpan5">
        <span class="language-dot" data-name="RepoCardSpan6"></span>
        {displayPrimaryLanguage}
      </span>
    {/if}
  </div>

  {#if repo.description && !repo.isAnonymized}
    <p class="repo-description" data-name="RepoCardP7">{repo.description}</p>
  {:else if repo.isAnonymized}
    <p class="repo-description muted" data-name="RepoCardP8">Private Academic Projects</p>
  {/if}

  {#if topProjectTags.length > 0}
    <div class="project-tags" aria-label="Project type signals" data-name="RepoCardDiv9">
      {#each topProjectTags as tag}
        <span class="project-tag" data-name="RepoCardSpan10">
          {tag.label} {Math.round((tag.confidence || 0) * 100)}%
        </span>
      {/each}
    </div>
  {/if}

  <div class="repo-stats" data-name="RepoCardDiv11">
    <div class="stat" data-name="RepoCardDiv12">
      <span class="stat-icon" data-name="RepoCardSpan13">📊</span>
      <span class="stat-value" data-name="RepoCardSpan14">{formatNumber(repo.summary.lines)}</span>
      <span class="stat-label" data-name="RepoCardSpan15">lines</span>
    </div>
    <div class="stat" data-name="RepoCardDiv16">
      <span class="stat-icon" data-name="RepoCardSpan17">📁</span>
      <span class="stat-value" data-name="RepoCardSpan18">{repo.summary.files}</span>
      <span class="stat-label" data-name="RepoCardSpan19">files</span>
    </div>
    <div class="stat" data-name="RepoCardDiv20">
      <span class="stat-icon" data-name="RepoCardSpan21">🧮</span>
      <span class="stat-value" data-name="RepoCardSpan22">{repo.summary.complexity}</span>
      <span class="stat-label" data-name="RepoCardSpan23">complexity</span>
    </div>
  </div>

  {#if compositionShares.length > 0}
    <section class="language-composition" aria-label="Language composition" data-name="RepoCardSection24">
      <div class="composition-label" data-name="RepoCardDiv25">Language composition</div>
      <div class="composition-track" role="img" aria-label="Top language composition by code share" data-name="RepoCardDiv26">
        {#each compositionShares as language}
          <div
            class="composition-segment"
            title={`${language.name} ${language.percent.toFixed(1)}%`}
            style="width: {toPercent(language.percent)}%; background-color: {compositionColor(language.name)}"
           data-name="RepoCardDiv27"></div>
        {/each}
      </div>
      <div class="composition-legend" data-name="RepoCardDiv28">
        {#each compositionShares as language}
          <span class="legend-item" data-name="RepoCardSpan29">
            <span class="legend-dot" style="background-color: {compositionColor(language.name)}" data-name="RepoCardSpan30"></span>
            {language.name} {language.percent.toFixed(0)}%
          </span>
        {/each}
      </div>
    </section>
  {/if}

  <div class="card-footer" data-name="RepoCardDiv31">
    {#if canShowRepoLink}
      <a
        class="repo-link"
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        on:click|stopPropagation
        aria-label={`View Repo: ${repo.name}`}
       data-name="RepoCardA32">
        View Repo ↗
      </a>
    {/if}
    <span class="view-details" data-name="RepoCardSpan33">View Details →</span>
  </div>
</div>

<style>
  .repo-card {
    background: var(--surface-panel);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: clamp(0.72rem, 1.2vw, 0.96rem);
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    cursor: pointer;
    text-align: left;
    width: 100%;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(0.5rem, 0.95vw, 0.68rem);
  }

  .repo-card:hover {
    transform: translateY(-3px);
    border-color: var(--surface-border-strong);
    box-shadow: var(--shadow-hover);
  }

  .repo-card:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 3px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
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
    font-size: 1.08rem;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    overflow-wrap: anywhere;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
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
    background: var(--surface-glass);
    border-color: var(--surface-border-strong);
    color: var(--text-primary);
    margin-left: auto;
  }

  .language-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-primary);
  }

  .repo-description {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-secondary);
    line-height: 1.34;
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
    color: var(--text-secondary);
    background: var(--surface-glass);
    border: 1px solid var(--surface-border);
  }

  .repo-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
    gap: 0.45rem;
    padding: 0.56rem;
    background: var(--surface-glass);
    border-radius: 7px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
    padding: 0.08rem 0;
  }

  .stat-icon {
    font-size: 0.95rem;
  }

  .stat-value {
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-label {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .language-composition {
    border: 1px solid var(--surface-border);
    border-radius: 9px;
    padding: 0.56rem;
    background: var(--surface-glass);
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
    height: 8px;
    background: var(--surface-base);
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

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    border-top: 1px solid var(--surface-border-soft);
    padding-top: 0.56rem;
    margin-top: 0.05rem;
  }

  .repo-link {
    font-size: 0.92rem;
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 600;
  }

  .repo-link:hover {
    text-decoration: underline;
  }

  .repo-link:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: 6px;
  }

  .view-details {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 1rem;
    margin-left: auto;
  }

  @media (max-width: 1024px) {
    .repo-stats {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 7rem), 1fr));
    }
  }

  @media (max-width: 560px) {
    .repo-card {
      padding: 0.78rem;
      gap: 0.52rem;
    }

    .repo-stats {
      padding: 0.5rem;
      gap: 0.45rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .stat {
      min-width: 0;
    }

    .repo-title h3 {
      font-size: 1rem;
      -webkit-line-clamp: 3;
    }

    .repo-description {
      font-size: 0.8rem;
      -webkit-line-clamp: 1;
    }

    .language-composition {
      padding: 0.5rem;
    }

    .composition-legend {
      gap: 0.34rem;
    }

    .legend-item {
      font-size: 0.62rem;
    }

    .card-footer {
      gap: 0.4rem 0.75rem;
    }

    .repo-link,
    .view-details {
      font-size: 0.86rem;
    }
  }
</style>
