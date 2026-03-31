interface MobileHeaderParams {
  isMobile: boolean;
  scrollTop: number;
  revealTopY?: number;
}

export function resolveMobileHeaderHidden({
  isMobile,
  scrollTop,
  revealTopY = 0
}: MobileHeaderParams): boolean {
  if (!isMobile) {
    return false;
  }

  const safeScrollTop = Number.isFinite(Number(scrollTop)) ? Number(scrollTop) : 0;
  const safeRevealTopY = Number.isFinite(Number(revealTopY)) ? Number(revealTopY) : 0;
  return safeScrollTop > safeRevealTopY;
}
