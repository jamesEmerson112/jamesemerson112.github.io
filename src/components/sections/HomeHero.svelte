<script lang="ts">
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { formatCompact } from '../../utils/formatters.ts';
  import { prefersReducedMotion } from '../../utils/reveal.ts';

  export let repos: number | null = null;
  export let lines: number | null = null;
  export let languages: number | null = null;
  export let scanned: string | null = null;

  // Tagline split into styled segments; typed out once on load.
  const TAGLINE = [
    { text: "'Cure' neural networks ", accent: false, breakAfter: true },
    { text: '==', accent: true, breakAfter: false },
    { text: ' cure brains', accent: false, breakAfter: false }
  ];
  const FULL_TAGLINE = TAGLINE.map((segment) => segment.text).join('');

  let typedCount = FULL_TAGLINE.length;
  let typing = false;

  // Per-segment typed/untyped split. The untyped remainder stays in the DOM
  // (transparent) so the right-aligned line never shifts while typing.
  $: typedSegments = (() => {
    let remaining = typedCount;
    return TAGLINE.map((segment) => {
      const visible = Math.max(0, Math.min(segment.text.length, remaining));
      remaining -= visible;
      return {
        ...segment,
        typed: segment.text.slice(0, visible),
        rest: segment.text.slice(visible)
      };
    });
  })();
  $: caretIndex = (() => {
    // Segment index the caret sits in (first segment with untyped text).
    const index = typedSegments.findIndex((segment) => segment.rest.length > 0);
    return index === -1 ? typedSegments.length - 1 : index;
  })();

  const duration = prefersReducedMotion() ? 0 : 1600;
  const repoCount = tweened(0, { duration, easing: cubicOut });
  const lineCount = tweened(0, { duration: duration * 1.15, easing: cubicOut });
  const languageCount = tweened(0, { duration, easing: cubicOut });

  $: if (repos !== null) repoCount.set(repos);
  $: if (lines !== null) lineCount.set(lines);
  $: if (languages !== null) languageCount.set(languages);

  $: hasStats = repos !== null && lines !== null && languages !== null;

  onMount(() => {
    if (prefersReducedMotion() || typeof window.matchMedia !== 'function') return;

    typedCount = 0;
    typing = true;
    let timer = 0;
    const step = () => {
      typedCount += 1;
      if (typedCount < FULL_TAGLINE.length) {
        // Slight jitter reads as typing rather than a ticker.
        timer = window.setTimeout(step, 34 + Math.random() * 40);
      } else {
        typing = false;
      }
    };
    timer = window.setTimeout(step, 450);

    return () => window.clearTimeout(timer);
  });
</script>

