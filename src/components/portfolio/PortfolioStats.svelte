<script>
  import { onMount } from 'svelte';
  import { portfolioTotals } from '../../stores/portfolioStore.js';
  import { formatNumber, formatCurrency } from '../../utils/dataLoader.js';

  let displayLines = 0;
  let displayValue = 0;
  let displayYears = 0;
  let displayRepos = 0;
  let displayLanguages = 0;
  let hasAnimated = false;

  // Counter animation function
  function animateValue(start, end, duration, callback) {
    const startTime = performance.now();
    const range = end - start;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (easeOutExpo)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + range * eased;

      callback(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // Start animations when component mounts and data is available (only once)
  $: if ($portfolioTotals && !hasAnimated) {
    hasAnimated = true;
    const totals = $portfolioTotals;
    const soloDev = totals.soloDeveloper;
    const numLanguages = Object.keys(totals.languages || {}).length;

    // Animate each stat with different durations for visual interest
    setTimeout(() => animateValue(0, totals.totalLines, 2000, val => displayLines = val), 100);
    setTimeout(() => animateValue(0, totals.estimatedValue.standardCost, 2000, val => displayValue = val), 300);
    setTimeout(() => animateValue(0, soloDev.fullTimeYears, 2000, val => displayYears = val), 500);
    setTimeout(() => animateValue(0, numLanguages, 1500, val => displayLanguages = val), 700);
  }
</script>

<div class="portfolio-stats" data-name="PortfolioStats">
  <div class="stats-container" data-name="PortfolioStatsDiv1">
    <div class="stat-item" data-name="PortfolioStatsDiv2">
      <div class="stat-value" data-name="PortfolioStatsDiv3">
        {formatNumber(Math.round(displayLines))}
      </div>
      <div class="stat-label" data-name="PortfolioStatsDiv4">Lines of Code</div>
    </div>

    <div class="stat-item" data-name="PortfolioStatsDiv5">
      <div class="stat-value" data-name="PortfolioStatsDiv6">
        {formatCurrency(displayValue)}
      </div>
      <div class="stat-label" data-name="PortfolioStatsDiv7">Development Value</div>
    </div>

    <div class="stat-item" data-name="PortfolioStatsDiv8">
      <div class="stat-value" data-name="PortfolioStatsDiv9">
        {Math.round(displayYears)}
      </div>
      <div class="stat-label" data-name="PortfolioStatsDiv10">Years Solo Dev Time</div>
    </div>

    <div class="stat-item" data-name="PortfolioStatsDiv11">
      <div class="stat-value" data-name="PortfolioStatsDiv12">
        {Math.round(displayLanguages)}
      </div>
      <div class="stat-label" data-name="PortfolioStatsDiv13">Programming Languages</div>
    </div>
  </div>
</div>

<style>
  .portfolio-stats {
    width: 100%;
    padding: 4rem 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .stats-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 3rem;
    max-width: 1400px;
    width: 100%;
  }

  .stat-item {
    text-align: center;
    padding: 2rem 1rem;
    border-radius: 12px;
    transition: transform 0.3s ease;
  }

  .stat-item:hover {
    transform: translateY(-5px);
  }

  .stat-value {
    font-size: 4.5rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px rgba(var(--primary-rgb), 0.3));
  }

  .stat-label {
    font-size: 1rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.8;
    color: var(--text-color);
  }

  /* Responsive design */
  @media (max-width: 1200px) {
    .stats-container {
      grid-template-columns: repeat(2, 1fr);
      gap: 2.5rem;
    }

    .stat-value {
      font-size: 4rem;
    }
  }

  @media (max-width: 768px) {
    .portfolio-stats {
      padding: 3rem 1.5rem;
    }

    .stats-container {
      gap: 2rem;
    }

    .stat-value {
      font-size: 3rem;
    }

    .stat-label {
      font-size: 0.875rem;
    }
  }

  @media (max-width: 480px) {
    .stats-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .portfolio-stats {
      padding: 2rem 1rem;
    }

    .stat-item {
      padding: 1.5rem 1rem;
    }

    .stat-value {
      font-size: 2.5rem;
    }

    .stat-label {
      font-size: 0.75rem;
    }
  }

  /* Theme-specific styles */
  :global(body.light-theme) .stat-value {
    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.3));
  }

  :global(body.dark-theme) .stat-value {
    filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.4));
  }

  :global(body.dark-theme) .stat-item {
    background: rgba(255, 255, 255, 0.02);
  }

  :global(body.light-theme) .stat-item {
    background: rgba(0, 0, 0, 0.02);
  }
</style>
