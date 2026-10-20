/// <reference lib="webworker" />
import { compose } from './answer';
import { decodeVectors, search, type SearchIndex } from './retrieve';

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
  | { type: 'init' }
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

async function init() {
  try {
    const [{ pipeline, env }, loaded] = await Promise.all([
      import('@huggingface/transformers'),
      import('./search-index.json'),
    ]);

    // The index is the only thing we ship; the weights come from the hub and are cached by the
    // browser after the first open.
    index = loaded.default as unknown as SearchIndex;
    rows = decodeVectors(index);

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

self.addEventListener('message', (event: MessageEvent<Incoming>) => {
  const msg = event.data;

  if (msg.type === 'init') {
    void init();
    return;
  }

  if (msg.type === 'ask') {
    void (async () => {
      if (!embed || !index || !rows) {
        post({ type: 'failed', reason: 'not ready' });
        return;
      }
      const out = await embed(msg.query, { pooling: 'mean', normalize: true });
      const query = Float32Array.from(out.data);

      // A query embedded by a different model than the index is refused rather than scored. A
      // cosine between vectors of different provenance returns a plausible number, not an error.
      if (query.length !== index.dimensions) {
        post({ type: 'failed', reason: 'dimension mismatch' });
        return;
      }

      const hits = search(query, index, rows, { lang: msg.lang, limit: 4 });
      const answer = compose(hits, msg.lang);
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
