import type { NavItem, ParsedRoute } from '../types.js';

export const SECTION_IDS: readonly string[] = ['home', 'metrics', 'projects', 'blog', 'contact', 'privacy'];

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'projects', label: 'Projects' },
  { id: 'blog', label: 'Blog' },
  { id: 'contact', label: 'Contact' },
  { id: 'privacy', label: 'Privacy' }
];

export function isValidSection(sectionId: string): boolean {
  return SECTION_IDS.includes(sectionId);
}

export function parseHash(): ParsedRoute {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'posts') return { view: 'blog', section: null, slug: null };
  if (hash.startsWith('posts/')) return { view: 'post', section: null, slug: hash.slice(6) };
  if (isValidSection(hash)) return { view: 'main', section: hash, slug: null };
  return { view: 'main', section: null, slug: null };
}

export function navigateToPost(slug: string): void {
  window.location.hash = `posts/${slug}`;
}

export function navigateToBlogList(): void {
  window.location.hash = 'posts';
}

export function updateHash(sectionId: string, mode: 'replace' | 'push' = 'replace'): void {
  if (!isValidSection(sectionId)) return;

  const nextHash = `#${sectionId}`;
  if (window.location.hash === nextHash) return;

  if (mode === 'push') {
    window.history.pushState(null, '', nextHash);
    return;
  }

  window.history.replaceState(null, '', nextHash);
}
