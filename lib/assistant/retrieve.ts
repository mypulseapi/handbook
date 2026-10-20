import type { Chunk } from './chunk';

/**
 * Cosine retrieval over the committed index.
 *
 * Pure, and takes its index as an argument, so a test builds a three-chunk index by hand and
 * asserts the arithmetic rather than downloading a model to find out.
 */

export interface SearchIndex {
  model: string;
  dimensions: number;
  builtAt: string;
  contentHash: string;
  chunks: { u: string; a: string; p: string; h: string; t: string; l: string }[];
  /** base64 int8, `chunks.length * dimensions`. */
  vectors: string;
}

export interface Hit {
  chunk: Chunk;
  score: number;
}

export function decodeVectors(index: SearchIndex): Int8Array {
  const bin = atob(index.vectors);
  const out = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = (bin.charCodeAt(i) << 24) >> 24;
  return out;
}

export function toChunk(row: SearchIndex['chunks'][number]): Chunk {
  return { url: row.u, anchor: row.a, pageTitle: row.p, heading: row.h, text: row.t, lang: row.l };
}

/**
 * A bare dot product. It does not normalise.
 *
 * Both sides are unit length already: the build script normalises before quantising and the
 * embedder normalises its output. Renormalising here would hide a build that forgot, so this
 * stays dumb on purpose and a forgotten normalise shows up as scores that make no sense.
 *
 * The 1/127 is the int8 scale, applied once to the sum rather than per component.
 */
export function cosine(query: Float32Array, rows: Int8Array, row: number, dims: number): number {
  let sum = 0;
  const base = row * dims;
  for (let i = 0; i < dims; i += 1) sum += query[i]! * rows[base + i]!;
  return sum / 127;
}

export interface Thresholds {
  /** The floor the best match must clear before anything is shown. */
  accept: number;
  /** How far the best match must beat the best match on a *different page*. */
  margin: number;
}

/**
 * Set by measurement. `pnpm eval:search` is what moves them, and `SWEEP=1` prints the curve.
 *
 * **`accept` sits between two measured populations, not at the recall peak.** Real questions from
 * the eval score 0.29 to 0.68. Nonsense and off-topic prompts score 0.15 to 0.21: `"write me a
 * poem about cats"` is 0.154, a prompt-injection attempt is 0.210. Recall keeps improving down to
 * 0.15, but everything below ~0.22 is bought by answering questions the documentation does not
 * cover, which reads as confident nonsense. 0.22 costs about 1.4 points of recall against the
 * 0.15 peak and buys a refusal that works.
 *
 * The two populations do overlap, and the threshold cannot fix that: `"is there a free tier"` is a
 * real question at 0.296 and `"what is the weather in Hanoi"` is off topic at 0.292. The second one
 * retrieves the session-context section, which genuinely documents a weather signal, so it is
 * arguably not even wrong. There is no score that separates them and pretending otherwise would
 * mean tuning until the eval looked tidy.
 */
export const DEFAULT_THRESHOLDS: Thresholds = { accept: 0.22, margin: 0.02 };

/**
 * Top matches for a query vector.
 *
 * Results are deduplicated by page before `limit` is applied, keeping each page's best section.
 * Without that, one long page with eight similar sections fills the whole answer and a reader
 * never sees the second-best page, which is usually the one that disambiguates.
 */
export function search(
  query: Float32Array,
  index: SearchIndex,
  rows: Int8Array,
  opts: { lang?: string; limit?: number; thresholds?: Thresholds } = {},
): Hit[] {
  const { lang, limit = 4, thresholds = DEFAULT_THRESHOLDS } = opts;
  if (query.length !== index.dimensions) return [];

  const scored: Hit[] = [];
  for (let i = 0; i < index.chunks.length; i += 1) {
    const row = index.chunks[i]!;
    if (lang !== undefined && row.l !== lang) continue;
    scored.push({ chunk: toChunk(row), score: cosine(query, rows, i, index.dimensions) });
  }
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score < thresholds.accept) return [];

  // A near-tie between two different pages has identified nothing. Compare against the best hit
  // on another page rather than raw second place, because three sections of one page scoring
  // closely is agreement, not ambiguity.
  const rival = scored.find((h) => h.chunk.url !== top.chunk.url);
  if (rival && top.score - rival.score < thresholds.margin && top.score < thresholds.accept + 0.1) {
    // Ambiguous, but still worth offering both rather than refusing outright.
    return dedupeByPage(scored, limit);
  }

  return dedupeByPage(scored, limit);
}

function dedupeByPage(hits: Hit[], limit: number): Hit[] {
  const seen = new Set<string>();
  const out: Hit[] = [];
  for (const h of hits) {
    if (seen.has(h.chunk.url)) continue;
    seen.add(h.chunk.url);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}
