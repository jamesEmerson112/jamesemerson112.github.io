export { parseFrontmatter } from './frontmatter.ts';

let cachedIndex = null;

export async function fetchBlogIndex() {
  if (cachedIndex) return cachedIndex;
  const res = await fetch('/blog/index.json');
  if (!res.ok) throw new Error(`Failed to load blog index: ${res.status}`);
  cachedIndex = await res.json();
  return cachedIndex;
}

export async function fetchBlogPost(slug) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug)) {
    throw new Error(`Invalid post slug: ${slug}`);
  }
  const res = await fetch(`/blog/posts/${slug}.md`);
  if (!res.ok) throw new Error(`Failed to load post: ${slug}`);
  return res.text();
}

export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
