import type { Chunk } from './chunk';

/**
 * Cosine retrieval over the committed index.
 *
 * Pure, and takes its index as an argument, so a test builds a three-chunk index by hand and
 * asserts the arithmetic rather than downloading a model to find out.
 */

export interface SearchIndex {
  model: string;
  /** Prepended to a query before embedding. e5 needs `query: `; MiniLM needs nothing. */
  queryPrefix?: string;
  dimensions: number;
  builtAt: string;
  contentHash: string;
  chunks: {
    u: string;
    a: string;
    p: string;
    h: string;
    t: string;
    l: string;
    c?: { l: string; s: string };
    /** The Vietnamese URL this English chunk also serves, when the page is untranslated. */
    v?: string;
  }[];
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
  return {
    url: row.u,
    anchor: row.a,
    pageTitle: row.p,
    heading: row.h,
    text: row.t,
    code: row.c ? { lang: row.c.l, source: row.c.s } : undefined,
    lang: row.l,
  };
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
 * e5 lives in a different range, so it needs its own floor.
 *
 * Cosines from `multilingual-e5-small` are compressed high: a correct Vietnamese match scores
 * 0.78 to 0.86 and unrelated text still sits near 0.7, because the model was trained with a
 * contrastive objective that does not spread the tail. Reusing 0.22 here would accept
 * everything.
 *
 * 0.80 is where the sweep puts it: 10 of 10 Vietnamese probes retrieved, and one of three
 * nonsense queries accepted. Recall is flat from 0.74 to 0.80 and then falls off a cliff, 6 of
 * 10 at 0.82 and 3 of 10 at 0.84, so there is no room above it and nothing to gain below it.
 */
export const E5_THRESHOLDS: Thresholds = { accept: 0.8, margin: 0.01 };

/** The thresholds an index was built for. */
export function thresholdsFor(index: SearchIndex): Thresholds {
  return index.model.includes('e5') ? E5_THRESHOLDS : DEFAULT_THRESHOLDS;
}

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
  const { lang, limit = 4, thresholds = thresholdsFor(index) } = opts;
  if (query.length !== index.dimensions) return [];

  const scored: Hit[] = [];
  for (let i = 0; i < index.chunks.length; i += 1) {
    const row = index.chunks[i]!;

    /*
     * Vietnamese reaches the English pages too, because the site does.
     *
     * Only three pages have a `.vi.mdx`; the rest serve their English body under Vietnamese
     * chrome, and `v` is the Vietnamese URL such a chunk also lives at. Filtering strictly on
     * language left a reader on /vi/backend/python with nothing to find, which is the bug this
     * is here to fix. The chunk is presented at the URL the reader is actually on.
     */
    let chunk = toChunk(row);
    if (lang !== undefined && row.l !== lang) {
      if (lang !== 'vi' || !row.v) continue;
      chunk = { ...chunk, url: row.v, lang: 'vi' };
    }

    scored.push({ chunk, score: cosine(query, rows, i, index.dimensions) });
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
