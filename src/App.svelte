<script>
  import { onMount } from 'svelte';
  import { darkMode } from './stores/theme.js';
  import { portfolio } from './stores/portfolioStore.js';
  import PageContainer from './components/layout/PageContainer.svelte';
  import Frame from './components/layout/Frame.svelte';
  import Masks from './components/layout/Masks.svelte';
  import SiteHeader from './components/layout/SiteHeader.svelte';
  import ContentLayer from './components/layout/ContentLayer.svelte';
  import ThemeSwitcher from './components/ThemeSwitcher.svelte';
  import Copyright from './components/layout/Copyright.svelte';
  import PortfolioOverview from './components/portfolio/PortfolioOverview.svelte';
  import OverallCharacterDashboard from './components/portfolio/OverallCharacterDashboard.svelte';
  import Timeline from './components/Timeline.svelte';
  import './styles/themes.css';

  const PAGE_ORDER = ['home', 'metrics', 'projects', 'contact', 'privacy'];
  const SCROLL_SWITCH_THRESHOLD = 30;
  const SCROLL_SWITCH_COOLDOWN_MS = 650;

  let currentPage = 'home';
  let lastWheelSwitchAt = 0;
  $: isDataPage = currentPage === 'projects' || currentPage === 'metrics';
  $: chromeBlendMode = isDataPage || !$darkMode ? 'normal' : 'difference';

  function getScrollableAncestor(target) {
    let node = target instanceof HTMLElement ? target : null;

    while (node) {
      const { overflowY } = getComputedStyle(node);
      const isScrollable = /(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight + 1;
      if (isScrollable) {
        return node;
      }

      node = node.parentElement;
    }

    return null;
  }

  function canConsumeWheelDelta(scrollNode, deltaY) {
    if (!scrollNode || !Number.isFinite(deltaY) || deltaY === 0) {
      return false;
    }

    const top = scrollNode.scrollTop;
    const max = scrollNode.scrollHeight - scrollNode.clientHeight;

    if (deltaY > 0) {
      return top < max - 1;
    }

    return top > 1;
  }

  function switchPageByWheelDelta(deltaY) {
    if (!Number.isFinite(deltaY) || Math.abs(deltaY) < SCROLL_SWITCH_THRESHOLD) {
      return false;
    }

    const now = Date.now();
    if (now - lastWheelSwitchAt < SCROLL_SWITCH_COOLDOWN_MS) {
      return false;
    }

    const currentIndex = PAGE_ORDER.indexOf(currentPage);
    if (currentIndex === -1) {
      return false;
    }

    const direction = deltaY > 0 ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(PAGE_ORDER.length - 1, currentIndex + direction));

    if (nextIndex === currentIndex) {
      return false;
    }

    currentPage = PAGE_ORDER[nextIndex];
    lastWheelSwitchAt = now;
    return true;
  }

  onMount(() => {
    // Load portfolio data
    portfolio.load();

    // Listen for page change events from SiteHeader
    const handlePageChange = (e) => {
      currentPage = e.detail;
    };

    const handleWheel = (event) => {
      const scrollableAncestor = getScrollableAncestor(event.target);
      if (canConsumeWheelDelta(scrollableAncestor, event.deltaY)) {
        return;
      }

      const switched = switchPageByWheelDelta(event.deltaY);
      if (switched) {
        event.preventDefault();
      }
    };

    window.addEventListener('pageChange', handlePageChange);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('pageChange', handlePageChange);
      window.removeEventListener('wheel', handleWheel);
    };
  });
</script>

