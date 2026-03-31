<script>
  import { onMount } from 'svelte';
  import {
    isLoading,
    hasError,
    repos,
    overallCategoryStats,
    overallLanguageProficiencyStats,
    overallQualityStats,
    loadPortfolioData
  } from '../../stores/portfolioStore.js';
  import CategorySpider from './CategorySpider.svelte';

  const BAND_COLORS = {
    Low: '#6b7280',
    Moderate: '#9ca3af',
    High: '#d1d5db',
    'Very High': '#f3f4f6'
  };
  const SPIDER_SCALE_OPTIONS = [
    { id: 'relative', label: 'Relative (Top axis = 100)' },
    { id: 'absolute', label: 'Absolute (Raw score)' }
  ];
  export let autoLoad = true;
  let spiderScaleMode = 'relative';

  onMount(() => {
    if (autoLoad) {
      loadPortfolioData();
    }
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

<section class="overall-dashboard" data-name="OverallCharacterDashboard">
  <header class="dashboard-header" data-name="OverallCharacterDashboardHeader1">
    <h1 data-name="OverallCharacterDashboardH12">Generalist Character Stats</h1>
    <p data-name="OverallCharacterDashboardP3">
      Portfolio-level dashboard for recruiter scanning: breadth by domain and quality proxy indicators.
    </p>
  </header>

  {#if $isLoading}
    <div class="state-card" data-name="OverallCharacterDashboardDiv4">
      <div class="spinner" aria-hidden="true" data-name="OverallCharacterDashboardDiv5"></div>
      <p data-name="OverallCharacterDashboardP6">Loading portfolio dashboard...</p>
    </div>
  {:else if $hasError}
    <div class="state-card error" data-name="OverallCharacterDashboardDiv7">
      <h2 data-name="OverallCharacterDashboardH28">Unable to load metrics</h2>
      <p data-name="OverallCharacterDashboardP9">{$hasError}</p>
      <button type="button" data-name="dashboard-retry" on:click={loadPortfolioData}>Retry</button>
    </div>
  {:else if $repos.length === 0}
    <div class="state-card" data-name="OverallCharacterDashboardDiv10">
      <h2 data-name="OverallCharacterDashboardH211">No projects to summarize yet</h2>
      <p data-name="OverallCharacterDashboardP12">Add repositories to build the overall profile dashboard.</p>
    </div>
  {:else}
    <div class="spider-controls" role="group" aria-label="Spider scale mode" data-name="OverallCharacterDashboardDiv13">
      <div class="control-buttons" data-name="OverallCharacterDashboardDiv14">
        {#each SPIDER_SCALE_OPTIONS as option}
          <button
            type="button"
            class="control-button {spiderScaleMode === option.id ? 'is-active' : ''}"
            aria-pressed={spiderScaleMode === option.id}
            data-name={`spider-scale-${option.id}`}
            on:click={() => (spiderScaleMode = option.id)}
          >
            {option.label}
          </button>
        {/each}
      </div>
      <p class="control-caption" data-name="OverallCharacterDashboardP15">
        Relative mode normalizes each chart by its strongest axis for easier shape comparison.
      </p>
    </div>

    <div class="dashboard-grid" data-name="OverallCharacterDashboardDiv16">
      <div class="left-column" data-name="OverallCharacterDashboardDiv17">
        <div class="category-panel" data-name="OverallCharacterDashboardDiv18">
          <CategorySpider
            stats={$overallCategoryStats}
            absoluteStats={$overallCategoryStats}
            scaleMode={spiderScaleMode}
            tableShowBoth={spiderScaleMode === 'relative'}
            size={430}
            title="Category Coverage"
            color="#22d3ee"
            fill="rgba(34, 211, 238, 0.18)"
          />
        </div>

        <div class="proficiency-panel" data-name="OverallCharacterDashboardDiv19">
          <CategorySpider
            stats={$overallLanguageProficiencyStats}
            absoluteStats={$overallLanguageProficiencyStats}
            scaleMode={spiderScaleMode}
            tableShowBoth={spiderScaleMode === 'relative'}
            size={430}
            title="Programming Language Proficiency"
            color="#34d399"
            fill="rgba(52, 211, 153, 0.16)"
          />
          <p class="proficiency-note" data-name="OverallCharacterDashboardP20">
            Blended signal: code share + complexity share, recency-weighted.
          </p>
        </div>
      </div>

      <aside class="quality-panel" aria-label="Quality Scorecard" data-name="OverallCharacterDashboardAside21">
        <h2 data-name="OverallCharacterDashboardH222">Quality Scorecard</h2>
        <p class="quality-subtitle" data-name="OverallCharacterDashboardP23">Proxy indicators from static code metrics.</p>

        {#each $overallQualityStats as item}
          <div class="quality-row" data-name="OverallCharacterDashboardDiv24">
            <div class="row-meta" data-name="OverallCharacterDashboardDiv25">
              <span data-name="OverallCharacterDashboardSpan26">{item.axis}</span>
              <strong data-name="OverallCharacterDashboardStrong27">{Math.round(item.score)}</strong>
            </div>
            <div class="row-track" data-name="OverallCharacterDashboardDiv28">
              <div
                class="row-fill"
                style="width: {safePercent(item.score)}%; background: {tone(item.band)}"
               data-name="OverallCharacterDashboardDiv29"></div>
            </div>
            <div class="row-band" data-name="OverallCharacterDashboardDiv30">{item.band}</div>
          </div>
        {/each}

        <p class="methodology" data-name="OverallCharacterDashboardP31">
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
    margin-bottom: 1rem;
    padding: 0.35rem 0;
    border-radius: 14px;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .dashboard-header h1 {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.6rem);
    line-height: 1.1;
    font-weight: 300;
    color: var(--text-primary);
  }

  .dashboard-header p {
    margin: 0.4rem 0 0;
    color: var(--text-secondary);
    max-width: 760px;
    line-height: 1.45;
    font-size: 0.95rem;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 1fr);
    gap: 1.35rem;
    align-items: start;
  }

  .spider-controls {
    margin-bottom: 0.9rem;
    display: grid;
    gap: 0.45rem;
  }

  .control-buttons {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .control-button {
    border-radius: 999px;
    border: 1px solid var(--chip-neutral-border);
    background: var(--chip-neutral-bg);
    color: var(--text-secondary);
    padding: 0.35rem 0.72rem;
    font-size: 0.76rem;
    line-height: 1;
    cursor: pointer;
  }

  .control-button.is-active {
    border-color: var(--chip-active-border);
    color: var(--text-primary);
    background: var(--chip-active-bg);
  }

  .control-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .control-caption {
    margin: 0;
    font-size: 0.77rem;
    color: var(--text-secondary);
    line-height: 1.38;
  }

  .left-column {
    display: grid;
    gap: 1rem;
    min-width: 0;
  }

  .category-panel,
  .proficiency-panel,
  .quality-panel,
  .state-card {
    border: 1px solid var(--panel-cinematic-border);
    border-radius: 14px;
    background: var(--panel-cinematic-bg);
    box-shadow: var(--panel-cinematic-shadow);
    padding: 1rem;
    min-width: 0;
    overflow: hidden;
  }

  .proficiency-note {
    margin: 0.7rem 0 0;
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .quality-panel h2 {
    margin: 0;
    font-size: 1.12rem;
  }

  .quality-subtitle {
    margin: 0.35rem 0 0.9rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .quality-row {
    margin-bottom: 0.62rem;
  }

  .row-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.83rem;
    margin-bottom: 0.22rem;
    color: var(--text-secondary);
  }

  .row-track {
    width: 100%;
    height: 9px;
    border-radius: 999px;
    background: var(--quality-track);
    overflow: hidden;
  }

  .row-fill {
    height: 100%;
    border-radius: inherit;
  }

  .row-band {
    margin-top: 0.18rem;
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .methodology {
    margin: 0.9rem 0 0;
    padding-top: 0.8rem;
    border-top: 1px solid var(--surface-border);
    font-size: 0.74rem;
    line-height: 1.45;
    color: var(--text-secondary);
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
    border: 1px solid color-mix(in srgb, var(--accent-primary) 65%, transparent);
    background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
    color: var(--text-primary);
    cursor: pointer;
  }

  .state-card.error button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .spinner {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 3px solid color-mix(in srgb, var(--surface-border-strong) 70%, transparent);
    border-top-color: var(--accent-primary);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1160px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .overall-dashboard {
      padding: 1.2rem 0.75rem;
    }

    .category-panel,
    .proficiency-panel,
    .quality-panel,
    .state-card {
      padding: 0.8rem;
    }
  }
</style>
