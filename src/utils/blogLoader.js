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

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    meta[key] = val;
  }
  return { meta, content: match[2] };
}

export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
