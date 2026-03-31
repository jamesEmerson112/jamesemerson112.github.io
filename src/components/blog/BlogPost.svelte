<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { fetchBlogPost, parseFrontmatter, formatDate } from '../../utils/blogLoader.ts';

  export let slug;

  let title = '';
  let date = '';
  let html = '';
  let loading = true;
  let error = null;

  async function loadPost(postSlug) {
    loading = true;
    error = null;
    try {
      const raw = await fetchBlogPost(postSlug);
      const { meta, content } = parseFrontmatter(raw);
      title = meta.title || postSlug;
      date = meta.date || '';
      html = DOMPurify.sanitize(marked.parse(content));
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => loadPost(slug));

  $: if (slug) loadPost(slug);

  function goBack() {
    window.location.hash = 'posts';
  }
</script>

<div class="blog-post" data-name="BlogPost">
  <nav class="post-nav" data-name="BlogPostNav">
    <button class="back-link" type="button" on:click={goBack} data-name="BlogPostBack">
      ← Back to blog
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

      <div class="post-body">
        {@html html}
      </div>
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
    font-family: inherit;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
    opacity: 0.5;
    cursor: pointer;
    transition: opacity 0.25s ease;
  }

  @media (hover: hover) {
    .back-link:hover {
      opacity: 1;
    }
  }

  .back-link:focus-visible {
    outline: 2px solid var(--accent-primary);
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
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    opacity: 0.5;
    margin-bottom: 1em;
  }

  .post-title {
    font-size: clamp(32px, 6vw, 48px);
    font-weight: 200;
    margin: 0;
    color: var(--text-primary);
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  /* Editorial body typography */
  .post-body {
    font-size: 18px;
    line-height: 1.72;
    color: var(--text-primary);
    opacity: 0.88;
  }

  .post-body :global(h1) {
    display: none; /* Hide duplicate h1 from markdown — title is in header */
  }

  .post-body :global(h2) {
    font-size: 24px;
    font-weight: 400;
    margin: 2.4em 0 0.8em 0;
    color: var(--text-primary);
    opacity: 1;
  }

  .post-body :global(h3) {
    font-size: 20px;
    font-weight: 500;
    margin: 2em 0 0.6em 0;
    color: var(--text-primary);
    opacity: 1;
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
    color: var(--text-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
    opacity: 0.85;
    transition: opacity 0.2s ease;
  }

  .post-body :global(a:hover) {
    opacity: 1;
  }

  .post-body :global(strong) {
    font-weight: 600;
    color: var(--text-primary);
    opacity: 1;
  }

  .post-body :global(code) {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.88em;
    padding: 0.15em 0.4em;
    background: var(--code-bg, rgba(255, 255, 255, 0.06));
    border-radius: 3px;
  }

  .post-body :global(pre) {
    margin: 1.6em 0;
    padding: 1.2em 1.4em;
    background: var(--code-bg, rgba(255, 255, 255, 0.06));
    border-radius: 6px;
    overflow-x: auto;
    line-height: 1.55;
  }

  .post-body :global(pre code) {
    padding: 0;
    background: none;
    font-size: 14px;
  }

  .post-body :global(blockquote) {
    margin: 1.6em 0;
    padding: 0 0 0 1.2em;
    border-left: 2px solid var(--text-secondary);
    opacity: 0.7;
  }

  .post-body :global(hr) {
    border: none;
    border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
    margin: 2.4em 0;
  }

  .post-body :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1.6em 0;
  }

  @media (max-width: 900px) {
    .post-body {
      font-size: 16px;
    }
  }
</style>
