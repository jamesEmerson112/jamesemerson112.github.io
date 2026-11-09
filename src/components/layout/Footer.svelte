<script lang="ts">
  function backToTop(event: MouseEvent) {
    const scroller = (event.currentTarget as HTMLElement).closest('.single-page-scroll');
    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
</script>

<footer class="site-footer" data-name="Footer">
  <div class="hairline" data-name="FooterHairline"></div>
  <div class="row" data-name="FooterRow">
    <span data-name="FooterCopyright">© 2026 JAMES EMERSON VO</span>
    <button class="to-top" type="button" on:click={backToTop} data-name="FooterBackToTop">
      BACK TO TOP <span class="to-top-arrow" aria-hidden="true" data-name="FooterBackToTopArrow">↑</span>
    </button>
    <span data-name="FooterCredit">INSPIRED BY KEITA YAMADA</span>
  </div>
</footer>

<style>
  .hairline {
    height: 1px;
    background: var(--line-3);
    margin: 0 var(--sec-pad-x);
  }

  .row {
    padding: 26px var(--sec-pad-x);
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.12em;
    color: var(--footer-ink);
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .to-top {
    font: inherit;
    letter-spacing: inherit;
    color: var(--nav-idle);
    background: none;
    border: none;
    padding: 4px 0;
    cursor: pointer;
    transition: color 0.25s ease;
  }

  .to-top-arrow {
    display: inline-block;
    margin-left: 4px;
    transition: transform 0.35s var(--ease-out-expo, ease);
  }

  .to-top:hover {
    color: var(--acc);
  }

  .to-top:hover .to-top-arrow {
    transform: translateY(-3px);
  }

  .to-top:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
</style>
