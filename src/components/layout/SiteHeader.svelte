<script>
  export let currentPage = 'home';
  export let compact = false;

  const pages = [
    { id: 'home', label: 'Home' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' },
    { id: 'privacy', label: 'Privacy' }
  ];

  function handlePageChange(pageId) {
    currentPage = pageId;
    // Dispatch event for parent to handle
    window.dispatchEvent(new CustomEvent('pageChange', { detail: pageId }));
  }
</script>

<header class="siteHeader" class:is-compact={compact}>
  {#if !compact}
    <div class="siteHeader_title">
      <div>James</div>
      <div>Emerson</div>
      <div>Vo</div>
    </div>

    <div class="siteHeader_description">
      <p>I like to study both brains and neural networks.</p>
      <p>'Cure' neural networks == cure brains</p>
    </div>
  {/if}

  <nav class="siteHeader_nav">
    <ol class:is-compact-list={compact}>
      {#each pages as page}
        <li class:is-selected={currentPage === page.id}>
          <button
            on:click={() => handlePageChange(page.id)}
            class="nav-button"
          >
            <span class="_dot">●</span>
            <span class="_text">{page.label}</span>
          </button>
        </li>
      {/each}
    </ol>
  </nav>
</header>

<style>
  .siteHeader {
    position: fixed;
    z-index: 10;
    left: calc(var(--pad) * 2);
    top: calc(var(--pad) * 2);
    mix-blend-mode: difference;
    color: var(--chrome-fg);
  }

  .siteHeader.is-compact {
    left: calc(var(--pad) * 2);
    right: auto;
    top: calc(var(--pad) * 1.7);
    mix-blend-mode: normal;
  }

  .siteHeader_title {
    margin: -0.1em 0 0 -0.04em;
    font-weight: 200;
    font-size: 30px;
    line-height: 1.1;
  }

  @media (min-width: 1280px) {
    .siteHeader_title {
      font-size: 60px;
    }
  }

  .siteHeader_description {
    margin-top: 1.5em;
    font-size: 12px;
    line-height: 1.6;
    opacity: 0.8;
    max-width: 300px;
  }

  .siteHeader_description p {
    margin: 0.5em 0;
  }

  @media (min-width: 1280px) {
    .siteHeader_description {
      font-size: 14px;
      max-width: 400px;
    }
  }

  .siteHeader_nav {
    margin-top: 50px;
  }

  .siteHeader.is-compact .siteHeader_nav {
    margin-top: 0;
  }

  .siteHeader_nav ol {
    display: flex;
    flex-direction: column;
    row-gap: 15px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .siteHeader_nav ol.is-compact-list {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 0.45rem;
    row-gap: 0.45rem;
  }

  .siteHeader_nav ol li {
    position: relative;
  }

  .nav-button {
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    cursor: pointer;
    position: relative;
    display: block;
  }

  .is-compact .nav-button {
    display: inline-flex;
    align-items: center;
    gap: 0.33rem;
    border: 1px solid var(--surface-border-strong);
    border-radius: 999px;
    padding: 0.3rem 0.66rem;
    color: var(--text-secondary);
    background: var(--surface-glass);
  }

  .nav-button ._dot {
    position: absolute;
    left: 0;
    top: 2px;
    font-size: 10px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s cubic-bezier(0.1, 0.4, 0.2, 1);
  }

  .is-compact .nav-button ._dot {
    display: none;
    position: static;
    font-size: 8px;
  }

  .nav-button ._text {
    position: relative;
    transition: opacity 0.4s cubic-bezier(0.1, 0.4, 0.2, 1);
  }

  .nav-button ._text::before {
    content: "";
    display: block;
    position: absolute;
    left: -5px;
    top: -5px;
    width: calc(100% + 10px);
    height: calc(100% + 10px);
  }

  @media (hover: hover) {
    .nav-button:hover ._text {
      opacity: 0.25;
    }
  }

  .is-selected .nav-button {
    pointer-events: none;
  }

  .is-selected ._dot {
    opacity: 0;
  }

  .is-selected ._text {
    opacity: 1;
    color: var(--text-primary);
  }

  .is-compact .is-selected .nav-button {
    border-color: var(--chip-active-border);
    background: var(--chip-active-bg);
  }

  .nav-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
