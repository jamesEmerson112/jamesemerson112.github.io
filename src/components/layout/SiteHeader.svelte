<script>
  import { createEventDispatcher } from 'svelte';
  import { NAV_ITEMS } from '../../utils/routing.js';

  export let activeSection = 'home';
  export let compact = false;
  export let blendMode = 'difference';
  export let isMobile = false;
  export let mobileHidden = false;
  const dispatch = createEventDispatcher();

  const pages = NAV_ITEMS;

  $: selectedSection = activeSection || 'home';
  $: hideIdentity = compact;
  $: hideDescription = isMobile || compact || selectedSection === 'metrics' || selectedSection === 'projects';
  $: effectiveBlendMode = compact ? 'normal' : blendMode;

  function handlePageChange(pageId) {
    dispatch('navigate', pageId);
  }
</script>

<header
  class="siteHeader"
  class:is-compact={compact}
  class:is-mobile={isMobile}
  class:is-mobile-hidden={isMobile && mobileHidden}
  aria-hidden={isMobile && mobileHidden ? 'true' : 'false'}
  style={`mix-blend-mode: ${effectiveBlendMode};`}
  data-name="SiteHeader"
>
  <div
    class="siteHeader_identity"
    class:is-hidden={hideIdentity}
    aria-hidden={hideIdentity ? 'true' : 'false'}
    data-name="SiteHeaderIdentity"
  >
    <div class="siteHeader_title" data-name="SiteHeaderTitle">
      <div data-name="SiteHeaderDiv1">James</div>
      <div data-name="SiteHeaderDiv2">Emerson</div>
      <div data-name="SiteHeaderDiv3">Vo</div>
    </div>

    <div
      class="siteHeader_description"
      class:is-hidden={hideDescription}
      aria-hidden={hideDescription ? 'true' : 'false'}
      data-name="SiteHeaderDescription"
    >
      <p data-name="SiteHeaderDescriptionLineOne">I like to study both brains and neural networks.</p>
      <p data-name="SiteHeaderDescriptionLineTwo">'Cure' neural networks == cure brains</p>
    </div>
  </div>

  <nav class="siteHeader_nav" data-name="SiteHeaderNav">
    <ol class:is-compact-list={compact} data-name="SiteHeaderNavList">
      {#each pages as page}
        <li class:is-selected={selectedSection === page.id} data-name="SiteHeaderLi4">
          <button
            on:click={() => handlePageChange(page.id)}
            class="nav-button"
            type="button"
            data-name={`nav-${page.id}`}
          >
            <span class="_dot" data-name="SiteHeaderSpan6">●</span>
            <span class="_text" data-name="SiteHeaderSpan7">{page.label}</span>
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
    --site-header-rail-width: clamp(11rem, 18vw, 15rem);
    --site-header-anchor-left: calc(var(--pad) * 2);
    --site-header-anchor-top: calc(var(--pad) * 2);
    left: var(--site-header-anchor-left);
    top: var(--site-header-anchor-top);
    width: min(var(--site-header-rail-width), calc(100vw - (var(--pad) * 4)));
    color: var(--chrome-fg);
    transition: opacity 0.22s ease, transform 0.22s ease;
  }

  .siteHeader.is-mobile-hidden {
    opacity: 0;
    transform: translateX(-14px);
    pointer-events: none;
  }

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
    font-size: clamp(0.72rem, 0.88vw, 0.88rem);
    line-height: 1.55;
    opacity: 0.8;
    width: 100%;
    max-width: 100%;
    overflow-wrap: anywhere;
    text-wrap: pretty;
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
    transition: opacity 0.4s cubic-bezier(0.1, 0.4, 0.2, 1), letter-spacing 0.25s ease;
  }

  .nav-button ._text::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -4px;
    width: 100%;
    height: 1px;
    background: var(--text-primary);
    transform-origin: left center;
    transform: scaleX(0);
    opacity: 0.7;
    transition: transform 0.28s ease, opacity 0.28s ease;
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
    letter-spacing: 0.02em;
  }

  .is-selected ._text::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .nav-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  @media (max-width: 900px) {
    .siteHeader {
      width: auto;
      left: calc(var(--pad) * 0.85);
      top: calc(var(--pad) * 0.8);
    }

    .siteHeader_title {
      font-size: 16px;
      line-height: 1.02;
    }

    .siteHeader_nav {
      margin-top: 12px;
    }

    .siteHeader_nav ol {
      row-gap: 8px;
    }

    .nav-button {
      padding: 0.08rem 0;
    }

    .nav-button ._text {
      font-size: 14px;
      letter-spacing: 0.01em;
    }

    .nav-button ._dot {
      top: 1px;
      font-size: 8px;
    }
  }
</style>
