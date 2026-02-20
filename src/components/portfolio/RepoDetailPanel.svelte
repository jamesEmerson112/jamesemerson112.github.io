<script>
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import CategorySpider from './CategorySpider.svelte';
  import {
    buildProgrammingComposition,
    formatCurrency,
    formatDuration,
    formatNumber,
    getDisplayPrimaryLanguage,
    getLanguageColor
  } from '../../utils/dataLoader.js';
  import { computeRepoQualitySignals } from '../../utils/profileMetrics.js';
  import { qualityBaselines } from '../../stores/portfolioStore.js';

  export let repo = null;

  const dispatch = createEventDispatcher();
  let closeButton;
  let previouslyFocused;
  let panelWasOpen = false;
  const OTHER_COLOR = 'var(--mono-tone-5)';

  $: savingsPercent = repo?.summary?.traditionalCost > 0
    ? Math.round(((repo.summary.traditionalCost - repo.summary.aiCost) / repo.summary.traditionalCost) * 100)
    : 0;

  $: displayPrimaryLanguage = getDisplayPrimaryLanguage(repo?.primaryLanguage || '', repo?.languages || []);
  $: topProjectTags = Array.isArray(repo?.projectTags) ? repo.projectTags.slice(0, 2) : [];
  $: qualitySignals = repo ? computeRepoQualitySignals(repo, $qualityBaselines) : [];
  $: languageRows = buildProgrammingComposition(repo?.languages || []);
  $: repoUrl = repo?.url || repo?.htmlUrl || null;
  $: canShowRepoLink = repo?.isPrivate !== true && Boolean(repoUrl);

  function closePanel() {
    dispatch('close');
  }

  function compositionColor(name) {
    if (name === 'Other') {
      return OTHER_COLOR;
    }
    return getLanguageColor(name);
  }

  function scoreClass(score) {
    if (score >= 75) return 'very-high';
    if (score >= 50) return 'high';
    if (score >= 25) return 'moderate';
    return 'low';
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

  $: if (repo && !panelWasOpen) {
    panelWasOpen = true;
    previouslyFocused = document.activeElement;
    tick().then(() => closeButton?.focus());
  }

  $: if (!repo && panelWasOpen) {
    panelWasOpen = false;
    if (previouslyFocused?.focus) {
      previouslyFocused.focus();
    }
  }
</script>

{#if repo}
  <div class="detail-overlay" name="RepoDetailPanel" role="presentation" on:click|self={closePanel}>
    <aside
      class="detail-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repo-detail-title"
    >
      <header class="detail-header">
        <div class="detail-title-wrap">
          <h2 id="repo-detail-title">{repo.name}</h2>
          {#if displayPrimaryLanguage}
            <span class="language-chip">
              <span class="dot"></span>
              {displayPrimaryLanguage}
            </span>
          {/if}
        </div>

        <div class="header-actions">
          {#if canShowRepoLink}
            <a
              class="repo-link"
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View Repository: ${repo.name}`}
            >
              View Repository ↗
            </a>
          {/if}
          <button
            bind:this={closeButton}
            class="close-btn"
            type="button"
            name="repo-detail-close"
            on:click={closePanel}
            aria-label="Close repository details"
          >
            Close
          </button>
        </div>
      </header>

      <section class="detail-body">
        <div class="detail-meta">
          {#if repo.isAnonymized}
            <p class="repo-description muted">
              This Private Academic Projects entry is anonymized for recruiter-safe display.
            </p>
          {:else if repo.description}
            <p class="repo-description">{repo.description}</p>
          {/if}

          {#if topProjectTags.length > 0}
            <div class="project-signals" aria-label="Project type signals">
              <div class="signals-label">Project Type Signals</div>
              <div class="signals-tags">
                {#each topProjectTags as tag}
                  <span class="signal-tag">{tag.label} {Math.round((tag.confidence || 0) * 100)}%</span>
                {/each}
              </div>
            </div>
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

        <div class="detail-visuals">
          <div class="language-breakdown">
            <h3>Language composition</h3>
            {#if languageRows.length > 0}
              <div class="composition-bars" aria-hidden="true">
                {#each languageRows as language}
                  <div class="composition-row">
                    <div class="composition-meta">
                      <span>{language.name}</span>
                      <span>{language.percent.toFixed(1)}%</span>
                    </div>
                    <div class="composition-track">
                      <div
                        class="composition-fill"
                        style="width: {Math.max(0, Math.min(100, language.percent))}%; background-color: {compositionColor(language.name)}"
                        data-testid="language-composition-bar"
                      ></div>
                    </div>
                  </div>
                {/each}
              </div>

              <table aria-label="Language composition breakdown">
                <thead>
                  <tr>
                    <th scope="col">Language</th>
                    <th scope="col">Code</th>
                    <th scope="col">Code %</th>
                    <th scope="col">Complexity</th>
                    <th scope="col">Complexity %</th>
                  </tr>
                </thead>
                <tbody>
                  {#each languageRows as language}
                    <tr>
                      <th scope="row">{language.name}</th>
                      <td>{formatNumber(language.code)}</td>
                      <td>{language.percent.toFixed(1)}%</td>
                      <td>{formatNumber(language.complexity)}</td>
                      <td>{language.complexityPercent.toFixed(1)}%</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              <p class="empty-breakdown">No language metrics available.</p>
            {/if}
          </div>

          <div class="detail-chart">
            <h3>Quality Profile</h3>
            <CategorySpider
              stats={qualitySignals}
              size={360}
              title="Quality Profile"
              showTitle={false}
              showAxisTable={false}
              color="#38bdf8"
              fill="rgba(56, 189, 248, 0.18)"
            />

            <div class="quality-rows" aria-label="Quality profile scores">
              {#each qualitySignals as signal}
                <div class="quality-row">
                  <div class="quality-meta">
                    <span>{signal.axis}</span>
                    <strong>{Math.round(signal.score)}</strong>
                  </div>
                  <div class="quality-track">
                    <div class="quality-fill {scoreClass(signal.score)}" style="width: {signal.score}%"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>
    </aside>
  </div>
{/if}

<style>
  .detail-overlay {
    position: fixed;
    inset: 0;
    background: var(--surface-overlay);
    backdrop-filter: blur(5px);
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
  }

  .detail-panel {
    width: min(1160px, 100%);
    max-height: 92vh;
    overflow: auto;
    background: var(--surface-elevated);
    color: var(--text-primary, #fff);
    border: 1px solid var(--surface-border-strong);
    border-radius: 16px;
    padding: 1.1rem;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .detail-title-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    align-items: center;
  }

  .detail-title-wrap h2 {
    margin: 0;
    font-size: 1.42rem;
  }

  .language-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.34rem;
    border: 1px solid var(--surface-border-strong);
    background: var(--surface-glass);
    color: var(--text-primary);
    border-radius: 999px;
    padding: 0.2rem 0.58rem;
    font-size: 0.74rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-primary);
  }

  .close-btn {
    border: 1px solid var(--surface-border-strong);
    background: var(--surface-glass);
    color: inherit;
    border-radius: 8px;
    padding: 0.5rem 0.85rem;
    cursor: pointer;
  }

  .close-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .repo-link {
    text-decoration: none;
    border: 1px solid var(--surface-border-strong);
    background: var(--surface-glass);
    color: var(--text-primary);
    border-radius: 8px;
    padding: 0.5rem 0.8rem;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .repo-link:hover {
    text-decoration: underline;
  }

  .repo-link:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .detail-body {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(420px, 1.2fr);
    gap: 1rem;
  }

  .detail-meta {
    min-width: 0;
  }

  .repo-description {
    margin: 0 0 0.9rem;
    line-height: 1.45;
    opacity: 0.92;
  }

  .repo-description.muted {
    font-style: italic;
    opacity: 0.75;
  }

  .project-signals {
    margin: 0 0 1rem;
  }

  .signals-label {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.65;
    margin-bottom: 0.35rem;
  }

  .signals-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.44rem;
  }

  .signal-tag {
    border-radius: 999px;
    border: 1px solid var(--surface-border);
    background: var(--surface-glass);
    color: var(--text-secondary);
    font-size: 0.7rem;
    padding: 0.2rem 0.55rem;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.7rem;
    margin-bottom: 1rem;
  }

  .summary-grid .label {
    font-size: 0.7rem;
    opacity: 0.65;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.24rem;
  }

  .summary-grid .value {
    font-size: 1rem;
    font-weight: 700;
  }

  .cost-card {
    border: 1px solid var(--surface-border);
    border-radius: 10px;
    padding: 0.78rem;
    background: var(--surface-glass);
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 0.6rem;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
  }

  .row strong {
    font-weight: 700;
  }

  .row.highlight strong {
    color: var(--text-primary);
  }

  .caveat {
    margin: 0.3rem 0 0;
    font-size: 0.74rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .detail-visuals {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.9rem;
    align-items: start;
  }

  .language-breakdown,
  .detail-chart {
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: 0.8rem;
    background: var(--surface-glass);
  }

  h3 {
    margin: 0 0 0.65rem;
    font-size: 0.94rem;
    letter-spacing: 0.02em;
  }

  .composition-bars {
    margin-bottom: 0.75rem;
  }

  .composition-row {
    margin-bottom: 0.45rem;
  }

  .composition-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.74rem;
    margin-bottom: 0.2rem;
    color: var(--text-secondary, #cbd5e1);
  }

  .composition-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: var(--quality-track);
    overflow: hidden;
  }

  .composition-fill {
    height: 100%;
    border-radius: inherit;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78rem;
  }

  th,
  td {
    padding: 0.38rem 0.34rem;
    border-bottom: 1px solid var(--surface-border);
    text-align: left;
  }

  tbody tr:last-child th,
  tbody tr:last-child td {
    border-bottom: none;
  }

  .empty-breakdown {
    margin: 0;
    color: var(--text-muted, #94a3b8);
    font-size: 0.8rem;
  }

  .quality-rows {
    margin-top: 0.7rem;
  }

  .quality-row {
    margin-top: 0.45rem;
  }

  .quality-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.76rem;
    margin-bottom: 0.2rem;
    color: var(--text-secondary, #cbd5e1);
  }

  .quality-track {
    width: 100%;
    height: 7px;
    border-radius: 999px;
    background: var(--quality-track);
    overflow: hidden;
  }

  .quality-fill {
    height: 100%;
    border-radius: inherit;
  }

  .quality-fill.low {
    background: linear-gradient(90deg, #6b7280, #9ca3af);
  }

  .quality-fill.moderate {
    background: linear-gradient(90deg, #9ca3af, #d1d5db);
  }

  .quality-fill.high {
    background: linear-gradient(90deg, #d1d5db, #e5e7eb);
  }

  .quality-fill.very-high {
    background: linear-gradient(90deg, #e5e7eb, #f3f4f6);
  }

  @media (max-width: 1080px) {
    .detail-body {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .detail-visuals {
      grid-template-columns: 1fr;
    }

    .language-breakdown {
      order: 1;
    }

    .detail-chart {
      order: 2;
    }

    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
