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
  import { formatCompact } from './utils/formatters.ts';
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
  const sectionElements = new Map();

  $: portfolioIndex = $portfolio.data;
  $: heroStats = portfolioIndex?.portfolioTotals
    ? {
        repos: portfolioIndex.totalRepos ?? portfolioIndex.repos?.length ?? 0,
        lines: formatCompact(portfolioIndex.portfolioTotals.totalLines),
        languages: Object.keys(portfolioIndex.portfolioTotals.languages || {}).length,
        scanned: formatScanDate(portfolioIndex.generatedAt)
      }
    : null;

  function formatScanDate(value) {
    const timestamp = Date.parse(String(value || ''));
    if (!Number.isFinite(timestamp)) return null;
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
          <div class="herotag" data-name="AppHeroTag">
            'Cure' neural networks <span class="eq">==</span> cure brains
          </div>
          <div class="role-line" data-name="AppRoleLine">
            Software Developer @ JCM Global · MSCS @ Georgia Tech
          </div>
          <div class="hero-stats" data-name="AppHeroStats">
            {#if heroStats}
              {heroStats.repos} repos · {heroStats.lines} lines · {heroStats.languages} languages{#if heroStats.scanned}
                · scanned {heroStats.scanned}{/if}
            {:else}
              — repos · — lines · — languages
            {/if}
          </div>
          <div class="eyebrow" data-name="AppTimelineEyebrow">// TIMELINE</div>
          <Timeline />
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
    align-items: center;
    justify-content: flex-end;
    padding-top: 100px;
    padding-bottom: 100px;
  }

  .rightblk {
    max-width: 620px;
    margin-left: auto;
    text-align: right;
    width: 100%;
  }

  .herotag {
    font-family: var(--font-mono);
    font-size: 15px;
    letter-spacing: 0.01em;
    color: var(--mono-tone-2);
    margin-bottom: 14px;
    white-space: nowrap;
  }

  .herotag .eq {
    color: var(--acc);
  }

  .role-line {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .hero-stats {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin-bottom: 30px;
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

  @media (max-width: 960px) {
    .single-page-scroll {
      padding-left: 0;
      padding-top: var(--topbar-h, 128px);
    }

    .sec {
      padding-top: clamp(4rem, 12vw, 7rem);
    }

    .herotag {
      white-space: normal;
      font-size: 13.5px;
    }

    .rightblk {
      margin-left: 0;
      text-align: left;
    }
  }
</style>
