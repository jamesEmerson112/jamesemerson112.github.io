<script>
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import LanguageSpider from './LanguageSpider.svelte';
  import {
    formatCurrency,
    formatDuration,
    formatNumber,
    getLanguageColor
  } from '../../utils/dataLoader.js';

  export let repo = null;

  const dispatch = createEventDispatcher();
  let closeButton;
  let previouslyFocused;

  $: savingsPercent = repo?.summary?.traditionalCost > 0
    ? Math.round(((repo.summary.traditionalCost - repo.summary.aiCost) / repo.summary.traditionalCost) * 100)
    : 0;

  $: languageColor = repo?.primaryLanguage
    ? getLanguageColor(repo.primaryLanguage)
    : '#64748b';

  function closePanel() {
    dispatch('close');
  }

  onMount(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && repo) {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  });

  $: if (repo) {
    previouslyFocused = document.activeElement;
    tick().then(() => closeButton?.focus());
  }

  $: if (!repo && previouslyFocused?.focus) {
    // Restore focus to the triggering card for keyboard users.
    previouslyFocused.focus();
  }
</script>

{#if repo}
  <div class="detail-overlay" role="presentation" on:click|self={closePanel}>
    <aside
      class="detail-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repo-detail-title"
    >
      <header class="detail-header">
        <div class="detail-title-wrap">
          <h2 id="repo-detail-title">{repo.name}</h2>
          {#if repo.primaryLanguage}
            <span class="language-chip" style="border-color: {languageColor};">
              <span class="dot" style="background-color: {languageColor};"></span>
              {repo.primaryLanguage}
            </span>
          {/if}
        </div>

        <button
          bind:this={closeButton}
          class="close-btn"
          type="button"
          on:click={closePanel}
          aria-label="Close repository details"
        >
          Close
        </button>
      </header>

      <section class="detail-body">
        <div class="detail-meta">
          {#if repo.isAnonymized}
            <p class="repo-description muted">
              This private repository is anonymized for recruiter-safe display.
            </p>
          {:else if repo.description}
            <p class="repo-description">{repo.description}</p>
          {/if}

          <div class="summary-grid">
            <div>
              <div class="label">Lines</div>
              <div class="value">{formatNumber(repo.summary.lines)}</div>
            </div>
            <div>
              <div class="label">Files</div>
              <div class="value">{formatNumber(repo.summary.files)}</div>
            </div>
            <div>
              <div class="label">Complexity</div>
              <div class="value">{formatNumber(repo.summary.complexity)}</div>
            </div>
          </div>

          <div class="cost-card">
            <div class="row">
              <span>Traditional estimate</span>
              <strong>{formatCurrency(repo.summary.traditionalCost)}</strong>
            </div>
            <div class="row highlight">
              <span>AI-assisted estimate</span>
              <strong>{formatCurrency(repo.summary.aiCost)}</strong>
            </div>
            <div class="row">
              <span>AI-assisted timeline</span>
              <strong>{formatDuration(repo.summary.aiMonths)}</strong>
            </div>
            <p class="caveat">
              Estimates are COCOMO-derived directional metrics, not delivery guarantees.
              Savings shown: {savingsPercent}%.
            </p>
          </div>
        </div>

        <div class="detail-chart">
          <LanguageSpider
            languages={repo.languages || []}
            size={340}
            showLabels={true}
          />
        </div>
      </section>
    </aside>
  </div>
{/if}

<style>
  .detail-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
  }

  .detail-panel {
    width: min(980px, 100%);
    max-height: 90vh;
    overflow: auto;
    background: var(--bg-card, #111);
    color: var(--text-primary, #fff);
    border: 1px solid var(--border-primary, #333);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .detail-title-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  .detail-title-wrap h2 {
    margin: 0;
    font-size: 1.4rem;
  }

  .language-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid;
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .close-btn {
    border: 1px solid var(--border-primary, #333);
    background: transparent;
    color: inherit;
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
  }

  .detail-body {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 1rem;
  }

  .repo-description {
    margin: 0 0 0.9rem;
    line-height: 1.45;
    opacity: 0.9;
  }

  .repo-description.muted {
    font-style: italic;
    opacity: 0.75;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .label {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.65;
  }

  .value {
    margin-top: 0.2rem;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .cost-card {
    border: 1px solid var(--border-primary, #333);
    border-radius: 10px;
    padding: 0.85rem;
    background: rgba(255, 255, 255, 0.02);
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin: 0.4rem 0;
    font-size: 0.9rem;
  }

  .row.highlight strong {
    color: #10b981;
  }

  .caveat {
    margin-top: 0.8rem;
    font-size: 0.74rem;
    line-height: 1.4;
    opacity: 0.7;
  }

  .detail-chart {
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--border-primary, #333);
    border-radius: 10px;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
  }

  @media (max-width: 900px) {
    .detail-body {
      grid-template-columns: 1fr;
    }
  }
</style>
