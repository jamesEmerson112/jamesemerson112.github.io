<script lang="ts">
  import { onMount } from 'svelte';
  import { darkMode } from '../../stores/theme.ts';

  export let density = 0.00016;
  export let linkDistance = 130;
  export let speed = 0.2;

  interface FieldNode {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
  }

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const reduceQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    const coarseQuery = typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)')
      : null;

    let rafId = 0;
    let running = false;
    let nodes: FieldNode[] = [];
    let width = 0;
    let height = 0;
    let accent = '#5ccfd6';
    let glow = true;
    let resizeTimer = 0;
    const mouse = { x: -9999, y: -9999 };

    const prefersReducedMotion = () => Boolean(reduceQuery?.matches);
    const isMobile = () => window.innerWidth < 768 || Boolean(coarseQuery?.matches);

    function readTheme() {
      const styles = getComputedStyle(document.documentElement);
      accent = styles.getPropertyValue('--neural-accent').trim() || '#5ccfd6';
      glow = styles.getPropertyValue('--neural-glow').trim() !== '0';
    }

    function seed() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const effectiveDensity = density * (isMobile() ? 0.5 : 1);
      const count = Math.max(22, Math.min(340, Math.round(width * height * effectiveDensity)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r: Math.random() * 1.3 + 0.7
      }));
    }

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < linkDistance) {
            ctx.globalAlpha = (1 - d / linkDistance) * 0.5;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (mouse.x > -9000) {
        const reach = linkDistance * 1.1;
        for (const node of nodes) {
          const d = Math.hypot(mouse.x - node.x, mouse.y - node.y);
          if (d < reach) {
            ctx.globalAlpha = (1 - d / reach) * 0.65;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      for (const node of nodes) {
        if (glow) {
          ctx.shadowColor = accent;
          ctx.shadowBlur = 6;
        }
        ctx.fillStyle = accent;
        ctx.globalAlpha = glow ? 0.9 : 0.7;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    function step() {
      const attract = !isMobile();
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        if (attract) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const d = Math.hypot(dx, dy);
          if (d < 150 && d > 0.1) {
            node.x += (dx / d) * 0.8;
            node.y += (dy / d) * 0.8;
          }
        }
      }
      drawFrame();
      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (running || prefersReducedMotion() || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function handleVisibility() {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    function handleMotionChange() {
      if (prefersReducedMotion()) {
        stop();
        drawFrame();
      } else {
        start();
      }
    }

    function handleMouseMove(event: MouseEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }

    function handleMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function handleResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        seed();
        if (!running) drawFrame();
      }, 180);
    }

    const unsubscribeTheme = darkMode.subscribe(() => {
      readTheme();
      if (!running) drawFrame();
    });

    seed();
    if (prefersReducedMotion()) {
      drawFrame();
    } else {
      start();
    }

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    reduceQuery?.addEventListener?.('change', handleMotionChange);

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      unsubscribeTheme();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      reduceQuery?.removeEventListener?.('change', handleMotionChange);
    };
  });
</script>

<canvas bind:this={canvas} class="neural-field" data-name="NeuralField" aria-hidden="true"></canvas>

<style>
  .neural-field {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    opacity: var(--neural-opacity, 0.3);
    pointer-events: none;
  }
</style>
