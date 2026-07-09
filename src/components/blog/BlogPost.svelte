<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { fetchBlogPost, fetchBlogIndex, parseFrontmatter, formatDate } from '../../utils/blogLoader.ts';
  import { navigateToPost, navigateToBlogList } from '../../utils/routing.ts';

  interface BlogIndexEntry {
    slug: string;
    title: string;
    date: string;
    excerpt?: string;
  }

  export let slug: string;

  let title = '';
  let date = '';
  let html = '';
  let loading = true;
  let error: string | null = null;
  let bodyEl: HTMLElement | null = null;
  let prevPost: BlogIndexEntry | null = null;
  let nextPost: BlogIndexEntry | null = null;

  async function applyHighlighting() {
    await tick();
    if (!bodyEl || !bodyEl.querySelector('pre code')) return;
    const { default: hljs } = await import('../../utils/highlighter.ts');
    for (const block of bodyEl.querySelectorAll('pre code')) {
      hljs.highlightElement(block as HTMLElement);
    }
  }

  async function loadNeighbors(postSlug: string) {
    try {
      const index: BlogIndexEntry[] = await fetchBlogIndex();
      const position = index.findIndex((post) => post.slug === postSlug);
      // The index is newest-first: the next entry is the older post.
      prevPost = position >= 0 ? index[position + 1] || null : null;
      nextPost = position > 0 ? index[position - 1] : null;
    } catch {
      prevPost = null;
      nextPost = null;
    }
  }

  async function loadPost(postSlug: string) {
    loading = true;
    error = null;
    try {
      const raw = await fetchBlogPost(postSlug);
      const { meta, content } = parseFrontmatter(raw);
      title = meta.title || postSlug;
      date = meta.date || '';
      html = DOMPurify.sanitize(await marked.parse(content));
      loading = false;
      applyHighlighting();
      loadNeighbors(postSlug);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      loading = false;
    }
  }

  onMount(() => loadPost(slug));

  $: if (slug) loadPost(slug);

  const goBack = navigateToBlogList;
</script>

