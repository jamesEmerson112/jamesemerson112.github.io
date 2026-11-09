import { afterEach, describe, expect, it, vi } from 'vitest';
import { createScrollSync } from './scrollSync.ts';

let observerCallback = null;

class FakeIntersectionObserver {
  constructor(callback) {
    observerCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

function section(id) {
  const el = document.createElement('section');
  el.id = id;
  return el;
}

function fire(...changes) {
  observerCallback(changes.map(([el, isIntersecting]) => ({ target: el, isIntersecting })));
}

afterEach(() => {
  vi.unstubAllGlobals();
  observerCallback = null;
});

describe('createScrollSync', () => {
  function setup() {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const ids = ['home', 'metrics', 'projects'];
    const elements = new Map(ids.map((id) => [id, section(id)]));
    const onSectionChange = vi.fn();
    createScrollSync({
      scrollRoot: document.createElement('main'),
      sectionElements: elements,
      sectionIds: ids,
      isValidSection: (id) => ids.includes(id),
      onSectionChange
    });
    return { elements, onSectionChange, last: () => onSectionChange.mock.calls.at(-1)?.[0] };
  }

  it('activates the section crossing the band', () => {
    const { elements, last } = setup();
    fire([elements.get('home'), true]);
    expect(last()).toBe('home');
    fire([elements.get('home'), false], [elements.get('metrics'), true]);
    expect(last()).toBe('metrics');
  });

  it('hands back to the upper section when a straddled boundary is reversed', () => {
    const { elements, last } = setup();
    fire([elements.get('home'), true]);
    // Boundary straddles the band: both cross, the lower one wins the tie.
    fire([elements.get('metrics'), true]);
    expect(last()).toBe('metrics');
    // Visitor scrolls back up: only metrics stops crossing; home never re-enters.
    fire([elements.get('metrics'), false]);
    expect(last()).toBe('home');
  });
});
