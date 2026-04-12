import fs from 'fs';
import path from 'path';

// Inlined from src/utils/frontmatter.ts (kept pure JS for Node script compatibility)
function parseFrontmatter(raw) {
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

const POSTS_DIR = path.resolve('public/blog/posts');
const INDEX_PATH = path.resolve('public/blog/index.json');

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

const posts = files
  .map(file => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { meta } = parseFrontmatter(raw);
    if (!meta.title || !meta.date) {
      console.warn(`Skipping ${file}: missing title or date in frontmatter`);
      return null;
    }
    return {
      slug: file.replace(/\.md$/, ''),
      title: meta.title,
      date: meta.date,
      excerpt: meta.excerpt || ''
    };
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(INDEX_PATH, JSON.stringify(posts, null, 2) + '\n');
console.log(`Built blog index: ${posts.length} post(s)`);
