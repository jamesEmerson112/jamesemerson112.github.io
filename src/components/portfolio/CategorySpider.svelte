<script lang="ts">
  import { clampPercent } from '../../utils/math.ts';
  import type { AxisScore } from '../../types.js';

  export let stats: AxisScore[] = [];
  export let size = 360;
  export let title = 'Spider chart';
  export let subtitle = '';
  export let showTitle = true;
  export let showAxisTable = true;
  export let showRingHint = true;
  export let dotRadius = 4.4;
  export let displayLabels: string[] | null = null;
  export let color = '#38bdf8';
  export let fill = 'rgba(56, 189, 248, 0.2)';
  export let scaleMode: 'absolute' | 'relative' = 'absolute';
  export let tableShowBoth = false;
  export let absoluteStats: AxisScore[] | undefined = undefined;

  const levels = [25, 50, 75, 100];

  function normalizeAxisRows(list = []) {
    return (Array.isArray(list) ? list : []).map((item, index) => ({
      axis: item?.axis || `Axis ${index + 1}`,
      score: clampPercent(item?.score)
    }));
  }

  $: safeScaleMode = scaleMode === 'relative' ? 'relative' : 'absolute';
  $: normalizedStats = normalizeAxisRows(stats);
  $: normalizedAbsoluteStats = normalizeAxisRows(
    Array.isArray(absoluteStats) && absoluteStats.length > 0 ? absoluteStats : normalizedStats
  );
  $: absoluteByAxis = new Map(normalizedAbsoluteStats.map((item) => [item.axis, item.score]));
  $: maxAbsoluteScore = normalizedStats.reduce((max, item) => Math.max(max, item.score), 0);
  $: displayStats = normalizedStats.map((item, index) => {
    const absoluteScore = absoluteByAxis.has(item.axis) ? absoluteByAxis.get(item.axis) : item.score;
    const relativeScore = maxAbsoluteScore > 0 ? (item.score / maxAbsoluteScore) * 100 : 0;
    const displayScore = safeScaleMode === 'relative' ? relativeScore : item.score;

    return {
      axis: item.axis,
      label: displayLabels?.[index] ?? item.axis,
      displayScore: clampPercent(displayScore),
      relativeScore: clampPercent(relativeScore),
      absoluteScore: clampPercent(absoluteScore)
    };
  });

  $: center = size / 2;
  $: radius = Math.max(38, size / 2 - 64);
  $: labelOffset = Math.max(20, radius * 0.18);
  $: points = displayStats.map((item, index) => {
    const clamped = clampPercent(item.displayScore);
    const angle = ((Math.PI * 2 * index) / Math.max(displayStats.length, 1)) - Math.PI / 2;
    const scale = clamped / 100;
    return {
      axis: item.axis,
      label: item.label,
      score: clamped,
      roundedScore: Math.round(clamped),
      relativeRoundedScore: Math.round(item.relativeScore),
      absoluteScore: item.absoluteScore,
      absoluteRoundedScore: Math.round(item.absoluteScore),
      angle,
      axisX: center + radius * Math.cos(angle),
      axisY: center + radius * Math.sin(angle),
      x: center + radius * scale * Math.cos(angle),
      y: center + radius * scale * Math.sin(angle),
      labelX: center + (radius + labelOffset) * Math.cos(angle),
      labelY: center + (radius + labelOffset) * Math.sin(angle)
    };
  });

  $: polygonPath = buildPath(points, 'x', 'y');
  $: gridPaths = levels.map((level) => {
    const factor = level / 100;
    return buildPath(
      points.map((point) => ({
        x: center + (point.axisX - center) * factor,
        y: center + (point.axisY - center) * factor
      })),
      'x',
      'y'
      );
  });
  $: ringHint = safeScaleMode === 'relative'
    ? 'Rings: 25 / 50 / 75 / 100 (of top axis)'
    : 'Rings: 25 / 50 / 75 / 100 (raw score)';

  function buildPath(pathPoints, xKey, yKey) {
    if (!pathPoints.length) return '';
    return `${pathPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point[xKey].toFixed(2)},${point[yKey].toFixed(2)}`)
      .join(' ')} Z`;
  }

  function getTextAnchor(angle) {
    const cosine = Math.cos(angle);
    if (Math.abs(cosine) < 0.2) return 'middle';
    return cosine > 0 ? 'start' : 'end';
  }

  function getBaseline(angle) {
    const sine = Math.sin(angle);
    if (Math.abs(sine) < 0.2) return 'middle';
    return sine > 0 ? 'hanging' : 'baseline';
  }
</script>

<section class="category-spider" aria-label={title} data-name="CategorySpider">
  {#if showTitle}
    <h3 data-name="CategorySpiderH31">{title}</h3>
  {/if}
  {#if subtitle}
    <p class="chart-subtitle" data-name="CategorySpiderSubtitle">{subtitle}</p>
  {/if}

  {#if points.length > 0}
    <svg width={size} height={size} viewBox="0 0 {size} {size}" role="img" aria-label={title} data-name="CategorySpiderSvg2">
      <g class="grid" data-name="CategorySpiderG3">
        {#each gridPaths as path}
          <path d={path} fill="none" class="grid-ring" stroke-width="1" data-name="CategorySpiderPath4" />
        {/each}
        {#if showRingHint}
          {#each levels as level, idx}
            <text x={center + 8} y={center - radius * (levels[idx] / 100)} data-name="CategorySpiderText5">{level}%</text>
          {/each}
        {/if}
      </g>

      <g class="axes" data-name="CategorySpiderG6">
        {#each points as point}
          <line x1={center} y1={center} x2={point.axisX} y2={point.axisY} class="axis-spoke" data-name="CategorySpiderLine7" />
        {/each}
      </g>

      <path d={polygonPath} style="fill: {fill}" data-name="CategorySpiderPath8" />
      <path
        d={polygonPath}
        fill="none"
        style="stroke: {color}"
        stroke-width="1.6"
        stroke-linejoin="round"
        data-name="CategorySpiderPath9"
      />

      {#each points as point}
        <circle cx={point.x} cy={point.y} r={dotRadius} style="fill: {color}" data-name="CategorySpiderCircle10" />
        <text
          class="axis-label"
          x={point.labelX}
          y={point.labelY}
          text-anchor={getTextAnchor(point.angle)}
          dominant-baseline={getBaseline(point.angle)}
         data-name="CategorySpiderText11">
          {point.label}
        </text>
      {/each}
    </svg>

    {#if showRingHint}
      <div class="ring-hint" data-name="CategorySpiderDiv12">{ringHint}</div>
    {/if}

    {#if showAxisTable}
      <div class="axis-table" aria-label="Axis values" data-name="CategorySpiderDiv13">
        {#each points as point}
          <div class="axis-row" data-name="CategorySpiderDiv14">
            <span data-name="CategorySpiderSpan15">{point.label}</span>
            {#if tableShowBoth}
              <div class="axis-values" data-name="CategorySpiderDiv16">
                <strong class="axis-primary" style="color: {color}" data-name="CategorySpiderStrong17">R{point.relativeRoundedScore}</strong>
                <span class="axis-secondary" data-name="CategorySpiderSpan18">A{point.absoluteRoundedScore}</span>
              </div>
            {:else}
              <strong data-name="CategorySpiderStrong19">{point.roundedScore}</strong>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <p class="empty" data-name="CategorySpiderP20">No category stats available.</p>
  {/if}
</section>

<style>
  .category-spider {
    border: none;
    padding: 0;
    background: transparent;
    overflow: hidden;
  }

  h3 {
    margin: 0 0 2px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .chart-subtitle {
    margin: 0 0 14px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-muted);
  }

  svg {
    display: block;
    margin: 0 auto;
    max-width: 300px;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .grid text {
    font-size: 9px;
    fill: var(--text-secondary);
  }

  .grid-ring {
    stroke: var(--radar-ring);
  }

  .axis-spoke {
    stroke: var(--radar-spoke);
    stroke-width: 1;
  }

  .axis-label {
    font-family: var(--font-mono);
    font-size: 9.5px;
    fill: var(--radar-label);
  }

  .ring-hint {
    margin: 0.28rem 0 0.65rem;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }

  .axis-table {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 14px;
    margin-top: 16px;
  }

  .axis-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.55rem;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--mono-tone-3);
  }

  .axis-row strong {
    color: var(--text-primary);
    font-size: 10px;
    font-weight: 500;
  }

  .axis-values {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .axis-secondary {
    font-size: 10px;
    color: var(--mono-tone-5);
  }

  .empty {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  @media (max-width: 860px) {
    .axis-label {
      font-size: 11px;
    }
  }

  @media (max-width: 620px) {
    .axis-table {
      grid-template-columns: 1fr;
    }
  }
</style>
