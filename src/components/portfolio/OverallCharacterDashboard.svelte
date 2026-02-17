<script>
  import { onMount } from 'svelte';
  import {
    loading,
    error,
    repos,
    overallCategoryStats,
    overallQualityStats,
    loadPortfolioData
  } from '../../stores/portfolioStore.js';
  import CategorySpider from './CategorySpider.svelte';

  const BAND_COLORS = {
    Low: '#f59e0b',
    Moderate: '#eab308',
    High: '#22c55e',
    'Very High': '#38bdf8'
  };

  onMount(() => {
    loadPortfolioData();
  });

  function safePercent(score) {
    const value = Number(score);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  function tone(band) {
    return BAND_COLORS[band] || '#94a3b8';
  }
</script>

<section class="overall-dashboard">
  <header class="dashboard-header">
    <h1>Generalist Character Stats</h1>
    <p>
      Portfolio-level dashboard for recruiter scanning: breadth by domain and quality proxy indicators.
    </p>
  </header>

  {#if $loading}
    <div class="state-card">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading portfolio dashboard...</p>
    </div>
  {:else if $error}
    <div class="state-card error">
      <h2>Unable to load metrics</h2>
      <p>{$error}</p>
      <button type="button" on:click={loadPortfolioData}>Retry</button>
    </div>
  {:else if $repos.length === 0}
    <div class="state-card">
      <h2>No projects to summarize yet</h2>
      <p>Add repositories to build the overall profile dashboard.</p>
    </div>
  {:else}
    <div class="dashboard-grid">
      <div class="category-panel">
        <CategorySpider
          stats={$overallCategoryStats}
          size={430}
          title="Category Coverage"
          color="#22d3ee"
          fill="rgba(34, 211, 238, 0.18)"
        />
      </div>

      <aside class="quality-panel" aria-label="Quality Scorecard">
        <h2>Quality Scorecard</h2>
        <p class="quality-subtitle">Proxy indicators from static code metrics.</p>

        {#each $overallQualityStats as item}
          <div class="quality-row">
            <div class="row-meta">
              <span>{item.axis}</span>
              <strong>{Math.round(item.score)}</strong>
            </div>
            <div class="row-track">
              <div
                class="row-fill"
                style="width: {safePercent(item.score)}%; background: {tone(item.band)}"
              ></div>
            </div>
            <div class="row-band">{item.band}</div>
          </div>
        {/each}

        <p class="methodology">
          Methodology: robust normalization (`p10/p90`) on portfolio-relative signals.
          Caveat: proxy indicators from static code metrics; not runtime correctness evidence.
        </p>
      </aside>
    </div>
  {/if}
</section>

<style>
  .overall-dashboard {
    min-height: 100%;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem 1.25rem;
  }

  .dashboard-header {
    margin-bottom: 1.2rem;
  }

  .dashboard-header h1 {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.6rem);
    line-height: 1.1;
    color: var(--text-primary, #f8fafc);
  }

  .dashboard-header p {
    margin: 0.4rem 0 0;
    color: var(--text-secondary, #cbd5e1);
    max-width: 760px;
    line-height: 1.45;
    font-size: 0.95rem;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 1fr);
    gap: 1rem;
    align-items: stretch;
  }

  .category-panel,
  .quality-panel,
  .state-card {
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 14px;
    background: linear-gradient(155deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.48));
    padding: 1rem;
  }

  .quality-panel h2 {
    margin: 0;
    font-size: 1.12rem;
  }

  .quality-subtitle {
    margin: 0.35rem 0 0.9rem;
    font-size: 0.8rem;
    color: var(--text-secondary, #cbd5e1);
  }

  .quality-row {
    margin-bottom: 0.62rem;
  }

  .row-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.83rem;
    margin-bottom: 0.22rem;
    color: var(--text-secondary, #cbd5e1);
  }

  .row-track {
    width: 100%;
    height: 9px;
    border-radius: 999px;
    background: rgba(71, 85, 105, 0.38);
    overflow: hidden;
  }

  .row-fill {
    height: 100%;
    border-radius: inherit;
  }

  .row-band {
    margin-top: 0.18rem;
    font-size: 0.72rem;
    color: var(--text-muted, #94a3b8);
  }

  .methodology {
    margin: 0.9rem 0 0;
    padding-top: 0.8rem;
    border-top: 1px solid rgba(148, 163, 184, 0.22);
    font-size: 0.74rem;
    line-height: 1.45;
    color: rgba(226, 232, 240, 0.84);
  }

  .state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 260px;
    text-align: center;
    gap: 0.7rem;
  }

  .state-card h2,
  .state-card p {
    margin: 0;
  }

  .state-card.error button {
    margin-top: 0.2rem;
    border-radius: 8px;
    padding: 0.48rem 0.9rem;
    border: 1px solid rgba(56, 189, 248, 0.65);
    background: rgba(56, 189, 248, 0.14);
    color: var(--text-primary, #fff);
    cursor: pointer;
  }

  .state-card.error button:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  .spinner {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 3px solid rgba(148, 163, 184, 0.32);
    border-top-color: #38bdf8;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 980px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .overall-dashboard {
      padding: 1.2rem 0.75rem;
    }

    .category-panel,
    .quality-panel,
    .state-card {
      padding: 0.8rem;
    }
  }
</style>
