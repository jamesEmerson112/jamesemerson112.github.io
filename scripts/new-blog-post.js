import fs from 'fs';
import path from 'path';
import { POSTS_DIR } from './build-blog-index.js';

/* Scaffold a new blog post.

   npm run blog:new -- "My Post Title"
   npm run blog:new -- "My Post Title" --slug=custom-slug

   Creates public/blog/posts/<slug>.md as a draft. Drafts show up (badged) on
   the dev server but stay out of the published index and the production
   build. Flip `draft: true` to `false` (or delete the line) to publish. */

const args = process.argv.slice(2);
const slugArg = args.find((arg) => arg.startsWith('--slug='));
const title = args.filter((arg) => !arg.startsWith('--')).join(' ').trim();

if (!title) {
  console.error('Usage: npm run blog:new -- "My Post Title" [--slug=my-post]');
  process.exit(1);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '');
}

const slug = slugArg ? slugify(slugArg.slice('--slug='.length)) : slugify(title);
if (!/^[a-z0-9][a-z0-9_-]*$/.test(slug)) {
  console.error(`Could not derive a valid slug from "${title}". Pass one with --slug=my-post.`);
  process.exit(1);
}

const filePath = path.join(POSTS_DIR, `${slug}.md`);
if (fs.existsSync(filePath)) {
  console.error(`A post already exists at ${path.relative(process.cwd(), filePath)}`);
  process.exit(1);
}

const now = new Date();
const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
].join('-');
const safeTitle = title.replace(/\r?\n/g, ' ');

const template = `---
title: ${safeTitle}
date: ${today}
excerpt: One or two sentences that sell the post in the list view.
tags: [notes]
draft: true
---

Open with the hook: what you set out to do, and why it matters.

## The problem

Set up the context. Short paragraphs read best on this layout.

## What I tried

\`\`\`python
# Fenced code blocks get syntax highlighting and a copy button.
print("hello, world")
\`\`\`

> [!NOTE]
> Callouts: start a blockquote with [!NOTE], [!TIP] or [!WARNING].

## What I learned

Wrap up with the takeaway.
`;

fs.mkdirSync(POSTS_DIR, { recursive: true });
fs.writeFileSync(filePath, template);

const relative = path.relative(process.cwd(), filePath);
console.log(`Created ${relative} (draft)`);
console.log(`Preview: npm run dev, then open http://localhost:5173/#posts/${slug}`);
console.log('Publish: set "draft: false" (or remove the line), then commit and push.');
