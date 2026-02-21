import { describe, expect, it } from 'vitest';
import { resolveMobileHeaderHidden } from './mobileHeaderVisibility.js';

describe('mobileHeaderVisibility', () => {
  it('always returns visible for non-mobile contexts', () => {
    expect(
      resolveMobileHeaderHidden({
        isMobile: false,
        scrollTop: 500
      })
    ).toBe(false);
  });

  it('reveals header only at top by default', () => {
    expect(
      resolveMobileHeaderHidden({
        isMobile: true,
        scrollTop: 0
      })
    ).toBe(false);

    expect(
      resolveMobileHeaderHidden({
        isMobile: true,
        scrollTop: 1
      })
    ).toBe(true);
  });

  it('supports a custom reveal threshold when provided', () => {
    expect(
      resolveMobileHeaderHidden({
        isMobile: true,
        scrollTop: 24,
        revealTopY: 24
      })
    ).toBe(false);

    expect(
      resolveMobileHeaderHidden({
        isMobile: true,
        scrollTop: 25,
        revealTopY: 24
      })
    ).toBe(true);
  });

  it('falls back safely for invalid values', () => {
    expect(
      resolveMobileHeaderHidden({
        isMobile: true,
        scrollTop: Number.NaN,
        revealTopY: Number.NaN
      })
    ).toBe(false);
  });
});
