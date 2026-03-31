import type { ViewportDetectionParams, Destroyable } from '../types.js';

export function createViewportDetection({ breakpoint, onChange }: ViewportDetectionParams): Destroyable {
  const query = window.matchMedia(`(max-width: ${breakpoint}px)`);

  const handler = (event: MediaQueryListEvent) => onChange(event.matches);

  onChange(query.matches);

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handler);
  } else {
    query.addListener(handler);
  }

  return {
    destroy() {
      if (typeof query.removeEventListener === 'function') {
        query.removeEventListener('change', handler);
      } else {
        query.removeListener(handler);
      }
    }
  };
}