<div class="blog-post" data-name="BlogPost">
  <nav class="post-nav" data-name="BlogPostNav">
    <button class="back-link" type="button" on:click={goBack} data-name="BlogPostBack">
      ← BACK TO BLOG
    </button>
  </nav>

  {#if loading}
    <p class="post-status">Loading...</p>
  {:else if error}
    <p class="post-status post-error">{error}</p>
  {:else}
    <article class="post-article" data-name="BlogPostArticle">
      <header class="post-header">
        {#if date}
          <time class="post-date" datetime={date}>{formatDate(date)}</time>
        {/if}
        <h1 class="post-title">{title}</h1>
      </header>

      <div class="post-body" bind:this={bodyEl}>
        {@html html}
      </div>

      {#if prevPost || nextPost}
        <nav class="post-pager" aria-label="Adjacent posts" data-name="BlogPostPager">
          {#if prevPost}
            <button
              class="pager-link pager-prev"
              type="button"
              on:click={() => navigateToPost(prevPost.slug)}
              data-name="BlogPostPrev"
            >
              <span class="pager-label">← OLDER</span>
              <span class="pager-title">{prevPost.title}</span>
            </button>
          {:else}
            <span class="pager-spacer" aria-hidden="true"></span>
          {/if}
          {#if nextPost}
            <button
              class="pager-link pager-next"
              type="button"
              on:click={() => navigateToPost(nextPost.slug)}
              data-name="BlogPostNext"
            >
              <span class="pager-label">NEWER →</span>
              <span class="pager-title">{nextPost.title}</span>
            </button>
          {/if}
        </nav>
      {/if}
    </article>
  {/if}
</div>

<style>
  .blog-post {
    max-width: 680px;
    margin: 0 auto;
    padding: clamp(2rem, 6vw, 4rem) clamp(1.5rem, 4vw, 2rem) clamp(4rem, 10vw, 8rem);
  }

  .post-nav {
    margin-bottom: 3em;
  }

  .back-link {
    background: none;
    border: none;
    padding: 0.4em 0;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    color: var(--nav-idle);
    cursor: pointer;
    transition: color 0.25s ease;
  }

  @media (hover: hover) {
    .back-link:hover {
      color: var(--nav-hover);
    }
  }

  .back-link:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  .post-status {
    font-size: 16px;
    color: var(--text-secondary);
    opacity: 0.6;
  }

  .post-error {
    color: #e55;
  }

  .post-header {
    margin-bottom: 3em;
  }

  .post-date {
    display: block;
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent-info);
    margin-bottom: 1em;
  }

  .post-title {
    font-family: var(--font-display);
    font-size: clamp(32px, 6vw, 48px);
    font-weight: 200;
    margin: 0;
    color: var(--scene-text);
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  /* Editorial body typography */
  .post-body {
    font-size: 17px;
    line-height: 1.72;
    color: var(--text-secondary);
  }

  .post-body :global(h1) {
    display: none; /* Hide duplicate h1 from markdown — title is in header */
  }

  .post-body :global(h2) {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 400;
    margin: 2.4em 0 0.8em 0;
    color: var(--text-primary);
  }

  .post-body :global(h3) {
    font-family: var(--font-display);
    font-size: 21px;
    font-weight: 500;
    margin: 2em 0 0.6em 0;
    color: var(--text-primary);
  }

  .post-body :global(p) {
    margin: 0 0 1.4em 0;
  }

  .post-body :global(ul),
  .post-body :global(ol) {
    margin: 0 0 1.4em 0;
    padding-left: 1.4em;
  }

  .post-body :global(li) {
    margin-bottom: 0.4em;
  }

  .post-body :global(a) {
    color: var(--acc);
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.2s ease;
  }

  .post-body :global(a:hover) {
    color: var(--acc-hover);
  }

  .post-body :global(strong) {
    font-weight: 600;
    color: var(--text-primary);
  }

  .post-body :global(code) {
    font-family: var(--font-mono);
    font-size: 0.85em;
    padding: 0.15em 0.4em;
    background: var(--code-bg);
    border-radius: 3px;
  }

  .post-body :global(pre) {
    margin: 1.6em 0;
    padding: 1.2em 1.4em;
    background: var(--code-bg);
    border: 1px solid var(--line-3);
    border-radius: 8px;
    overflow-x: auto;
    line-height: 1.55;
  }

  .post-body :global(pre code) {
    padding: 0;
    background: none;
    font-size: 13.5px;
  }

  /* highlight.js token theme (CSS-var driven, works in both themes) */
  .post-body :global(.hljs-keyword),
  .post-body :global(.hljs-selector-tag),
  .post-body :global(.hljs-built_in),
  .post-body :global(.hljs-type) {
    color: var(--code-keyword);
  }

  .post-body :global(.hljs-string),
  .post-body :global(.hljs-regexp),
  .post-body :global(.hljs-template-string) {
    color: var(--code-string);
  }

  .post-body :global(.hljs-comment),
  .post-body :global(.hljs-quote) {
    color: var(--code-comment);
    font-style: italic;
  }

  .post-body :global(.hljs-number),
  .post-body :global(.hljs-literal),
  .post-body :global(.hljs-symbol) {
    color: var(--code-number);
  }

  .post-body :global(.hljs-title),
  .post-body :global(.hljs-function),
  .post-body :global(.hljs-section) {
    color: var(--code-title);
  }

  .post-body :global(.hljs-attr),
  .post-body :global(.hljs-attribute),
  .post-body :global(.hljs-variable),
  .post-body :global(.hljs-params),
  .post-body :global(.hljs-property) {
    color: var(--code-attr);
  }

  .post-body :global(blockquote) {
    margin: 1.6em 0;
    padding: 0 0 0 1.2em;
    border-left: 2px solid var(--acc);
    color: var(--text-muted);
  }

  .post-body :global(hr) {
    border: none;
    border-top: 1px solid var(--line-3);
    margin: 2.4em 0;
  }

  .post-body :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1.6em 0;
  }

  .post-pager {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-top: 4em;
    padding-top: 1.6em;
    border-top: 1px solid var(--line-2);
  }

  .pager-link {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    max-width: 46%;
  }

  .pager-next {
    text-align: right;
    align-items: flex-end;
    margin-left: auto;
  }

  .pager-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--nav-idle);
  }

  .pager-title {
    font-family: var(--font-display);
    font-size: 16px;
    color: var(--text-secondary);
    line-height: 1.3;
    transition: color 0.2s;
  }

  .pager-link:hover .pager-title {
    color: var(--text-primary);
  }

  .pager-link:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }

  .pager-spacer {
    flex: 1;
  }

  @media (max-width: 900px) {
    .post-body {
      font-size: 16px;
    }
  }
</style>
