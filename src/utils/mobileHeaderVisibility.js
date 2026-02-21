export function resolveMobileHeaderHidden({
  isMobile,
  scrollTop,
  revealTopY = 0
}) {
  if (!isMobile) {
    return false;
  }

  const safeScrollTop = Number.isFinite(Number(scrollTop)) ? Number(scrollTop) : 0;
  const safeRevealTopY = Number.isFinite(Number(revealTopY)) ? Number(revealTopY) : 0;
  return safeScrollTop > safeRevealTopY;
}
