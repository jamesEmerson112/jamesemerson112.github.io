<script>
  import { darkMode } from '../stores/theme.ts';
  export let blendMode = 'difference';
  
  function toggleTheme() {
    darkMode.toggle();
  }
</script>

<div class="theme" style={`mix-blend-mode: ${blendMode};`} data-name="ThemeSwitcher">
  <button on:click={toggleTheme} class="theme_btn" type="button" data-name="theme-toggle">
    <span class="_box" data-name="ThemeSwitcherSpan1"></span>
    <span class="_text" data-name="ThemeSwitcherSpan2">{$darkMode ? 'Dark' : 'Light'}</span>
  </button>
</div>

<style>
  .theme {
    position: fixed;
    z-index: 10;
    left: calc(var(--pad) - 0.15em);
    bottom: var(--pad);
    transform-origin: left bottom;
    transform: rotate(-90deg);
    white-space: nowrap;
    cursor: pointer;
    color: var(--chrome-fg);
  }
  
  .theme_btn {
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    cursor: pointer;
    display: flex;
    column-gap: 3px;
    font-weight: 400;
    text-transform: uppercase;
  }
  
  .theme_btn ._box::before {
    content: "□";
  }
  
  .theme_btn:hover {
    opacity: 0.7;
  }

  @media (max-width: 900px) {
    .theme {
      left: auto;
      right: calc(var(--pad) * 1.2);
      top: calc(var(--pad) * 1.1);
      bottom: auto;
      transform: none;
      white-space: nowrap;
    }

    .theme_btn {
      font-size: 11px;
      padding: 0.2rem 0.35rem;
      border: 1px solid var(--surface-border);
      border-radius: 999px;
      background: color-mix(in srgb, var(--surface-base) 90%, transparent);
    }
  }
</style>
