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
    <div class="recent-label" data-name="RecentPostsLabel">Recent Posts</div>
    <div class="recent-items" data-name="RecentPostsItems">
      {#each posts as post}
        <button
          class="recent-item"
          type="button"
          on:click={() => navigateToPost(post.slug)}
          data-name={`recent-post-${post.slug}`}
        >
          <time class="recent-date" datetime={post.date}>{formatDate(post.date)}</time>
          <span class="recent-title">{post.title}</span>
        </button>
      {/each}
    </div>
    <button class="recent-view-all" type="button" on:click={viewAll} data-name="RecentPostsViewAll">
      View all posts →
    </button>
  </div>
{/if}

<style>
  .recent-posts {
    margin-top: 2.5em;
    padding-top: 1.5em;
    border-top: 1px solid var(--border-secondary);
  }

  .recent-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-secondary);
    opacity: 0.6;
    margin-bottom: 0.8em;
  }

  .recent-items {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  .recent-item {
    display: flex;
    align-items: baseline;
    gap: 0.8em;
    background: none;
    border: none;
    padding: 0.25em 0;
    cursor: pointer;
    color: inherit;
    font-family: inherit;
    text-align: inherit;
    transition: opacity 0.25s ease;
  }

  @media (hover: hover) {
    .recent-item:hover {
      opacity: 0.6;
    }
  }

  .recent-item:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .recent-date {
    font-size: 11px;
    color: var(--text-secondary);
    opacity: 0.5;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .recent-title {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-primary);
    opacity: 0.85;
  }

  .recent-view-all {
    display: inline-block;
    margin-top: 1.2em;
    font-size: 11px;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-primary);
    opacity: 0.5;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: inherit;
    transition: opacity 0.25s ease;
  }

  @media (hover: hover) {
    .recent-view-all:hover {
      opacity: 0.85;
    }
  }

  .recent-view-all:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .recent-title {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .recent-label {
      font-size: 10px;
    }

    .recent-title {
      font-size: 11px;
    }

    .recent-date {
      font-size: 10px;
    }
  }
</style>
