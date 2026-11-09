import type { BlogPostMeta } from '../types.js';

export { parseFrontmatter, parseTagList, estimateReadingMinutes, normalizeDate } from './frontmatter.ts';

let cachedIndex: BlogPostMeta[] | null = null;

export async function fetchBlogIndex(): Promise<BlogPostMeta[]> {
  if (cachedIndex) return cachedIndex;
  const res = await fetch('/blog/index.json');
  if (!res.ok) throw new Error(`Failed to load blog index: ${res.status}`);
  cachedIndex = await res.json();
  return cachedIndex!;
}

/* Dev-only live preview: the Vite blog plugin emits `blog:changed` when a
   post file is saved. Returns an unsubscribe function (a no-op in prod). */
export function onBlogChange(callback: (change: { slug: string }) => void): () => void {
  const hot = import.meta.hot;
  if (!hot) return () => {};
  const handler = (data: { slug: string }) => {
    cachedIndex = null;
    callback(data);
  };
  hot.on('blog:changed', handler);
  return () => hot.off?.('blog:changed', handler);
}

export async function fetchBlogPost(slug: string): Promise<string> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug)) {
    throw new Error(`Invalid post slug: ${slug}`);
  }
  const res = await fetch(`/blog/posts/${slug}.md`);
  if (!res.ok) throw new Error(`Failed to load post: ${slug}`);
  const text = await res.text();
  // SPA servers (Vite dev/preview, many static hosts) answer unknown paths
  // with index.html and a 200; never render that as a post.
  const contentType = res.headers?.get?.('content-type') || '';
  if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(text)) {
    throw new Error(`Post not found: ${slug}`);
  }
  return text;
}

/* Tab titles for blog views; restores the page's own title afterwards. */
const SITE_NAME = 'James Emerson Vo';
let baseTitle: string | null = null;

export function setBlogTitle(title: string | null): void {
  if (typeof document === 'undefined') return;
  if (baseTitle === null) baseTitle = document.title;
  document.title = title ? `${title} — ${SITE_NAME}` : baseTitle;
}

export function formatReadingTime(minutes: number | undefined): string {
  const value = Number(minutes);
  return Number.isFinite(value) && value > 0 ? `${Math.round(value)} min read` : '';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
