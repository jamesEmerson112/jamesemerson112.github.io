import { beforeEach, describe, expect, it, vi } from 'vitest';

async function importBlogLoader() {
  vi.resetModules();
  return import('./blogLoader.ts');
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchBlogPost slug validation', () => {
  const invalidSlugs = ['../secrets', 'a/b', '', '.hidden', 'has space', '-leading', 'ünïcode'];

  it.each(invalidSlugs)('rejects invalid slug %j without fetching', async (slug) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { fetchBlogPost } = await importBlogLoader();

    await expect(fetchBlogPost(slug)).rejects.toThrow(/Invalid post slug/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches markdown for a valid slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Hello')
    });
    vi.stubGlobal('fetch', fetchMock);
    const { fetchBlogPost } = await importBlogLoader();

    await expect(fetchBlogPost('hello-world')).resolves.toBe('# Hello');
    expect(fetchMock).toHaveBeenCalledWith('/blog/posts/hello-world.md');
  });

  it('throws when the post request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const { fetchBlogPost } = await importBlogLoader();

    await expect(fetchBlogPost('missing-post')).rejects.toThrow(/Failed to load post/);
  });
});

describe('fetchBlogIndex', () => {
  it('fetches once and serves subsequent calls from cache', async () => {
    const posts = [{ slug: 'a', title: 'A', date: '2026-01-01', excerpt: '' }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(posts)
    });
    vi.stubGlobal('fetch', fetchMock);
    const { fetchBlogIndex } = await importBlogLoader();

    await expect(fetchBlogIndex()).resolves.toEqual(posts);
    await expect(fetchBlogIndex()).resolves.toEqual(posts);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/blog/index.json');
  });

  it('throws on a failed index request and does not poison the cache', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal('fetch', fetchMock);
    const { fetchBlogIndex } = await importBlogLoader();

    await expect(fetchBlogIndex()).rejects.toThrow(/Failed to load blog index: 500/);
    await expect(fetchBlogIndex()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('formatDate', () => {
  it('formats an ISO date as a long US date', async () => {
    const { formatDate } = await importBlogLoader();
    expect(formatDate('2026-01-05')).toBe('January 5, 2026');
  });
});
