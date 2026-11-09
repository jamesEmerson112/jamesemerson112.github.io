import type { ScrollSyncParams, Destroyable } from '../types.js';

/* Active-section tracking.

   A section is "active" when it crosses a thin horizontal band ~35% down the
   scroll viewport. Sections are stacked contiguously, so one crosses the band
   at a time regardless of its height. (Ratio-based thresholds break for
   sections taller than the viewport: a 2,000px section can never be 35%
   visible, so the nav highlight lagged behind on Projects.)

   The set of crossing sections is tracked across callbacks and the active one
   is recomputed on every change: at a boundary both neighbours briefly cross,
   and when one of them leaves, the other must take over even though it never
   re-entered. */
export function createScrollSync({ scrollRoot, sectionElements, sectionIds, isValidSection, onSectionChange }: ScrollSyncParams): Destroyable {
  const crossing = new Set<string>();

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const id = (entry.target as HTMLElement).id;
      if (entry.isIntersecting) crossing.add(id);
      else crossing.delete(id);
    }

    // In document order, the lowest crossing section wins a tie.
    const active = sectionIds.filter((id) => crossing.has(id)).pop();
    if (active && isValidSection(active)) {
      onSectionChange(active);
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
