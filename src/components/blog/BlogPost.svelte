<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import {
    fetchBlogPost,
    fetchBlogIndex,
    parseFrontmatter,
    parseTagList,
    estimateReadingMinutes,
    normalizeDate,
    formatDate,
    formatReadingTime,
    onBlogChange,
    setBlogTitle
  } from '../../utils/blogLoader.ts';
  import { navigateToPost, navigateToBlogList } from '../../utils/routing.ts';
  import { enhancePostBody, collectHeadings, copyText } from '../../utils/postEnhancements.ts';
  import type { PostHeading } from '../../utils/postEnhancements.ts';
  import PostToc from './PostToc.svelte';
  import type { BlogPostMeta } from '../../types.js';

  export let slug: string;

  let title = '';
  let date = '';
  let excerpt = '';
  let tags: string[] = [];
  let readingTime = 0;
  let isDraft = false;
  let html = '';
  let loading = true;
  let error: string | null = null;
  let rootEl: HTMLElement | null = null;
  let bodyEl: HTMLElement | null = null;
  let prevPost: BlogPostMeta | null = null;
  let nextPost: BlogPostMeta | null = null;
  let progress = 0;
  let linkCopied = false;
  let loadToken = 0;
  let copiedTimer = 0;
  let headings: PostHeading[] = [];
  let scrollEl: HTMLElement | null = null;

  // A contents rail appears (on wide screens) once a post has enough sections.
  $: showToc = headings.length >= 3;

  async function renderEnhancements(token: number) {
    await tick();
    if (token !== loadToken || !bodyEl) return;
    enhancePostBody(bodyEl);
    headings = collectHeadings(bodyEl);

    // Only fenced blocks with an explicit language get highlighted; unlabeled
    // blocks (ASCII diagrams, output) stay plain instead of being guessed at.
    const highlightable = 'pre code[class*="language-"]:not(.language-text):not(.language-plaintext)';
    if (!bodyEl.querySelector(highlightable)) return;
    const { default: hljs } = await import('../../utils/highlighter.ts');
    // The component may have navigated or unmounted while hljs loaded.
    if (token !== loadToken || !bodyEl) return;
    for (const block of bodyEl.querySelectorAll<HTMLElement>(highlightable)) {
      if (block.dataset.highlighted) continue;
      hljs.highlightElement(block);
    }
  }

  async function loadNeighbors(postSlug: string, token: number) {
    try {
      const index: BlogPostMeta[] = await fetchBlogIndex();
      if (token !== loadToken) return;
      const position = index.findIndex((post) => post.slug === postSlug);
      // The index is newest-first: the next entry is the older post.
      prevPost = position >= 0 ? index[position + 1] || null : null;
      nextPost = position > 0 ? index[position - 1] : null;
    } catch {
      prevPost = null;
      nextPost = null;
    }
  }

  async function loadPost(postSlug: string, { silent = false } = {}) {
    const token = ++loadToken;
    if (!silent) {
      loading = true;
      error = null;
    }
    try {
      const raw = await fetchBlogPost(postSlug);
      if (token !== loadToken) return;
      const { meta, content } = parseFrontmatter(raw);
      title = meta.title || postSlug;
      setBlogTitle(title);
      date = normalizeDate(meta.date || '') || '';
      excerpt = meta.excerpt || '';
      tags = parseTagList(meta.tags);
      isDraft = String(meta.draft || '').toLowerCase() === 'true';
      readingTime = estimateReadingMinutes(content);
      // `math: true` posts get KaTeX; loaded on demand so other pages never pay for it.
      const wantsMath = String(meta.math || '').toLowerCase() === 'true';
      const rendered = wantsMath
        ? await (await import('../../utils/mathMarkdown.ts')).parseMathMarkdown(content)
        : await marked.parse(content);
      if (token !== loadToken) return;
      html = DOMPurify.sanitize(rendered);
      if (token !== loadToken) return;
      loading = false;
      error = null;
      renderEnhancements(token);
      loadNeighbors(postSlug, token);
      if (!silent) resetScroll();
    } catch (e) {
      if (token !== loadToken) return;
      error = e instanceof Error ? e.message : String(e);
      loading = false;
    }
  }

  // Always load: fetchBlogPost rejects empty/invalid slugs (e.g. "#posts/"),
  // which shows the error state instead of an endless skeleton.
  $: loadPost(slug);

  function scrollContainer(): HTMLElement | null {
    return rootEl?.closest<HTMLElement>('.single-page-scroll') ?? null;
  }

  function resetScroll() {
    const container = scrollContainer();
    if (container && typeof container.scrollTo === 'function') {
      container.scrollTo({ top: 0, behavior: 'instant' });
    } else if (container) {
      container.scrollTop = 0;
    }
    progress = 0;
  }

  function updateProgress() {
    const container = scrollContainer();
    if (!container) return;
    const max = container.scrollHeight - container.clientHeight;
    progress = max > 0 ? Math.min(1, Math.max(0, container.scrollTop / max)) : 0;
  }

  // Inline contents (narrow screens): scroll the reading container to a heading.
  function jumpToHeading(id: string) {
    const el = document.getElementById(id);
    const container = scrollContainer();
    if (!el || !container) return;
    const topbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 0;
    const barOffset = window.matchMedia?.('(max-width: 960px)').matches ? topbar : 0;
    const offset = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTo({ top: container.scrollTop + offset - barOffset - 24, behavior: 'smooth' });
  }

  async function copyLink() {
    const ok = await copyText(window.location.href);
    linkCopied = ok;
    window.clearTimeout(copiedTimer);
    copiedTimer = window.setTimeout(() => {
      linkCopied = false;
    }, 1800);
  }

  onMount(() => {
    const container = scrollContainer();
    scrollEl = container;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateProgress();
      });
    };
    container?.addEventListener('scroll', onScroll, { passive: true });

    // Dev live preview: re-render in place when this post's file is saved.
    const stopWatching = onBlogChange((change) => {
      if (change.slug === slug) {
        loadPost(slug, { silent: true });
      }
    });

    return () => {
      container?.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(copiedTimer);
      stopWatching();
      loadToken += 1;
      setBlogTitle(null);
    };
  });

  const goBack = navigateToBlogList;
