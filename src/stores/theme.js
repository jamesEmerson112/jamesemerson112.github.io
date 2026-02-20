
function resolveInitialMode() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      return true;
    }
    if (savedMode === 'false') {
      return false;
    }
  } catch {
    // Ignore storage errors and continue to system preference.
  }

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return true;
}

function applyThemeToDocument(isDark) {
  if (typeof window === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('data-light', (!isDark).toString());

  if (document.body) {
    document.body.classList.toggle('dark-theme', isDark);
    document.body.classList.toggle('light-theme', !isDark);
  }
}

class DarkModeStore {
  constructor() {
    this.subscribers = new Set();
    this.value = resolveInitialMode();
    applyThemeToDocument(this.value);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.value);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  notify() {
    this.subscribers.forEach((callback) => callback(this.value));
  }

  toggle() {
    this.setMode(!this.value);
  }

  setMode(isDark) {
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
