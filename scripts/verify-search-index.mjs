/**
 * Is the committed index still true?
 *
 *   pnpm verify:search-index
 *
 * Three failures it exists to catch, each of which is silent otherwise:
 *
 * 1. **Stale.** Somebody edited a page and did not re-run the build. The chat then answers from
 *    the previous wording, which is worse than not answering, because it looks correct.
 * 2. **A page with no chunks.** The whole requirement is that every page is answerable. A page
 *    that chunked to nothing is a question nobody can ask, and nothing else would report it.
 * 3. **Shape drift.** Model name or dimensions changed. Cosine between a 384-dim query and a
 *    256-dim row does not throw; it compares the overlap and returns a plausible number.
 *
 * Runs in CI, where it needs no model: it re-chunks the content and compares hashes, which is
 * text processing only.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentHash, MODELS } from './build-search-index.mjs';
import { chunkPage } from '../lib/assistant/chunk.ts';
import { readdirSync, statSync } from 'node:fs';
import { relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const CONTENT = join(ROOT, 'content', 'docs');

function pages() {
  const found = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith('.mdx')) continue;
      const rel = relative(CONTENT, full).replace(/\\/g, '/');
      const dotted = /\.([a-z]{2})\.mdx$/.exec(rel);
      const lang = dotted ? dotted[1] : 'en';
      const slug = rel.replace(/\.([a-z]{2})\.mdx$/, '').replace(/\.mdx$/, '');
      const clean = slug.replace(/(^|\/)index$/, '');
      const path = clean.length > 0 ? `/${clean}` : '/';
      const url = lang === 'en' ? path : `/${lang}${path === '/' ? '' : path}`;
      found.push({ file: full, url, lang, raw: readFileSync(full, 'utf8') });
    }
  };
  walk(CONTENT);
  return found.sort((a, b) => a.url.localeCompare(b.url));
}

const fail = [];
const docs = pages();

for (const model of MODELS) {
  const index = JSON.parse(readFileSync(join(ROOT, 'lib', 'assistant', model.file), 'utf8'));

  if (index.model !== model.id) {
    fail.push(`${model.file}: built by ${index.model}, expected ${model.id}`);
  }
  if (index.dimensions !== 384) fail.push(`${model.file}: unexpected dimensions ${index.dimensions}`);
  if ((index.queryPrefix ?? '') !== model.query) {
    fail.push(`${model.file}: query prefix drift`);
  }

  const expected = contentHash(docs);
  if (index.contentHash !== expected) {
    fail.push(
      `${model.file} is stale: content hashes to ${expected}, index claims ${index.contentHash}.\n` +
        `  Run: pnpm build:search-index`,
    );
  }

  const vectorBytes = Buffer.from(index.vectors, 'base64').byteLength;
  if (vectorBytes !== index.chunks.length * index.dimensions) {
    fail.push(
      `${model.file}: vector matrix is ${vectorBytes} bytes, expected ` +
        `${index.chunks.length * index.dimensions}`,
    );
  }

  // Every page has to be reachable in the language this index serves.
  const covered = new Set(index.chunks.map((c) => c.u));
  const vi = model.file.includes('.vi.');
  for (const d of docs) {
    if (vi && d.lang !== 'en') continue;
    const produced = chunkPage({ raw: d.raw, url: d.url, lang: d.lang });
    if (produced.length === 0) {
      fail.push(`page chunks to nothing: ${relative(ROOT, d.file)}`);
      continue;
    }
    const want = vi ? (d.url === '/' ? '/vi' : `/vi${d.url}`) : d.url;
    if (!covered.has(want)) fail.push(`${model.file}: page missing — ${want}`);
  }
}

if (fail.length > 0) {
  console.error('search index verification failed:\n' + fail.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

console.log(
  `search indexes ok — ${docs.length} page files, ${MODELS.length} indexes, every page covered ` +
    `in both languages`,
);