</script>

<div class="blog-post" class:has-toc={showToc} bind:this={rootEl} data-name="BlogPost">
  <div
    class="read-progress"
    style="transform: scaleX({progress})"
    aria-hidden="true"
    data-name="BlogPostProgress"
  ></div>

  <nav class="post-nav" data-name="BlogPostNav">
    <button class="back-link" type="button" on:click={goBack} data-name="BlogPostBack">
      <span class="back-arrow" aria-hidden="true" data-name="BlogPostBackArrow">←</span> ALL POSTS
    </button>
  </nav>

  {#if loading}
    <div class="post-skeleton" aria-busy="true" aria-label="Loading post" data-name="BlogPostSkeleton">
      <span class="skeleton-line short" data-name="BlogPostSkeletonLine1"></span>
      <span class="skeleton-line title" data-name="BlogPostSkeletonLine2"></span>
      <span class="skeleton-line" data-name="BlogPostSkeletonLine3"></span>
      <span class="skeleton-line" data-name="BlogPostSkeletonLine4"></span>
      <span class="skeleton-line medium" data-name="BlogPostSkeletonLine5"></span>
    </div>
  {:else if error}
    <div class="post-status post-error" data-name="BlogPostError">
      <p data-name="BlogPostErrorText">{error}</p>
      <button class="back-link" type="button" on:click={goBack} data-name="BlogPostErrorBack">
        ← BROWSE ALL POSTS
      </button>
    </div>
  {:else}
    <div class="post-layout" data-name="BlogPostLayout">
    <article class="post-article selectable" data-name="BlogPostArticle">
      <header class="post-header enter" data-name="BlogPostHeader">
        <div class="post-meta" data-name="BlogPostMeta">
          {#if date}
            <time class="post-date" datetime={date} data-name="BlogPostDate">{formatDate(date)}</time>
          {/if}
          {#if readingTime}
            <span class="meta-sep" aria-hidden="true" data-name="BlogPostMetaSep">·</span>
            <span class="post-reading" data-name="BlogPostReadingTime">{formatReadingTime(readingTime)}</span>
          {/if}
          {#if isDraft}
            <span class="draft-badge" data-name="BlogPostDraftBadge">Draft</span>
          {/if}
        </div>
        <h1 class="post-title" data-name="BlogPostTitle">{title}</h1>
        {#if excerpt}
          <p class="post-dek" data-name="BlogPostDek">{excerpt}</p>
        {/if}
        {#if tags.length > 0}
          <ul class="post-tags" aria-label="Tags" data-name="BlogPostTags">
            {#each tags as tag}
              <li class="post-tag" data-name="BlogPostTag">{tag}</li>
            {/each}
          </ul>
        {/if}
      </header>

      {#if showToc}
        <details class="toc-inline" data-name="BlogPostTocInline">
          <summary data-name="BlogPostTocInlineSummary">Contents <span class="toc-count" data-name="BlogPostTocInlineCount">{headings.length} sections</span></summary>
          <ol data-name="BlogPostTocInlineList">
            {#each headings as heading (heading.id)}
              <li class:sub={heading.level === 3} data-name="BlogPostTocInlineItem">
                <button type="button" on:click={() => jumpToHeading(heading.id)} data-name="BlogPostTocInlineLink">
                  {heading.text}
                </button>
              </li>
            {/each}
          </ol>
        </details>
      {/if}

      <div class="post-body enter" style="--enter-delay: 120ms" bind:this={bodyEl} data-name="BlogPostBody">
        {@html html}
      </div>

      <footer class="post-footer" data-name="BlogPostFooter">
        <span class="end-mark" aria-hidden="true" data-name="BlogPostEndMark"></span>
        <div class="post-actions" data-name="BlogPostActions">
          <button class="action-link" type="button" on:click={copyLink} data-name="BlogPostCopyLink">
            {linkCopied ? 'LINK COPIED ✓' : 'COPY LINK'}
          </button>
          <a class="action-link" href="/blog/feed.xml" target="_blank" rel="noopener noreferrer" data-name="BlogPostRss">
            RSS
          </a>
          <button class="action-link" type="button" on:click={goBack} data-name="BlogPostFooterBack">
            ALL POSTS →
          </button>
        </div>
      </footer>

      {#if prevPost || nextPost}
        <nav class="post-pager" aria-label="Adjacent posts" data-name="BlogPostPager">
          {#if prevPost}
            <button
              class="pager-link pager-prev"
              type="button"
              on:click={() => prevPost && navigateToPost(prevPost.slug)}
              data-name="BlogPostPrev"
            >
              <span class="pager-label" data-name="BlogPostPrevLabel">← OLDER</span>
              <span class="pager-title" data-name="BlogPostPrevTitle">{prevPost.title}</span>
            </button>
          {:else}
            <span class="pager-spacer" aria-hidden="true" data-name="BlogPostPagerSpacer"></span>
          {/if}
          {#if nextPost}
            <button
              class="pager-link pager-next"
              type="button"
              on:click={() => nextPost && navigateToPost(nextPost.slug)}
              data-name="BlogPostNext"
            >
              <span class="pager-label" data-name="BlogPostNextLabel">NEWER →</span>
              <span class="pager-title" data-name="BlogPostNextTitle">{nextPost.title}</span>
            </button>
          {/if}
        </nav>
      {/if}
    </article>
    {#if showToc}
      <PostToc {headings} container={scrollEl} />
    {/if}
    </div>
  {/if}
</div>

<style>
  .blog-post {
    max-width: 700px;
    margin: 0 auto;
    padding: clamp(2rem, 6vw, 4rem) clamp(1.25rem, 4vw, 2rem) clamp(4rem, 10vw, 8rem);
  }

  .post-layout {
    min-width: 0;
  }

  .post-article {
    min-width: 0;
  }

  /* Inline contents for narrower screens (the rail takes over at 1400px). */
  .toc-inline {
    margin: -1.6em 0 2.6em;
    border: 1px solid var(--line-2);
    border-radius: 12px;
    padding: 0 16px;
  }

  .toc-inline summary {
    cursor: pointer;
    padding: 12px 0;
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--acc);
    list-style-position: inside;
  }

  .toc-inline summary:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
    border-radius: 6px;
  }

  .toc-count {
    margin-left: 8px;
    color: var(--text-muted);
    letter-spacing: 0.08em;
  }

  .toc-inline ol {
    list-style: none;
    margin: 0;
    padding: 0 0 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toc-inline li.sub {
    padding-left: 14px;
  }

  .toc-inline button {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 6px 0;
    font-family: var(--font-family-primary);
    font-size: 14.5px;
    line-height: 1.4;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .toc-inline button:hover {
    color: var(--text-primary);
  }

  .toc-inline button:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  @media (min-width: 1400px) {
    .toc-inline {
      display: none;
    }
  }

  @media print {
    .toc-inline {
      display: none;
    }
  }

  /* Wide screens: article + sticky contents rail. Below that the rail hides. */
  .blog-post :global(.post-toc) {
    display: none;
  }

  @media (min-width: 1400px) {
    .blog-post.has-toc {
      max-width: 980px;
    }

    .has-toc .post-layout {
      display: grid;
      grid-template-columns: minmax(0, 700px) 210px;
      gap: 56px;
      align-items: start;
    }

    .blog-post.has-toc :global(.post-toc) {
      display: block;
    }
  }

  /* Reading progress: pinned to the top of the content column. */
  .read-progress {
    position: fixed;
    top: 0;
    left: var(--rail);
    right: 0;
    height: 2px;
    z-index: 30;
    transform-origin: 0 50%;
    background: linear-gradient(90deg, color-mix(in srgb, var(--acc) 40%, transparent), var(--acc));
    box-shadow: 0 0 12px color-mix(in srgb, var(--acc) 60%, transparent);
    transition: transform 0.12s linear;
    pointer-events: none;
  }

  .post-nav {
    margin-bottom: 3.2em;
  }

  .back-link {
    background: none;
    border: none;
    padding: 0.4em 0;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    color: var(--nav-idle);
    cursor: pointer;
    transition: color 0.25s ease;
  }

  .back-arrow {
    display: inline-block;
    transition: transform 0.3s var(--ease-out-expo, ease);
  }

  @media (hover: hover) {
    .back-link:hover {
      color: var(--nav-hover);
    }

    .back-link:hover .back-arrow {
      transform: translateX(-4px);
    }
  }

  .back-link:focus-visible,
  .action-link:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  .post-status {
    font-size: 16px;
    color: var(--text-secondary);
  }

  .post-error p {
    color: #e55;
    margin-bottom: 1.2em;
  }

  /* Loading skeleton */
  .post-skeleton {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .skeleton-line {
    display: block;
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--line-3) 0%, var(--line-1) 50%, var(--line-3) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  .skeleton-line.short {
    width: 30%;
    height: 10px;
  }

  .skeleton-line.title {
    width: 75%;
    height: 42px;
    margin-bottom: 18px;
  }

  .skeleton-line.medium {
    width: 60%;
  }

  @keyframes shimmer {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }

  /* Header */
  .post-header {
    margin-bottom: 3.2em;
    padding-bottom: 2.4em;
    border-bottom: 1px solid var(--line-2);
  }

  .post-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 1.2em;
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }

  .post-date {
    color: var(--acc);
  }

  .draft-badge {
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent-warning) 60%, transparent);
    color: var(--accent-warning);
    font-size: 9.5px;
    letter-spacing: 0.14em;
  }

  .post-title {
    font-family: var(--font-display);
    font-size: clamp(36px, 6vw, 58px);
    font-weight: 200;
    margin: 0;
    color: var(--scene-text);
    line-height: 1.08;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }

  .post-dek {
    margin: 0.9em 0 0;
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(18px, 2.2vw, 21px);
    line-height: 1.45;
    color: var(--text-secondary);
    text-wrap: pretty;
  }

  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    margin: 1.6em 0 0;
    padding: 0;
  }

  .post-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 999px;
    color: var(--mono-tone-3);
    border: 1px solid var(--line-1);
  }

  .post-tag::before {
    content: '#';
    color: var(--acc);
    margin-right: 2px;
  }

  /* Editorial body typography */
  .post-body {
    font-size: 17.5px;
    line-height: 1.75;
    color: color-mix(in srgb, var(--text-primary) 72%, var(--text-secondary));
    overflow-wrap: break-word;
  }

  .post-body > :global(:first-child) {
    margin-top: 0;
  }

  /* Lead paragraph */
  .post-body > :global(p:first-of-type) {
    font-size: 1.12em;
    line-height: 1.65;
    color: var(--text-primary);
  }

  .post-body :global(h1) {
    display: none; /* Hide duplicate h1 from markdown — title is in header */
  }

  .post-body :global(h2) {
    font-family: var(--font-display);
    font-size: clamp(25px, 3vw, 30px);
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: -0.01em;
    margin: 2.2em 0 0.7em;
    color: var(--text-primary);
  }

  .post-body :global(h3) {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 400;
    margin: 1.9em 0 0.5em;
    color: var(--text-primary);
  }

  .post-body :global(h4) {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 2em 0 0.6em;
    color: var(--acc);
  }

  .post-body :global(p) {
    margin: 0 0 1.35em;
  }

  .post-body :global(ul),
  .post-body :global(ol) {
    margin: 0 0 1.4em;
    padding-left: 1.4em;
  }

  .post-body :global(li) {
    margin-bottom: 0.45em;
    padding-left: 0.25em;
  }

  .post-body :global(ul > li::marker) {
    color: var(--acc);
  }

  .post-body :global(ol > li::marker) {
    font-family: var(--font-mono);
    font-size: 0.82em;
    color: var(--acc);
  }

  .post-body :global(li > ul),
  .post-body :global(li > ol) {
    margin: 0.45em 0 0;
  }

  /* GFM task lists */
  .post-body :global(li:has(> input[type='checkbox'])) {
    list-style: none;
    margin-left: -1.2em;
  }

  .post-body :global(input[type='checkbox']) {
    accent-color: var(--acc);
    margin-right: 0.5em;
    transform: translateY(1px);
  }

  .post-body :global(a) {
    color: var(--acc);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--acc) 45%, transparent);
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    transition: color 0.2s ease, text-decoration-color 0.2s ease;
  }

  .post-body :global(a:hover) {
    color: var(--acc-hover);
    text-decoration-color: currentColor;
  }

  .post-body :global(strong) {
    font-weight: 600;
    color: var(--text-primary);
  }

  .post-body :global(mark) {
    color: var(--text-primary);
    background: color-mix(in srgb, var(--acc) 24%, transparent);
    padding: 0.05em 0.25em;
    border-radius: 3px;
  }

  .post-body :global(kbd) {
    font-family: var(--font-mono);
    font-size: 0.78em;
    padding: 0.15em 0.45em;
    border: 1px solid var(--line-1);
    border-bottom-width: 2px;
    border-radius: 4px;
    color: var(--text-primary);
  }

  .post-body :global(code) {
    font-family: var(--font-mono);
    font-size: 0.84em;
    padding: 0.15em 0.4em;
    color: var(--code-title);
    background: var(--code-bg);
    border: 1px solid var(--line-3);
    border-radius: 4px;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }

  /* Code blocks (toolbar added by postEnhancements.ts) */
  .post-body :global(.code-block) {
    margin: 1.8em 0;
    border: 1px solid var(--line-2);
    border-radius: 10px;
    background: var(--code-bg);
    overflow: hidden;
  }

  .post-body :global(.code-block-bar) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 10px 7px 16px;
    border-bottom: 1px solid var(--line-3);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .post-body :global(.code-copy) {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mono-tone-3);
    background: transparent;
    border: 1px solid var(--line-2);
    border-radius: 999px;
    padding: 4px 10px;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .post-body :global(.code-copy:hover) {
    color: var(--text-primary);
    border-color: color-mix(in srgb, var(--acc) 60%, transparent);
  }

  .post-body :global(.code-copy.is-copied) {
    color: var(--acc-2);
    border-color: color-mix(in srgb, var(--acc-2) 60%, transparent);
  }

  .post-body :global(.code-copy:focus-visible) {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  .post-body :global(pre) {
    margin: 1.8em 0;
    padding: 1.1em 1.3em;
    background: var(--code-bg);
    border: 1px solid var(--line-3);
    border-radius: 10px;
    overflow-x: auto;
    line-height: 1.6;
  }

  .post-body :global(.code-block pre) {
    margin: 0;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .post-body :global(pre:focus-visible),
  .post-body :global(.table-wrap:focus-visible),
  .post-body :global(.math-block:focus-visible) {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  .post-body :global(pre code) {
    padding: 0;
    color: var(--mono-tone-2);
    background: none;
    border: none;
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

  /* Math (KaTeX, for posts with math: true) */
  .post-body :global(.math-block) {
    margin: 1.8em 0;
    padding: 0.4em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .post-body :global(.katex) {
    font-size: 1.08em;
    color: var(--text-primary);
  }

  .post-body :global(.katex-display) {
    margin: 0;
  }

  /* Pull quote */
  .post-body :global(blockquote) {
    margin: 2em 0;
    padding: 0.2em 0 0.2em 1.3em;
    border-left: 2px solid var(--acc);
    font-family: var(--font-display);
    font-size: 1.3em;
    font-weight: 300;
    line-height: 1.5;
    color: var(--text-primary);
  }

  .post-body :global(blockquote p:last-child) {
    margin-bottom: 0;
  }

  /* Callouts: > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION] */
  .post-body :global(blockquote.callout) {
    --callout: var(--acc);
    padding: 14px 18px 14px 18px;
    border-left: 2px solid var(--callout);
    border-radius: 0 10px 10px 0;
    background: color-mix(in srgb, var(--callout) 7%, transparent);
    font-family: var(--font-family-primary);
    font-size: 0.94em;
    font-weight: 400;
    line-height: 1.65;
    color: color-mix(in srgb, var(--text-primary) 80%, var(--text-secondary));
  }

  .post-body :global(blockquote.callout-tip) {
    --callout: var(--acc-2);
  }

  .post-body :global(blockquote.callout-important) {
    --callout: #a78bfa;
  }

  .post-body :global(blockquote.callout-warning) {
    --callout: var(--accent-warning);
  }

  .post-body :global(blockquote.callout-caution) {
    --callout: #f87171;
  }

  /* Light theme: deeper hues keep the small callout titles above 4.5:1. */
  :global([data-light='true']) .post-body :global(blockquote.callout-important) {
    --callout: #6d4fc2;
  }

  :global([data-light='true']) .post-body :global(blockquote.callout-caution) {
    --callout: #b42318;
  }

  .post-body :global(.callout-title) {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--callout);
    margin-bottom: 6px;
  }

  /* Section break ornament */
  .post-body :global(hr) {
    border: none;
    margin: 2.6em 0;
    text-align: center;
    color: var(--text-muted);
  }

  .post-body :global(hr)::after {
    content: '· · ·';
    letter-spacing: 0.8em;
    font-size: 15px;
  }

  /* Tables (wrapped for horizontal scroll) */
  .post-body :global(.table-wrap) {
    margin: 1.8em 0;
    overflow-x: auto;
    border: 1px solid var(--line-2);
    border-radius: 10px;
  }

  .post-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 14.5px;
    line-height: 1.5;
  }

  .post-body :global(th) {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-align: left;
    color: var(--text-muted);
    padding: 11px 14px;
    background: var(--surface-glass);
    border-bottom: 1px solid var(--line-2);
  }

  .post-body :global(th[align='right']) {
    text-align: right;
  }

  .post-body :global(th[align='center']) {
    text-align: center;
  }

  .post-body :global(td) {
    padding: 10px 14px;
    border-bottom: 1px solid var(--line-3);
    vertical-align: top;
  }

  .post-body :global(tr:last-child td) {
    border-bottom: none;
  }

  /* Images & figures */
  .post-body :global(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 1.8em auto;
    border-radius: 10px;
    border: 1px solid var(--line-3);
  }

  .post-body :global(figure) {
    margin: 2em 0;
  }

  .post-body :global(figure img) {
    margin: 0 auto;
  }

  .post-body :global(figcaption) {
    margin-top: 0.8em;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }

  /* Footer */
  .post-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 3.2em;
  }

  .end-mark {
    width: 9px;
    height: 9px;
    background: var(--acc);
    box-shadow: 0 0 12px color-mix(in srgb, var(--acc) 70%, transparent);
    transform: rotate(45deg);
  }

  .post-actions {
    display: flex;
    gap: 20px;
  }

  .action-link {
    text-decoration: none;
    background: none;
    border: none;
    padding: 0.4em 0;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    color: var(--nav-idle);
    cursor: pointer;
    transition: color 0.25s ease;
  }

  .action-link:hover {
    color: var(--acc);
  }

  .post-pager {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 2.4em;
  }

  .pager-link {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: none;
    border: 1px solid var(--line-2);
    border-radius: 12px;
    padding: 18px 20px;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.25s ease, background-color 0.25s ease, transform 0.25s ease;
  }

  .pager-next {
    grid-column: 2;
    text-align: right;
    align-items: flex-end;
  }

  .pager-link:hover {
    border-color: color-mix(in srgb, var(--acc) 50%, transparent);
    background: var(--card-hover-bg);
    transform: translateY(-2px);
  }

  .pager-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--nav-idle);
  }

  .pager-title {
    font-family: var(--font-display);
    font-size: 18px;
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
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton-line {
      animation: none;
    }

    .read-progress {
      transition: none;
    }
  }

  @media (max-width: 960px) {
    .read-progress {
      left: 0;
      top: var(--topbar-h, 0px);
    }
  }

  @media (max-width: 900px) {
    .post-body {
      font-size: 16.5px;
    }
  }

  @media (max-width: 560px) {
    .post-pager {
      grid-template-columns: 1fr;
    }

    .pager-next {
      grid-column: auto;
      grid-row: 1;
    }
  }
</style>
