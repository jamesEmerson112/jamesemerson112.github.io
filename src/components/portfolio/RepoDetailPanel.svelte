<script>
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import CategorySpider from './CategorySpider.svelte';
  import RepoCostCard from './RepoCostCard.svelte';
  import RepoLanguageBreakdown from './RepoLanguageBreakdown.svelte';
  import { getDisplayPrimaryLanguage } from '../../utils/languageUtils.ts';
  import { computeRepoQualitySignals } from '../../utils/profileMetrics.ts';
  import { qualityBaselines } from '../../stores/portfolioStore.ts';

  export let repo = null;

  const dispatch = createEventDispatcher();
  let closeButton;
  let previouslyFocused;
  let panelWasOpen = false;

  $: displayPrimaryLanguage = getDisplayPrimaryLanguage(repo?.primaryLanguage || '', repo?.languages || []);
  $: topProjectTags = Array.isArray(repo?.projectTags) ? repo.projectTags.slice(0, 2) : [];
  $: qualitySignals = repo ? computeRepoQualitySignals(repo, $qualityBaselines) : [];
  $: repoUrl = repo?.url || repo?.htmlUrl || null;
  $: canShowRepoLink = repo?.isPrivate !== true && Boolean(repoUrl);

  function closePanel() {
    dispatch('close');
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
  <div class="detail-overlay" data-name="RepoDetailPanel" role="presentation" on:click|self={closePanel}>
    <aside
      class="detail-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repo-detail-title"
     data-name="RepoDetailPanelAside1">
      <header class="detail-header" data-name="RepoDetailPanelHeader2">
        <div class="detail-title-wrap" data-name="RepoDetailPanelDiv3">
          <h2 id="repo-detail-title" data-name="RepoDetailPanelH24">{repo.name}</h2>
          {#if displayPrimaryLanguage}
            <span class="language-chip" data-name="RepoDetailPanelSpan5">
              <span class="dot" data-name="RepoDetailPanelSpan6"></span>
              {displayPrimaryLanguage}
            </span>
          {/if}
        </div>

        <div class="header-actions" data-name="RepoDetailPanelDiv7">
          {#if canShowRepoLink}
            <a
              class="repo-link"
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View Repository: ${repo.name}`}
             data-name="RepoDetailPanelA8">
              View Repository ↗
            </a>
          {/if}
          <button
            bind:this={closeButton}
            class="close-btn"
            type="button"
            data-name="repo-detail-close"
            on:click={closePanel}
            aria-label="Close repository details"
          >
            Close
          </button>
        </div>
      </header>

      <section class="detail-body" data-name="RepoDetailPanelSection9">
        <div class="detail-meta" data-name="RepoDetailPanelDiv10">
          {#if repo.isAnonymized}
            <p class="repo-description muted" data-name="RepoDetailPanelP11">
              This Private Academic Projects entry is anonymized for recruiter-safe display.
            </p>
          {:else if repo.description}
            <p class="repo-description" data-name="RepoDetailPanelP12">{repo.description}</p>
          {/if}

          {#if topProjectTags.length > 0}
            <div class="project-signals" aria-label="Project type signals" data-name="RepoDetailPanelDiv13">
              <div class="signals-label" data-name="RepoDetailPanelDiv14">Project Type Signals</div>
              <div class="signals-tags" data-name="RepoDetailPanelDiv15">
                {#each topProjectTags as tag}
                  <span class="signal-tag" data-name="RepoDetailPanelSpan16">{tag.label} {Math.round((tag.confidence || 0) * 100)}%</span>
                {/each}
              </div>
            </div>
          {/if}

          <RepoCostCard summary={repo.summary} />
        </div>

        <div class="detail-visuals" data-name="RepoDetailPanelDiv38">
          <RepoLanguageBreakdown languages={repo.languages || []} />

          <div class="detail-chart" data-name="RepoDetailPanelDiv64">
            <h3 data-name="RepoDetailPanelH365">Quality Profile</h3>
            <CategorySpider
              stats={qualitySignals}
              size={360}
              title="Quality Profile"
              showTitle={false}
              showAxisTable={false}
              color="#38bdf8"
              fill="rgba(56, 189, 248, 0.18)"
            />

            <div class="quality-rows" aria-label="Quality profile scores" data-name="RepoDetailPanelDiv66">
              {#each qualitySignals as signal}
                <div class="quality-row" data-name="RepoDetailPanelDiv67">
                  <div class="quality-meta" data-name="RepoDetailPanelDiv68">
                    <span data-name="RepoDetailPanelSpan69">{signal.axis}</span>
                    <strong data-name="RepoDetailPanelStrong70">{Math.round(signal.score)}</strong>
                  </div>
                  <div class="quality-track" data-name="RepoDetailPanelDiv71">
                    <div class="quality-fill {scoreClass(signal.score)}" style="width: {signal.score}%" data-name="RepoDetailPanelDiv72"></div>
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

  .detail-visuals {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.9rem;
    align-items: start;
  }

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

    .detail-chart {
      order: 2;
    }
  }
</style>
