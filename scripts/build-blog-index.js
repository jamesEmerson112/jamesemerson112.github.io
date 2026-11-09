import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/* Blog index builder.

   CLI:     npm run blog:index          (writes public/blog/index.json)
   Library: buildBlogIndex() / readBlogPosts() — used by the Vite plugin in
            vite.config.js to serve a live index (drafts included) in dev and to
            regenerate the published index on every production build.

   Frontmatter keys: title, date (YYYY-MM-DD), excerpt, tags, draft.
   `tags` accepts `[a, b]` or `a, b`. `draft: true` keeps a post out of the
   published index and out of the production build output. */

export const POSTS_DIR = path.resolve('public/blog/posts');
export const INDEX_PATH = path.resolve('public/blog/index.json');

const WORDS_PER_MINUTE = 230;

// Inlined from src/utils/frontmatter.ts (kept pure JS for Node script compatibility)
export function parseFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, content: normalized };

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

export function parseTagList(value) {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  const raw = String(value || '').trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!raw) return [];
  return raw
    .split(',')
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean);
}

export function isDraft(meta) {
  return String(meta?.draft || '').trim().toLowerCase() === 'true';
}

/* Minutes to read, counting prose words; fenced code counts at a third. */
export function estimateReadingMinutes(markdown) {
  const text = String(markdown || '');
  let codeWords = 0;
  const prose = text.replace(/```[\s\S]*?```/g, (block) => {
    codeWords += block.split(/\s+/).filter(Boolean).length;
    return ' ';
  });
  const proseWords = prose
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~[\]()-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = (proseWords + codeWords / 3) / WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}

export function readBlogPosts({ includeDrafts = false, postsDir = POSTS_DIR } = {}) {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8');
      const { meta, content } = parseFrontmatter(raw);
      if (!meta.title || !meta.date) {
        console.warn(`Skipping ${file}: missing title or date in frontmatter`);
        return null;
      }
      const draft = isDraft(meta);
      if (draft && !includeDrafts) return null;

      const post = {
        slug: file.replace(/\.md$/, ''),
        title: meta.title,
        date: meta.date,
        excerpt: meta.excerpt || '',
        tags: parseTagList(meta.tags),
        readingTime: estimateReadingMinutes(content)
      };
      if (draft) post.draft = true;
      return post;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || a.title.localeCompare(b.title));
}

/* Slugs of draft posts — the production build strips these files. */
export function listDraftSlugs({ postsDir = POSTS_DIR } = {}) {
  return readBlogPosts({ includeDrafts: true, postsDir })
    .filter((post) => post.draft)
    .map((post) => post.slug);
}

export function buildBlogIndex({ indexPath = INDEX_PATH, postsDir = POSTS_DIR } = {}) {
  const posts = readBlogPosts({ includeDrafts: false, postsDir });
  const next = JSON.stringify(posts, null, 2) + '\n';
  const current = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : '';
  if (current !== next) {
    fs.writeFileSync(indexPath, next);
  }
  return posts;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const posts = buildBlogIndex();
  const drafts = listDraftSlugs();
  console.log(`Built blog index: ${posts.length} post(s)${drafts.length ? `, ${drafts.length} draft(s) skipped` : ''}`);
}
