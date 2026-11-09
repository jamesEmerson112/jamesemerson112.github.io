/* Math rendering for blog posts that opt in with `math: true` frontmatter.

   Lazy-loaded by BlogPost.svelte, so KaTeX (JS, CSS and self-hosted fonts —
   the CSP only allows font-src 'self') never loads for other pages.

   Syntax:
     $$ … $$   display math (on its own lines)
     $ … $     inline math. Pandoc rules: no space just inside the dollars and
               no digit right after the closing one, so prose like
               "costs $5 and $10" stays text. Write \$ for a literal dollar. */
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Marked } from 'marked';
import type { MarkedExtension } from 'marked';

function render(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, { displayMode, throwOnError: false });
}

export const mathExtension: MarkedExtension = {
  extensions: [
    {
      name: 'mathBlock',
      level: 'block',
      // Only a $$ at the start of a line can open display math, so a $$ in
      // prose or inside a code span never cuts a paragraph.
      start(src: string) {
        const match = /(?:^|\n)\$\$/.exec(src);
        if (!match) return undefined;
        return match.index + (match[0].startsWith('\n') ? 1 : 0);
      },
      // Content may span lines but not a blank line or another $$, and the
      // closing $$ must end its line — an unclosed $$ can't swallow the post.
      tokenizer(src: string) {
        const match = /^\$\$((?:[^$\n]|\$(?!\$)|\n(?![ \t]*\n))+?)\$\$[ \t]*(?:\n|$)/.exec(src);
        if (!match || !match[1].trim()) return undefined;
        return { type: 'mathBlock', raw: match[0], text: match[1].trim() };
      },
      renderer(token) {
        return `<div class="math-block">${render(String(token.text), true)}</div>\n`;
      }
    },
    {
      name: 'mathInline',
      level: 'inline',
      start(src: string) {
        const index = src.indexOf('$');
        return index < 0 ? undefined : index;
      },
      tokenizer(src: string) {
        // Escapes are consumed in pairs, the closing $ may not follow a
        // backslash, and a formula never runs into a code span (backtick).
        const match = /^\$(?!\s)((?:\\.|[^\\$\n`])+?)(?<![\s\\])\$(?!\d)/.exec(src);
        if (!match) return undefined;
        return { type: 'mathInline', raw: match[0], text: match[1] };
      },
      renderer(token) {
        return render(String(token.text), false);
      }
    }
  ]
};

const mathMarked = new Marked(mathExtension);

export async function parseMathMarkdown(content: string): Promise<string> {
  return mathMarked.parse(content);
}
