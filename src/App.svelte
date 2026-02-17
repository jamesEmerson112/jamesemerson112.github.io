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
  import PortfolioStats from './components/portfolio/PortfolioStats.svelte';
  import Timeline from './components/Timeline.svelte';
  import './styles/themes.css';

  let currentPage = 'home';

  onMount(() => {
    // Load portfolio data
    portfolio.load();

    // Listen for page change events from SiteHeader
    const handlePageChange = (e) => {
      currentPage = e.detail;
    };

    window.addEventListener('pageChange', handlePageChange);

    return () => {
      window.removeEventListener('pageChange', handlePageChange);
    };
  });
</script>

<PageContainer>
  <!-- Layer 10: UI Chrome -->
  <Frame />
  <SiteHeader {currentPage} />
  <ThemeSwitcher />
  <Copyright />

  <!-- Layer 3: Masks -->
  <Masks />

  <!-- Layer 2: Content -->
  <ContentLayer>
    {#if currentPage === 'home'}
      <div class="page home">
        <div class="home_content">
          <Timeline />
        </div>
      </div>
    {:else if currentPage === 'projects'}
      <div class="page projects">
        <div class="projects_content">
          <PortfolioOverview />
        </div>
      </div>
    {:else if currentPage === 'metrics'}
      <div class="page metrics">
        <div class="metrics_content">
          <PortfolioStats />
          <div class="methodology">
            <div class="method_name">Calculated using COCOMO</div>
            <div class="method_citation">(Boehm, 1981)</div>
          </div>
          <p class="metrics_caveat">
            Traditional and AI-assisted estimates are directional planning metrics, not guarantees.
          </p>
        </div>
      </div>
    {:else if currentPage === 'contact'}
      <div class="page contact">
        <div class="contact_content">
          <h2>Get in Touch</h2>
          <div class="contact_links">
            <a href="https://x.com/V_like_flan"
               target="_blank"
               rel="noopener noreferrer"
               class="contact_link">
              <span class="link_label">Twitter</span>
              <span class="link_handle">@V_like_flan</span>
            </a>

            <a href="https://www.linkedin.com/in/james-vo/"
               target="_blank"
               rel="noopener noreferrer"
               class="contact_link">
              <span class="link_label">LinkedIn</span>
              <span class="link_handle">james-vo</span>
            </a>
          </div>
        </div>
      </div>
    {:else if currentPage === 'privacy'}
      <div class="page privacy">
        <div class="privacy_content">
          <h2>Privacy</h2>
          <p class="privacy_summary">
            This site uses Google Analytics<br />
            to understand how visitors use the site.
          </p>
          <a href="/privacy.html"
             target="_blank"
             class="privacy_link">
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
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: calc(var(--pad) * 2);
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
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .metrics_caveat {
    margin-top: 1rem;
    font-size: 11px;
    color: #fff;
    opacity: 0.65;
    max-width: 520px;
    text-align: center;
    line-height: 1.4;
  }

  .methodology {
    margin-top: 3em;
    text-align: right;
    font-size: 10px;
    color: #fff;
    opacity: 0.5;
    line-height: 1.4;
  }

  .method_name {
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .method_citation {
    font-style: italic;
    margin-top: 0.2em;
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
    color: #fff;
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
    color: #fff;
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
    color: #fff;
  }

  .privacy_summary {
    font-size: 14px;
    line-height: 1.6;
    color: #fff;
    opacity: 0.8;
    margin: 2em 0;
  }

  .privacy_link {
    display: inline-block;
    font-size: 12px;
    color: #fff;
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
</style>
