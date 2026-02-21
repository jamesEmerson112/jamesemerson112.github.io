<script>
  import { onMount } from 'svelte';
  import {
    loading,
    error,
    filteredRepos,
    searchTerm,
    languageFilter,
    categoryFilter,
    sortBy,
    sortOrder,
    selectedRepo,
    loadPortfolioData
  } from '../../stores/portfolioStore.js';
  import SearchFilter from './SearchFilter.svelte';
  import RepoCard from './RepoCard.svelte';
  import RepoDetailPanel from './RepoDetailPanel.svelte';

  export let autoLoad = true;
  const INITIAL_VISIBLE_COUNT = 12;

  let visibleCount = INITIAL_VISIBLE_COUNT;
  let filterSignature = '';

  $: shownCount = Math.min(visibleCount, $filteredRepos.length);
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

  function loadMoreRepos() {
    visibleCount += INITIAL_VISIBLE_COUNT;
  }

  function closeSelectedRepo() {
    selectedRepo.set(null);
  }
</script>

<section class="portfolio-overview" data-name="PortfolioOverview">
  <div class="container" data-name="PortfolioOverviewDiv1">
    <!-- Header -->
    <header class="section-header" data-name="PortfolioOverviewHeader2">
      <h1 data-name="PortfolioOverviewH13">Portfolio Metrics</h1>
      <p class="section-subtitle" data-name="PortfolioOverviewP4">
        Comprehensive analysis of my development portfolio, powered by AI
      </p>
    </header>

    {#if $loading}
      <!-- Loading State -->
      <div class="loading-state" data-name="PortfolioOverviewDiv5">
        <div class="spinner" data-name="PortfolioOverviewDiv6"></div>
        <p data-name="PortfolioOverviewP7">Loading portfolio metrics...</p>
      </div>
    {:else if $error}
      <!-- Error State -->
      <div class="error-state" data-name="PortfolioOverviewDiv8">
        <span class="error-icon" data-name="PortfolioOverviewSpan9">⚠️</span>
        <h3 data-name="PortfolioOverviewH310">Failed to load metrics</h3>
        <p data-name="PortfolioOverviewP11">{$error}</p>
        <button class="retry-button" on:click={loadPortfolioData} type="button" data-name="portfolio-retry">
          Try Again
        </button>
      </div>
    {:else}
      <!-- Search & Filter -->
      <SearchFilter />

      <!-- Repositories Grid -->
      {#if $filteredRepos.length > 0}
        <div class="repos-header" data-name="PortfolioOverviewDiv12">
          <h2 data-name="PortfolioOverviewH213">Recent Projects ({shownCount} of {$filteredRepos.length})</h2>
        </div>

        <div class="repos-grid" data-name="PortfolioOverviewDiv14">
          {#each visibleRepos as repo (repo.id)}
            <RepoCard {repo} />
          {/each}
        </div>

        {#if shownCount < $filteredRepos.length}
          <div class="load-more-wrap" data-name="PortfolioOverviewDiv15">
            <button
              type="button"
              class="load-more-button"
              on:click={loadMoreRepos}
              data-name="projects-load-more"
            >
              Load 12 more
            </button>
          </div>
        {/if}
      {:else}
        <!-- Empty State -->
        <div class="empty-state" data-name="PortfolioOverviewDiv16">
          <span class="empty-icon" data-name="PortfolioOverviewSpan17">🔍</span>
          <h3 data-name="PortfolioOverviewH318">No repositories found</h3>
          <p data-name="PortfolioOverviewP19">Try adjusting your search or filters</p>
        </div>
      {/if}
    {/if}
  </div>

  <RepoDetailPanel repo={$selectedRepo} on:close={closeSelectedRepo} />
</section>

<style>
  .portfolio-overview {
    min-height: 100vh;
    padding: 4rem 2rem;
  }

  .container {
    max-width: 1400px;
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

  .section-header h1 {
    font-size: 3rem;
    font-weight: 300;
    margin-bottom: 0.8rem;
    color: var(--text-primary);
  }

  .section-subtitle {
    font-size: 1.125rem;
    color: var(--text-secondary);
    max-width: 760px;
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

  .error-icon {
    font-size: 4rem;
  }

  .error-state h3 {
    font-size: 1.5rem;
    margin: 0;
    color: var(--text-primary);
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
    padding: 4rem 2rem;
    gap: 1rem;
    text-align: center;
    background: var(--surface-glass);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
  }

  .empty-icon {
    font-size: 4rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    margin: 0;
    color: var(--text-primary);
  }

  .empty-state p {
    color: var(--text-secondary);
  }

  /* Repos Header */
  .repos-header {
    margin-bottom: 1.5rem;
  }

  .repos-header h2 {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }

  /* Repos Grid */
  .repos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: 1.1rem;
  }

  .load-more-wrap {
    margin-top: 1.4rem;
    display: flex;
    justify-content: center;
  }

  .load-more-button {
    border: 1px solid var(--surface-border-strong);
    background: var(--surface-glass);
    color: var(--text-primary);
    border-radius: 999px;
    padding: 0.62rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
  }

  .load-more-button:hover {
    border-color: color-mix(in srgb, var(--accent-primary) 65%, transparent);
    background: color-mix(in srgb, var(--accent-primary) 12%, var(--surface-glass));
    transform: translateY(-1px);
  }

  .load-more-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .portfolio-overview {
      padding: 2rem 1rem;
    }

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
