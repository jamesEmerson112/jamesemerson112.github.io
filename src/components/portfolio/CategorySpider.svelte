<script>
  export let stats = [];
  export let size = 360;
  export let title = 'Spider chart';
  export let showTitle = true;
  export let showAxisTable = true;
  export let color = '#38bdf8';
  export let fill = 'rgba(56, 189, 248, 0.2)';

  const levels = [25, 50, 75, 100];

  $: center = size / 2;
  $: radius = Math.max(38, size / 2 - 64);
  $: labelOffset = Math.max(20, radius * 0.18);
  $: points = (stats || []).map((item, index) => {
    const safeScore = Number.isFinite(Number(item?.score)) ? Number(item.score) : 0;
    const clamped = Math.max(0, Math.min(100, safeScore));
    const angle = ((Math.PI * 2 * index) / Math.max(stats.length, 1)) - Math.PI / 2;
    const scale = clamped / 100;
    return {
      axis: item?.axis || `Axis ${index + 1}`,
      score: clamped,
      roundedScore: Math.round(clamped),
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

<section class="category-spider" aria-label={title}>
  {#if showTitle}
    <h3>{title}</h3>
  {/if}

  {#if points.length > 0}
    <svg width={size} height={size} viewBox="0 0 {size} {size}" role="img" aria-label={title}>
      <g class="grid">
        {#each gridPaths as path}
          <path d={path} fill="none" stroke="rgba(148, 163, 184, 0.34)" stroke-width="1.1" />
        {/each}
        {#each levels as level, idx}
          <text x={center + 8} y={center - radius * (levels[idx] / 100)}>{level}%</text>
        {/each}
      </g>

      <g class="axes">
        {#each points as point}
          <line x1={center} y1={center} x2={point.axisX} y2={point.axisY} stroke="rgba(148, 163, 184, 0.52)" />
        {/each}
      </g>

      <path d={polygonPath} fill={fill} />
      <path d={polygonPath} fill="none" stroke={color} stroke-width="2.8" />

      {#each points as point}
        <circle cx={point.x} cy={point.y} r="4.4" fill={color} stroke="rgba(15, 23, 42, 0.95)" stroke-width="1.6" />
        <text
          class="axis-label"
          x={point.labelX}
          y={point.labelY}
          text-anchor={getTextAnchor(point.angle)}
          dominant-baseline={getBaseline(point.angle)}
        >
          {point.axis}
        </text>
      {/each}
    </svg>

    <div class="ring-hint">Rings: 25 / 50 / 75 / 100</div>

    {#if showAxisTable}
      <div class="axis-table" aria-label="Axis values">
        {#each points as point}
          <div class="axis-row">
            <span>{point.axis}</span>
            <strong>{point.roundedScore}</strong>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <p class="empty">No category stats available.</p>
  {/if}
</section>

<style>
  .category-spider {
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 14px;
    padding: 0.95rem;
    background: radial-gradient(circle at 50% 38%, rgba(30, 64, 175, 0.17), rgba(15, 23, 42, 0.56) 58%);
  }

  h3 {
    margin: 0 0 0.7rem;
    font-size: 1rem;
    color: var(--text-primary, #f8fafc);
  }

  svg {
    display: block;
    margin: 0 auto;
    overflow: visible;
  }

  .grid text {
    font-size: 9px;
    fill: rgba(203, 213, 225, 0.95);
  }

  .axis-label {
    font-size: 12px;
    font-weight: 600;
    fill: var(--text-secondary, #e2e8f0);
  }

  .ring-hint {
    margin: 0.28rem 0 0.65rem;
    text-align: center;
    font-size: 0.72rem;
    color: var(--text-muted, #94a3b8);
    letter-spacing: 0.02em;
  }

  .axis-table {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.42rem 0.7rem;
    margin-top: 0.28rem;
  }

  .axis-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.8rem;
    padding: 0.28rem 0.44rem;
    border-radius: 6px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    background: rgba(15, 23, 42, 0.34);
    color: var(--text-secondary, #cbd5e1);
  }

  .axis-row strong {
    color: var(--text-primary, #f8fafc);
    font-size: 0.82rem;
  }

  .empty {
    margin: 0;
    color: var(--text-muted, #94a3b8);
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
