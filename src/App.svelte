<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { portfolio, loadPortfolioData } from './stores/portfolioStore.ts';
  import PageContainer from './components/layout/PageContainer.svelte';
  import Sidebar from './components/layout/Sidebar.svelte';
  import Footer from './components/layout/Footer.svelte';
  import NeuralField from './components/effects/NeuralField.svelte';
  import PortfolioOverview from './components/portfolio/PortfolioOverview.svelte';
  import OverallCharacterDashboard from './components/portfolio/OverallCharacterDashboard.svelte';
  import Timeline from './components/Timeline.svelte';
  import BlogList from './components/blog/BlogList.svelte';
  import BlogPost from './components/blog/BlogPost.svelte';
  import RecentPosts from './components/blog/RecentPosts.svelte';
  import ContactSection from './components/sections/ContactSection.svelte';
  import PrivacySection from './components/sections/PrivacySection.svelte';
  import HomeHero from './components/sections/HomeHero.svelte';
  import { reveal } from './utils/reveal.ts';
  import { SECTION_IDS, isValidSection, parseHash, updateHash } from './utils/routing.ts';
  import { createScrollSync } from './utils/scrollSync.ts';
  import { createDataPreloader } from './utils/dataPreloader.ts';
  import { createViewportDetection } from './utils/viewportDetection.ts';
  import './styles/themes.css';

  const DATA_PRELOAD_SECTIONS = new Set(['metrics', 'projects']);
  const MOBILE_BREAKPOINT = 960;

  let activeSection = 'home';
  let currentView = 'main'; // 'main' | 'blog' | 'post'
  let blogSlug = '';
  let scrollRoot;
  let isMobileViewport = false;
  let lastTrackedView = '';
  // A deep link (#contact, #blog, …) opened on page load. Metrics data loads
  // after the first scroll and grows the sections above it, so we keep the
  // target anchored until the user takes over.
  let pendingDeepLink: string | null = null;
  const sectionElements = new Map();

  $: portfolioIndex = $portfolio.data;
  $: heroStats = portfolioIndex?.portfolioTotals
    ? {
        repos: portfolioIndex.totalRepos ?? portfolioIndex.repos?.length ?? 0,
        lines: Number(portfolioIndex.portfolioTotals.totalLines) || 0,
        languages: Object.keys(portfolioIndex.portfolioTotals.languages || {}).length,
        scanned: formatScanDate(portfolioIndex.generatedAt)
      }
    : null;

  // Lets global styles react to the current view (e.g. dim the background
  // animation while reading a post).
  $: if (typeof document !== 'undefined') {
    document.documentElement.dataset.view = currentView;
  }

  function formatScanDate(value) {
    const timestamp = Date.parse(String(value || ''));
    if (!Number.isFinite(timestamp)) return null;
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  const releaseDeepLink = () => {
    pendingDeepLink = null;
  };

  $: if (pendingDeepLink && portfolioIndex) {
    const target = pendingDeepLink;
    // Wait for the data-driven sections to render and lay out.
    tick().then(() => {
      requestAnimationFrame(() => {
        if (pendingDeepLink === target) {
          // Re-assert the hash too: scroll sync may have rewritten it while
          // the sections above were still growing.
          scrollToSection(target, { behavior: 'auto', hashMode: 'replace' });
        }
      });
    });
  }

  function trackView(id) {
    if (!id || id === lastTrackedView) return;
    lastTrackedView = id;
    window.gtag?.('event', 'section_view', { section_id: id });
  }

  function applyHash() {
    const parsed = parseHash();
    currentView = parsed.view;
    if (parsed.view === 'post') {
      blogSlug = parsed.slug;
      activeSection = 'blog';
      trackView(`posts/${parsed.slug}`);
    } else if (parsed.view === 'blog') {
      blogSlug = '';
      activeSection = 'blog';
      trackView('posts');
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
    trackView(sectionId);

    if (hashMode) {
      updateHash(sectionId, hashMode);
    }

    sectionNode.scrollIntoView({
      behavior,
      block: 'start'
    });
  }

  function handleNavigate(event) {
    pendingDeepLink = null;
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

  onMount(() => {
    const viewport = createViewportDetection({
      breakpoint: MOBILE_BREAKPOINT,
      onChange(isMobile) {
        isMobileViewport = isMobile;
      }
    });

    const handleHashChange = () => {
      const scrollTarget = applyHash();
      if (scrollTarget) {
        scrollToSection(scrollTarget, { behavior: 'smooth' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('wheel', releaseDeepLink, { passive: true });
    window.addEventListener('touchstart', releaseDeepLink, { passive: true });
    window.addEventListener('pointerdown', releaseDeepLink, { passive: true });
    window.addEventListener('keydown', releaseDeepLink);

    // Hero stats need the metrics index; defer past first paint.
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => loadPortfolioData());
    } else {
      setTimeout(() => loadPortfolioData(), 1200);
    }

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
            trackView(nextSection);
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
        if (initialScrollTarget !== 'home') {
          pendingDeepLink = initialScrollTarget;
          window.setTimeout(() => {
            pendingDeepLink = null;
          }, 6000);
        }
      }
    });

    return () => {
      viewport.destroy();
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('wheel', releaseDeepLink);
      window.removeEventListener('touchstart', releaseDeepLink);
      window.removeEventListener('pointerdown', releaseDeepLink);
      window.removeEventListener('keydown', releaseDeepLink);
      scrollSyncHandle?.destroy();
      preloadHandle?.destroy();
    };
  });
</script>

<PageContainer>
  <NeuralField />
  <Sidebar
    activeSection={activeSection}
    isMobile={isMobileViewport}
    on:navigate={handleNavigate}
  />

  {#if currentView === 'blog'}
    <main class="single-page-scroll blog-view" data-name="AppBlogScroll">
      <BlogList />
    </main>
  {:else if currentView === 'post'}
    <main class="single-page-scroll blog-view" data-name="AppPostScroll">
      <BlogPost slug={blogSlug} />
    </main>
  {:else}
    <main
      class="single-page-scroll"
      bind:this={scrollRoot}
      data-name="AppMainScroll"
    >
      <section id="home" class="sec home-sec" use:registerSection={'home'} data-name="AppHomeSection">
        <div class="rightblk home-block" data-name="AppHomeContent">
          <div class="hero-wrap" data-name="AppHeroWrap">
            <HomeHero
              repos={heroStats ? heroStats.repos : null}
              lines={heroStats ? heroStats.lines : null}
              languages={heroStats ? heroStats.languages : null}
              scanned={heroStats ? heroStats.scanned : null}
            />
            <div class="scroll-cue enter" style="--enter-delay: 900ms" aria-hidden="true" data-name="AppScrollCue">
              <span class="scroll-cue-label" data-name="AppScrollCueLabel">SCROLL</span>
              <span class="scroll-cue-line" data-name="AppScrollCueLine"></span>
            </div>
          </div>
          <div class="timeline-block" data-name="AppTimelineBlock">
            <div class="eyebrow" use:reveal data-name="AppTimelineEyebrow">// TIMELINE</div>
            <Timeline />
          </div>
        </div>
      </section>

      <section
        id="metrics"
        class="sec wide-sec"
        use:registerSection={'metrics'}
        data-name="AppMetricsSection"
      >
        <div class="wide-inner" data-name="AppMetricsContent">
          <OverallCharacterDashboard autoLoad={false} />
        </div>
      </section>

      <section
        id="projects"
        class="sec wide-sec"
        use:registerSection={'projects'}
        data-name="AppProjectsSection"
      >
        <div class="wide-inner" data-name="AppProjectsContent">
          <PortfolioOverview autoLoad={false} />
        </div>
      </section>

      <section id="blog" class="sec blog-sec" use:registerSection={'blog'} data-name="AppBlogSection">
        <div class="blog-inner" data-name="AppBlogContent">
          <RecentPosts />
        </div>
      </section>

      <section
        id="contact"
        class="sec right-sec contact-sec"
        use:registerSection={'contact'}
        data-name="AppContactSection"
      >
        <ContactSection />
      </section>

      <section
        id="privacy"
        class="sec right-sec privacy-sec"
        use:registerSection={'privacy'}
        data-name="AppPrivacySection"
      >
        <PrivacySection />
      </section>

      <Footer />
    </main>
  {/if}
</PageContainer>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }

  .single-page-scroll {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    padding-left: var(--rail);
  }

  .sec {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding: 120px var(--sec-pad-x);
  }

  .home-sec {
    display: flex;
    justify-content: flex-end;
    padding-top: 0;
    padding-bottom: 120px;
  }

  .rightblk {
    max-width: 640px;
    margin-left: auto;
    text-align: right;
    width: 100%;
  }

  .hero-wrap {
    position: relative;
    min-height: 100vh;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 110px 0 120px;
  }

  .scroll-cue {
    position: absolute;
    right: 0;
    bottom: 44px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .scroll-cue-label {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.24em;
    color: var(--text-muted);
  }

  .scroll-cue-line {
    position: relative;
    width: 56px;
    height: 1px;
    overflow: hidden;
    background: var(--line-2);
  }

  .scroll-cue-line::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, var(--acc), transparent);
    transform: translateX(-100%);
    animation: cue-sweep 2.6s var(--ease-out-soft, ease) infinite;
  }

  @keyframes cue-sweep {
    60%,
    100% {
      transform: translateX(100%);
    }
  }

  .timeline-block {
    padding-top: 8px;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    color: var(--acc);
    margin-bottom: 8px;
  }

  .wide-sec .wide-inner {
    max-width: 1160px;
    margin: 0 auto;
  }

  .blog-sec {
    min-height: 70vh;
    display: flex;
    align-items: center;
    padding-top: 110px;
    padding-bottom: 110px;
  }

  .blog-inner {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }

  .right-sec {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .contact-sec {
    min-height: 90vh;
  }

  .privacy-sec {
    min-height: 70vh;
    padding-bottom: 140px;
  }

  .blog-view {
    padding-top: 40px;
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-cue-line::after {
      animation: none;
      transform: none;
      opacity: 0.4;
    }
  }

  @media (max-width: 960px) {
    .single-page-scroll {
      padding-left: 0;
      padding-top: var(--topbar-h, 96px);
      /* Keep scrollIntoView targets clear of the fixed top bar. */
      scroll-padding-top: var(--topbar-h, 96px);
    }

    .sec {
      padding-top: clamp(4rem, 12vw, 7rem);
    }

    .home-sec {
      padding-top: 0;
    }

    .hero-wrap {
      min-height: calc(100svh - var(--topbar-h, 96px));
      padding: 48px 0 96px;
    }

    .scroll-cue {
      right: auto;
      left: 0;
      bottom: 36px;
    }

    .rightblk {
      margin-left: 0;
      text-align: left;
    }
  }
</style>
