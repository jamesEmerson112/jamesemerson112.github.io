import type { BlogPostMeta } from '../types.js';

export { parseFrontmatter } from './frontmatter.ts';

let cachedIndex: BlogPostMeta[] | null = null;

export async function fetchBlogIndex(): Promise<BlogPostMeta[]> {
  if (cachedIndex) return cachedIndex;
  const res = await fetch('/blog/index.json');
  if (!res.ok) throw new Error(`Failed to load blog index: ${res.status}`);
  cachedIndex = await res.json();
  return cachedIndex!;
}

export async function fetchBlogPost(slug: string): Promise<string> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug)) {
    throw new Error(`Invalid post slug: ${slug}`);
  }
  const res = await fetch(`/blog/posts/${slug}.md`);
  if (!res.ok) throw new Error(`Failed to load post: ${slug}`);
  return res.text();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
