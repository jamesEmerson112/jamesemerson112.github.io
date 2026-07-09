<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { NAV_ITEMS } from '../../utils/routing.ts';
  import { darkMode } from '../../stores/theme.ts';

  export let activeSection = 'home';
  export let isMobile = false;
  const dispatch = createEventDispatcher();

  function handleNavigate(sectionId: string) {
    dispatch('navigate', sectionId);
  }
</script>

<aside class="sidebar" class:is-mobile={isMobile} data-name="Sidebar">
  <div class="idblock" data-name="SidebarIdentity">James<br />Emerson<br />Vo</div>

  <nav class="sidenav" data-name="SidebarNav">
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

  <div class="sidefoot" data-name="SidebarFooter">
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
      on:click={() => darkMode.toggle()}
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
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px 26px;
      border-bottom: 1px solid var(--line-2);
      padding: 18px 22px;
      background: color-mix(in srgb, var(--scene-canvas) 86%, transparent);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 20;
    }

    .idblock {
      font-size: 19px;
    }

    .sidenav {
      flex-direction: row;
      flex-wrap: wrap;
      margin-top: 0;
      gap: 6px 18px;
    }

    .sidefoot {
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
