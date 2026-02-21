#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'svelte/compiler';

const args = process.argv.slice(2);
const writeMode = args.includes('--write');
const inputArgs = args.filter((arg) => arg !== '--write');
const targets = inputArgs.length > 0 ? inputArgs : ['src'];

async function main() {
  const files = await collectSvelteFiles(targets);

  if (files.length === 0) {
    console.log('No .svelte files found.');
    return;
  }

  let totalReplacements = 0;
  let changedFiles = 0;

  for (const filePath of files) {
    const source = await fs.readFile(filePath, 'utf8');
    const ast = parse(source, { filename: filePath });
    const replacementStarts = [];

    walkAst(ast, (node) => {
      if (!node || typeof node !== 'object' || !Array.isArray(node.attributes)) {
        return;
      }

      for (const attribute of node.attributes) {
        if (!attribute || attribute.type !== 'Attribute' || attribute.name !== 'name') {
          continue;
        }

        const start = Number(attribute.start);
        if (!Number.isFinite(start)) {
          continue;
        }

        // Only rename the attribute key token, preserving original value/expression.
        if (source.slice(start, start + 4) === 'name') {
          replacementStarts.push(start);
        }
      }
    });

    if (replacementStarts.length === 0) {
      continue;
    }

    let output = source;
    for (const start of replacementStarts.sort((a, b) => b - a)) {
      output = `${output.slice(0, start)}data-name${output.slice(start + 4)}`;
    }

    changedFiles += 1;
    totalReplacements += replacementStarts.length;

    if (writeMode) {
      await fs.writeFile(filePath, output, 'utf8');
      console.log(`updated: ${toRelative(filePath)} (+${replacementStarts.length})`);
    } else {
      console.log(`would update: ${toRelative(filePath)} (+${replacementStarts.length})`);
    }
  }

  if (writeMode) {
    console.log(`Done. Updated ${changedFiles} file(s), ${totalReplacements} replacement(s).`);
  } else {
    console.log(`Dry run. Would update ${changedFiles} file(s), ${totalReplacements} replacement(s).`);
  }
}

async function collectSvelteFiles(inputTargets) {
  const results = [];

  for (const target of inputTargets) {
    const resolved = path.resolve(process.cwd(), target);
    let stats;
    try {
      stats = await fs.stat(resolved);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      await walkDirectory(resolved, results);
      continue;
    }

    if (stats.isFile() && resolved.endsWith('.svelte')) {
      results.push(resolved);
    }
  }

  results.sort();
  return results;
}

async function walkDirectory(directoryPath, results) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, results);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.svelte')) {
      results.push(fullPath);
    }
  }
}

function walkAst(node, visit) {
  if (!node || typeof node !== 'object') {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      walkAst(item, visit);
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

function toRelative(filePath) {
  const relative = path.relative(process.cwd(), filePath);
  return relative.length === 0 ? filePath : relative;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
