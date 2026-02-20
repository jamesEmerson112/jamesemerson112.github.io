<script>
  export let currentPage = 'home';
  export let compact = false;
  export let blendMode = 'difference';

  const pages = [
    { id: 'home', label: 'Home' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' },
    { id: 'privacy', label: 'Privacy' }
  ];

  $: hideIdentity = compact;
  $: hideDescription = compact || currentPage === 'metrics' || currentPage === 'projects';
  $: effectiveBlendMode = compact ? 'normal' : blendMode;

  function handlePageChange(pageId) {
    currentPage = pageId;
    // Dispatch event for parent to handle
    window.dispatchEvent(new CustomEvent('pageChange', { detail: pageId }));
  }
</script>

<header
  class="siteHeader"
  class:is-compact={compact}
  style={`mix-blend-mode: ${effectiveBlendMode};`}
  name="SiteHeader"
>
  <div
    class="siteHeader_identity"
    class:is-hidden={hideIdentity}
    aria-hidden={hideIdentity ? 'true' : 'false'}
    name="SiteHeaderIdentity"
  >
    <div class="siteHeader_title" name="SiteHeaderTitle">
      <div name="SiteHeaderDiv1">James</div>
      <div name="SiteHeaderDiv2">Emerson</div>
      <div name="SiteHeaderDiv3">Vo</div>
    </div>

    <div
      class="siteHeader_description"
      class:is-hidden={hideDescription}
      aria-hidden={hideDescription ? 'true' : 'false'}
      name="SiteHeaderDescription"
    >
      <p name="SiteHeaderDescriptionLineOne">I like to study both brains and neural networks.</p>
      <p name="SiteHeaderDescriptionLineTwo">'Cure' neural networks == cure brains</p>
    </div>
  </div>

  <nav class="siteHeader_nav" name="SiteHeaderNav">
    <ol class:is-compact-list={compact} name="SiteHeaderNavList">
      {#each pages as page}
        <li class:is-selected={currentPage === page.id} name="SiteHeaderLi4">
          <button
            on:click={() => handlePageChange(page.id)}
            class="nav-button"
            type="button"
            name={`nav-${page.id}`}
          >
            <span class="_dot" name="SiteHeaderSpan6">●</span>
            <span class="_text" name="SiteHeaderSpan7">{page.label}</span>
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
    --site-header-anchor-left: calc(var(--pad) * 2);
    --site-header-anchor-top: calc(var(--pad) * 2);
    left: var(--site-header-anchor-left);
    top: var(--site-header-anchor-top);
    color: var(--chrome-fg);
  }

  /* Keep identity footprint so nav anchor does not jump between pages. */
  .siteHeader_identity {
    opacity: 1;
    visibility: visible;
    transition:
      opacity 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
      visibility 0s linear 0s;
  }

  .siteHeader_identity.is-hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    user-select: none;
    transition:
      opacity 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
      visibility 0s linear 0.28s;
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
    visibility: visible;
    transition:
      opacity 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
      visibility 0s linear 0s;
  }

  .siteHeader_description.is-hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    user-select: none;
    transition:
      opacity 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
      visibility 0s linear 0.24s;
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
    display: block;
    border: none;
    border-radius: 0;
    padding: 0;
    color: var(--text-secondary);
    background: transparent;
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

  .nav-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