<PageContainer>
  <!-- Layer 10: UI Chrome -->
  <Frame blendMode={chromeBlendMode} />
  <SiteHeader {currentPage} compact={false} blendMode={chromeBlendMode} />
  <ThemeSwitcher blendMode={chromeBlendMode} />
  <Copyright blendMode={chromeBlendMode} />

  <!-- Layer 3: Masks -->
  <Masks />

  <!-- Layer 2: Content -->
  <ContentLayer blendMode={chromeBlendMode}>
    {#if isDataPage}
      <div class="data-page-aura" aria-hidden="true" name="AppDiv1"></div>
    {/if}

    {#if currentPage === 'home'}
      <div class="page home" name="AppHomePage">
        <div class="home_content" name="AppDiv2">
          <Timeline />
        </div>
      </div>
    {:else if currentPage === 'projects'}
      <div class="page projects data-page" name="AppProjectsPage">
        <div class="projects_content data_content" name="AppDiv3">
          <PortfolioOverview />
        </div>
      </div>
    {:else if currentPage === 'metrics'}
      <div class="page metrics data-page" name="AppMetricsPage">
        <div class="metrics_content data_content" name="AppDiv4">
          <OverallCharacterDashboard />
        </div>
      </div>
    {:else if currentPage === 'contact'}
      <div class="page contact" name="AppContactPage">
        <div class="contact_content" name="AppDiv5">
          <h2 name="AppH26">Get in Touch</h2>
          <div class="contact_links" name="AppDiv7">
            <a href="https://x.com/V_like_flan"
               target="_blank"
               rel="noopener noreferrer"
               class="contact_link" name="AppA8">
              <span class="link_label" name="AppSpan9">Twitter</span>
              <span class="link_handle" name="AppSpan10">@V_like_flan</span>
            </a>

            <a href="https://www.linkedin.com/in/james-vo/"
               target="_blank"
               rel="noopener noreferrer"
               class="contact_link" name="AppA11">
              <span class="link_label" name="AppSpan12">LinkedIn</span>
              <span class="link_handle" name="AppSpan13">james-vo</span>
            </a>
          </div>
        </div>
      </div>
    {:else if currentPage === 'privacy'}
      <div class="page privacy" name="AppPrivacyPage">
        <div class="privacy_content" name="AppDiv14">
          <h2 name="AppH215">Privacy</h2>
          <p class="privacy_summary" name="AppP16">
            This site uses Google Analytics<br name="AppBr17" />
            to understand how visitors use the site.
          </p>
          <a href="/privacy.html"
             target="_blank"
             class="privacy_link" name="AppA18">
            Full Privacy Policy →
          </a>
        </div>
      </div>
    {/if}
  </ContentLayer>
</PageContainer>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .page {
    position: absolute;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: calc(var(--pad) * 2);
  }

  .data-page-aura {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(circle at 16% 15%, rgba(255, 255, 255, 0.08) 0%, transparent 55%),
      radial-gradient(circle at 84% 10%, rgba(255, 255, 255, 0.06) 0%, transparent 52%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 48%);
    opacity: var(--data-page-aura-opacity, 0.9);
  }

  /* Home Page */
  .page.home {
    overflow: hidden;
  }

  .home_content {
    text-align: right;
    max-width: 600px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  /* Projects Page */
  .page.projects {
    justify-content: stretch;
    align-items: stretch;
    padding-right: 0;
  }

  .page.metrics {
    justify-content: stretch;
    align-items: stretch;
    padding-right: 0;
  }

  .projects_content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    text-align: left;
    max-width: none;
    padding: calc(var(--pad) * 2);
  }

  /* Metrics Page */
  .metrics_content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    text-align: left;
    max-width: none;
    padding: calc(var(--pad) * 2);
  }

  .page.data-page {
    align-items: flex-start;
    justify-content: stretch;
  }

  .data_content {
    padding-top: clamp(6rem, 11vw, 7.5rem);
    /* Reserve a left rail so fixed site navigation never overlaps data cards. */
    padding-left: calc((var(--pad) * 2) + clamp(8.5rem, 12vw, 11.5rem));
  }

  /* Contact Page */
  .contact_content {
    text-align: right;
    max-width: 600px;
  }

  .contact_content h2 {
    font-size: clamp(32px, 6vw, 60px);
    font-weight: 200;
    margin: 0 0 1em 0;
    color: var(--text-primary);
  }

  .contact_links {
    display: flex;
    flex-direction: column;
    gap: 2em;
    margin-top: 3em;
  }

  .contact_link {
    display: flex;
    flex-direction: column;
    gap: 0.3em;
    text-decoration: none;
    color: var(--text-primary);
    transition: opacity 0.3s ease;
  }

  .contact_link:hover {
    opacity: 0.7;
  }

  .link_label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    opacity: 0.5;
  }

  .link_handle {
    font-size: 16px;
    font-weight: 400;
  }

  /* Privacy Page */
  .privacy_content {
    text-align: right;
    max-width: 600px;
  }

  .privacy_content h2 {
    font-size: clamp(32px, 6vw, 60px);
    font-weight: 200;
    margin: 0 0 1em 0;
    color: var(--text-primary);
  }

  .privacy_summary {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
    opacity: 0.8;
    margin: 2em 0;
  }

  .privacy_link {
    display: inline-block;
    font-size: 12px;
    color: var(--text-primary);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.5em 0;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .privacy_link:hover {
    opacity: 1;
  }

  @media (max-width: 900px) {
    .data_content {
      padding-top: clamp(6.5rem, 18vw, 8.5rem);
      padding-left: calc(var(--pad) * 2);
    }
  }
</style>
