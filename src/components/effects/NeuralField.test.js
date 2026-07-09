import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import NeuralField from './NeuralField.svelte';

function stubMatchMedia({ reducedMotion = false } = {}) {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn()
  })));
}

describe('NeuralField', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders a decorative canvas with data-name', () => {
    stubMatchMedia();
    const { container } = render(NeuralField);

    const canvas = container.querySelector('canvas[data-name="NeuralField"]');
    expect(canvas).not.toBeNull();
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not start the animation loop under prefers-reduced-motion', () => {
    stubMatchMedia({ reducedMotion: true });

    // jsdom canvas has no 2d context by default; provide a minimal one so the
    // component reaches its reduced-motion branch instead of bailing out.
    const ctxStub = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctxStub);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    render(NeuralField);

    expect(rafSpy).not.toHaveBeenCalled();
    // The static frame still rendered once.
    expect(ctxStub.clearRect).toHaveBeenCalled();
  });

  it('cleans up its animation frame on destroy', () => {
    stubMatchMedia();
    const ctxStub = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctxStub);
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = render(NeuralField);
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
