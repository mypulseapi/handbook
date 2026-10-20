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
const OUT_DIR = join(ROOT, 'lib', 'assistant');
/* Also published, so the MCP server can fetch the current index instead of bundling a stale one. */
const PUBLIC_DIR = join(ROOT, 'public');
/*
 * A tiny per-page summary, separate from the vectors.
 *
 * The panel notes a navigation the moment it happens, and it must not need the worker running to
 * do it: the model loads on the first question, and a reader may click through five pages before
 * asking one. This is a few kilobytes it can import directly.
 */
const NOTES_OUT = join(ROOT, 'lib', 'assistant', 'page-notes.json');

/**
 * One index per model, because vectors from different models are not comparable.
 *
 * English readers get the small one. Vietnamese readers get a multilingual one, which is the
 * only way a question typed in Vietnamese can reach documentation written in English, and it is
 * 129 MB against 23 MB. That cost is paid once, on the first question, by the reader who asked.
 *
 * e5 models are trained with these prefixes and score noticeably worse without them.
 */
export const MODELS = [
  { id: 'Xenova/all-MiniLM-L6-v2', file: 'search-index.json', query: '', passage: '' },
  {
    id: 'Xenova/multilingual-e5-small',
    file: 'search-index.vi.json',
    query: 'query: ',
    passage: 'passage: ',
  },
];

export const MODEL = MODELS[0].id;

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

  /*
   * Mirror the site's own language fallback.
   *
   * Fumadocs serves an untranslated page's English body under the Vietnamese chrome, so
   * /vi/backend/python is a real page a reader can be standing on. The index did not know that:
   * it held only the three pages with a .vi.mdx, so that URL was unanswerable and unrecordable,
   * which is exactly what it looked like from the outside.
   *
   * The chunk is not duplicated and nothing is embedded twice. It is tagged with the Vietnamese
   * URL it also serves, and the retriever presents it there. A translated page overrides its
   * English twin, which is the same precedence the renderer uses.
   */
  const translated = new Set(
    chunks.filter((c) => c.lang !== 'en').map((c) => c.url.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'),
  );

  let mirrored = 0;
  for (const c of chunks) {
    if (c.lang !== 'en') continue;
    if (translated.has(c.url)) continue;
    c.alsoAt = { vi: c.url === '/' ? '/vi' : `/vi${c.url}` };
    mirrored += 1;
  }
  console.log(`${translated.size} pages translated, ${mirrored} chunks also served under /vi`);
  if (chunks.length === 0) throw new Error('Chunked to nothing. Refusing to write an empty index.');

  console.log(`${docs.length} pages -> ${chunks.length} chunks`);

  for (const model of MODELS) {
    /*
     * The Vietnamese index holds English chunks only, presented at their /vi URLs.
     *
     * Mixing the two languages in one index does not work, and the reason is structural rather
     * than fixable by a threshold: a Vietnamese query scores higher against Vietnamese text than
     * against English text whatever either one says, so the three translated pages won every
     * query. "làm sao để lấy API key" returned the changelog.
     *
     * Only three of forty-two pages are translated, and each has an English twin, so dropping
     * the Vietnamese chunks from this index costs no coverage and makes every chunk compete on
     * the same footing: one language, one distribution, ranked on meaning.
     */
    const source =
      model.id === 'Xenova/multilingual-e5-small'
        ? chunks
            .filter((c) => c.lang === 'en')
            .map((c) => ({ ...c, url: c.alsoAt?.vi ?? (c.url === '/' ? '/vi' : `/vi${c.url}`), lang: 'vi' }))
        : chunks;

    const embed = await pipeline('feature-extraction', model.id, { dtype: 'q8' });
    const vectors = [];
    for (let i = 0; i < source.length; i += 1) {
      const out = await embed(model.passage + embedText(source[i]), {
        pooling: 'mean',
        normalize: true,
      });
      vectors.push(Array.from(out.data));
      if ((i + 1) % 80 === 0) console.log(`  ${model.id}: ${i + 1}/${source.length}`);
    }

    const dims = vectors[0].length;
    if (!vectors.every((v) => v.length === dims)) throw new Error('Ragged vectors.');

    const index = {
      // Recorded so the runtime can refuse a query embedded by a different model. A cosine
      // between vectors of different provenance does not throw, it returns a plausible number.
      model: model.id,
      queryPrefix: model.query,
      dimensions: dims,
      builtAt: new Date().toISOString().slice(0, 10),
      contentHash: contentHash(docs),
      chunks: source.map((c) => ({
        u: c.url,
        a: c.anchor,
        p: c.pageTitle,
        h: c.heading,
        t: c.text,
        l: c.lang,
        ...(c.code ? { c: { l: c.code.lang, s: c.code.source } } : {}),
        ...(c.alsoAt ? { v: c.alsoAt.vi } : {}),
      })),
      vectors: quantise(vectors),
    };

    const json = JSON.stringify(index);
    mkdirSync(OUT_DIR, { recursive: true });
    mkdirSync(PUBLIC_DIR, { recursive: true });
    writeFileSync(join(OUT_DIR, model.file), json);
    writeFileSync(join(PUBLIC_DIR, model.file), json);
    console.log(
      `wrote ${model.file} — ${source.length} chunks, ${dims} dims, ` +
        `${(Buffer.byteLength(json) / 1024).toFixed(0)} KB`,
    );
  }

  // One entry per page  // One entry per page: what it is, and the first few things it answers.
  const notes = {};
  for (const c of chunks) {
    const existing = notes[c.url];
    if (!existing) {
      notes[c.url] = {
        title: c.pageTitle,
        lang: c.lang,
        summary: c.text.split('\n')[0].slice(0, 190),
        topics: [],
      };
      continue;
    }
    if (c.anchor && c.heading !== c.pageTitle && existing.topics.length < 3) {
      existing.topics.push({ heading: c.heading, anchor: c.anchor });
    }
  }
  // The same fallback for the notes: standing on /vi/backend/python must say something.
  for (const [url, note] of Object.entries({ ...notes })) {
    if (note.lang !== 'en') continue;
    const viUrl = url === '/' ? '/vi' : `/vi${url}`;
    if (notes[viUrl]) continue;
    notes[viUrl] = {
      ...note,
      lang: 'vi',
      untranslated: true,
      topics: note.topics.map((t) => ({ ...t })),
    };
  }

  writeFileSync(NOTES_OUT, JSON.stringify(notes));
  console.log(`wrote ${relative(ROOT, NOTES_OUT)} — ${Object.keys(notes).length} pages`);
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
