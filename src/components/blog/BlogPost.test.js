import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';

vi.mock('../../utils/blogLoader.ts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchBlogPost: vi.fn(async () => [
      '---',
      'title: Middle Post',
      'date: 2026-03-22',
      '---',
      '',
      'Some intro text.',
      '',
      '```javascript',
      'const answer = 42;',
      '```'
    ].join('\n')),
    fetchBlogIndex: vi.fn(async () => [
      { slug: 'newest', title: 'Newest Post', date: '2026-04-12' },
      { slug: 'middle', title: 'Middle Post', date: '2026-03-22' },
      { slug: 'oldest', title: 'Oldest Post', date: '2026-01-01' }
    ])
  };
});

import BlogPost from './BlogPost.svelte';

describe('BlogPost', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the post with prev/next navigation from the blog index', async () => {
    render(BlogPost, { props: { slug: 'middle' } });

    expect(await screen.findByText('Middle Post')).toBeInTheDocument();

    // Older neighbor (next entry in the newest-first index).
    expect(await screen.findByText('Oldest Post')).toBeInTheDocument();
    expect(screen.getByText(/OLDER/)).toBeInTheDocument();

    // Newer neighbor.
    expect(await screen.findByText('Newest Post')).toBeInTheDocument();
    expect(screen.getByText(/NEWER/)).toBeInTheDocument();
  });

  it('applies syntax highlighting to fenced code blocks', async () => {
    const { container } = render(BlogPost, { props: { slug: 'middle' } });

    await screen.findByText('Middle Post');
    await waitFor(() => {
      const keyword = container.querySelector('pre code .hljs-keyword');
      expect(keyword).not.toBeNull();
      expect(keyword.textContent).toBe('const');
    });
  });
});
