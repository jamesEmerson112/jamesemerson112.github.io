---
title: Markdown Style Guide
date: 2026-11-09
updated: 2026-11-10
excerpt: Every element a post can use, rendered with the site's styles. A draft, so it only appears on the dev server.
tags: [meta, reference]
math: true
draft: true
---

The first paragraph is the lead: it renders slightly larger and brighter, so open with the hook. This file is a **draft**, which means it shows up on `npm run dev` with a badge but never ships to production. Keep it around as a reference while writing.

## Headings

Use `##` for sections and `###` for subsections. The title comes from frontmatter, so a leading `# Heading` in the body is hidden automatically.

### A subsection

#### A mono kicker (h4)

Regular paragraph text with *emphasis*, **strong text**, ~~strikethrough~~, `inline code`, a [link to the blog index](#posts) and an [external link](https://karpathy.ai/) that opens in a new tab. Keyboard shortcuts read well as <kbd>Ctrl</kbd> + <kbd>K</kbd>, and <mark>highlighted text</mark> uses raw `<mark>` tags.

## Lists

- Unordered items get accent markers
- Keep items short and parallel
  - Nested lists work too
- Third item

1. Ordered lists use mono numerals
2. Good for steps and procedures
3. Third step

- [x] Task lists render checkboxes
- [ ] Unchecked items stay open

## Code

Fenced blocks get syntax highlighting, a language label and a copy button:

```python
import torch
import torch.nn as nn

class TinyNet(nn.Module):
    def __init__(self, dim: int = 64):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(dim, dim), nn.ReLU(), nn.Linear(dim, 1))

    def forward(self, x):
        return self.net(x)  # shape: (batch, 1)
```

```typescript
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}
```

```bash
npm run blog:new -- "My Next Post"
```

## Math

Add `math: true` to the frontmatter and write TeX. Inline math like $\sigma(x) = \frac{1}{1 + e^{-x}}$ sits in the sentence; display math goes on its own lines:

$$
\operatorname{softmax}(z)_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}
$$

Prices stay prose even in math posts: it costs $5 and $10. Write `\$` for a literal dollar sign next to a number, like \$3.

## Quotes and callouts

> A plain blockquote becomes a pull quote. Use it for the one line you want readers to remember.

> [!NOTE]
> Start a blockquote with `[!NOTE]` for neutral context.

> [!TIP]
> `[!TIP]` is for shortcuts and recommendations.

> [!IMPORTANT]
> `[!IMPORTANT]` flags something readers must not miss.

> [!WARNING]
> `[!WARNING]` is for pitfalls and sharp edges.

> [!CAUTION]
> `[!CAUTION]` is for destructive or risky actions.

## Tables

| Model     | Params | Top-1 | Notes                      |
| --------- | -----: | ----: | -------------------------- |
| TinyNet   |   8.4K | 71.2% | Baseline from this post    |
| ResNet-18 |  11.7M | 69.8% | Reference implementation   |
| ViT-S/16  |  22.1M | 79.9% | Needs more data to shine   |

## Images

Add a title in quotes and it becomes a caption:

![Social preview card](/og-image.png "Images get rounded corners and an optional caption from the title")

---

A horizontal rule renders as a quiet section break. End posts with a short takeaway; the footer adds copy-link and share buttons (X, LinkedIn), the RSS feed, and links to the neighbouring posts.
