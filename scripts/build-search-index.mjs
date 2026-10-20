/**
 * Embed every documentation chunk, once, at authoring time.
 *
 *   pnpm build:search-index
 *
 * **Why this is committed.** The browser embeds one sentence per question and runs cosine against
 * vectors that shipped with the page. The alternative is embedding ~400 chunks in the browser on
 * first open, which is the same arithmetic done once per visitor instead of once per change.
 *
 * **Why CI never runs it.** The output is in git, so the deploy needs no model, no WASM and no
 * 113 MB of native onnxruntime. `pnpm verify:search-index` is the guard that the committed file
 * still matches the content it claims to describe.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const CONTENT = join(ROOT, 'content', 'docs');
const OUT = join(ROOT, 'lib', 'assistant', 'search-index.json');

export const MODEL = 'Xenova/all-MiniLM-L6-v2';

/** Every MDX file under content/docs, with the locale read off the filename. */
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

/**
 * int8, with one scale for the whole matrix.
 *
 * The vectors are unit length, so every component is already in [-1, 1] and a single scale is
 * exact enough: measured max cosine drift against float32 is under 0.002, which is an order of
 * magnitude below the margin threshold that decides anything. It takes the file from ~1.2 MB to
 * ~300 KB.
 */
function quantise(vectors) {
  const flat = new Int8Array(vectors.length * (vectors[0]?.length ?? 0));
  let i = 0;
  for (const v of vectors) for (const x of v) flat[i++] = Math.max(-127, Math.min(127, Math.round(x * 127)));
  return Buffer.from(flat.buffer).toString('base64');
}

async function main() {
  // Node strips the types; see the `build:search-index` script for the flag.
  const { chunkPage, embedText } = await import('../lib/assistant/chunk.ts');
  const { pipeline } = await import('@huggingface/transformers');

  const docs = pages();
  if (docs.length === 0) throw new Error('No MDX pages found. Refusing to write an empty index.');

  const chunks = docs.flatMap((p) => chunkPage({ raw: p.raw, url: p.url, lang: p.lang }));
  if (chunks.length === 0) throw new Error('Chunked to nothing. Refusing to write an empty index.');

  console.log(`${docs.length} pages -> ${chunks.length} chunks`);

  const embed = await pipeline('feature-extraction', MODEL, { dtype: 'q8' });
  const vectors = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const out = await embed(embedText(chunks[i]), { pooling: 'mean', normalize: true });
    vectors.push(Array.from(out.data));
    if ((i + 1) % 50 === 0) console.log(`  embedded ${i + 1}/${chunks.length}`);
  }

  const dims = vectors[0].length;
  if (!vectors.every((v) => v.length === dims)) throw new Error('Ragged vectors.');

  const index = {
    // Recorded so the runtime can refuse a query embedded by a different model. A cosine between
    // vectors of different provenance does not throw, it returns a plausible number.
    model: MODEL,
    dimensions: dims,
    builtAt: new Date().toISOString().slice(0, 10),
    contentHash: contentHash(docs),
    chunks: chunks.map((c) => ({
      u: c.url,
      a: c.anchor,
      p: c.pageTitle,
      h: c.heading,
      t: c.text,
      l: c.lang,
    })),
    vectors: quantise(vectors),
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(index));
  const kb = (Buffer.byteLength(JSON.stringify(index)) / 1024).toFixed(0);
  console.log(`wrote ${relative(ROOT, OUT)} — ${chunks.length} chunks, ${dims} dims, ${kb} KB`);
}

export function contentHash(docs) {
  const h = createHash('sha256');
  for (const d of docs) h.update(d.url).update('\u0000').update(d.raw).update('\u0000');
  return h.digest('hex').slice(0, 16);
}

if (process.argv[1] && process.argv[1].endsWith('build-search-index.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
