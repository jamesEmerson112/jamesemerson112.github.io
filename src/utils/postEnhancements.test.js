import { afterEach, describe, expect, it, vi } from 'vitest';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { enhancePostBody, collectHeadings } from './postEnhancements.ts';
import { reveal } from './reveal.ts';

function renderMarkdown(markdown) {
  const root = document.createElement('div');
  root.innerHTML = DOMPurify.sanitize(marked.parse(markdown));
  document.body.appendChild(root);
  enhancePostBody(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('enhancePostBody', () => {
  it('turns [!TYPE] blockquotes into labelled callouts and strips the marker', () => {
    const root = renderMarkdown('> [!WARNING]\n> Mind the **gap**.');
    const callout = root.querySelector('blockquote');

    expect(callout.classList.contains('callout')).toBe(true);
    expect(callout.classList.contains('callout-warning')).toBe(true);
    expect(callout.querySelector('.callout-title').textContent).toBe('Warning');
    expect(callout.textContent).not.toContain('[!WARNING]');
    // Inline formatting survives marker removal.
    expect(callout.querySelector('strong').textContent).toBe('gap');
  });

  it('leaves ordinary blockquotes alone', () => {
    const root = renderMarkdown('> Just a quote.');
    const quote = root.querySelector('blockquote');
    expect(quote.classList.contains('callout')).toBe(false);
    expect(quote.querySelector('.callout-title')).toBeNull();
  });

  it('wraps fenced code in a toolbar with the language and a working copy button', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const root = renderMarkdown('```python\nprint("hi")\n```');

    const block = root.querySelector('.code-block');
    expect(block).not.toBeNull();
    expect(block.querySelector('.code-block-lang').textContent).toBe('Python');
    expect(block.querySelector('pre code')).not.toBeNull();

    const button = block.querySelector('.code-copy');
    button.click();
    await vi.waitFor(() => expect(button.textContent).toBe('Copied'));
    expect(writeText).toHaveBeenCalledWith('print("hi")\n');
  });

  it('labels unlabeled code blocks generically', () => {
    const root = renderMarkdown('```\nplain output\n```');
    expect(root.querySelector('.code-block-lang').textContent).toBe('Code');
  });

  it('opens external links in a new tab with noopener noreferrer, but not internal ones', () => {
    const root = renderMarkdown('[out](https://example.com) and [in](#posts/hello-world)');
    const [external, internal] = root.querySelectorAll('a');

    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noopener noreferrer');
    expect(internal.hasAttribute('target')).toBe(false);
  });

  it('wraps tables for horizontal scrolling', () => {
    const root = renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |');
    const table = root.querySelector('table');
    expect(table.parentElement.classList.contains('table-wrap')).toBe(true);
  });

  it('turns a titled image into a captioned figure and lazy-loads images', () => {
    const root = renderMarkdown('![Alt text](/img.png "A caption")');
    const figure = root.querySelector('figure');

    expect(figure).not.toBeNull();
    expect(figure.querySelector('figcaption').textContent).toBe('A caption');
    expect(figure.querySelector('img').getAttribute('loading')).toBe('lazy');
    // The paragraph that only held the image is replaced, not left empty.
    expect(root.querySelector('p')).toBeNull();
  });

  it('is idempotent when run twice on the same DOM', () => {
    const root = renderMarkdown('```js\nconst a = 1;\n```\n\n| a |\n| - |\n| 1 |');
    enhancePostBody(root);
    expect(root.querySelectorAll('.code-block').length).toBe(1);
    expect(root.querySelectorAll('.table-wrap').length).toBe(1);
  });
});

describe('collectHeadings', () => {
  it('assigns prefixed, de-duplicated ids to h2/h3 and returns them in order', () => {
    const root = renderMarkdown('## Projects\n\ntext\n\n### Setup & Install\n\n## Projects\n\n#### Not included');
    const headings = collectHeadings(root);

    expect(headings).toEqual([
      { id: 'section-projects', text: 'Projects', level: 2 },
      { id: 'section-setup-install', text: 'Setup & Install', level: 3 },
      { id: 'section-projects-2', text: 'Projects', level: 2 }
    ]);
    // Never collides with the app's own section ids (#projects etc.).
    expect(root.querySelector('#projects')).toBeNull();
    expect(root.querySelector('#section-projects-2').tagName).toBe('H2');
  });
});

describe('reveal action', () => {
  it('is a no-op (content stays visible) without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const node = document.createElement('div');
    const handle = reveal(node, { delay: 100 });

    expect(node.classList.contains('reveal')).toBe(false);
    expect(handle).toEqual({});
  });

  it('is a no-op under prefers-reduced-motion', () => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} });
    vi.stubGlobal('matchMedia', (query) => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    const node = document.createElement('div');
    reveal(node);
    expect(node.classList.contains('reveal')).toBe(false);
  });
});
