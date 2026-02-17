<script>
  import { onMount } from 'svelte';
  import {
    loading,
    error,
    filteredRepos,
    selectedRepo,
    loadPortfolioData
  } from '../../stores/portfolioStore.js';
  import SearchFilter from './SearchFilter.svelte';
  import RepoCard from './RepoCard.svelte';
  import RepoDetailPanel from './RepoDetailPanel.svelte';

  // Load data on mount
  onMount(() => {
    loadPortfolioData();
  });

  function closeSelectedRepo() {
    selectedRepo.set(null);
  }
</script>

<section class="portfolio-overview">
  <div class="container">
    <!-- Header -->
    <header class="section-header">
      <h1>Portfolio Metrics</h1>
      <p class="section-subtitle">
        Comprehensive analysis of my development portfolio, powered by AI
      </p>
    </header>

    {#if $loading}
      <!-- Loading State -->
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading portfolio metrics...</p>
      </div>
    {:else if $error}
      <!-- Error State -->
      <div class="error-state">
        <span class="error-icon">⚠️</span>
        <h3>Failed to load metrics</h3>
        <p>{$error}</p>
        <button class="retry-button" on:click={loadPortfolioData}>
          Try Again
        </button>
      </div>
    {:else}
      <!-- Search & Filter -->
      <SearchFilter />

      <!-- Repositories Grid -->
      {#if $filteredRepos.length > 0}
        <div class="repos-header">
          <h2>Projects ({$filteredRepos.length})</h2>
        </div>

        <div class="repos-grid">
          {#each $filteredRepos as repo (repo.id)}
            <RepoCard {repo} />
          {/each}
        </div>
      {:else}
        <!-- Empty State -->
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <h3>No repositories found</h3>
          <p>Try adjusting your search or filters</p>
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
    text-align: center;
    margin-bottom: 3rem;
  }

  .section-header h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .section-subtitle {
    font-size: 1.125rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto;
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
    border: 4px solid rgba(59, 130, 246, 0.2);
    border-top-color: #3b82f6;
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
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .retry-button:hover {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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
    background: var(--card-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
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
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
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
    }
  }
</style>
