<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { NAV_ITEMS } from '../../utils/routing.ts';
  import { darkMode } from '../../stores/theme.ts';
  import { prefersReducedMotion } from '../../utils/reveal.ts';

  export let activeSection = 'home';
  export let isMobile = false;
  const dispatch = createEventDispatcher();

  let barHeight = 0;
  let navEl: HTMLElement | null = null;

  function handleNavigate(sectionId: string) {
    dispatch('navigate', sectionId);
  }

  type ViewTransitionDocument = Document & {
    startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> };
  };

  // Theme switch as a circle expanding from the toggle (View Transitions API).
  // Falls back to an instant toggle where unsupported or under reduced motion.
  function toggleTheme(event: MouseEvent) {
    const doc = document as ViewTransitionDocument;
    if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion()) {
      darkMode.toggle();
      return;
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const fromPointer = event.clientX !== 0 || event.clientY !== 0;
    const x = fromPointer ? event.clientX : rect.left + rect.width / 2;
    const y = fromPointer ? event.clientY : rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const root = document.documentElement;
    root.classList.add('theme-switching');
    const transition = doc.startViewTransition(() => darkMode.toggle());
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      })
      .catch(() => {});
    transition.finished.finally(() => root.classList.remove('theme-switching'));
  }

  // The mobile top bar publishes its real height so the scroll container can
  // offset content and scroll targets by exactly that much.
  $: if (isMobile && barHeight > 0 && typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--topbar-h', `${barHeight}px`);
  }

  // Keep the active item visible in the horizontally scrolling mobile nav.
  $: if (isMobile && navEl && activeSection) {
    centerActiveLink();
  }

  async function centerActiveLink() {
    await tick();
    const active = navEl?.querySelector<HTMLElement>('.navlink.active');
    if (!navEl || !active || typeof navEl.scrollTo !== 'function') return;
    const target = active.offsetLeft - (navEl.clientWidth - active.offsetWidth) / 2;
    navEl.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }
</script>

<aside class="sidebar" class:is-mobile={isMobile} bind:offsetHeight={barHeight} data-name="Sidebar">
  <div class="idblock enter" style="--enter-delay: 0ms" data-name="SidebarIdentity">
    <span data-name="SidebarFirstName">James</span>
    <span data-name="SidebarMiddleName">Emerson</span>
    <span data-name="SidebarLastName">Vo</span>
  </div>

  <nav class="sidenav enter" style="--enter-delay: 120ms" bind:this={navEl} data-name="SidebarNav">
    {#each NAV_ITEMS as item}
      <button
        class="navlink"
        class:active={activeSection === item.id}
        type="button"
        data-name={`nav-${item.id}`}
        on:click={() => handleNavigate(item.id)}
      >
        <span class="bar" data-name="SidebarNavBar"></span>{item.label}
      </button>
    {/each}
  </nav>

  <div class="sidefoot enter" style="--enter-delay: 240ms" data-name="SidebarFooter">
    <div class="open-badge" data-name="SidebarOpenBadge">
      <span class="pulse-dot" data-name="SidebarPulseDot"></span>OPEN TO WORK
    </div>
    <div class="socials" data-name="SidebarSocials">
      <a href="https://x.com/V_like_flan" target="_blank" rel="noopener noreferrer">Twitter</a>
      <a href="https://www.linkedin.com/in/james-vo/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </div>
    <button
      class="theme-pill"
      type="button"
      data-name="theme-toggle"
      aria-label="Toggle color theme"
      on:click={toggleTheme}
    >
      {$darkMode ? '☾ DARK' : '☀ LIGHT'}
    </button>
    <div class="credit" data-name="SidebarCredit">INSPIRED BY KEITA YAMADA</div>
  </div>
</aside>

<style>
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: var(--rail);
    height: 100vh;
    z-index: 15;
    padding: 54px 42px;
    display: flex;
    flex-direction: column;
  }

  .idblock {
    font-family: var(--font-display);
    font-weight: 200;
    font-size: 34px;
    line-height: 1.08;
    letter-spacing: -0.01em;
    color: var(--scene-text);
    text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
  }

  :global([data-light='true']) .idblock {
    text-shadow: none;
  }

  .idblock span {
    display: block;
  }

  .sidenav {
    margin-top: 46px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .navlink {
    color: var(--nav-idle);
    font-family: var(--font-mono);
    font-size: 13.5px;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: color 0.22s;
    display: flex;
    align-items: center;
    gap: 12px;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
  }

  .navlink .bar {
    width: 0;
    height: 1px;
    background: var(--acc);
    transition: width 0.28s;
  }

  .navlink:hover {
    color: var(--nav-hover);
  }

  .navlink:hover .bar {
    width: 10px;
  }

  .navlink.active {
    color: var(--nav-active);
  }

  .navlink.active .bar {
    width: 24px;
  }

  .navlink:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }

  .sidefoot {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .open-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--badge-open);
    width: fit-content;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--acc);
    box-shadow: 0 0 8px var(--acc);
    animation: pulse 2.4s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      opacity: 0.35;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pulse-dot {
      animation: none;
    }
  }

  .socials {
    display: flex;
    gap: 16px;
    font-family: var(--font-mono);
    font-size: 11px;
  }

  .socials a {
    color: var(--nav-idle);
    text-decoration: none;
    transition: color 0.22s;
  }

  .socials a:hover {
    color: var(--nav-hover);
  }

  .theme-pill {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--nav-idle);
    background: transparent;
    border: 1px solid var(--line-1);
    border-radius: 999px;
    padding: 5px 12px;
    cursor: pointer;
    width: fit-content;
    transition: all 0.18s;
  }

  .theme-pill:hover {
    border-color: color-mix(in srgb, var(--acc) 55%, transparent);
    color: var(--nav-hover);
  }

  .theme-pill:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }

  .credit {
    font-family: var(--font-mono);
    font-size: 8.5px;
    letter-spacing: 0.12em;
    color: var(--footer-ink);
  }

  @media (max-width: 960px) {
    .sidebar {
      width: 100%;
      height: auto;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'id foot'
        'nav nav';
      align-items: center;
      gap: 8px 16px;
      border-bottom: 1px solid var(--line-2);
      padding: 14px 20px 0;
      background: color-mix(in srgb, var(--scene-canvas) 86%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 20;
    }

    .idblock {
      grid-area: id;
      font-size: 21px;
      font-weight: 300;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .idblock span {
      display: inline;
    }

    .sidenav {
      grid-area: nav;
      flex-direction: row;
      flex-wrap: nowrap;
      margin: 0 -20px;
      padding: 0 20px;
      gap: 20px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 16px, #000 calc(100% - 24px), transparent 100%);
      mask-image: linear-gradient(90deg, transparent 0, #000 16px, #000 calc(100% - 24px), transparent 100%);
    }

    .sidenav::-webkit-scrollbar {
      display: none;
    }

    .navlink {
      position: relative;
      flex-shrink: 0;
      font-size: 12.5px;
      padding: 8px 0 11px;
      white-space: nowrap;
    }

    /* The desktop leading bar becomes an underline on the bar's edge. */
    .navlink .bar {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 2px;
      border-radius: 2px;
    }

    .navlink.active .bar {
      width: 100%;
    }

    .navlink:hover .bar {
      width: 0;
    }

    .navlink.active:hover .bar {
      width: 100%;
    }

    .sidefoot {
      grid-area: foot;
      margin-top: 0;
      flex-direction: row;
      align-items: center;
      gap: 14px;
    }

    .open-badge,
    .credit,
    .socials {
      display: none;
    }
  }
</style>
