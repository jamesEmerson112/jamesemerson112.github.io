<script lang="ts">
  import { onMount } from 'svelte';
  import {
    isLoading,
    hasError,
    repos,
    overallCategoryStats,
    overallLanguageProficiencyStats,
    overallQualityStats,
    loadPortfolioData
  } from '../../stores/portfolioStore.ts';
  import { clampPercent } from '../../utils/math.ts';
  import CategorySpider from './CategorySpider.svelte';

  const BAND_COLORS = {
    Low: 'var(--mono-tone-4)',
    Moderate: 'var(--band-moderate)',
    High: 'var(--acc)',
    'Very High': 'var(--acc)'
  };
  const SPIDER_SCALE_OPTIONS = [
    { id: 'relative', label: 'Relative (Top axis = 100)' },
    { id: 'absolute', label: 'Absolute (Raw score)' }
  ];
  const LANGUAGE_SHORT_LABELS = ['JS/TS', 'C/C++/Rust', 'Python', 'Web UI', 'Data/SQL', 'Other'];
  export let autoLoad = true;
  let spiderScaleMode = 'relative';

  onMount(() => {
    if (autoLoad) {
      loadPortfolioData();
    }
  });

  function tone(band) {
    return BAND_COLORS[band] || 'var(--band-moderate)';
  }
</script>

<section class="overall-dashboard" data-name="OverallCharacterDashboard">
  <header class="dashboard-header" data-name="OverallCharacterDashboardHeader1">
    <div class="eyebrow" data-name="OverallCharacterDashboardEyebrow">// PORTFOLIO ANALYSIS</div>
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
      <div class="panel category-panel" data-name="OverallCharacterDashboardDiv18">
        <CategorySpider
          stats={$overallCategoryStats}
          absoluteStats={$overallCategoryStats}
          scaleMode={spiderScaleMode}
          tableShowBoth={true}
          showRingHint={false}
          dotRadius={2.6}
          size={300}
          title="Category Coverage"
          subtitle="Breadth across engineering domains"
          color="var(--acc)"
          fill="color-mix(in srgb, var(--acc) 18%, transparent)"
        />
      </div>

      <div class="panel proficiency-panel" data-name="OverallCharacterDashboardDiv19">
        <CategorySpider
          stats={$overallLanguageProficiencyStats}
          absoluteStats={$overallLanguageProficiencyStats}
          scaleMode={spiderScaleMode}
          tableShowBoth={true}
          showRingHint={false}
          dotRadius={2.6}
          size={300}
          title="Language Proficiency"
          subtitle="Code share + complexity, recency-weighted"
          displayLabels={LANGUAGE_SHORT_LABELS}
          color="var(--acc-2)"
          fill="color-mix(in srgb, var(--acc-2) 16%, transparent)"
        />
      </div>

      <aside class="panel quality-panel" aria-label="Quality Scorecard" data-name="OverallCharacterDashboardAside21">
        <h2 data-name="OverallCharacterDashboardH222">Quality Scorecard</h2>
        <p class="quality-subtitle" data-name="OverallCharacterDashboardP23">Proxy indicators from static code metrics</p>

        {#each $overallQualityStats as item}
          <div class="quality-row" data-name="OverallCharacterDashboardDiv24">
            <div class="row-meta" data-name="OverallCharacterDashboardDiv25">
              <span data-name="OverallCharacterDashboardSpan26">{item.axis}</span>
              <strong data-name="OverallCharacterDashboardStrong27">{Math.round(item.score)}</strong>
            </div>
            <div class="row-track" data-name="OverallCharacterDashboardDiv28">
              <div
                class="row-fill"
                style="width: {clampPercent(item.score)}%; background: {tone(item.band)}"
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
    max-width: 1160px;
    margin: 0 auto;
    padding: 0;
  }

  .dashboard-header {
    margin-bottom: 1rem;
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

  .dashboard-header h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(32px, 3.8vw, 50px);
    line-height: 1.1;
    font-weight: 300;
    letter-spacing: -0.01em;
    color: var(--scene-text);
  }

  .dashboard-header p {
    margin: 12px 0 0;
    color: var(--text-secondary);
    max-width: 720px;
    line-height: 1.5;
    font-size: 15px;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    align-items: start;
    margin-top: 26px;
  }

  .spider-controls {
    margin: 30px 0 0.9rem;
    display: grid;
    gap: 12px;
  }

  .control-buttons {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .control-button {
    border-radius: 999px;
    border: 1px solid var(--line-1);
    background: transparent;
    color: var(--mono-tone-3);
    font-family: var(--font-mono);
    padding: 6px 14px;
    font-size: 11.5px;
    line-height: 1.4;
    cursor: pointer;
    transition: all 0.18s;
  }

  .control-button.is-active {
    border-color: color-mix(in srgb, var(--acc) 60%, transparent);
    color: var(--text-primary);
    background: color-mix(in srgb, var(--acc) 14%, transparent);
  }

  .control-button:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  .control-caption {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.38;
  }

  .panel,
  .state-card {
    border: 1px solid var(--line-2);
    border-radius: 14px;
    background: var(--card-bg);
    padding: 22px;
    min-width: 0;
    overflow: hidden;
  }

  .quality-panel h2 {
    margin: 0 0 2px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .quality-subtitle {
    margin: 0 0 18px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-muted);
  }

  .quality-row {
    margin-bottom: 15px;
  }

  .row-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    margin-bottom: 6px;
    color: var(--mono-tone-2);
  }

  .row-meta strong {
    color: var(--text-primary);
  }

  .row-track {
    width: 100%;
    height: 6px;
    border-radius: 4px;
    background: var(--quality-track);
    overflow: hidden;
  }

  .row-fill {
    height: 100%;
    border-radius: inherit;
  }

  .row-band {
    margin-top: 4px;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .methodology {
    margin: 16px 0 0;
    padding-top: 14px;
    border-top: 1px solid var(--line-3);
    font-size: 10.5px;
    line-height: 1.5;
    color: var(--text-muted);
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

  @media (max-width: 640px) {
    .panel,
    .state-card {
      padding: 16px;
    }
  }
</style>
