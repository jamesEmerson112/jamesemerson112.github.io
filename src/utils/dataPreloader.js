/**
 * Creates an IntersectionObserver that triggers data loading when
 * target sections approach the viewport.
 */
export function createDataPreloader({ scrollRoot, sectionElements, preloadSections, onPreload }) {
  let loaded = false;

  const observer = new IntersectionObserver((entries) => {
    if (loaded) return;
    if (!entries.some((entry) => entry.isIntersecting)) return;

    loaded = true;
    onPreload();
    observer.disconnect();
  }, {
    root: scrollRoot,
    rootMargin: '500px 0px',
    threshold: 0
  });

  for (const sectionId of preloadSections) {
    const node = sectionElements.get(sectionId);
    if (node) observer.observe(node);
  }

  return { destroy: () => observer.disconnect() };
}
