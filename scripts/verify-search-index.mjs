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
import { contentHash, MODEL } from './build-search-index.mjs';
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
const index = JSON.parse(readFileSync(join(ROOT, 'lib', 'assistant', 'search-index.json'), 'utf8'));
const docs = pages();

if (index.model !== MODEL) fail.push(`model drift: index has ${index.model}, build script uses ${MODEL}`);
if (index.dimensions !== 384) fail.push(`unexpected dimensions: ${index.dimensions}`);

const expected = contentHash(docs);
if (index.contentHash !== expected) {
  fail.push(
    `index is stale: content hashes to ${expected}, index claims ${index.contentHash}.\n` +
      `  Run: pnpm build:search-index`,
  );
}

const covered = new Set(index.chunks.map((c) => c.u));
for (const d of docs) {
  const produced = chunkPage({ raw: d.raw, url: d.url, lang: d.lang });
  if (produced.length === 0) fail.push(`page chunks to nothing: ${relative(ROOT, d.file)}`);
  else if (!covered.has(d.url)) fail.push(`page missing from index: ${d.url}`);
}

const vectorBytes = Buffer.from(index.vectors, 'base64').byteLength;
if (vectorBytes !== index.chunks.length * index.dimensions) {
  fail.push(
    `vector matrix is ${vectorBytes} bytes, expected ${index.chunks.length * index.dimensions}`,
  );
}

if (fail.length > 0) {
  console.error('search index verification failed:\n' + fail.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

console.log(
  `search index ok — ${docs.length} pages, ${index.chunks.length} chunks, ` +
    `${index.dimensions} dims, every page covered`,
);
