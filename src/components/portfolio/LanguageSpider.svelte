<script>
  import * as d3 from 'd3';
  import { onMount, afterUpdate } from 'svelte';

  export let languages = [];
  export let size = 300;
  export let showLabels = true;
  export let animationDuration = 750;
  export let curveType = 'cardinal'; // 'linear', 'cardinal', 'catmullRom', 'basis'

  let svgElement;
  let mounted = false;
  const instanceId = `spider-${Math.random().toString(36).slice(2, 10)}`;
  const codeGradientId = `${instanceId}-code-gradient`;
  const complexityGradientId = `${instanceId}-complexity-gradient`;
  const glowFilterId = `${instanceId}-glow`;
  const shadowFilterId = `${instanceId}-shadow`;

  // Filter and prepare language data
  $: validLanguages = languages
    .filter(lang => lang.code > 0 || lang.complexity > 0)
    .slice(0, 8); // Max 8 languages for readability

  // D3 Scale Functions
  $: maxCode = Math.max(...validLanguages.map(l => l.code), 1);
  $: maxComplexity = Math.max(...validLanguages.map(l => l.complexity), 1);

  // Radial scale for mapping values to radius
  $: radialScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, radius]);

  // Angular scale for distributing axes
  $: angleScale = d3.scaleLinear()
    .domain([0, validLanguages.length])
    .range([0, 2 * Math.PI]);

  // Color scale for languages
  $: colorScale = d3.scaleOrdinal()
    .domain(validLanguages.map(l => l.name))
    .range(d3.schemeCategory10);

  // Normalize values to 0-100 scale
  $: normalizedData = validLanguages.map((lang, i) => ({
    name: lang.name,
    code: (lang.code / maxCode) * 100,
    complexity: (lang.complexity / maxComplexity) * 100,
    rawCode: lang.code,
    rawComplexity: lang.complexity,
    angle: angleScale(i) - Math.PI / 2, // Start from top
    index: i
  }));

  // D3 Line and Area Generators with curve interpolation
  $: getCurveType = () => {
    switch(curveType) {
      case 'cardinal': return d3.curveCardinalClosed.tension(0.5);
      case 'catmullRom': return d3.curveCatmullRomClosed.alpha(0.5);
      case 'basis': return d3.curveBasisClosed;
      default: return d3.curveLinearClosed;
    }
  };

  $: lineGenerator = d3.lineRadial()
    .angle(d => d.angle)
    .radius(d => radialScale(d.value))
    .curve(getCurveType());

  $: areaGenerator = d3.areaRadial()
    .angle(d => d.angle)
    .innerRadius(0)
    .outerRadius(d => radialScale(d.value))
    .curve(getCurveType());

  // Generate path data
  $: codePath = lineGenerator(normalizedData.map(d => ({ angle: d.angle, value: d.code })));
  $: complexityPath = lineGenerator(normalizedData.map(d => ({ angle: d.angle, value: d.complexity })));
  $: codeArea = areaGenerator(normalizedData.map(d => ({ angle: d.angle, value: d.code })));
  $: complexityArea = areaGenerator(normalizedData.map(d => ({ angle: d.angle, value: d.complexity })));

  $: center = size / 2;
  $: radius = (size / 2) - 40;

  // Grid levels for radial axes
  const gridLevels = [25, 50, 75, 100];

  // Calculate axis endpoints
  $: axisPoints = normalizedData.map(d => ({
    x: center + radius * Math.cos(d.angle),
    y: center + radius * Math.sin(d.angle),
    angle: d.angle,
    name: d.name
  }));

  // Calculate label positions (slightly outside the chart)
  $: labelPoints = normalizedData.map(d => {
    const labelRadius = radius + 25;
    return {
      x: center + labelRadius * Math.cos(d.angle),
      y: center + labelRadius * Math.sin(d.angle),
      angle: d.angle,
      name: d.name
    };
  });

  // Calculate data point positions for both metrics
  $: codePoints = normalizedData.map(d => ({
    x: center + radialScale(d.code) * Math.cos(d.angle),
    y: center + radialScale(d.code) * Math.sin(d.angle),
    data: d,
    type: 'code'
  }));

  $: complexityPoints = normalizedData.map(d => ({
    x: center + radialScale(d.complexity) * Math.cos(d.angle),
    y: center + radialScale(d.complexity) * Math.sin(d.angle),
    data: d,
    type: 'complexity'
  }));

  let hoveredLanguage = null;
  let hoveredMetric = null;

  // D3 Transitions
  function animatePath(element, pathData, isArea = false) {
    if (!mounted) return;

    d3.select(element)
      .transition()
      .duration(animationDuration)
      .ease(d3.easeCubicInOut)
      .attr(isArea ? 'd' : 'd', pathData)
      .style('opacity', 1);
  }

  function animatePoints(element) {
    if (!mounted) return;

    d3.select(element)
      .transition()
      .duration(animationDuration)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr('r', 4)
      .style('opacity', 1);
  }

  onMount(() => {
    mounted = true;

    // Initial entrance animation
    if (svgElement) {
      d3.select(svgElement)
        .style('opacity', 0)
        .transition()
        .duration(300)
        .style('opacity', 1);
    }
  });

  afterUpdate(() => {
    if (mounted && svgElement) {
      // Animate polygons
      const codePoly = svgElement.querySelector('.code-path');
      const complexityPoly = svgElement.querySelector('.complexity-path');

      if (codePoly) animatePath(codePoly, codePath);
      if (complexityPoly) animatePath(complexityPoly, complexityPath);

      // Animate data points with stagger
      svgElement.querySelectorAll('.data-point').forEach((point, i) => {
        d3.select(point)
          .transition()
          .delay(i * 50)
          .duration(animationDuration)
          .ease(d3.easeElasticOut)
          .attr('r', 4);
      });
    }
  });

  function handlePointHover(lang, metric) {
    hoveredLanguage = lang.name;
    hoveredMetric = metric;
  }

  function handlePointLeave() {
    hoveredLanguage = null;
    hoveredMetric = null;
  }

  // Get text anchor based on angle
  function getTextAnchor(angle) {
    const deg = (angle * 180 / Math.PI) % 360;
    if (deg > 80 && deg < 100) return 'middle';
    if (deg > 260 && deg < 280) return 'middle';
    return deg > 90 && deg < 270 ? 'end' : 'start';
  }

  // Get baseline alignment based on angle
  function getBaseline(angle) {
    const deg = (angle * 180 / Math.PI) % 360;
    if (deg > 350 || deg < 10) return 'middle';
    if (deg > 170 && deg < 190) return 'middle';
    return deg > 180 ? 'baseline' : 'hanging';
  }
