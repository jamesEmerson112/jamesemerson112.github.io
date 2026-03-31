import type { ScrollSyncParams, Destroyable } from '../types.js';

export function createScrollSync({ scrollRoot, sectionElements, sectionIds, isValidSection, onSectionChange }: ScrollSyncParams): Destroyable {
  const observer = new IntersectionObserver((entries) => {
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);
    if (visibleEntries.length === 0) return;

    const dominantEntry = visibleEntries.sort(
      (a, b) => b.intersectionRatio - a.intersectionRatio
    )[0];
    const nextSection = dominantEntry.target.id;

    if (!isValidSection(nextSection)) return;

    onSectionChange(nextSection);
  }, {
    root: scrollRoot,
    threshold: [0.35, 0.6],
    rootMargin: '-15% 0px -45% 0px'
  });

  for (const sectionId of sectionIds) {
    const node = sectionElements.get(sectionId);
    if (node) observer.observe(node);
  }

  return { destroy: () => observer.disconnect() };
}
