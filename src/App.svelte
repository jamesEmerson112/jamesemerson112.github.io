<script>
  import { onMount, tick } from 'svelte';
  import { darkMode } from './stores/theme.ts';
  import { loadPortfolioData } from './stores/portfolioStore.ts';
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
  import BlogList from './components/blog/BlogList.svelte';
  import BlogPost from './components/blog/BlogPost.svelte';
  import RecentPosts from './components/blog/RecentPosts.svelte';
  import ContactSection from './components/sections/ContactSection.svelte';
  import PrivacySection from './components/sections/PrivacySection.svelte';
  import { resolveMobileHeaderHidden } from './utils/mobileHeaderVisibility.ts';
  import { SECTION_IDS, isValidSection, parseHash, updateHash } from './utils/routing.ts';
  import { createScrollSync } from './utils/scrollSync.ts';
  import { createDataPreloader } from './utils/dataPreloader.ts';
  import { createViewportDetection } from './utils/viewportDetection.ts';
  import './styles/themes.css';

  const DATA_PRELOAD_SECTIONS = new Set(['metrics', 'projects']);
  const MOBILE_BREAKPOINT = 900;
  const REVEAL_TOP_Y = 0;

  let activeSection = 'home';
  let currentView = 'main'; // 'main' | 'blog' | 'post'
  let blogSlug = '';
  let scrollRoot;
  let hasLoadedPortfolioData = false;
  let isMobileViewport = false;
  let mobileHeaderHidden = false;
  const sectionElements = new Map();

  $: chromeBlendMode = !$darkMode ? 'normal' : 'difference';

  function applyHash() {
    const parsed = parseHash();
    currentView = parsed.view;
    if (parsed.view === 'post') {
      blogSlug = parsed.slug;
      activeSection = 'blog';
    } else if (parsed.view === 'blog') {
      blogSlug = '';
      activeSection = 'blog';
    } else if (parsed.section) {
      blogSlug = '';
      return parsed.section;
    }
    return null;
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
    if (currentView !== 'main') {
      currentView = 'main';
      blogSlug = '';
      window.location.hash = sectionId;
      tick().then(() => {
        scrollToSection(sectionId, { behavior: 'auto' });
      });
      return;
    }
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
    const viewport = createViewportDetection({
      breakpoint: MOBILE_BREAKPOINT,
      onChange(isMobile) {
        isMobileViewport = isMobile;
        if (!isMobile) mobileHeaderHidden = false;
      }
    });

    const handleHashChange = () => {
      const scrollTarget = applyHash();
      if (scrollTarget) {
        scrollToSection(scrollTarget, { behavior: 'smooth' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    let scrollSyncHandle;
    let preloadHandle;

    tick().then(() => {
      scrollSyncHandle = createScrollSync({
        scrollRoot,
        sectionElements,
        sectionIds: SECTION_IDS,
        isValidSection,
        onSectionChange(nextSection) {
          if (nextSection !== activeSection) {
            activeSection = nextSection;
            updateHash(nextSection, 'replace');
          }
        }
      });

      preloadHandle = createDataPreloader({
        scrollRoot,
        sectionElements,
        preloadSections: DATA_PRELOAD_SECTIONS,
        onPreload: loadPortfolioData
      });

      const initialScrollTarget = applyHash();
      if (initialScrollTarget) {
        scrollToSection(initialScrollTarget, { behavior: 'auto' });
      }
    });

    return () => {
      viewport.destroy();
      window.removeEventListener('hashchange', handleHashChange);
      scrollSyncHandle?.destroy();
      preloadHandle?.destroy();
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
    {#if currentView === 'blog'}
      <main
        class="single-page-scroll blog-view"
        class:mobile-header-hidden={isMobileViewport && mobileHeaderHidden}
        data-name="AppBlogScroll"
      >
        <div class="page-aura" aria-hidden="true" data-name="AppDiv1"></div>
        <BlogList />
      </main>
    {:else if currentView === 'post'}
      <main
        class="single-page-scroll blog-view"
        class:mobile-header-hidden={isMobileViewport && mobileHeaderHidden}
        data-name="AppPostScroll"
      >
        <div class="page-aura" aria-hidden="true" data-name="AppDiv1"></div>
        <BlogPost slug={blogSlug} />
      </main>
    {:else}
      <main
        class="single-page-scroll"
        class:mobile-header-hidden={isMobileViewport && mobileHeaderHidden}
        bind:this={scrollRoot}
        on:scroll={handleRootScroll}
        data-name="AppMainScroll"
      >
        <div class="page-aura" aria-hidden="true" data-name="AppDiv1"></div>

        <section id="home" class="app-section home-section" use:registerSection={'home'} data-name="AppHomeSection">
          <div class="home_content" data-name="AppDiv2">
            <Timeline />
          </div>
        </section>

        <section id="blog" class="app-section blog-section" use:registerSection={'blog'} data-name="AppBlogSection">
          <div class="blog_content" data-name="AppBlogDiv">
            <RecentPosts />
          </div>
        </section>

        <section
          id="metrics"
          class="app-section metrics-section"
          use:registerSection={'metrics'}
          data-name="AppMetricsSection"
        >
          <div class="metrics_content data_content" data-name="AppDiv3">
            <OverallCharacterDashboard autoLoad={false} />
          </div>
        </section>

        <section
          id="projects"
          class="app-section projects-section"
          use:registerSection={'projects'}
          data-name="AppProjectsSection"
        >
          <div class="projects_content data_content" data-name="AppDiv4">
            <PortfolioOverview autoLoad={false} />
          </div>
        </section>

        <section
          id="contact"
          class="app-section contact-section"
          use:registerSection={'contact'}
          data-name="AppContactSection"
        >
          <ContactSection />
        </section>

        <section
          id="privacy"
          class="app-section privacy-section"
          use:registerSection={'privacy'}
          data-name="AppPrivacySection"
        >
          <PrivacySection />
        </section>
      </main>
    {/if}
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
    padding-left: calc((var(--pad) * 2) + clamp(11rem, 18vw, 15rem) + clamp(1rem, 2vw, 1.75rem));
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

  .blog-section {
    min-height: auto;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
  }

  .blog_content {
    width: 100%;
    max-width: 600px;
    text-align: center;
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

  .blog-view {
    padding-left: calc((var(--pad) * 2) + clamp(11rem, 18vw, 15rem) + clamp(1rem, 2vw, 1.75rem));
    transition: padding-left 0.22s ease;
  }

  @media (max-width: 900px) {
    .blog-view {
      padding-left: calc((var(--pad) * 2) + 3.9rem);
    }

    .single-page-scroll.mobile-header-hidden.blog-view {
      padding-left: calc(var(--pad) * 2);
    }

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
