import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

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
  // Strip a UTF-8 BOM (PowerShell / older Notepad) and normalize CRLF.
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, content: normalized };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = unquote(line.slice(idx + 1).trim());
    meta[key] = val;
  }
  return { meta, content: match[2] };
}

function unquote(value) {
  const quoted = value.match(/^(['"])([\s\S]*)\1$/);
  return quoted ? quoted[2] : value;
}

/* Accept YYYY-MM-DD (also unpadded YYYY-M-D); null when not a real date. */
export function normalizeDate(value) {
  const match = String(value ?? '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const [year, month, day] = [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')];
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
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

function readPostFiles(postsDir) {
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8');
      return { file, slug: file.replace(/\.md$/, ''), ...parseFrontmatter(raw) };
    });
}

export function readBlogPosts({ includeDrafts = false, postsDir = POSTS_DIR } = {}) {
  return readPostFiles(postsDir)
    .map(({ file, slug, meta, content }) => {
      const date = normalizeDate(meta.date);
      if (!meta.title || !date) {
        console.warn(`Skipping ${file}: needs a title and a date in YYYY-MM-DD form`);
        return null;
      }
      const draft = isDraft(meta);
      if (draft && !includeDrafts) return null;

      const post = {
        slug,
        title: meta.title,
        date,
        excerpt: meta.excerpt || '',
        tags: parseTagList(meta.tags),
        readingTime: estimateReadingMinutes(content)
      };
      if (draft) post.draft = true;
      return post;
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

/* Slugs of draft posts — the production build strips these files. Decided
   from frontmatter alone, so a draft with a missing/bad date still never ships. */
export function listDraftSlugs({ postsDir = POSTS_DIR } = {}) {
  return readPostFiles(postsDir)
    .filter(({ meta }) => isDraft(meta))
    .map(({ slug }) => slug);
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

/* ─── RSS ─────────────────────────────────────────────────────── */

const FEED_TITLE = 'James Emerson Vo — Writing';
const FEED_DESCRIPTION = 'Notes at the intersection of neuroscience, machine learning, and the things I build.';

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(value) {
  return `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/* Site origin for absolute links: SITE_URL env, else the canonical link in
   index.html, so the feed follows whatever domain the site declares. */
export function resolveSiteUrl(indexHtmlPath = path.resolve('index.html')) {
  const fromEnv = process.env.SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '') + '/';
  try {
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    const match = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (match) return match[1].replace(/\/+$/, '') + '/';
  } catch {
    // Fall through to the default.
  }
  return 'https://jamesemerson112.github.io/';
}

export function renderBlogFeed({ siteUrl = resolveSiteUrl(), postsDir = POSTS_DIR, limit = 20 } = {}) {
  const posts = readBlogPosts({ includeDrafts: false, postsDir }).slice(0, limit);
  const absolutize = (html) => html.replace(/(src|href)="\/(?!\/)/g, `$1="${siteUrl}`);

  const items = posts.map((post) => {
    const raw = fs.readFileSync(path.join(postsDir, `${post.slug}.md`), 'utf-8');
    const { content } = parseFrontmatter(raw);
    const body = absolutize(marked.parse(content.replace(/^\s*#\s+.*\n/, '')));
    const link = `${siteUrl}#posts/${post.slug}`;
    const categories = post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n');
    return [
      '    <item>',
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>`,
      `      <description>${escapeXml(post.excerpt)}</description>`,
      categories,
      `      <content:encoded>${cdata(body)}</content:encoded>`,
      '    </item>'
    ].filter(Boolean).join('\n');
  });

  const lastBuild = posts[0] ? new Date(`${posts[0].date}T00:00:00Z`).toUTCString() : new Date(0).toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(`${siteUrl}#posts`)}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteUrl}blog/feed.xml`)}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const posts = buildBlogIndex();
  const drafts = listDraftSlugs();
  console.log(`Built blog index: ${posts.length} post(s)${drafts.length ? `, ${drafts.length} draft(s) skipped` : ''}`);
}
