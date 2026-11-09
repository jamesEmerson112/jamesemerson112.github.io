// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listDraftSlugs, readBlogPosts, renderBlogFeed } from './build-blog-index.js';

let dir;

function write(name, body) {
  fs.writeFileSync(path.join(dir, name), body);
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-posts-'));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('readBlogPosts', () => {
  it('handles BOM, CRLF, quoted values and unpadded dates', () => {
    write('bom.md', '﻿---\r\ntitle: "Part 1: Intro"\r\ndate: 2026-1-5\r\ntags: [ml, notes]\r\n---\r\nBody\r\n');
    write('quoted.md', "---\ntitle: 'Quoted'\ndate: \"2026-02-10\"\nexcerpt: \"Hi\"\n---\nBody\n");

    const posts = readBlogPosts({ postsDir: dir });

    expect(posts.map((post) => [post.slug, post.title, post.date])).toEqual([
      ['quoted', 'Quoted', '2026-02-10'],
      ['bom', 'Part 1: Intro', '2026-01-05']
    ]);
    expect(posts[1].tags).toEqual(['ml', 'notes']);
    expect(posts[0].excerpt).toBe('Hi');
  });

  it('skips posts with impossible dates instead of emitting Invalid Date', () => {
    write('bad.md', '---\ntitle: Bad\ndate: 2026-02-31\n---\nBody\n');
    expect(readBlogPosts({ postsDir: dir })).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });

  it('treats quoted "true" as a draft and keeps drafts out unless asked', () => {
    write('draft.md', '---\ntitle: Draft\ndate: 2026-03-01\ndraft: "true"\n---\nBody\n');
    expect(readBlogPosts({ postsDir: dir })).toEqual([]);
    expect(readBlogPosts({ postsDir: dir, includeDrafts: true })[0]).toMatchObject({ slug: 'draft', draft: true });
  });
});

describe('listDraftSlugs', () => {
  it('finds drafts even when the rest of the frontmatter is invalid, BOM included', () => {
    write('no-date.md', '﻿---\ntitle: Unfinished\ndraft: true\n---\nBody\n');
    write('published.md', '---\ntitle: Live\ndate: 2026-03-01\n---\nBody\n');
    expect(listDraftSlugs({ postsDir: dir })).toEqual(['no-date']);
  });
});

describe('renderBlogFeed', () => {
  it('emits valid dates and escapes titles', () => {
    write('a.md', '---\ntitle: Fish & Chips <3\ndate: 2026-1-5\n---\nHello ]]> world\n');
    const xml = renderBlogFeed({ postsDir: dir, siteUrl: 'https://example.com/' });

    expect(xml).not.toContain('Invalid Date');
    expect(xml).toContain('<pubDate>Mon, 05 Jan 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('<title>Fish &amp; Chips &lt;3</title>');
    expect(xml).toContain('<link>https://example.com/#posts/a</link>');
  });
});
