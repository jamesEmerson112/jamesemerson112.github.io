<script lang="ts">
  import { formatCurrency, formatDuration, formatNumber } from '../../utils/formatters.ts';
  import type { RepoSummary } from '../../types.js';

  export let summary: RepoSummary;

  $: savingsPercent = summary?.traditionalCost > 0
    ? Math.round(((summary.traditionalCost - summary.aiCost) / summary.traditionalCost) * 100)
    : 0;
</script>

<div class="summary-grid" data-name="RepoDetailPanelDiv17">
  <div data-name="RepoDetailPanelDiv18">
    <div class="label" data-name="RepoDetailPanelDiv19">Lines</div>
    <div class="value" data-name="RepoDetailPanelDiv20">{formatNumber(summary.lines)}</div>
  </div>
  <div data-name="RepoDetailPanelDiv21">
    <div class="label" data-name="RepoDetailPanelDiv22">Files</div>
    <div class="value" data-name="RepoDetailPanelDiv23">{formatNumber(summary.files)}</div>
  </div>
  <div data-name="RepoDetailPanelDiv24">
    <div class="label" data-name="RepoDetailPanelDiv25">Complexity</div>
    <div class="value" data-name="RepoDetailPanelDiv26">{formatNumber(summary.complexity)}</div>
  </div>
</div>

<div class="cost-card" data-name="RepoDetailPanelDiv27">
  <div class="row" data-name="RepoDetailPanelDiv28">
    <span data-name="RepoDetailPanelSpan29">Traditional estimate</span>
    <strong data-name="RepoDetailPanelStrong30">{formatCurrency(summary.traditionalCost)}</strong>
  </div>
  <div class="row highlight" data-name="RepoDetailPanelDiv31">
    <span data-name="RepoDetailPanelSpan32">AI-assisted estimate</span>
    <strong data-name="RepoDetailPanelStrong33">{formatCurrency(summary.aiCost)}</strong>
  </div>
  <div class="row" data-name="RepoDetailPanelDiv34">
    <span data-name="RepoDetailPanelSpan35">AI-assisted timeline</span>
    <strong data-name="RepoDetailPanelStrong36">{formatDuration(summary.aiMonths)}</strong>
  </div>
  <p class="caveat" data-name="RepoDetailPanelP37">
    Estimates are COCOMO-derived directional metrics, not delivery guarantees.
    Savings shown: {savingsPercent}%.
  </p>
</div>

<style>
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.7rem;
    margin-bottom: 1rem;
  }

  .summary-grid .label {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.35rem;
  }

  /* Display numerals, as in the home hero stats. */
  .summary-grid .value {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 300;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--scene-text);
    font-variant-numeric: tabular-nums lining-nums;
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
    font-family: var(--font-mono);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
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

  @media (max-width: 560px) {
    .summary-grid .value {
      font-size: 22px;
    }
  }
</style>
