import { beforeEach, describe, expect, it, vi } from 'vitest';

function stubMatchMedia(prefersDark) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: prefersDark }));
}

async function importDarkMode() {
  vi.resetModules();
  const module = await import('./theme.ts');
  return module.darkMode;
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-light');
  document.body.className = '';
});

describe('initial mode resolution', () => {
  it('uses saved localStorage value over system preference', async () => {
    localStorage.setItem('darkMode', 'false');
    stubMatchMedia(true);

    const darkMode = await importDarkMode();

    let value;
    darkMode.subscribe((v) => (value = v))();
    expect(value).toBe(false);
    expect(document.documentElement.getAttribute('data-light')).toBe('true');
    expect(document.body.classList.contains('light-theme')).toBe(true);
  });

  it('falls back to system preference when nothing is saved', async () => {
    stubMatchMedia(true);

    const darkMode = await importDarkMode();

    let value;
    darkMode.subscribe((v) => (value = v))();
    expect(value).toBe(true);
    expect(document.documentElement.getAttribute('data-light')).toBe('false');
    expect(document.body.classList.contains('dark-theme')).toBe(true);
  });

  it('respects a light system preference', async () => {
    stubMatchMedia(false);

    const darkMode = await importDarkMode();

    let value;
    darkMode.subscribe((v) => (value = v))();
    expect(value).toBe(false);
  });
});

describe('setMode / toggle', () => {
  it('persists the mode and updates the document', async () => {
    stubMatchMedia(true);
    const darkMode = await importDarkMode();

    darkMode.setMode(false);

    expect(localStorage.getItem('darkMode')).toBe('false');
    expect(document.documentElement.getAttribute('data-light')).toBe('true');
    expect(document.body.classList.contains('light-theme')).toBe(true);
    expect(document.body.classList.contains('dark-theme')).toBe(false);
  });

  it('toggle flips the current value and notifies subscribers', async () => {
    stubMatchMedia(true);
    const darkMode = await importDarkMode();

    const seen = [];
    const unsubscribe = darkMode.subscribe((v) => seen.push(v));

    darkMode.toggle();

    expect(seen).toEqual([true, false]);
    expect(localStorage.getItem('darkMode')).toBe('false');

    darkMode.toggle();
    expect(seen).toEqual([true, false, true]);
    expect(localStorage.getItem('darkMode')).toBe('true');
    unsubscribe();
  });

  it('stops notifying after unsubscribe', async () => {
    stubMatchMedia(true);
    const darkMode = await importDarkMode();

    const seen = [];
    const unsubscribe = darkMode.subscribe((v) => seen.push(v));
    unsubscribe();

    darkMode.toggle();

    expect(seen).toEqual([true]);
  });
});
