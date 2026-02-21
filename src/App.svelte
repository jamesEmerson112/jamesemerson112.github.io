<script>
  import { onMount, tick } from 'svelte';
  import { darkMode } from './stores/theme.js';
  import { loadPortfolioData } from './stores/portfolioStore.js';
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
  import { resolveMobileHeaderHidden } from './utils/mobileHeaderVisibility.js';
  import './styles/themes.css';

  const SECTION_IDS = ['home', 'metrics', 'projects', 'contact', 'privacy'];
  const DATA_PRELOAD_SECTIONS = new Set(['metrics', 'projects']);
  const MOBILE_BREAKPOINT = 900;
  const REVEAL_TOP_Y = 0;

  let activeSection = 'home';
  let scrollRoot;
  let hasLoadedPortfolioData = false;
  let isMobileViewport = false;
  let mobileHeaderHidden = false;
  const sectionElements = new Map();

  $: chromeBlendMode = !$darkMode ? 'normal' : 'difference';

  function isValidSection(sectionId) {
    return SECTION_IDS.includes(sectionId);
  }

  function getHashSection() {
    const hashSection = window.location.hash.replace('#', '');
    return isValidSection(hashSection) ? hashSection : null;
  }

  function updateHash(sectionId, mode = 'replace') {
    if (!isValidSection(sectionId)) return;

    const nextHash = `#${sectionId}`;
    if (window.location.hash === nextHash) return;

    if (mode === 'push') {
      window.history.pushState(null, '', nextHash);
      return;
    }

    window.history.replaceState(null, '', nextHash);
  }

  function registerSection(node, sectionId) {
    sectionElements.set(sectionId, node);
    return {
      destroy() {
        if (sectionElements.get(sectionId) === node) {
          sectionElements.delete(sectionId);
        }
      }
    };
  }

  function scrollToSection(sectionId, { behavior = 'smooth', hashMode = null } = {}) {
    if (!isValidSection(sectionId)) return;
    const sectionNode = sectionElements.get(sectionId);
    if (!sectionNode) return;

    activeSection = sectionId;

    if (hashMode) {
      updateHash(sectionId, hashMode);
    }

    sectionNode.scrollIntoView({
      behavior,
      block: 'start'
    });
  }

  function handleNavigate(event) {
    const sectionId = event.detail;
    scrollToSection(sectionId, { behavior: 'smooth', hashMode: 'push' });
  }

  function handleRootScroll() {
    if (!scrollRoot) {
      return;
    }

    const scrollTop = scrollRoot.scrollTop;
    mobileHeaderHidden = resolveMobileHeaderHidden({
      isMobile: isMobileViewport,
      scrollTop,
      revealTopY: REVEAL_TOP_Y
    });
  }

  onMount(() => {
    let sectionObserver;
    let preloadObserver;
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    const handleViewportChange = (event) => {
      isMobileViewport = event.matches;
      if (!isMobileViewport) {
        mobileHeaderHidden = false;
      }
    };

    handleViewportChange(mobileQuery);
    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', handleViewportChange);
    } else {
      mobileQuery.addListener(handleViewportChange);
    }

    const handleHashChange = () => {
      const hashSection = getHashSection();
      if (hashSection) {
        scrollToSection(hashSection, { behavior: 'smooth' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    tick().then(() => {
      sectionObserver = new IntersectionObserver((entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) {
          return;
        }

        const dominantEntry = visibleEntries.sort(
          (a, b) => b.intersectionRatio - a.intersectionRatio
        )[0];
        const nextSection = dominantEntry.target.id;

        if (!isValidSection(nextSection)) {
          return;
        }

        if (nextSection === activeSection) {
          return;
        }

        activeSection = nextSection;
        updateHash(nextSection, 'replace');
      }, {
        root: scrollRoot,
        threshold: [0.35, 0.6],
        rootMargin: '-15% 0px -45% 0px'
      });

      for (const sectionId of SECTION_IDS) {
        const sectionNode = sectionElements.get(sectionId);
        if (sectionNode) {
          sectionObserver.observe(sectionNode);
        }
      }

      preloadObserver = new IntersectionObserver((entries) => {
        if (hasLoadedPortfolioData) {
          return;
        }

        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        hasLoadedPortfolioData = true;
        loadPortfolioData();
        preloadObserver.disconnect();
      }, {
        root: scrollRoot,
        rootMargin: '500px 0px',
        threshold: 0
      });

      for (const sectionId of DATA_PRELOAD_SECTIONS) {
        const sectionNode = sectionElements.get(sectionId);
        if (sectionNode) {
          preloadObserver.observe(sectionNode);
        }
      }

      const initialHashSection = getHashSection();
      if (!initialHashSection) {
        return;
      }

      scrollToSection(initialHashSection, { behavior: 'auto' });
    });

    return () => {
      if (typeof mobileQuery.removeEventListener === 'function') {
        mobileQuery.removeEventListener('change', handleViewportChange);
      } else {
        mobileQuery.removeListener(handleViewportChange);
      }

      window.removeEventListener('hashchange', handleHashChange);
      sectionObserver?.disconnect();
      preloadObserver?.disconnect();
    };
  });
</script>

<PageContainer>
  <!-- Layer 10: UI Chrome -->
  <Frame blendMode={chromeBlendMode} />
  <SiteHeader
    activeSection={activeSection}
    compact={false}
    blendMode={chromeBlendMode}
    isMobile={isMobileViewport}
    mobileHidden={mobileHeaderHidden}
    on:navigate={handleNavigate}
  />
  <ThemeSwitcher blendMode={chromeBlendMode} />
  <Copyright blendMode={chromeBlendMode} />

  <!-- Layer 3: Masks -->
  <Masks />

  <!-- Layer 2: Content -->
  <ContentLayer blendMode={chromeBlendMode}>
    <main
      class="single-page-scroll"
      class:mobile-header-hidden={isMobileViewport && mobileHeaderHidden}
      bind:this={scrollRoot}
      on:scroll={handleRootScroll}
      name="AppMainScroll"
    >
      <div class="page-aura" aria-hidden="true" name="AppDiv1"></div>

      <section id="home" class="app-section home-section" use:registerSection={'home'} name="AppHomeSection">
        <div class="home_content" name="AppDiv2">
          <Timeline />
        </div>
      </section>

      <section
        id="metrics"
        class="app-section metrics-section"
        use:registerSection={'metrics'}
        name="AppMetricsSection"
      >
        <div class="metrics_content data_content" name="AppDiv3">
          <OverallCharacterDashboard autoLoad={false} />
        </div>
      </section>

      <section
        id="projects"
        class="app-section projects-section"
        use:registerSection={'projects'}
        name="AppProjectsSection"
      >
        <div class="projects_content data_content" name="AppDiv4">
          <PortfolioOverview autoLoad={false} />
        </div>
      </section>

      <section
        id="contact"
        class="app-section contact-section"
        use:registerSection={'contact'}
        name="AppContactSection"
      >
        <div class="contact_content" name="AppDiv5">
          <h2 name="AppH26">Get in Touch</h2>
          <div class="contact_links" name="AppDiv7">
            <a
              href="https://x.com/V_like_flan"
              target="_blank"
              rel="noopener noreferrer"
              class="contact_link"
              name="AppA8"
            >
              <span class="link_label" name="AppSpan9">Twitter</span>
              <span class="link_handle" name="AppSpan10">@V_like_flan</span>
            </a>

            <a
              href="https://www.linkedin.com/in/james-vo/"
              target="_blank"
              rel="noopener noreferrer"
              class="contact_link"
              name="AppA11"
            >
              <span class="link_label" name="AppSpan12">LinkedIn</span>
              <span class="link_handle" name="AppSpan13">james-vo</span>
            </a>
          </div>
        </div>
      </section>

      <section
        id="privacy"
        class="app-section privacy-section"
        use:registerSection={'privacy'}
        name="AppPrivacySection"
      >
        <div class="privacy_content" name="AppDiv14">
          <h2 name="AppH215">Privacy</h2>
          <p class="privacy_summary" name="AppP16">
            This site uses Google Analytics<br name="AppBr17" />
            to understand how visitors use the site.
          </p>
          <a href="/privacy.html" target="_blank" class="privacy_link" name="AppA18">
            Full Privacy Policy →
          </a>
        </div>
      </section>
    </main>
  </ContentLayer>
</PageContainer>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .single-page-scroll {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }

  .page-aura {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(circle at 16% 15%, rgba(255, 255, 255, 0.08) 0%, transparent 55%),
      radial-gradient(circle at 84% 10%, rgba(255, 255, 255, 0.06) 0%, transparent 52%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 48%);
    opacity: var(--data-page-aura-opacity, 0.75);
  }

  .app-section {
    position: relative;
    z-index: 1;
    min-height: clamp(560px, 85svh, 940px);
    display: flex;
    align-items: flex-start;
    justify-content: stretch;
    padding:
      clamp(4.5rem, 7.5vw, 6rem)
      calc(var(--pad) * 2)
      clamp(2.5rem, 4.8vw, 3.8rem);
    padding-left: calc((var(--pad) * 2) + clamp(8.5rem, 12vw, 11.5rem));
    transition: padding-left 0.22s ease;
  }

  .home-section {
    min-height: 100svh;
    align-items: center;
    justify-content: flex-end;
  }

  .home_content {
    text-align: right;
    max-width: 600px;
    width: 100%;
  }

  .metrics_content,
  .projects_content {
    width: 100%;
    text-align: left;
    max-width: none;
  }

  .data_content {
    width: 100%;
  }

  .contact-section,
  .privacy-section {
    justify-content: flex-end;
    align-items: center;
  }

  .contact_content,
  .privacy_content {
    text-align: right;
    max-width: 600px;
  }

  .contact_content h2,
  .privacy_content h2 {
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
    .app-section {
      padding-top: clamp(5.6rem, 16vw, 8rem);
      padding-left: calc((var(--pad) * 2) + 3.9rem);
      padding-right: calc(var(--pad) * 2);
    }

    .single-page-scroll.mobile-header-hidden .app-section {
      padding-left: calc(var(--pad) * 2);
    }

    .home_content {
      text-align: left;
      max-width: none;
    }
  }
</style>
