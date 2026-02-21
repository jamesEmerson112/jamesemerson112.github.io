<script>
  import { buildSpiderDataset } from '../../utils/spiderTransforms.js';

  export let languages = [];
  export let size = 300;
  export let variant = 'detail';
  export let metric = 'code';
  export let maxAxes = 8;
  export let aggregateOther = true;
  export let showLabels = true;
  export let showLegend = true;

  const gridLevels = [25, 50, 75, 100];

  let hoveredName = null;

  $: isMini = variant === 'mini';
  $: activeMetric = isMini ? 'code' : metric === 'complexity' ? 'complexity' : 'code';
  $: resolvedMaxAxes = Number.isFinite(Number(maxAxes)) ? Math.max(1, Math.floor(Number(maxAxes))) : 8;
  $: effectiveShowLabels = isMini ? false : showLabels;
  $: effectiveShowLegend = isMini ? false : showLegend;
  $: seriesColor = activeMetric === 'complexity' ? '#ef4444' : '#3b82f6';
  $: data = buildSpiderDataset(languages, {
    metric: activeMetric,
    maxAxes: resolvedMaxAxes,
    aggregateOther
  });

  $: center = size / 2;
  $: radius = Math.max((size / 2) - (isMini ? 20 : 44), 12);
  $: labelRadius = radius + 18;
  $: points = data.map((item, index) => {
    const angle = toAngle(index, data.length);
    const factor = Math.max(0, Math.min(1, item.valuePercent / 100));
    const axis = projectPoint(angle, 1);
    const point = projectPoint(angle, factor);
    const label = projectPoint(angle, labelRadius / radius);

    return {
      ...item,
      angle,
      axisX: axis.x,
      axisY: axis.y,
      x: point.x,
      y: point.y,
      labelX: label.x,
      labelY: label.y
    };
  });
  $: shapePath = toPath(points, 'x', 'y');
  $: gridPaths = gridLevels.map((level) => {
    const factor = level / 100;
    const scaled = points.map((point) => ({
      x: center + (point.axisX - center) * factor,
      y: center + (point.axisY - center) * factor
    }));
    return toPath(scaled, 'x', 'y');
  });
  $: hoveredPoint = points.find((point) => point.name === hoveredName);

  function toAngle(index, count) {
    const safeCount = Math.max(count, 1);
    return ((2 * Math.PI * index) / safeCount) - (Math.PI / 2);
  }

  function projectPoint(angle, scale) {
    return {
      x: center + (radius * scale) * Math.cos(angle),
      y: center + (radius * scale) * Math.sin(angle)
    };
  }

  function toPath(pathPoints, xKey, yKey) {
    if (!pathPoints.length) {
      return '';
    }

    const commands = pathPoints.map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command}${point[xKey].toFixed(2)},${point[yKey].toFixed(2)}`;
    });

    return `${commands.join(' ')} Z`;
  }

  function getTextAnchor(angle) {
    const cos = Math.cos(angle);
    if (Math.abs(cos) < 0.2) return 'middle';
    return cos > 0 ? 'start' : 'end';
  }

  function getBaseline(angle) {
    const sin = Math.sin(angle);
    if (Math.abs(sin) < 0.2) return 'middle';
    return sin > 0 ? 'hanging' : 'baseline';
  }

  function formatPercent(value) {
    return `${value.toFixed(1)}%`;
  }

  function handlePointFocus(name) {
    hoveredName = name;
  }

  function handlePointBlur() {
    hoveredName = null;
  }
</script>

<div
  class="spider-chart"
  data-name="LanguageSpider"
  data-variant={isMini ? 'mini' : 'detail'}
  style="width: {size}px; height: {size}px;"
>
  {#if points.length === 0}
    <div class="empty-state" data-name="LanguageSpiderDiv1">No language data</div>
  {:else}
    <svg
      width={size}
      height={size}
      viewBox="0 0 {size} {size}"
      role="img"
      aria-label={isMini ? 'Repository language share chart' : 'Repository language share detail chart'}
     data-name="LanguageSpiderSvg2">
      <title data-name="LanguageSpiderTitle3">{activeMetric === 'code' ? 'Code % share by language' : 'Complexity % share by language'}</title>

      <g class="grid" data-name="LanguageSpiderG4">
        {#each gridPaths as gridPath, index}
          <path
            d={gridPath}
            fill="none"
            stroke={isMini ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.28)'}
            stroke-width="1" data-name="LanguageSpiderPath5" />
          {#if !isMini}
            <text
              x={center + 4}
              y={(center - radius * (gridLevels[index] / 100)) + 2}
              class="grid-label"
             data-name="LanguageSpiderText6">
              {gridLevels[index]}%
            </text>
          {/if}
        {/each}
      </g>

      <g class="axes" data-name="LanguageSpiderG7">
        {#each points as point}
          <line
            x1={center}
            y1={center}
            x2={point.axisX}
            y2={point.axisY}
            stroke="rgba(148, 163, 184, 0.45)"
            stroke-width="1" data-name="LanguageSpiderLine8" />
        {/each}
      </g>

      <path
        d={shapePath}
        class="data-area"
        fill={activeMetric === 'complexity' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(59, 130, 246, 0.22)'} data-name="LanguageSpiderPath9" />
      <path
        d={shapePath}
        class="data-shape"
        fill="none"
        stroke={seriesColor}
        stroke-width={isMini ? 2.25 : 2.5} data-name="LanguageSpiderPath10" />

      {#each points as point}
        <circle
          class="data-point"
          cx={point.x}
          cy={point.y}
          r={isMini ? 3.4 : 4.2}
          fill={seriesColor}
          stroke="rgba(15, 23, 42, 0.95)"
          stroke-width="1.5"
          tabindex="0"
          role="button"
          aria-label={`${point.name} ${activeMetric} share ${formatPercent(point.valuePercent)}`}
          on:mouseenter={() => handlePointFocus(point.name)}
          on:mouseleave={handlePointBlur}
          on:focus={() => handlePointFocus(point.name)}
          on:blur={handlePointBlur}
          data-name={`LanguageSpiderDataPoint-${point.name}`}
        />
      {/each}

      {#if effectiveShowLabels}
        {#each points as point}
          <text
            class="language-label"
            x={point.labelX}
            y={point.labelY}
            text-anchor={getTextAnchor(point.angle)}
            dominant-baseline={getBaseline(point.angle)}
           data-name="LanguageSpiderText12">
            {point.name}
          </text>
        {/each}
      {/if}
    </svg>

    {#if effectiveShowLegend}
      <div class="legend" data-name="LanguageSpiderDiv13">
        <span class="legend-dot" style="background-color: {seriesColor};" data-name="LanguageSpiderSpan14"></span>
        <span data-name="LanguageSpiderSpan15">{activeMetric === 'code' ? 'Code % share' : 'Complexity % share'}</span>
      </div>
    {/if}

    {#if !isMini && hoveredPoint}
      <div class="tooltip" data-name="LanguageSpiderDiv16">
        <strong data-name="LanguageSpiderStrong17">{hoveredPoint.name}</strong>
        <div data-name="LanguageSpiderDiv18">Code: {hoveredPoint.code.toLocaleString()} ({formatPercent(hoveredPoint.codePercent)})</div>
        <div data-name="LanguageSpiderDiv19">Complexity: {hoveredPoint.complexity.toLocaleString()} ({formatPercent(hoveredPoint.complexityPercent)})</div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .spider-chart {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.12);
    padding: 0.5rem;
  }

  :global([data-light="true"]) .spider-chart {
    background: rgba(15, 23, 42, 0.04);
  }

  svg {
    display: block;
    overflow: visible;
  }

  .grid-label {
    font-size: 9px;
    fill: rgba(148, 163, 184, 0.92);
  }

  .language-label {
    font-size: 11px;
    font-weight: 600;
    fill: var(--text-primary, #ffffff);
    pointer-events: none;
    user-select: none;
  }

  .data-shape,
  .data-area,
  .data-point {
    transition: 180ms ease;
  }

  .data-point {
    cursor: pointer;
  }

  .data-point:hover,
  .data-point:focus-visible {
    transform-origin: center;
    stroke-width: 2;
    opacity: 0.95;
  }

  .legend {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: var(--text-secondary, #e5e7eb);
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .tooltip {
    position: absolute;
    top: 0.45rem;
    left: 0.45rem;
    padding: 0.5rem 0.65rem;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.95);
    color: #f8fafc;
    font-size: 0.74rem;
    line-height: 1.35;
    border: 1px solid rgba(148, 163, 184, 0.45);
    pointer-events: none;
  }

  .tooltip strong {
    display: block;
    margin-bottom: 0.15rem;
  }

  .empty-state {
    font-size: 0.8rem;
    color: var(--text-muted, #94a3b8);
    text-align: center;
    width: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .data-shape,
    .data-area,
    .data-point {
      transition: none;
    }
  }
</style>
