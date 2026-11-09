/* Post-render enhancements for sanitized blog HTML.

   Runs on the live DOM after {@html} renders (everything here operates on
   already-sanitized nodes, so no untrusted HTML is introduced):
   - external links open in a new tab with rel="noopener noreferrer"
   - GitHub-style callouts: a blockquote starting with [!NOTE], [!TIP],
     [!IMPORTANT], [!WARNING] or [!CAUTION]
   - fenced code blocks get a toolbar with the language and a copy button
   - tables scroll horizontally inside a wrapper on narrow screens
   - images load lazily; an image title becomes a caption */

/* DOMPurify options for post HTML. KaTeX output carries the TeX source in a
   MathML <annotation>; DOMPurify removes the tag but keeps its text, which
   screen readers then announce after every formula. Drop the contents too. */
export const POST_SANITIZE_OPTIONS = { ADD_FORBID_CONTENTS: ['annotation'] };

const CALLOUT_TYPES: Record<string, string> = {
  NOTE: 'Note',
  TIP: 'Tip',
  IMPORTANT: 'Important',
  WARNING: 'Warning',
  CAUTION: 'Caution'
};

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  sh: 'Shell',
  bash: 'Bash',
  shell: 'Shell',
  json: 'JSON',
  html: 'HTML',
  xml: 'XML',
  css: 'CSS',
  rust: 'Rust',
  rs: 'Rust',
  text: 'Text',
  plaintext: 'Text'
};

function enhanceLinks(root: HTMLElement): void {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const href = link.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

function enhanceCallouts(root: HTMLElement): void {
  for (const quote of root.querySelectorAll<HTMLElement>('blockquote')) {
    const first = quote.firstElementChild;
    if (!first || first.tagName !== 'P') continue;
    const match = (first.textContent || '').match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
    if (!match) continue;

    const type = match[1].toUpperCase();
    // Strip the marker from the first text node, keeping inline formatting.
    const walker = document.createTreeWalker(first, NodeFilter.SHOW_TEXT);
    const textNode = walker.nextNode();
    if (textNode) {
      textNode.textContent = (textNode.textContent || '').replace(/^\s*\[![A-Za-z]+\]\s*/, '');
    }
    if (!first.textContent?.trim() && first.children.length === 0) {
      first.remove();
    }

    quote.classList.add('callout', `callout-${type.toLowerCase()}`);
    const label = document.createElement('div');
    label.className = 'callout-title';
    label.textContent = CALLOUT_TYPES[type];
    quote.prepend(label);
  }
}

function languageOf(code: Element): string {
  const match = Array.from(code.classList).find((name) => name.startsWith('language-'));
  if (!match) return '';
  const key = match.slice('language-'.length).toLowerCase();
  return LANGUAGE_LABELS[key] || key;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

function enhanceCodeBlocks(root: HTMLElement): void {
  for (const pre of root.querySelectorAll<HTMLPreElement>('pre')) {
    if (pre.parentElement?.classList.contains('code-block')) continue;
    const code = pre.querySelector('code');
    if (!code) continue;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';

    const bar = document.createElement('div');
    bar.className = 'code-block-bar';

    const label = document.createElement('span');
    label.className = 'code-block-lang';
    label.textContent = languageOf(code) || 'Code';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    let resetTimer = 0;
    button.addEventListener('click', async () => {
      const ok = await copyText(code.textContent || '');
      button.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      button.classList.toggle('is-copied', ok);
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('is-copied');
      }, 1800);
    });

    bar.append(label, button);
    pre.replaceWith(wrapper);
    wrapper.append(bar, pre);
    // Wide code scrolls horizontally; keyboard users need to reach it.
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', `${label.textContent} code`);
  }
}

function enhanceTables(root: HTMLElement): void {
  for (const table of root.querySelectorAll<HTMLTableElement>('table')) {
    if (table.parentElement?.classList.contains('table-wrap')) continue;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrap';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Table');
    table.replaceWith(wrapper);
    wrapper.append(table);
  }
}

function enhanceImages(root: HTMLElement): void {
  for (const image of root.querySelectorAll<HTMLImageElement>('img')) {
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');
    const caption = image.getAttribute('title');
    if (!caption || image.closest('figure')) continue;

    const figure = document.createElement('figure');
    const figcaption = document.createElement('figcaption');
    figcaption.textContent = caption;
    const parent = image.parentElement;
    // An image alone in its paragraph: replace the paragraph with the figure.
    if (parent && parent.tagName === 'P' && parent.childNodes.length === 1) {
      parent.replaceWith(figure);
    } else {
      image.replaceWith(figure);
    }
    figure.append(image, figcaption);
  }
}

export interface PostHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/* Give h2/h3 headings stable ids and return them for a table of contents.
   Ids are prefixed so they can never collide with the app's section ids. */
export function collectHeadings(root: HTMLElement | null): PostHeading[] {
  if (!root) return [];
  const used = new Set<string>();
  const headings: PostHeading[] = [];
  for (const heading of root.querySelectorAll<HTMLElement>('h2, h3')) {
    const text = (heading.textContent || '').trim();
    if (!text) continue;
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'heading';
    const base = `section-${slug}`;
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    heading.id = id;
    headings.push({ id, text, level: heading.tagName === 'H2' ? 2 : 3 });
  }
  return headings;
}

function enhanceTaskLists(root: HTMLElement): void {
  for (const box of root.querySelectorAll<HTMLInputElement>('li > input[type="checkbox"]')) {
    const text = (box.parentElement?.textContent || '').trim();
    if (text && !box.hasAttribute('aria-label')) box.setAttribute('aria-label', text);
  }
}

function enhanceMath(root: HTMLElement): void {
  for (const block of root.querySelectorAll<HTMLElement>('.math-block')) {
    block.tabIndex = 0;
  }
}

export function enhancePostBody(root: HTMLElement | null): void {
  if (!root) return;
  enhanceLinks(root);
  enhanceTaskLists(root);
  enhanceMath(root);
  enhanceCallouts(root);
  enhanceCodeBlocks(root);
  enhanceTables(root);
  enhanceImages(root);
}

export { copyText };
