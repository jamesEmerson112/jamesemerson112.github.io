<script>
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Set viewport height CSS variable (for mobile)
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  });
</script>

<div id="Page" name="PageContainer">
  <slot />
</div>

<style>
  #Page {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--c-bg);
    transition: background-color 0.9s cubic-bezier(0.1, 0.4, 0.2, 1);
  }
</style>
