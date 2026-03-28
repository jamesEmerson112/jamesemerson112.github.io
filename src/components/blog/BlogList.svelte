<script>
  import { onMount } from 'svelte';
  import { fetchBlogIndex, formatDate } from '../../utils/blogLoader.js';

  let posts = [];
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      posts = await fetchBlogIndex();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  function navigateToPost(slug) {
    window.location.hash = `posts/${slug}`;
  }
</script>

<div class="blog-list" data-name="BlogList">
  <header class="blog-header" data-name="BlogListHeader">
    <h1>Blog</h1>
  </header>

  {#if loading}
    <p class="blog-status">Loading...</p>
  {:else if error}
    <p class="blog-status blog-error">{error}</p>
  {:else if posts.length === 0}
    <p class="blog-status">No posts yet.</p>
  {:else}
    <ul class="post-list" data-name="BlogPostList">
      {#each posts as post}
        <li class="post-item" data-name="BlogPostItem">
          <button
            class="post-link"
            type="button"
            on:click={() => navigateToPost(post.slug)}
            data-name={`blog-post-${post.slug}`}
          >
            <time class="post-date" datetime={post.date}>{formatDate(post.date)}</time>
            <h2 class="post-title">{post.title}</h2>
            {#if post.excerpt}
              <p class="post-excerpt">{post.excerpt}</p>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .blog-list {
    max-width: 680px;
    margin: 0 auto;
    padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 4vw, 2rem);
  }

  .blog-header h1 {
    font-size: clamp(36px, 7vw, 56px);
    font-weight: 200;
    margin: 0 0 2em 0;
    color: var(--text-primary);
    letter-spacing: -0.02em;
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
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .post-item {
    border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  }

  .post-item:last-child {
    border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  }

  .post-link {
    display: block;
    width: 100%;
    background: none;
    border: none;
    padding: 2em 0;
    text-align: left;
    cursor: pointer;
    color: inherit;
    font-family: inherit;
    transition: opacity 0.25s ease;
  }

  @media (hover: hover) {
    .post-link:hover {
      opacity: 0.6;
    }
  }

  .post-link:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 4px;
  }

  .post-date {
    display: block;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    opacity: 0.5;
    margin-bottom: 0.6em;
  }

  .post-title {
    font-size: clamp(20px, 3vw, 26px);
    font-weight: 400;
    margin: 0;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .post-excerpt {
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-secondary);
    opacity: 0.7;
    margin: 0.6em 0 0 0;
  }
</style>
