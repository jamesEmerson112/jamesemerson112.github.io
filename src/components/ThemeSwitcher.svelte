<script>
  import { darkMode } from '../stores/theme.js';
  export let blendMode = 'difference';
  
  function toggleTheme() {
    darkMode.toggle();
  }
</script>

<div class="theme" style={`mix-blend-mode: ${blendMode};`}>
  <button on:click={toggleTheme} class="theme_btn">
    <span class="_box"></span>
    <span class="_text">{$darkMode ? 'Dark' : 'Light'}</span>
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
</style>
