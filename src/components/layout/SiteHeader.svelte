<script>
  export let currentPage = 'home';

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

<header class="siteHeader">
  <div class="siteHeader_title">
    <div>James</div>
    <div>Emerson</div>
    <div>Vo</div>
  </div>

  <div class="siteHeader_description">
    <p>I like to study both brains and neural networks.</p>
    <p>'Cure' neural networks == cure brains</p>
  </div>

  <nav class="siteHeader_nav">
    <ol>
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
    color: #fff;
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

  .siteHeader_nav ol {
    display: flex;
    flex-direction: column;
    row-gap: 15px;
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

  .nav-button ._dot {
    position: absolute;
    left: 0;
    top: 2px;
    font-size: 10px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s cubic-bezier(0.1, 0.4, 0.2, 1);
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
    opacity: 1;
  }

  .is-selected ._text {
    opacity: 0;
  }
</style>
