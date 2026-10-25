/// <reference lib="webworker" />
import { compose } from './answer';
import { decodeVectors, search, type SearchIndex } from './retrieve';
import { ORIGINS, talk, unsure } from './talk';
import type { Answer } from './answer';
import type { Hit } from './retrieve';

/**
 * The embedder, off the main thread.
 *
 * Two reasons it is a worker and not a hook. The model is ~23 MB and decoding it blocks whatever
 * thread does it, and a forward pass is tens of milliseconds that would otherwise land in the
 * middle of a keystroke. The panel stays responsive while the first load happens, which is the
 * difference between "loading" and "broken".
 *
 * The index ships with the page and the model is fetched on first open, never before: a reader who
 * never opens the assistant pays nothing for it.
 */

type Incoming =
  | { type: 'init'; lang: string }
  | { type: 'ask'; id: number; query: string; lang: string };

type Outgoing =
  | { type: 'ready' }
  | { type: 'progress'; loaded: number; total: number }
  | { type: 'failed'; reason: string }
  | { type: 'answer'; id: number; body: string; code?: unknown; sources: unknown; kind: string };

const post = (msg: Outgoing) => (self as unknown as Worker).postMessage(msg);

let embed: ((text: string, opts: object) => Promise<{ data: ArrayLike<number> }>) | null = null;
let index: SearchIndex | null = null;
let rows: Int8Array | null = null;
/**
 * The other site's index, so each assistant answers for both: a pricing question asked in the
 * handbook, or an API question asked on the marketing site. Fetched beside the model, from the
 * index the other site publishes at its root. Optional: if it fails, this site still answers.
 */
let remote: { index: SearchIndex; rows: Int8Array; origin: string } | null = null;
const OTHER = ORIGINS.site;

async function init(lang: string) {
  try {
    /*
     * One model per language, because the English one cannot read Vietnamese.
     *
     * `all-MiniLM-L6-v2` is 23 MB and English-only. A Vietnamese question against it retrieves
     * nothing useful, which is what "not answering" looked like. `multilingual-e5-small` handles
     * both and retrieves English documentation from a Vietnamese question, measured at 0.78 to
     * 0.86 against the right passage. It costs 129 MB, paid once, on the first question, by the
     * reader who asked for it.
     */
    const [{ pipeline, env }, loaded] = await Promise.all([
      import('@huggingface/transformers'),
      lang === 'vi' ? import('./search-index.vi.json') : import('./search-index.json'),
    ]);

    // The index is the only thing we ship; the weights come from the hub and are cached by the
    // browser after the first open.
    index = loaded.default as unknown as SearchIndex;
    rows = decodeVectors(index);
    const own = index;
    void fetch(`${OTHER}/search-index${lang === 'vi' ? '.vi' : ''}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<SearchIndex>) : null))
      .then((idx) => {
        // Vectors from a different model are not comparable; refuse rather than mis-rank.
        if (idx && idx.model === own.model && idx.dimensions === own.dimensions) {
          remote = { index: idx, rows: decodeVectors(idx), origin: OTHER };
        }
      })
      .catch(() => {});

    env.allowLocalModels = false;

    const pipe = await pipeline('feature-extraction', index.model, {
      dtype: 'q8',
      progress_callback: (p: { status?: string; loaded?: number; total?: number }) => {
        if (p.status === 'progress' && typeof p.loaded === 'number' && typeof p.total === 'number') {
          post({ type: 'progress', loaded: p.loaded, total: p.total });
        }
      },
    });

    embed = (text, opts) => pipe(text, opts) as Promise<{ data: ArrayLike<number> }>;
    post({ type: 'ready' });
  } catch (err) {
    post({ type: 'failed', reason: err instanceof Error ? err.message : 'unknown' });
  }
}

/** Both sites' best sections, one list, best first, one per page. */
function retrieve(query: Float32Array, lang: string): Hit[] {
  const own = search(query, index!, rows!, { lang, limit: 4 });
  const r = remote;
  const theirs = r
    ? search(query, r.index, r.rows, { lang, limit: 4 }).map((h) => ({
        ...h,
        chunk: { ...h.chunk, url: `${r.origin}${h.chunk.url}` },
      }))
    : [];
  const seen = new Set<string>();
  const out: Hit[] = [];
  for (const h of [...own, ...theirs].sort((a, b) => b.score - a.score)) {
    if (seen.has(h.chunk.url)) continue;
    seen.add(h.chunk.url);
    out.push(h);
    if (out.length === 4) break;
  }
  return out;
}

function reply(text: string, lang: string, query: Float32Array): Answer {
  // A definition is the whole answer and carries its own link. Related pages under it were noise:
  // a one or two word question ("pricing") embeds too weakly to retrieve well.
  const lead = talk(text, lang, ORIGINS);
  if (lead) return lead.answer;
  const answer = compose(retrieve(query, lang), lang);
  return answer.kind === 'unsure' ? { ...answer, body: unsure(lang, ORIGINS) } : answer;
}

self.addEventListener('message', (event: MessageEvent<Incoming>) => {
  const msg = event.data;

  if (msg.type === 'init') {
    void init(msg.lang);
    return;
  }

  if (msg.type === 'ask') {
    void (async () => {
      if (!embed || !index || !rows) {
        post({ type: 'failed', reason: 'not ready' });
        return;
      }
      // e5 is trained with a `query: ` prefix and scores noticeably worse without it. The
      // prefix travels in the index so the two can never disagree about which model built it.
      const out = await embed(`${index.queryPrefix ?? ''}${msg.query}`, {
        pooling: 'mean',
        normalize: true,
      });
      const query = Float32Array.from(out.data);

      // A query embedded by a different model than the index is refused rather than scored. A
      // cosine between vectors of different provenance returns a plausible number, not an error.
      if (query.length !== index.dimensions) {
        post({ type: 'failed', reason: 'dimension mismatch' });
        return;
      }

      const answer = reply(msg.query, msg.lang, query);
      post({
        type: 'answer',
        id: msg.id,
        body: answer.body,
        code: answer.code,
        sources: answer.sources,
        kind: answer.kind,
      });
    })();
  }
});
