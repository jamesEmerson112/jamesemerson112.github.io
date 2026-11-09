<script lang="ts">
  import { onMount } from 'svelte';
  import type { PostHeading } from '../../utils/postEnhancements.ts';

  export let headings: PostHeading[] = [];
  export let container: HTMLElement | null = null;

  let activeId = '';
  let frame = 0;

  // The active section is the last heading above a reading line near the top.
  function updateActive() {
    frame = 0;
    if (!container || headings.length === 0) return;
    const line = container.getBoundingClientRect().top + 140;
    let current = headings[0].id;
    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el && el.getBoundingClientRect().top <= line) current = heading.id;
      else break;
    }
    activeId = current;
  }

  function onScroll() {
    if (!frame) frame = window.requestAnimationFrame(updateActive);
  }

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (!el || !container) return;
    const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTo({ top: container.scrollTop + offset - 40, behavior: 'smooth' });
  }

  $: if (headings) updateActive();

  let attached: HTMLElement | null = null;
  $: if (container !== attached) {
    attached?.removeEventListener('scroll', onScroll);
    container?.addEventListener('scroll', onScroll, { passive: true });
    attached = container;
  }

  onMount(() => () => {
    attached?.removeEventListener('scroll', onScroll);
    if (frame) window.cancelAnimationFrame(frame);
  });
</script>

<nav class="post-toc" aria-label="Table of contents" data-name="PostToc">
  <div class="toc-label" data-name="PostTocLabel">Contents</div>
  <ol class="toc-list" data-name="PostTocList">
    {#each headings as heading (heading.id)}
      <li class="toc-item" class:sub={heading.level === 3} data-name="PostTocItem">
        <button
          type="button"
          class="toc-link"
          class:active={heading.id === activeId}
          aria-current={heading.id === activeId ? 'location' : undefined}
          on:click={() => jumpTo(heading.id)}
          data-name="PostTocLink"
        >
          {heading.text}
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  .post-toc {
    position: sticky;
    top: 96px;
    align-self: start;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
    padding-left: 18px;
    border-left: 1px solid var(--line-2);
  }

  .toc-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--acc);
    margin-bottom: 14px;
  }

  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toc-item.sub {
    padding-left: 12px;
  }

  .toc-link {
    position: relative;
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 6px 0;
    font-family: var(--font-family-primary);
    font-size: 13px;
    line-height: 1.4;
    color: var(--text-muted);
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .toc-link::before {
    content: '';
    position: absolute;
    /* Inside the padding box: the rail's overflow clips anything further left. */
    left: -18px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    border-radius: 2px;
    background: var(--acc);
    transform: scaleY(0);
    transition: transform 0.3s var(--ease-out-expo, ease);
  }

  .toc-link:hover {
    color: var(--text-primary);
  }

  .toc-link.active {
    color: var(--text-primary);
  }

  .toc-link.active::before {
    transform: scaleY(1);
  }

  .toc-link:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }
</style>
