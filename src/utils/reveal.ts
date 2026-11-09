/* Scroll-reveal Svelte action.

   Usage: <div use:reveal={{ delay: 120 }}>…</div>

   Content is only hidden once this action has armed the element, so markup
   stays visible without JS, under prefers-reduced-motion, and in environments
   without IntersectionObserver (jsdom tests). Elements reveal once and stay
   revealed. Styles live in src/styles/base.css (.reveal / .is-revealed). */

export interface RevealOptions {
  /** Delay before the entrance animation starts, in ms. */
  delay?: number;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  if (
    typeof window === 'undefined'
    || typeof window.IntersectionObserver === 'undefined'
    || prefersReducedMotion()
  ) {
    return {};
  }

  const applyDelay = (opts: RevealOptions) => {
    node.style.setProperty('--reveal-delay', `${Math.max(0, opts.delay ?? 0)}ms`);
  };

  applyDelay(options);
  node.classList.add('reveal');

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        node.classList.add('is-revealed');
        observer.disconnect();
        break;
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  observer.observe(node);

  return {
    update(next: RevealOptions = {}) {
      applyDelay(next);
    },
    destroy() {
      observer.disconnect();
    }
  };
}
