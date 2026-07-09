// @vitest-environment node
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse, preprocess } from 'svelte/compiler';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const preprocessor = vitePreprocess();

async function collectSvelteFiles(rootDirectory) {
  const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSvelteFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.svelte')) {
      files.push(fullPath);
    }
  }

  return files;
}

function walkAst(node, visit) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      walkAst(child, visit);
    }
    return;
  }

  visit(node);

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') {
      continue;
    }
    walkAst(value, visit);
  }
}

describe('markup attribute contract', () => {
  it('does not use raw name attributes in Svelte markup selectors', async () => {
    const srcDirectory = path.join(process.cwd(), 'src');
    const svelteFiles = await collectSvelteFiles(srcDirectory);
    const violations = [];

    for (const filePath of svelteFiles) {
      const source = await fs.readFile(filePath, 'utf8');
      const processed = await preprocess(source, preprocessor, { filename: filePath });
      const ast = parse(processed.code, { filename: filePath });

      walkAst(ast, (node) => {
        if (!node || typeof node !== 'object' || !Array.isArray(node.attributes)) {
          return;
        }

        for (const attribute of node.attributes) {
          if (attribute?.type === 'Attribute' && attribute?.name === 'name') {
            violations.push(path.relative(process.cwd(), filePath));
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('keeps viewport meta name semantic attribute in privacy html', async () => {
    const privacyPath = path.join(process.cwd(), 'public', 'privacy.html');
    const privacyHtml = await fs.readFile(privacyPath, 'utf8');

    expect(privacyHtml).toMatch(/<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1\.0">/i);
  });
});
