<script lang="ts">
  import { onMount } from 'svelte';

  let isVisible = true;

  onMount(() => {
    const handleScroll = () => {
      // Hide indicator after scrolling 100px
      if (window.scrollY > 100) {
        isVisible = false;
      } else {
        isVisible = true;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

{#if isVisible}
  <div class="scroll-indicator" data-name="ScrollIndicator">
    <div class="arrow" data-name="ScrollIndicatorDiv1">↓</div>
    <div class="text" data-name="ScrollIndicatorDiv2">Scroll</div>
  </div>
{/if}

<style>
  .scroll-indicator {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3em;
    opacity: 0.6;
    animation: fadeIn 1s ease-in, bounce 2s ease-in-out infinite;
    transition: opacity 0.5s ease;
    pointer-events: none;
    mix-blend-mode: difference;
  }

  .arrow {
    font-size: 24px;
    color: #fff;
    line-height: 1;
  }

  .text {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #fff;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 0.6;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateX(-50%) translateY(0);
    }
    50% {
      transform: translateX(-50%) translateY(10px);
    }
  }

  /* Hide on mobile to avoid clutter */
  @media (max-width: 768px) {
    .scroll-indicator {
      display: none;
    }
  }
</style>
