<script>
  import { formatNumber } from '../../utils/formatters.js';
  import { buildProgrammingComposition, getLanguageColor } from '../../utils/languageUtils.js';

  export let languages = [];

  const OTHER_COLOR = 'var(--mono-tone-5)';

  $: languageRows = buildProgrammingComposition(languages);

  function compositionColor(name) {
    return name === 'Other' ? OTHER_COLOR : getLanguageColor(name);
  }
</script>

<div class="language-breakdown" data-name="RepoDetailPanelDiv39">
  <h3 data-name="RepoDetailPanelH340">Language composition</h3>
  {#if languageRows.length > 0}
    <div class="composition-bars" aria-hidden="true" data-name="RepoDetailPanelDiv41">
      {#each languageRows as language}
        <div class="composition-row" data-name="RepoDetailPanelDiv42">
          <div class="composition-meta" data-name="RepoDetailPanelDiv43">
            <span data-name="RepoDetailPanelSpan44">{language.name}</span>
            <span data-name="RepoDetailPanelSpan45">{language.percent.toFixed(1)}%</span>
          </div>
          <div class="composition-track" data-name="RepoDetailPanelDiv46">
            <div
              class="composition-fill"
              style="width: {Math.max(0, Math.min(100, language.percent))}%; background-color: {compositionColor(language.name)}"
              data-testid="language-composition-bar"
             data-name="RepoDetailPanelDiv47"></div>
          </div>
        </div>
      {/each}
    </div>

    <table aria-label="Language composition breakdown" data-name="RepoDetailPanelTable48">
      <thead data-name="RepoDetailPanelThead49">
        <tr data-name="RepoDetailPanelTr50">
          <th scope="col" data-name="RepoDetailPanelTh51">Language</th>
          <th scope="col" data-name="RepoDetailPanelTh52">Code</th>
          <th scope="col" data-name="RepoDetailPanelTh53">Code %</th>
          <th scope="col" data-name="RepoDetailPanelTh54">Complexity</th>
          <th scope="col" data-name="RepoDetailPanelTh55">Complexity %</th>
        </tr>
      </thead>
      <tbody data-name="RepoDetailPanelTbody56">
        {#each languageRows as language}
          <tr data-name="RepoDetailPanelTr57">
            <th scope="row" data-name="RepoDetailPanelTh58">{language.name}</th>
            <td data-name="RepoDetailPanelTd59">{formatNumber(language.code)}</td>
            <td data-name="RepoDetailPanelTd60">{language.percent.toFixed(1)}%</td>
            <td data-name="RepoDetailPanelTd61">{formatNumber(language.complexity)}</td>
            <td data-name="RepoDetailPanelTd62">{language.complexityPercent.toFixed(1)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="empty-breakdown" data-name="RepoDetailPanelP63">No language metrics available.</p>
  {/if}
</div>

<style>
  .language-breakdown {
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
</style>
