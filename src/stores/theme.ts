import type { Readable } from 'svelte/store';

type Subscriber = (value: boolean) => void;

function resolveInitialMode(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') return true;
    if (savedMode === 'false') return false;
  } catch {
    // Ignore storage errors and continue to system preference.
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return true;
}

function applyThemeToDocument(isDark: boolean): void {
  if (typeof window === 'undefined') return;

  document.documentElement.setAttribute('data-light', (!isDark).toString());

  if (document.body) {
    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
  }
}

class DarkModeStore implements Readable<boolean> {
  private subscribers = new Set<Subscriber>();
  private value: boolean;

  constructor() {
    this.value = resolveInitialMode();
    applyThemeToDocument(this.value);
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    callback(this.value);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  notify(): void {
    this.subscribers.forEach((callback) => callback(this.value));
  }

  toggle(): void {
    this.setMode(!this.value);
  }

  setMode(isDark: boolean): void {
    this.value = Boolean(isDark);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('darkMode', this.value.toString());
      } catch {
        // Ignore storage errors; UI state should still update.
      }
    }

    applyThemeToDocument(this.value);
    this.notify();
  }
}

export const darkMode = new DarkModeStore();
