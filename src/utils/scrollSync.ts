import type { ScrollSyncParams, Destroyable } from '../types.js';

/* Active-section tracking.

   A section is "active" when it crosses a thin horizontal band ~35% down the
   scroll viewport. Sections are stacked contiguously, so exactly one crosses
   the band at a time regardless of its height. (Ratio-based thresholds break
   for sections taller than the viewport: a 2,000px section can never be 35%
   visible, so the nav highlight lagged behind on Projects.) */
export function createScrollSync({ scrollRoot, sectionElements, sectionIds, isValidSection, onSectionChange }: ScrollSyncParams): Destroyable {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const nextSection = (entry.target as HTMLElement).id;
      if (isValidSection(nextSection)) {
        onSectionChange(nextSection);
      }
    }
  }, {
    root: scrollRoot,
    threshold: 0,
    rootMargin: '-35% 0px -64% 0px'
  });

  for (const sectionId of sectionIds) {
    const node = sectionElements.get(sectionId);
    if (node) observer.observe(node);
  }

  return { destroy: () => observer.disconnect() };
}
