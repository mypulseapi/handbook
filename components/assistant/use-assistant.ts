'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMessages, saveMessages } from '@/lib/assistant/session';

export type Status = 'idle' | 'loading' | 'ready' | 'failed';

export interface Source {
  url: string;
  title: string;
  heading: string;
  anchor: string;
}

export interface Message {
  id: number;
  role: 'you' | 'assistant';
  /** What has been revealed so far. Equals `full` once streaming finishes. */
  text: string;
  full: string;
  sources: Source[];
  code?: { lang: string; source: string };
  streaming: boolean;
}

/**
 * The assistant's state machine.
 *
 * **The worker starts on first open, never on page load.** A reader who never asks a question
 * never downloads a model, which is the difference between a docs site with a chat and a docs
 * site that costs 23 MB to read.
 *
 * The reveal is a timer over text that already exists. It is deliberately not dressed up as
 * anything else: the answer is retrieved from the page it cites, and the caret says "still
 * arriving", not "still thinking".
 */
export function useAssistant(lang: string) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  // Restored on mount, which is what makes a conversation survive a navigation. Lazy so the
  // read happens once rather than on every render, and after hydration so the server and the
  // client agree on the first paint.
  const [messages, setMessages] = useState<Message[]>([]);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const prior = loadMessages();
    if (prior.length > 0) {
      setMessages(prior);
      // Ids are keys and are compared by identity while streaming, so a restored conversation
      // must not hand out one that already exists.
      nextId.current = Math.max(...prior.map((m) => m.id)) + 1;
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) saveMessages(messages);
  }, [messages, restored]);
  const [pending, setPending] = useState(false);

  const worker = useRef<Worker | null>(null);
  const nextId = useRef(1);
  const reveal = useRef<number | null>(null);
  /** A question asked before the model finished loading, sent as soon as it is ready. */
  const queued = useRef<string | null>(null);
  /*
   * `start` has to send the queued question when the worker reports ready, and `submit` is
   * declared below it. A ref keeps `start`'s dependency list empty and honest: listing `submit`
   * would rebuild the worker callback every render for a function that never changes.
   */
  const submitRef = useRef<(q: string) => void>(() => {});

  const start = useCallback(() => {
    if (worker.current) return;
    setStatus('loading');

    const w = new Worker(new URL('../../lib/assistant/worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.current = w;

    w.addEventListener('message', (event: MessageEvent) => {
      const msg = event.data as
        | { type: 'ready' }
        | { type: 'progress'; loaded: number; total: number }
        | { type: 'failed'; reason: string }
        | {
            type: 'answer';
            id: number;
            body: string;
            code?: { lang: string; source: string };
            sources: Source[];
            kind: string;
          };

      if (msg.type === 'ready') {
        setStatus('ready');
        const q = queued.current;
        queued.current = null;
        if (q !== null) submitRef.current(q);
      }
      else if (msg.type === 'progress') setProgress(Math.min(1, msg.loaded / Math.max(1, msg.total)));
      else if (msg.type === 'failed') setStatus('failed');
      else if (msg.type === 'answer') {
        setPending(false);
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            role: 'assistant',
            text: '',
            full: msg.body,
            sources: msg.sources ?? [],
            code: msg.code,
            streaming: true,
          },
        ]);
      }
    });

    w.postMessage({ type: 'init' });
  }, []);

  /**
   * Reveal the newest streaming message a word at a time.
   *
   * Word by word rather than character by character: a character typewriter on a 500-word answer
   * takes half a minute and reads as a gimmick, where words land at about the speed someone
   * skims. The jitter keeps it from looking like a progress bar.
   */
  useEffect(() => {
    const streaming = messages.find((m) => m.streaming);
    if (!streaming) return;

    const words = streaming.full.split(/(\s+)/);
    let shown = streaming.text.length === 0 ? 0 : streaming.text.split(/(\s+)/).length;

    const tick = () => {
      shown += 1;
      const done = shown >= words.length;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streaming.id
            ? { ...m, text: words.slice(0, shown).join(''), streaming: !done }
            : m,
        ),
      );
      if (!done) reveal.current = window.setTimeout(tick, 14 + Math.random() * 26);
    };

    reveal.current = window.setTimeout(tick, 60);
    return () => {
      if (reveal.current !== null) window.clearTimeout(reveal.current);
    };
    // Only re-run when a new streaming message appears, not on every revealed word.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.find((m) => m.streaming)?.id]);

  const submit = useCallback(
    (trimmed: string) => {
      const id = nextId.current++;
      setMessages((prev) => [
        ...prev,
        { id, role: 'you', text: trimmed, full: trimmed, sources: [], streaming: false },
      ]);
      setPending(true);
      worker.current?.postMessage({ type: 'ask', id: nextId.current++, query: trimmed, lang });
    },
    [lang],
  );

  submitRef.current = submit;

  /**
   * Ask a question, starting the model if this is the first one.
   *
   * **The download begins on the first question, not when the panel opens.** The panel opens by
   * itself on a first visit, and charging every reader 23 MB for a thing they have not asked for
   * would be the opposite of leaving them free to just read. A question asked while the model is
   * still arriving is queued and sent the moment it is ready, so the wait is visible but never
   * loses the question.
   */
  const ask = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length === 0) return;

      if (!worker.current) {
        queued.current = trimmed;
        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current++,
            role: 'you',
            text: trimmed,
            full: trimmed,
            sources: [],
            streaming: false,
          },
        ]);
        setPending(true);
        start();
        return;
      }

      if (status !== 'ready') {
        queued.current = trimmed;
        return;
      }

      submit(trimmed);
    },
    [start, status, submit],
  );

  useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setPending(false);
    queued.current = null;
  }, []);

  return { status, progress, messages, pending, start, ask, reset };
}
