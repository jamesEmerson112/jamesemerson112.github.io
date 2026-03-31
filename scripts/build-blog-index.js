import fs from 'fs';
import path from 'path';
import { parseFrontmatter } from '../src/utils/frontmatter.js';

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