<div class="hero" data-name="HomeHero">
  <p class="hero-kicker enter" style="--enter-delay: 80ms" data-name="HomeHeroKicker">
    <span class="kicker-dot" aria-hidden="true" data-name="HomeHeroKickerDot"></span>
    Software Developer @ JCM Global · MSCS @ Georgia Tech
  </p>

  <h1 class="tagline" aria-label={FULL_TAGLINE} data-name="HomeHeroTagline">
    <span aria-hidden="true" data-name="HomeHeroTaglineTyped">
      {#each typedSegments as segment, index}
        <span class:eq={segment.accent} data-name="HomeHeroSegment">{segment.typed}</span>{#if index === caretIndex}<span
            class="caret"
            class:is-typing={typing}
            data-name="HomeHeroCaret"
          ></span>{/if}<span class="untyped" class:eq={segment.accent} data-name="HomeHeroRest">{segment.rest}</span>{#if segment.breakAfter}<br data-name="HomeHeroBreak" />{/if}
      {/each}
    </span>
  </h1>

  <dl class="stats enter" style="--enter-delay: 260ms" data-name="HomeHeroStats">
    <div class="stat" data-name="HomeHeroStatRepos">
      <dt data-name="HomeHeroStatReposLabel">Repositories</dt>
      <dd data-name="HomeHeroStatReposValue">{hasStats ? Math.round($repoCount) : '—'}</dd>
    </div>
    <div class="stat" data-name="HomeHeroStatLines">
      <dt data-name="HomeHeroStatLinesLabel">Lines of code</dt>
      <dd data-name="HomeHeroStatLinesValue">{hasStats ? formatCompact($lineCount) : '—'}</dd>
    </div>
    <div class="stat" data-name="HomeHeroStatLanguages">
      <dt data-name="HomeHeroStatLanguagesLabel">Languages</dt>
      <dd data-name="HomeHeroStatLanguagesValue">{hasStats ? Math.round($languageCount) : '—'}</dd>
    </div>
  </dl>

  <p class="scan-note enter" style="--enter-delay: 340ms" data-name="HomeHeroScanNote">
    {#if scanned}
      Auto-scanned from GitHub · last run {scanned}
    {:else}
      Auto-scanned from GitHub
    {/if}
  </p>

  <div class="cta-row enter" style="--enter-delay: 420ms" data-name="HomeHeroCtas">
    <a class="cta cta-primary" href="#projects" data-name="HomeHeroCtaProjects">
      Explore projects <span class="cta-arrow" aria-hidden="true" data-name="HomeHeroCtaArrow">→</span>
    </a>
    <a class="cta" href="#blog" data-name="HomeHeroCtaBlog">
      Read the blog <span class="cta-arrow" aria-hidden="true" data-name="HomeHeroCtaArrow2">→</span>
    </a>
  </div>
</div>

<style>
  .hero {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
  }

  .hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: 0 0 22px;
  }

  .kicker-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--acc);
    box-shadow: 0 0 10px var(--acc);
  }

  .tagline {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: clamp(22px, 2.6vw, 34px);
    line-height: 1.3;
    letter-spacing: -0.02em;
    color: var(--scene-text);
    margin: 0 0 40px;
  }

  .tagline .eq {
    color: var(--acc);
  }

  .untyped {
    color: transparent;
  }

  .tagline .untyped.eq {
    color: transparent;
  }

  .caret {
    position: relative;
    display: inline-block;
    width: 0;
    height: 1em;
    vertical-align: -0.14em;
  }

  .caret::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 0;
    bottom: 0;
    width: 0.5ch;
    background: var(--acc);
    opacity: 0.85;
    animation: caret-blink 1.05s steps(1) infinite;
  }

  .caret.is-typing::after {
    animation: none;
  }

  @keyframes caret-blink {
    50% {
      opacity: 0;
    }
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 0;
    margin: 0;
    border-top: 1px solid var(--line-2);
    border-bottom: 1px solid var(--line-2);
  }

  .stat {
    padding: 18px 0 16px;
    min-width: 0;
  }

  .stat + .stat {
    border-left: 1px solid var(--line-3);
    margin-left: 30px;
    padding-left: 30px;
  }

  .stat dt {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .stat dd {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(34px, 3.4vw, 46px);
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--scene-text);
    font-variant-numeric: tabular-nums lining-nums;
  }

  .scan-note {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin: 14px 0 34px;
  }

  .cta-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 12px;
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 11px 18px;
    border-radius: 999px;
    border: 1px solid var(--line-1);
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.04em;
    color: var(--mono-tone-2);
    text-decoration: none;
    background: transparent;
    transition: border-color 0.25s ease, color 0.25s ease, background-color 0.25s ease,
      box-shadow 0.25s ease;
  }

  .cta-primary {
    color: var(--acc);
    border-color: color-mix(in srgb, var(--acc) 55%, transparent);
    background: color-mix(in srgb, var(--acc) 8%, transparent);
  }

  .cta:hover {
    color: var(--text-primary);
    border-color: color-mix(in srgb, var(--acc) 70%, transparent);
  }

  .cta-primary:hover {
    color: var(--acc-hover);
    background: color-mix(in srgb, var(--acc) 14%, transparent);
    box-shadow: 0 0 28px color-mix(in srgb, var(--acc) 22%, transparent);
  }

  .cta:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }

  .cta-arrow {
    display: inline-block;
    transition: transform 0.3s var(--ease-out-expo, ease);
  }

  .cta:hover .cta-arrow {
    transform: translateX(4px);
  }

  @media (prefers-reduced-motion: reduce) {
    .caret::after {
      animation: none;
    }
  }

  @media (max-width: 960px) {
    .hero {
      align-items: flex-start;
      text-align: left;
    }

    .cta-row {
      justify-content: flex-start;
    }

    .stat + .stat {
      padding-left: 22px;
      margin-left: 22px;
    }
  }

  @media (max-width: 480px) {
    .stat + .stat {
      padding-left: 14px;
      margin-left: 14px;
    }

    .stat dt {
      font-size: 8.5px;
      letter-spacing: 0.12em;
    }
  }
</style>
