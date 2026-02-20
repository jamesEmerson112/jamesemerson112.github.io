<script>
  import { onMount } from 'svelte';

  let metricsData = null;
  let loading = true;
  let error = null;
  let totals = {
    lines: 0,
    code: 0,
    comments: 0,
    blanks: 0,
    complexity: 0,
    files: 0,
    bytes: 0
  };
  let cocomo = {
    cost: 0,
    time: 0,
    people: 0
  };

  function calculateCOCOMO(totalCodeLines, avgWage = 56286) {
    const KLOC = totalCodeLines / 1000;
    const a = 2.4, b = 1.05, c = 2.5, d = 0.38;

    const effort = a * Math.pow(KLOC, b);
    const time = c * Math.pow(effort, d);
    const people = effort / time;
    const cost = effort * (avgWage / 12);

    return {
      effort: effort.toFixed(2),
      time: time.toFixed(2),
      people: people.toFixed(2),
      cost: Math.round(cost)
    };
  }

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  onMount(async () => {
    try {
      // Use Vite's base URL for correct path in dev and production
      const basePath = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${basePath}scc-metrics.json`);
      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }

      metricsData = await response.json();

      // Calculate totals
      totals = metricsData.reduce((acc, lang) => ({
        lines: acc.lines + lang.Lines,
        code: acc.code + lang.Code,
        comments: acc.comments + lang.Comment,
        blanks: acc.blanks + lang.Blank,
        complexity: acc.complexity + lang.Complexity,
        files: acc.files + lang.Count,
        bytes: acc.bytes + lang.Bytes
      }), { lines: 0, code: 0, comments: 0, blanks: 0, complexity: 0, files: 0, bytes: 0 });

      // Calculate COCOMO
      cocomo = calculateCOCOMO(totals.code);

      loading = false;
    } catch (err) {
      error = err.message;
      loading = false;
    }
  });
</script>

<section class="metrics-section" name="CodeMetrics">
  <div class="section-header">
    <h2>📊 Code Metrics</h2>
    <p class="section-subtitle">Project statistics and development estimates</p>
  </div>

  {#if loading}
    <div class="loading">Loading metrics...</div>
  {:else if error}
    <div class="error">Unable to load metrics data</div>
  {:else}
    <!-- Summary Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{formatNumber(totals.code)}</div>
        <div class="stat-label">Lines of Code</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{metricsData.length}</div>
        <div class="stat-label">Languages</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{formatNumber(totals.files)}</div>
        <div class="stat-label">Files</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{totals.complexity}</div>
        <div class="stat-label">Complexity</div>
      </div>
    </div>

    <!-- COCOMO Estimates -->
    <div class="cocomo-section">
      <h3>💰 Development Estimates (COCOMO)</h3>
      <div class="cocomo-grid">
        <div class="cocomo-card">
          <div class="cocomo-icon">💵</div>
          <div class="cocomo-value">${formatNumber(cocomo.cost)}</div>
          <div class="cocomo-label">Estimated Cost</div>
        </div>
        <div class="cocomo-card">
          <div class="cocomo-icon">📅</div>
          <div class="cocomo-value">{cocomo.time} months</div>
          <div class="cocomo-label">Schedule Effort</div>
        </div>
        <div class="cocomo-card">
          <div class="cocomo-icon">👥</div>
          <div class="cocomo-value">{cocomo.people}</div>
          <div class="cocomo-label">People Required</div>
        </div>
      </div>
    </div>

    <!-- Language Breakdown -->
    <div class="languages-section">
      <h3>Languages Used</h3>
      <div class="language-grid">
        {#each metricsData.sort((a, b) => b.Lines - a.Lines).slice(0, 6) as lang}
          <div class="language-card">
            <div class="language-name">{lang.Name}</div>
            <div class="language-stats">
              <span>{formatNumber(lang.Code)} lines</span>
              <span class="dot">•</span>
              <span>{lang.Count} {lang.Count === 1 ? 'file' : 'files'}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="metrics-footer">
      <p>Metrics calculated using <a href="https://github.com/boyter/scc" target="_blank" rel="noopener">scc</a></p>
    </div>
  {/if}
</section>

<style>
  .metrics-section {
    width: 100%;
    max-width: 900px;
    margin: 3em auto;
    animation: fadeIn 2s ease-in;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2em;
  }

  .section-header h2 {
    font-size: 2.5em;
    font-weight: var(--font-weight-normal);
    margin: 0.2em 0;
    color: var(--text-primary);
  }

  .section-subtitle {
    font-size: 1.1em;
    color: var(--text-muted);
    margin: 0.5em 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5em;
    margin-bottom: 2em;
  }

  .stat-card {
    background: var(--bg-card);
    padding: 1.5em;
    border-radius: var(--card-border-radius);
    border: 1px solid var(--border-primary);
    transition: all 0.3s ease;
    text-align: center;
  }

  .stat-card:hover {
    transform: translateY(-5px);
    background: var(--bg-card-hover);
    box-shadow: var(--shadow-hover);
  }

  .stat-value {
    font-size: 2em;
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: 0.3em;
  }

  .stat-label {
    font-size: 0.9em;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cocomo-section {
    background: var(--bg-card);
    padding: 2em;
    border-radius: var(--card-border-radius);
    border: 1px solid var(--border-primary);
    margin-bottom: 2em;
  }

  .cocomo-section h3 {
    font-size: 1.5em;
    font-weight: var(--font-weight-medium);
    margin: 0 0 1.5em 0;
    color: var(--text-primary);
    text-align: center;
  }

  .cocomo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5em;
  }

  .cocomo-card {
    text-align: center;
    padding: 1em;
  }

  .cocomo-icon {
    font-size: 2em;
    margin-bottom: 0.5em;
  }

  .cocomo-value {
    font-size: 1.5em;
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: 0.3em;
  }

  .cocomo-label {
    font-size: 0.85em;
    color: var(--text-muted);
  }

  .languages-section {
    margin-bottom: 2em;
  }

  .languages-section h3 {
    font-size: 1.3em;
    font-weight: var(--font-weight-medium);
    margin: 0 0 1em 0;
    color: var(--text-primary);
    text-align: center;
  }

  .language-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1em;
  }

  .language-card {
    background: var(--bg-card);
    padding: 1em 1.5em;
    border-radius: var(--card-border-radius);
    border: 1px solid var(--border-primary);
    transition: all 0.3s ease;
  }

  .language-card:hover {
    background: var(--bg-card-hover);
    box-shadow: var(--shadow-hover);
  }

  .language-name {
    font-size: 1.1em;
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: 0.5em;
  }

  .language-stats {
    font-size: 0.85em;
    color: var(--text-muted);
  }

  .dot {
    margin: 0 0.5em;
  }

  .loading, .error {
    text-align: center;
    padding: 2em;
    color: var(--text-muted);
  }

  .error {
    color: var(--text-secondary);
  }

  .metrics-footer {
    text-align: center;
    padding-top: 1.5em;
    border-top: 1px solid var(--border-primary);
    margin-top: 2em;
  }

  .metrics-footer p {
    font-size: 0.9em;
    color: var(--text-muted);
    margin: 0;
  }

  .metrics-footer a {
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: var(--font-weight-medium);
    transition: color 0.3s ease;
  }

  .metrics-footer a:hover {
    color: var(--text-primary);
    text-decoration: underline;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .metrics-section {
      margin: 2em auto;
    }

    .section-header h2 {
      font-size: 2em;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1em;
    }

    .cocomo-grid {
      grid-template-columns: 1fr;
      gap: 1em;
    }

    .language-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
