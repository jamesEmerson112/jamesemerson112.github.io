<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchBlogIndex, formatDate, formatReadingTime, onBlogChange } from '../../utils/blogLoader.ts';
  import { navigateToPost } from '../../utils/routing.ts';
  import { reveal } from '../../utils/reveal.ts';
  import type { BlogPostMeta } from '../../types.js';

  let posts: BlogPostMeta[] = [];
  let loading = true;
  let error: string | null = null;

  async function load() {
    try {
      posts = await fetchBlogIndex();
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    load();
    // Dev live preview: new/renamed/edited posts show up without a reload.
    return onBlogChange(() => load());
  });

  $: publishedCount = posts.filter((post) => !post.draft).length;
  $: draftCount = posts.length - publishedCount;
</script>

<div class="blog-list" data-name="BlogList">
  <header class="blog-header enter" data-name="BlogListHeader">
    <div class="eyebrow" data-name="BlogListEyebrow">// WRITING</div>
    <h1 data-name="BlogListTitle">Blog</h1>
    <p class="blog-dek" data-name="BlogListDek">
      Notes at the intersection of neuroscience, machine learning, and the things I build.
    </p>
    <div class="blog-subline" data-name="BlogListSubline">
      {#if !loading && !error && posts.length > 0}
        <span class="blog-count" data-name="BlogListCount">
          {publishedCount} {publishedCount === 1 ? 'post' : 'posts'}{#if draftCount > 0}{` · ${draftCount} ${draftCount === 1 ? 'draft' : 'drafts'} (dev only)`}{/if}
        </span>
      {/if}
      <a class="rss-link" href="/blog/feed.xml" target="_blank" rel="noopener noreferrer" data-name="BlogListRss">
        RSS ↗
      </a>
    </div>
  </header>

  {#if loading}
    <p class="blog-status" data-name="BlogListLoading">Loading...</p>
  {:else if error}
    <p class="blog-status blog-error" data-name="BlogListError">{error}</p>
  {:else if posts.length === 0}
    <p class="blog-status" data-name="BlogListEmpty">No posts yet.</p>
  {:else}
    <ul class="post-list" data-name="BlogPostList">
      {#each posts as post, index (post.slug)}
        <li class="post-item" use:reveal={{ delay: Math.min(index, 4) * 70 }} data-name="BlogPostItem">
          <button
            class="post-link"
            type="button"
            on:click={() => navigateToPost(post.slug)}
            data-name={`blog-post-${post.slug}`}
          >
            <span class="post-meta" data-name="BlogListMeta">
              <time class="post-date" datetime={post.date} data-name="BlogListDate">{formatDate(post.date)}</time>
              {#if post.readingTime}
                <span class="meta-sep" aria-hidden="true" data-name="BlogListMetaSep">·</span>
                <span data-name="BlogListReadingTime">{formatReadingTime(post.readingTime)}</span>
              {/if}
              {#if post.draft}
                <span class="draft-badge" data-name="BlogListDraftBadge">Draft</span>
              {/if}
            </span>
            <span class="post-heading" data-name="BlogListHeading">
              <h2 class="post-title" data-name="BlogListPostTitle">{post.title}</h2>
              <span class="post-arrow" aria-hidden="true" data-name="BlogListArrow">→</span>
            </span>
            {#if post.excerpt}
              <p class="post-excerpt" data-name="BlogListExcerpt">{post.excerpt}</p>
            {/if}
            {#if post.tags && post.tags.length > 0}
              <span class="post-tags" data-name="BlogListTags">
                {#each post.tags as tag}
                  <span class="post-tag" data-name="BlogListTag">{tag}</span>
                {/each}
              </span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .blog-list {
    max-width: 720px;
    margin: 0 auto;
    padding: clamp(3rem, 8vw, 6rem) clamp(1.25rem, 4vw, 2rem) clamp(4rem, 10vw, 7rem);
  }

  .blog-header {
    margin-bottom: 3rem;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    color: var(--acc);
    margin-bottom: 14px;
  }

  .blog-header h1 {
    font-family: var(--font-display);
    font-size: clamp(44px, 7vw, 68px);
    font-weight: 200;
    line-height: 1;
    margin: 0;
    color: var(--scene-text);
    letter-spacing: -0.025em;
  }

  .blog-dek {
    margin: 0.9em 0 0;
    max-width: 34em;
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(18px, 2.2vw, 21px);
    line-height: 1.45;
    color: var(--text-secondary);
  }

  .blog-subline {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 1.6em;
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .rss-link {
    color: var(--nav-idle);
    text-decoration: none;
    padding: 3px 10px;
    border: 1px solid var(--line-1);
    border-radius: 999px;
    transition: color 0.25s ease, border-color 0.25s ease;
  }

  .rss-link:hover {
    color: var(--acc);
    border-color: color-mix(in srgb, var(--acc) 55%, transparent);
  }

  .rss-link:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  .blog-status {
    font-size: 16px;
    color: var(--text-secondary);
    opacity: 0.6;
  }

  .blog-error {
    color: #e55;
  }

  .post-list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--line-2);
  }

  .post-item {
    border-bottom: 1px solid var(--line-2);
  }

  .post-link {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.7em;
    background: none;
    border: none;
    padding: 2em 1.4em;
    margin: 0 -1.4em;
    width: calc(100% + 2.8em);
    text-align: left;
    cursor: pointer;
    color: inherit;
    font-family: inherit;
    border-radius: 12px;
    transition: background-color 0.3s ease;
  }

  /* Accent rule that grows in on hover */
  .post-link::before {
    content: '';
    position: absolute;
    left: 0;
    top: 1.9em;
    bottom: 1.9em;
    width: 2px;
    border-radius: 2px;
    background: var(--acc);
    transform: scaleY(0);
    transform-origin: 50% 0;
    transition: transform 0.4s var(--ease-out-expo, ease);
  }

  @media (hover: hover) {
    .post-link:hover {
      background: var(--card-hover-bg);
    }

    .post-link:hover::before {
      transform: scaleY(1);
    }

    .post-link:hover .post-title {
      color: var(--scene-text);
    }

    .post-link:hover .post-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .post-link:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .post-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }

  .post-date {
    color: var(--accent-info);
  }

  .draft-badge {
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent-warning) 60%, transparent);
    color: var(--accent-warning);
    font-size: 9px;
    letter-spacing: 0.14em;
  }

  .post-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
  }

  .post-title {
    font-family: var(--font-display);
    font-size: clamp(23px, 3vw, 30px);
    font-weight: 300;
    margin: 0;
    color: var(--text-primary);
    line-height: 1.2;
    letter-spacing: -0.01em;
    transition: color 0.25s ease;
  }

  .post-arrow {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 15px;
    color: var(--acc);
    opacity: 0;
    transform: translateX(-8px);
    transition: opacity 0.3s ease, transform 0.4s var(--ease-out-expo, ease);
  }

  .post-excerpt {
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0;
    max-width: 36em;
  }

  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 0.2em;
  }

  .post-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    color: var(--mono-tone-3);
  }

  .post-tag::before {
    content: '#';
    color: var(--acc);
    margin-right: 1px;
  }

  @media (max-width: 560px) {
    .post-link {
      padding: 1.6em 1em;
      margin: 0 -1em;
      width: calc(100% + 2em);
    }

    .post-arrow {
      display: none;
    }
  }
</style>
