<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchBlogIndex, formatDate } from '../../utils/blogLoader.ts';
  import { navigateToPost, navigateToBlogList } from '../../utils/routing.ts';

  const MAX_POSTS = 3;

  let posts = [];
  let visible = false;

  onMount(async () => {
    try {
      const all = await fetchBlogIndex();
      posts = all.slice(0, MAX_POSTS);
      visible = posts.length > 0;
    } catch {
      visible = false;
    }
  });

  const viewAll = navigateToBlogList;
</script>

{#if visible}
  <div class="recent-posts" data-name="RecentPosts">
    <div class="eyebrow" data-name="RecentPostsLabel">// RECENT POSTS</div>
    <h2 class="writing-title" data-name="RecentPostsTitle">Writing</h2>
    <div class="recent-items" data-name="RecentPostsItems">
      {#each posts as post}
        <button
          class="blogrow"
          type="button"
          on:click={() => navigateToPost(post.slug)}
          data-name={`recent-post-${post.slug}`}
        >
          <time class="recent-date" datetime={post.date}>{formatDate(post.date)}</time>
          <span class="row-main">
            <span class="recent-title">{post.title}</span>
            {#if post.excerpt}
              <span class="recent-excerpt">{post.excerpt}</span>
            {/if}
          </span>
          <span class="barrow" aria-hidden="true">→</span>
        </button>
      {/each}
    </div>
    <button class="recent-view-all" type="button" on:click={viewAll} data-name="RecentPostsViewAll">
      VIEW ALL POSTS →
    </button>
  </div>
{/if}

<style>
  .recent-posts {
    width: 100%;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    color: var(--acc);
    margin-bottom: 12px;
  }

  .writing-title {
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(30px, 3.6vw, 46px);
    letter-spacing: -0.01em;
    color: var(--scene-text);
    margin: 0 0 34px;
  }

  .recent-items {
    display: flex;
    flex-direction: column;
    text-align: left;
    max-width: 520px;
    margin: 0 auto;
  }

  .blogrow {
    display: flex;
    align-items: baseline;
    gap: 18px;
    padding: 20px 4px;
    border: none;
    border-top: 1px solid var(--line-2);
    background: none;
    cursor: pointer;
    color: inherit;
    font-family: inherit;
    text-align: left;
    width: 100%;
  }

  .blogrow:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  .recent-date {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent-info);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .row-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .recent-title {
    font-family: var(--font-display);
    font-size: 21px;
    color: var(--text-secondary);
    transition: color 0.2s;
    display: block;
    line-height: 1.3;
  }

  .blogrow:hover .recent-title {
    color: var(--text-primary);
  }

  .recent-excerpt {
    font-size: 12.5px;
    color: var(--text-muted);
    display: block;
    margin-top: 5px;
    line-height: 1.5;
  }

  .barrow {
    color: var(--acc);
    opacity: 0.5;
    transition: opacity 0.2s, transform 0.2s;
    font-family: var(--font-mono);
    font-size: 13px;
  }

  .blogrow:hover .barrow {
    opacity: 1;
    transform: translateX(3px);
  }

  .recent-view-all {
    display: inline-block;
    margin-top: 26px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    color: var(--nav-idle);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: color 0.25s ease;
  }

  @media (hover: hover) {
    .recent-view-all:hover {
      color: var(--nav-hover);
    }
  }

  .recent-view-all:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .recent-title {
      font-size: 18px;
    }
  }
</style>
