import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SECTION_IDS,
  isValidSection,
  parseHash,
  updateHash,
  navigateToPost,
  navigateToBlogList
} from './routing.ts';

beforeEach(() => {
  window.location.hash = '';
});

describe('isValidSection', () => {
  it('accepts every known section id', () => {
    for (const id of SECTION_IDS) {
      expect(isValidSection(id)).toBe(true);
    }
  });

  it('rejects unknown ids', () => {
    expect(isValidSection('unknown')).toBe(false);
    expect(isValidSection('')).toBe(false);
  });
});

describe('parseHash', () => {
  it('returns main view with no section for an empty hash', () => {
    expect(parseHash()).toEqual({ view: 'main', section: null, slug: null });
  });

  it('parses a valid section hash', () => {
    window.location.hash = '#projects';
    expect(parseHash()).toEqual({ view: 'main', section: 'projects', slug: null });
  });

  it('parses the blog list route', () => {
    window.location.hash = '#posts';
    expect(parseHash()).toEqual({ view: 'blog', section: null, slug: null });
  });

  it('parses an individual post route with slug', () => {
    window.location.hash = '#posts/my-first-post';
    expect(parseHash()).toEqual({ view: 'post', section: null, slug: 'my-first-post' });
  });

  it('falls back to main view for unknown hashes', () => {
    window.location.hash = '#nonsense';
    expect(parseHash()).toEqual({ view: 'main', section: null, slug: null });
  });
});

describe('updateHash', () => {
  it('replaces state by default', () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const pushSpy = vi.spyOn(window.history, 'pushState');

    updateHash('metrics');

    expect(replaceSpy).toHaveBeenCalledWith(null, '', '#metrics');
    expect(pushSpy).not.toHaveBeenCalled();
    replaceSpy.mockRestore();
    pushSpy.mockRestore();
  });

  it('pushes state when requested', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');

    updateHash('contact', 'push');

    expect(pushSpy).toHaveBeenCalledWith(null, '', '#contact');
    pushSpy.mockRestore();
  });

  it('ignores invalid sections', () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');

    updateHash('not-a-section');

    expect(replaceSpy).not.toHaveBeenCalled();
    replaceSpy.mockRestore();
  });

  it('is a no-op when the hash is already current', () => {
    window.location.hash = '#home';
    const replaceSpy = vi.spyOn(window.history, 'replaceState');

    updateHash('home');

    expect(replaceSpy).not.toHaveBeenCalled();
    replaceSpy.mockRestore();
  });
});

describe('blog navigation helpers', () => {
  it('navigateToPost sets the post hash', () => {
    navigateToPost('hello-world');
    expect(window.location.hash).toBe('#posts/hello-world');
  });

  it('navigateToBlogList sets the blog list hash', () => {
    navigateToBlogList();
    expect(window.location.hash).toBe('#posts');
  });
});
