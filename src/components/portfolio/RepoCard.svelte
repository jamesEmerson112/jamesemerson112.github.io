<script lang="ts">
  import { formatNumber } from '../../utils/formatters.ts';
  import {
    buildProgrammingComposition,
    getDisplayPrimaryLanguage,
    getLanguageColor
  } from '../../utils/languageUtils.ts';
  import { clampPercent } from '../../utils/math.ts';
  import { selectedRepo } from '../../stores/portfolioStore.ts';
  import { reveal } from '../../utils/reveal.ts';
  import type { Repo } from '../../types.js';

  export let repo: Repo;
  /** Stagger for the scroll-reveal entrance, in ms. */
  export let revealDelay = 0;
  const PROGRAMMING_LANGUAGE_LIMIT = 4;
  const OTHER_THRESHOLD_PERCENT = 0.5;
  const OTHER_COLOR = '#6a6d6a';

  function handleClick() {
    selectedRepo.set(repo);
  }

  $: displayPrimaryLanguage = getDisplayPrimaryLanguage(repo.primaryLanguage, repo.languages || []);
  $: topProjectTags = Array.isArray(repo.projectTags) ? repo.projectTags.slice(0, 2) : [];

  $: compositionShares = buildProgrammingComposition(repo.languages || [], {
    maxProgrammingLanguages: PROGRAMMING_LANGUAGE_LIMIT,
    otherThresholdPercent: OTHER_THRESHOLD_PERCENT,
    codeOnly: true
  });
  $: repoUrl = repo?.url || null;
  $: canShowRepoLink = repo?.isPrivate !== true && Boolean(repoUrl);

  function compositionColor(name) {
    if (name === 'Other') {
      return OTHER_COLOR;
    }
    return getLanguageColor(name);
  }
</script>

<!-- Clicking anywhere on the card is a mouse convenience; keyboard and
     screen-reader users get the real "View Details" button below, which
     avoids nesting the "View Repo" link inside an interactive element. -->
<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="repo-card"
  data-name="RepoCard"
  use:reveal={{ delay: revealDelay }}
  on:click={handleClick}
>
  <div class="card-header" data-name="RepoCardDiv1">
    <div class="repo-title" data-name="RepoCardDiv2">
      {#if repo.isPrivate}
        <span class="privacy-badge" title="Private Repository" role="img" aria-label="Private repository" data-name="RepoCardSpan3">
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" data-name="RepoCardLockIcon">
            <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </span>
      {/if}
      <h3 data-name="RepoCardH34">{repo.name}</h3>
    </div>
    {#if displayPrimaryLanguage}
      <span class="language-badge" data-name="RepoCardSpan5">
        <span
          class="language-dot"
          style="background-color: {getLanguageColor(displayPrimaryLanguage)}"
          data-name="RepoCardSpan6"
        ></span>
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
      <span class="stat-value" data-name="RepoCardSpan14">{formatNumber(repo.summary.lines)}</span>
      <span class="stat-label" data-name="RepoCardSpan15">lines</span>
    </div>
    <div class="stat" data-name="RepoCardDiv16">
      <span class="stat-value" data-name="RepoCardSpan18">{formatNumber(repo.summary.files)}</span>
      <span class="stat-label" data-name="RepoCardSpan19">files</span>
    </div>
    <div class="stat" data-name="RepoCardDiv20">
      <span class="stat-value" data-name="RepoCardSpan22">{formatNumber(repo.summary.complexity)}</span>
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
            style="width: {clampPercent(language.percent)}%; background-color: {compositionColor(language.name)}"
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
    <button
      type="button"
      class="view-details"
      aria-label={`View details for ${repo.name}`}
      on:click|stopPropagation={handleClick}
      data-name="RepoCardSpan33"
    >View Details →</button>
  </div>
</div>

<style>
  .repo-card {
    background: var(--card-bg);
    border: 1px solid var(--line-2);
    border-radius: 14px;
    padding: 20px;
    transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
    cursor: pointer;
    text-align: left;
    width: 100%;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* Cursor spotlight (position fed by PortfolioOverview via --mx/--my). */
  .repo-card {
    position: relative;
    isolation: isolate;
  }

  .repo-card::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(
      420px circle at var(--mx, 50%) var(--my, 0%),
      color-mix(in srgb, var(--acc) 10%, transparent),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.35s ease;
  }

  .repo-card:hover::before {
    opacity: 1;
  }

  .repo-card:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--acc) 45%, transparent);
    background: var(--card-hover-bg);
  }

  .repo-card:focus-within {
    border-color: color-mix(in srgb, var(--acc) 45%, transparent);
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
    display: inline-flex;
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .repo-title h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    overflow-wrap: anywhere;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .language-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    border: 1px solid var(--line-1);
    white-space: nowrap;
    flex-shrink: 0;
    background: transparent;
    color: var(--mono-tone-2);
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
    line-clamp: 2;
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
    padding: 3px 9px;
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--mono-tone-3);
    background: var(--chip-neutral-bg);
    border: 1px solid var(--line-2);
  }

  .repo-stats {
    display: flex;
    gap: 20px;
    padding: 12px 14px;
    background: var(--card-bg);
    border-radius: 8px;
    font-family: var(--font-mono);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .stat-value {
    font-weight: 500;
    font-size: 14px;
    color: var(--scene-text);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-label {
    font-size: 9.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .language-composition {
    border: none;
    padding: 0;
    background: transparent;
  }

  .composition-label {
    margin-bottom: 7px;
    font-family: var(--font-mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }

  .composition-track {
    display: flex;
    width: 100%;
    border-radius: 999px;
    overflow: hidden;
    height: 7px;
    background: var(--quality-track);
  }

  .composition-segment {
    height: 100%;
  }

  .composition-legend {
    margin-top: 9px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-mono);
    font-size: 9.5px;
    color: var(--mono-tone-3);
  }

  .legend-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    border-top: 1px solid var(--line-3);
    padding-top: 13px;
    margin-top: 2px;
  }

  .repo-link {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--mono-tone-2);
    text-decoration: none;
  }

  .repo-link:hover {
    color: var(--acc-hover);
  }

  .repo-link:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
    border-radius: 6px;
  }

  .view-details {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--acc);
    margin-left: auto;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .view-details:hover {
    color: var(--acc-hover);
  }

  .view-details:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: 4px;
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

    /* Equal columns so the three numbers never run together. */
    .repo-stats {
      display: grid;
      padding: 0.6rem 0.75rem;
      gap: 0.75rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .stat {
      min-width: 0;
    }

    .repo-title h3 {
      font-size: 1rem;
      -webkit-line-clamp: 3;
      line-clamp: 3;
    }

    .repo-description {
      font-size: 0.8rem;
      -webkit-line-clamp: 1;
      line-clamp: 1;
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
