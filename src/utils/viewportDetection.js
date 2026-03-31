/**
 * Sets up matchMedia listener for mobile viewport detection.
 * Returns current state and a destroy function.
 */
export function createViewportDetection({ breakpoint, onChange }) {
  const query = window.matchMedia(`(max-width: ${breakpoint}px)`);

  const handler = (event) => onChange(event.matches);

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