</script>

<div class="spider-chart" style="width: {size}px; height: {size}px;">
  <svg
    bind:this={svgElement}
    width={size}
    height={size}
    viewBox="0 0 {size} {size}"
  >
    <!-- Define gradients and filters -->
    <defs>
      <!-- Gradient for code polygon -->
      <radialGradient id={codeGradientId} cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:rgb(59, 130, 246);stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:rgb(59, 130, 246);stop-opacity:0.1" />
      </radialGradient>

      <!-- Gradient for complexity polygon -->
      <radialGradient id={complexityGradientId} cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:rgb(239, 68, 68);stop-opacity:0.4" />
        <stop offset="100%" style="stop-color:rgb(239, 68, 68);stop-opacity:0.15" />
      </radialGradient>

      <!-- Glow filter -->
      <filter id={glowFilterId}>
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <!-- Drop shadow -->
      <filter id={shadowFilterId}>
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
      </filter>
    </defs>

    <!-- Grid circles with labels -->
    <g class="grid-circles">
      {#each gridLevels as level}
        {@const r = radialScale(level)}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          stroke-width="1"
          stroke-dasharray="4,4"
        />
        <!-- Grid level labels -->
        <text
          x={center + 5}
          y={center - r + 3}
          font-size="8"
          fill="rgba(255, 255, 255, 0.4)"
          class="grid-label"
        >
          {level}%
        </text>
      {/each}
    </g>

    <!-- Axis lines -->
    <g class="axis-lines">
      {#each axisPoints as point, i}
        <line
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke="rgba(255, 255, 255, 0.12)"
          stroke-width="1.5"
          class="axis-line"
          class:highlighted={hoveredLanguage === point.name}
        />
      {/each}
    </g>

    <!-- Code area (filled) -->
    {#if codeArea}
      <path
        d={codeArea}
        fill={`url(#${codeGradientId})`}
        class="code-area"
        filter={`url(#${shadowFilterId})`}
      />
    {/if}

    <!-- Complexity area (filled) -->
    {#if complexityArea}
      <path
        d={complexityArea}
        fill={`url(#${complexityGradientId})`}
        class="complexity-area"
        filter={`url(#${shadowFilterId})`}
      />
    {/if}

    <!-- Code path (stroke) -->
    {#if codePath}
      <path
        d={codePath}
        fill="none"
        stroke="rgb(59, 130, 246)"
        stroke-width="2.5"
        class="code-path"
        filter={`url(#${glowFilterId})`}
        style="opacity: 0;"
      />
    {/if}

    <!-- Complexity path (stroke) -->
    {#if complexityPath}
      <path
        d={complexityPath}
        fill="none"
        stroke="rgb(239, 68, 68)"
        stroke-width="2.5"
        class="complexity-path"
        filter={`url(#${glowFilterId})`}
        style="opacity: 0;"
      />
    {/if}

    <!-- Code data points -->
    {#each codePoints as point}
      <circle
        cx={point.x}
        cy={point.y}
        r="0"
        fill="rgb(59, 130, 246)"
        stroke="rgba(255, 255, 255, 0.8)"
        stroke-width="2"
        class="data-point code-point"
        role="button"
        tabindex="0"
        aria-label="Language: {point.data.name}, Code: {point.data.rawCode} lines"
        on:mouseenter={() => handlePointHover(point.data, 'code')}
        on:mouseleave={handlePointLeave}
        on:focus={() => handlePointHover(point.data, 'code')}
        on:blur={handlePointLeave}
      />
    {/each}

    <!-- Complexity data points -->
    {#each complexityPoints as point}
      <circle
        cx={point.x}
        cy={point.y}
        r="0"
        fill="rgb(239, 68, 68)"
        stroke="rgba(255, 255, 255, 0.8)"
        stroke-width="2"
        class="data-point complexity-point"
        role="button"
        tabindex="0"
        aria-label="Language: {point.data.name}, Complexity: {point.data.rawComplexity}"
        on:mouseenter={() => handlePointHover(point.data, 'complexity')}
        on:mouseleave={handlePointLeave}
        on:focus={() => handlePointHover(point.data, 'complexity')}
        on:blur={handlePointLeave}
      />
    {/each}

    <!-- Labels -->
    {#if showLabels}
      {#each labelPoints as label, i}
        {@const lang = normalizedData[i]}
        <text
          x={label.x}
          y={label.y}
          text-anchor={getTextAnchor(label.angle)}
          dominant-baseline={getBaseline(label.angle)}
          font-size="11"
          font-weight="500"
          fill="rgba(255, 255, 255, 0.8)"
          class="language-label"
          class:hovered={hoveredLanguage === label.name}
          style="transition: all 0.2s ease;"
        >
          {label.name}
        </text>
      {/each}
    {/if}

    <!-- Center point -->
    <circle
      cx={center}
      cy={center}
      r="3"
      fill="rgba(255, 255, 255, 0.5)"
      stroke="rgba(255, 255, 255, 0.8)"
      stroke-width="1"
    />
  </svg>

  <!-- Enhanced Tooltip -->
  {#if hoveredLanguage}
    {@const lang = normalizedData.find(l => l.name === hoveredLanguage)}
    {#if lang}
      <div class="tooltip" class:visible={hoveredLanguage}>
        <div class="tooltip-header">
          <strong>{lang.name}</strong>
          {#if hoveredMetric}
            <span class="metric-badge" class:code={hoveredMetric === 'code'} class:complexity={hoveredMetric === 'complexity'}>
              {hoveredMetric}
            </span>
          {/if}
        </div>
        <div class="tooltip-content">
          <div class="metric-row">
            <span class="metric-icon code-icon">●</span>
            <span class="metric-label">Lines:</span>
            <span class="metric-value">{lang.rawCode.toLocaleString()}</span>
            <span class="metric-percent">({lang.code.toFixed(1)}%)</span>
          </div>
          <div class="metric-row">
            <span class="metric-icon complexity-icon">●</span>
            <span class="metric-label">Complexity:</span>
            <span class="metric-value">{lang.rawComplexity.toLocaleString()}</span>
            <span class="metric-percent">({lang.complexity.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Enhanced Legend -->
  <div class="legend">
    <div class="legend-item">
      <div class="legend-color code">
        <div class="legend-glow"></div>
      </div>
      <span>Lines of Code</span>
    </div>
    <div class="legend-item">
      <div class="legend-color complexity">
        <div class="legend-glow"></div>
      </div>
      <span>Complexity</span>
    </div>
  </div>
</div>

<style>
  .spider-chart {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.05));
    border-radius: 12px;
    padding: 1rem;
  }

  svg {
    display: block;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  }

  .axis-line {
    transition: all 0.3s ease;
  }

  .axis-line.highlighted {
    stroke: rgba(255, 255, 255, 0.4);
    stroke-width: 2;
  }

  .code-path,
  .complexity-path,
  .code-area,
  .complexity-area {
    transition: all 0.3s ease;
  }

  .data-point {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .data-point:hover,
  .data-point:focus {
    r: 6;
    stroke-width: 3;
    filter: drop-shadow(0 0 6px currentColor);
  }

  .code-point {
    filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.6));
  }

  .complexity-point {
    filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.6));
  }

  .language-label {
    pointer-events: none;
    user-select: none;
  }

  .language-label.hovered {
    font-weight: 700;
    font-size: 13px;
    fill: rgba(255, 255, 255, 1);
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
  }

  .grid-label {
    pointer-events: none;
    font-weight: 500;
  }

  .tooltip {
    position: absolute;
    top: -80px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }

  .tooltip.visible {
    animation: tooltipFadeIn 0.3s ease forwards;
  }

  .tooltip-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tooltip-header strong {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.95);
  }

  .metric-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .metric-badge.code {
    background: rgba(59, 130, 246, 0.2);
    color: rgb(59, 130, 246);
    border: 1px solid rgba(59, 130, 246, 0.4);
  }

  .metric-badge.complexity {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(239, 68, 68);
    border: 1px solid rgba(239, 68, 68, 0.4);
  }

  .tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .metric-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .metric-icon {
    font-size: 0.875rem;
  }

  .code-icon {
    color: rgb(59, 130, 246);
  }

  .complexity-icon {
    color: rgb(239, 68, 68);
  }

  .metric-label {
    color: rgba(255, 255, 255, 0.7);
    min-width: 70px;
  }

  .metric-value {
    color: rgba(255, 255, 255, 0.95);
    font-weight: 600;
  }

  .metric-percent {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.7rem;
  }

  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .legend {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 1rem;
    font-size: 0.7rem;
    background: rgba(0, 0, 0, 0.6);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .legend-color {
    position: relative;
    width: 16px;
    height: 16px;
    border-radius: 3px;
  }

  .legend-color.code {
    background: rgba(59, 130, 246, 0.5);
    border: 1.5px solid rgb(59, 130, 246);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
  }

  .legend-color.complexity {
    background: rgba(239, 68, 68, 0.5);
    border: 1.5px solid rgb(239, 68, 68);
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
  }

  .legend-glow {
    position: absolute;
    inset: -2px;
    border-radius: 3px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .legend-item:hover .legend-glow {
    opacity: 1;
  }

  .legend-color.code .legend-glow {
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
  }

  .legend-color.complexity .legend-glow {
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.8);
  }
</style>
