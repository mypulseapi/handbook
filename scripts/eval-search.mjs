/**
 * Does every page actually come back when you ask about it?
 *
 *   pnpm eval:search
 *
 * The claim being tested is the whole requirement: any question the documentation answers on
 * paper can be answered in the chat. So the eval is generated from the corpus rather than
 * hand-picked, which means it cannot be quietly curated to pass.
 *
 * Two probes per English page:
 *   - the page's own title, phrased as a reader would type it
 *   - each of its headings, which are already the questions an author chose to answer
 *
 * A probe passes when its page is in the top 4. Headings are the harder set and the honest one:
 * a title matching its own page is close to tautological, a heading is a real retrieval.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkPage } from '../lib/assistant/chunk.ts';
import {
  DEFAULT_THRESHOLDS,
  decodeVectors,
  search,
} from '../lib/assistant/retrieve.ts';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const CONTENT = join(ROOT, 'content', 'docs');

globalThis.atob ??= (b64) => Buffer.from(b64, 'base64').toString('binary');

const index = JSON.parse(readFileSync(join(ROOT, 'lib', 'assistant', 'search-index.json'), 'utf8'));
const rows = decodeVectors(index);

function enPages() {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith('.mdx') || /\.[a-z]{2}\.mdx$/.test(name)) continue;
      const rel = relative(CONTENT, full).replace(/\\/g, '/');
      const clean = rel.replace(/\.mdx$/, '').replace(/(^|\/)index$/, '');
      out.push({ url: clean.length > 0 ? `/${clean}` : '/', raw: readFileSync(full, 'utf8') });
    }
  };
  walk(CONTENT);
  return out;
}

const { pipeline } = await import('@huggingface/transformers');
const embed = await pipeline('feature-extraction', index.model, { dtype: 'q8' });

const probes = [];
for (const page of enPages()) {
  const chunks = chunkPage({ raw: page.raw, url: page.url, lang: 'en' });
  const title = chunks[0]?.pageTitle ?? page.url;
  probes.push({ q: title, url: page.url, kind: 'title' });
  for (const c of chunks) {
    if (c.anchor === '') continue;
    probes.push({ q: c.heading, url: page.url, kind: 'heading' });
  }
}

// Embed once, score many times, so a threshold sweep costs nothing extra.
const vectors = [];
for (const p of probes) {
  const out = await embed(p.q, { pooling: 'mean', normalize: true });
  vectors.push(Float32Array.from(out.data));
}

const sweep = (process.env.SWEEP ?? '').length > 0;
if (sweep) {
  console.log('\naccept  titles   headings  overall');
  for (const accept of [0.1, 0.15, 0.2, 0.25, 0.28, 0.32, 0.36, 0.4]) {
    let t = 0, tAll = 0, h = 0, hAll = 0;
    probes.forEach((p, i) => {
      const hits = search(vectors[i], index, rows, {
        lang: 'en', limit: 4, thresholds: { accept, margin: DEFAULT_THRESHOLDS.margin },
      });
      const ok = hits.some((x) => x.chunk.url === p.url);
      if (p.kind === 'title') { tAll += 1; if (ok) t += 1; }
      else { hAll += 1; if (ok) h += 1; }
    });
    const pct = (a, b) => `${((a / b) * 100).toFixed(1)}%`;
    console.log(
      `${accept.toFixed(2)}    ${pct(t, tAll).padEnd(8)} ${pct(h, hAll).padEnd(9)} ${pct(t + h, tAll + hAll)}`,
    );
  }
  process.exit(0);
}

let pass = 0;
const misses = [];
probes.forEach((p, i) => {
  const hits = search(vectors[i], index, rows, { lang: 'en', limit: 4 });
  if (hits.some((h) => h.chunk.url === p.url)) pass += 1;
  else misses.push({ ...p, got: hits.map((h) => h.chunk.url).slice(0, 3) });
});

const byKind = (k) => {
  const all = probes.filter((p) => p.kind === k).length;
  const bad = misses.filter((m) => m.kind === k).length;
  return `${all - bad}/${all} (${(((all - bad) / all) * 100).toFixed(1)}%)`;
};

console.log(`\nthresholds accept=${DEFAULT_THRESHOLDS.accept} margin=${DEFAULT_THRESHOLDS.margin}`);
console.log(`titles   ${byKind('title')}`);
console.log(`headings ${byKind('heading')}`);
console.log(`overall  ${pass}/${probes.length} (${((pass / probes.length) * 100).toFixed(1)}%)\n`);

if (misses.length > 0) {
  console.log('misses:');
  for (const m of misses.slice(0, 15)) {
    console.log(`  "${m.q}" -> wanted ${m.url}, got ${m.got.join(', ') || '(nothing)'}`);
  }
  if (misses.length > 15) console.log(`  ... and ${misses.length - 15} more`);
}
