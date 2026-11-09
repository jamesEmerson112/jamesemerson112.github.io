import { describe, expect, it } from 'vitest';
import DOMPurify from 'dompurify';
import { parseMathMarkdown } from './mathMarkdown.ts';

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

  it('survives DOMPurify sanitization', async () => {
    const html = DOMPurify.sanitize(await parseMathMarkdown('Inline $x^2$ here.'));
    expect(html).toContain('class="katex"');
  });

  it('shows parse errors inline instead of throwing', async () => {
    const html = await parseMathMarkdown('Broken $\\frac{1$ math');
    expect(html).toContain('katex-error');
  });
});
