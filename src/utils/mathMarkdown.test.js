import { describe, expect, it } from 'vitest';
import DOMPurify from 'dompurify';
import { parseMathMarkdown } from './mathMarkdown.ts';
import { POST_SANITIZE_OPTIONS } from './postEnhancements.ts';

const countDisplay = (html) => (html.match(/class="katex-display"/g) || []).length;

describe('parseMathMarkdown', () => {
  it('renders inline and display math with KaTeX', async () => {
    const html = await parseMathMarkdown('Softmax $p_i$ is:\n\n$$\np_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}\n$$\n');

    expect(html).toContain('class="katex"');
    expect(html).toContain('<div class="math-block">');
    expect(html).toContain('katex-display');
  });

  it('leaves prices and other prose dollars alone', async () => {
    const html = await parseMathMarkdown('It costs $5 and $10, or $0.50 ÷ 3 ≈ $0.17 per view.');

    expect(html).not.toContain('katex');
    expect(html).toContain('$5 and $10');
  });

  it('never closes a formula on an escaped dollar', async () => {
    const html = await parseMathMarkdown('It costs $10. Write `\\$` for a literal dollar, like \\$3.');

    expect(html).not.toContain('katex');
    expect(html).toContain('<code>\\$</code>');
  });

  it('allows escaped dollars inside a formula', async () => {
    const html = await parseMathMarkdown('Price $p = \\$5$ total.');
    expect(html).toContain('class="katex"');
  });

  it('does not open display math from a $$ inside a sentence or code span', async () => {
    const html = await parseMathMarkdown('Wrap display math in `$$` on its own lines:\n\n$$\nE = mc^2\n$$\n');

    expect(html).toContain('<code>$$</code>');
    expect(html).toContain('on its own lines:');
    expect(countDisplay(html)).toBe(1);
  });

  it('never lets display math cross a blank line or an improperly closed $$', async () => {
    const html = await parseMathMarkdown('$$\na\n$$.\n\nProse here.\n\n$$\nb\n$$\n\n$$\nunclosed\n\nLast paragraph.\n');

    expect(countDisplay(html)).toBe(1);
    expect(html).toMatch(/<p>Prose here\.<\/p>/);
    expect(html).toMatch(/<p>Last paragraph\.<\/p>/);
  });

  it('never pairs an inline $ with a dollar inside a code span', async () => {
    const html = await parseMathMarkdown('It costs about $5/month on a VPS; set `$PORT` to change it.');

    expect(html).not.toContain('katex');
    expect(html).toContain('<code>$PORT</code>');
  });

  it('drops the TeX annotation when sanitized with the post options', async () => {
    const container = document.createElement('div');
    container.innerHTML = DOMPurify.sanitize(await parseMathMarkdown('Half is $\\frac{1}{2}$.'), POST_SANITIZE_OPTIONS);

    expect(container.querySelector('.katex')).not.toBeNull();
    expect(container.textContent).not.toContain('\\frac');
  });

  it('survives DOMPurify sanitization', async () => {
    const html = DOMPurify.sanitize(await parseMathMarkdown('Inline $x^2$ here.'));
    expect(html).toContain('class="katex"');
  });

  it('shows parse errors inline instead of throwing', async () => {
    const html = await parseMathMarkdown('Broken $\\frac{1$ math');
    expect(html).toContain('katex-error');
  });
});
