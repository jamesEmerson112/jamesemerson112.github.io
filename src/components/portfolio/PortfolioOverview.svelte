<script lang="ts">
  import { onMount } from 'svelte';
  import {
    isLoading,
    hasError,
    repos,
    filteredRepos,
    searchTerm,
    languageFilter,
    categoryFilter,
    sortBy,
    sortOrder,
    selectedRepo,
    loadPortfolioData,
    resetFilters
  } from '../../stores/portfolioStore.ts';
  import SearchFilter from './SearchFilter.svelte';
  import RepoCard from './RepoCard.svelte';
  import RepoDetailPanel from './RepoDetailPanel.svelte';
  import { reveal } from '../../utils/reveal.ts';

  export let autoLoad = true;
  const INITIAL_VISIBLE_COUNT = 12;

  let visibleCount = INITIAL_VISIBLE_COUNT;
  let filterSignature = '';

  // Any active filter shows every match (auto-expand); the default view is Top-N.
  $: anyFilterActive =
    $searchTerm.trim() !== '' || $languageFilter !== 'all' || $categoryFilter !== 'all';
  $: effectiveVisibleCount = anyFilterActive ? $filteredRepos.length : visibleCount;
  $: shownCount = Math.min(effectiveVisibleCount, $filteredRepos.length);
  $: visibleRepos = $filteredRepos.slice(0, shownCount);
  $: nextFilterSignature = JSON.stringify([
    $searchTerm,
    $languageFilter,
    $categoryFilter,
    $sortBy,
    $sortOrder
  ]);

  $: if (nextFilterSignature !== filterSignature) {
    filterSignature = nextFilterSignature;
    visibleCount = INITIAL_VISIBLE_COUNT;
  }

  // Load data on mount
  onMount(() => {
    if (autoLoad) {
      loadPortfolioData();
    }
  });

  function showAllRepos() {
    visibleCount = $filteredRepos.length;
  }

  function closeSelectedRepo() {
    selectedRepo.set(null);
  }

  // Cursor spotlight: one delegated listener feeds --mx/--my to the hovered card.
  function trackSpotlight(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    const card = (event.target as HTMLElement | null)?.closest<HTMLElement>('.repo-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }
</script>

<section class="portfolio-overview" data-name="PortfolioOverview">
  <div class="container" data-name="PortfolioOverviewDiv1">
    <!-- Header -->
    <header class="section-header" use:reveal data-name="PortfolioOverviewHeader2">
      <div class="eyebrow" data-name="PortfolioOverviewEyebrow">
        // {$repos.length} REPOSITORIES ANALYZED
      </div>
      <h1 data-name="PortfolioOverviewH13">Portfolio Metrics</h1>
      <p class="section-subtitle" data-name="PortfolioOverviewP4">
        Comprehensive analysis of my development portfolio, powered by AI
      </p>
    </header>

    {#if $isLoading}
      <!-- Loading State -->
      <div class="loading-state" data-name="PortfolioOverviewDiv5">
        <div class="spinner" data-name="PortfolioOverviewDiv6"></div>
        <p data-name="PortfolioOverviewP7">Loading portfolio metrics...</p>
      </div>
    {:else if $hasError}
      <!-- Error State -->
      <div class="error-state" data-name="PortfolioOverviewDiv8">
        <span class="error-eyebrow" data-name="PortfolioOverviewSpan9">// SOMETHING WENT WRONG</span>
        <h3 data-name="PortfolioOverviewH310">Failed to load metrics</h3>
        <p data-name="PortfolioOverviewP11">{$hasError}</p>
        <button class="retry-button" on:click={loadPortfolioData} type="button" data-name="portfolio-retry">
          Try Again
        </button>
      </div>
    {:else}
      <!-- Search & Filter -->
      <SearchFilter />

      <!-- Repositories Grid -->
      {#if $filteredRepos.length > 0}
        <div class="repos-header" use:reveal data-name="PortfolioOverviewDiv12">
          <h2 data-name="PortfolioOverviewH213">Recent Projects ({shownCount} of {$filteredRepos.length})</h2>
        </div>

        <div class="repos-grid" on:pointermove={trackSpotlight} data-name="PortfolioOverviewDiv14">
          {#each visibleRepos as repo, index (repo.id)}
            <RepoCard {repo} revealDelay={(index % 3) * 70} />
          {/each}
        </div>

        {#if shownCount < $filteredRepos.length}
          <div class="load-more-wrap" data-name="PortfolioOverviewDiv15">
            <button
              type="button"
              class="load-more-button"
              on:click={showAllRepos}
              data-name="projects-show-all"
            >
              Show all {$filteredRepos.length} <span aria-hidden="true" data-name="PortfolioOverviewShowAllArrow">↓</span>
            </button>
          </div>
        {/if}
      {:else}
        <!-- Empty State -->
        <div class="empty-state" data-name="PortfolioOverviewDiv16">
          <span class="empty-eyebrow" data-name="PortfolioOverviewSpan17">// NO MATCHES</span>
          <h3 data-name="PortfolioOverviewH318">No repositories found</h3>
          <p data-name="PortfolioOverviewP19">Try adjusting your search or filters</p>
          <button type="button" class="clear-filters" on:click={resetFilters} data-name="projects-clear-filters">
            Clear filters
          </button>
        </div>
      {/if}
    {/if}
  </div>

  <RepoDetailPanel repo={$selectedRepo} on:close={closeSelectedRepo} />
</section>

<style>
  .portfolio-overview {
    /* Outer spacing comes from the App section wrapper. */
    padding: 0;
  }

  .container {
    max-width: 1160px;
    margin: 0 auto;
  }

  /* Header */
  .section-header {
    text-align: left;
    margin-bottom: 2rem;
    padding: 0.35rem 0;
    border-radius: 14px;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    color: var(--acc);
    margin-bottom: 14px;
  }

  .section-header h1 {
    font-family: var(--font-display);
    font-size: clamp(32px, 3.8vw, 50px);
    font-weight: 300;
    letter-spacing: -0.03em;
    margin-bottom: 0.8rem;
    color: var(--scene-text);
  }

  .section-subtitle {
    font-size: 15px;
    line-height: 1.5;
    color: var(--text-secondary);
    max-width: 720px;
    margin: 0;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1.5rem;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid color-mix(in srgb, var(--accent-primary) 28%, transparent);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-state p {
    font-size: 1.125rem;
    color: var(--text-secondary);
  }

  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
    text-align: center;
  }

  .error-eyebrow {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    color: var(--accent-warning);
  }

  .error-state h3 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 300;
    margin: 0;
    color: var(--scene-text);
  }

  .error-state p {
    color: var(--text-secondary);
    max-width: 400px;
  }

  .retry-button {
    padding: 0.75rem 1.5rem;
    background: var(--surface-glass);
    border: 1px solid var(--surface-border-strong);
    border-radius: 8px;
    color: var(--text-primary);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .retry-button:hover {
    background: color-mix(in srgb, var(--surface-glass) 70%, var(--text-primary) 8%);
    transform: translateY(-2px);
    box-shadow: var(--shadow-card);
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4.5rem 2rem;
    gap: 0.7rem;
    text-align: center;
    border: 1px dashed var(--line-1);
    border-radius: 14px;
  }

  .empty-eyebrow {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    color: var(--acc);
  }

  .empty-state h3 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 300;
    margin: 0;
    color: var(--scene-text);
  }

  .empty-state p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
  }

  .clear-filters {
    margin-top: 0.8rem;
    font-family: var(--font-mono);
    font-size: 11.5px;
    letter-spacing: 0.06em;
    padding: 8px 16px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--acc) 55%, transparent);
    background: color-mix(in srgb, var(--acc) 8%, transparent);
    color: var(--acc);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .clear-filters:hover {
    color: var(--acc-hover);
    background: color-mix(in srgb, var(--acc) 14%, transparent);
  }

  .clear-filters:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  /* Repos Header */
  .repos-header {
    margin-bottom: 1.5rem;
  }

  .repos-header h2 {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 400;
    margin: 0;
    color: var(--scene-text);
  }

  /* Repos Grid */
  .repos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
    gap: 18px;
  }

  .load-more-wrap {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
  }

  .load-more-button {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 1px solid color-mix(in srgb, var(--acc) 55%, transparent);
    background: color-mix(in srgb, var(--acc) 8%, transparent);
    color: var(--acc);
    border-radius: 999px;
    padding: 11px 20px;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.25s ease;
  }

  .load-more-button:hover {
    color: var(--acc-hover);
    background: color-mix(in srgb, var(--acc) 14%, transparent);
    box-shadow: 0 0 28px color-mix(in srgb, var(--acc) 20%, transparent);
  }

  .load-more-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .section-header h1 {
      font-size: 2rem;
    }

    .section-subtitle {
      font-size: 1rem;
    }

    .repos-grid {
      grid-template-columns: 1fr;
      gap: 0.8rem;
    }
  }
</style>
