'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowUp, Bot, RotateCcw, Sparkles, X } from 'lucide-react';
import { useAssistant, type Message } from './use-assistant';
import {
  clearMessages,
  getOpen,
  getOpenOnServer,
  setOpen as writeOpen,
  subscribeOpen,
} from '@/lib/assistant/session';

const SEEN_KEY = 'pulse-assistant-greeted';

const COPY = {
  en: {
    open: 'Ask the docs',
    title: 'Ask the documentation',
    subtitle: 'Answers are quoted from these pages, never generated.',
    placeholder: 'How do I run a catalogue audit?',
    loading: 'Getting ready',
    failed: 'The assistant could not start on this device. Every answer it would have given is on the pages themselves.',
    thinking: 'Searching the documentation',
    send: 'Send',
    close: 'Close',
    restart: 'Start a new conversation',
    suggestions: [
      'How do I run a catalogue audit?',
      'What does the audit measure?',
      'How long does a session last?',
      'What should I check before going live?',
    ],
  },
  vi: {
    open: 'Hỏi tài liệu',
    title: 'Hỏi tài liệu',
    subtitle: 'Câu trả lời được trích từ chính các trang này, không phải do máy tự viết.',
    placeholder: 'Làm sao để chạy một bản kiểm tra danh mục?',
    loading: 'Đang chuẩn bị',
    failed: 'Trợ lý không khởi động được trên thiết bị này. Mọi câu trả lời đều có sẵn trong các trang tài liệu.',
    thinking: 'Đang tìm trong tài liệu',
    send: 'Gửi',
    close: 'Đóng',
    restart: 'Bắt đầu cuộc trò chuyện mới',
    suggestions: [
      'Làm sao để chạy một bản kiểm tra danh mục?',
      'Bản kiểm tra đo những gì?',
      'Một phiên truy cập kéo dài bao lâu?',
      'Cần kiểm tra gì trước khi lên production?',
    ],
  },
} as const;

/**
 * Hold back a markdown construct the reveal has not finished.
 *
 * A word-at-a-time reveal lands mid-syntax, and `[Audit a catalogue` with no closing bracket
 * renders as a literal bracket, which looks like a bug rather than like typing. Cutting at the
 * last unterminated marker costs a few characters of latency and keeps every frame valid.
 */
function stable(text: string): string {
  const openLink = text.lastIndexOf('[');
  if (openLink !== -1 && !/\]\([^)]*\)\s*$/.test(text.slice(openLink))) {
    const closed = text.slice(openLink).match(/^\[[^\]]*\]\([^)]*\)/);
    if (!closed) return text.slice(0, openLink);
  }
  const ticks = (text.match(/`/g) ?? []).length;
  if (ticks % 2 === 1) return text.slice(0, text.lastIndexOf('`'));
  const bolds = (text.match(/\*\*/g) ?? []).length;
  if (bolds % 2 === 1) return text.slice(0, text.lastIndexOf('**'));
  return text;
}

/** Markdown, only the subset the composed answers actually use. */
function Rendered({ text, streaming = false }: { text: string; streaming?: boolean }) {
  const html = (streaming ? stable(text) : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-fd-muted px-1 py-0.5 text-[0.85em]">$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-fd-primary underline underline-offset-4">$1</a>',
    )
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    /*
     * Bare URLs become links. The chunks now carry their targets as `label (https://...)`, which
     * is right for an agent reading plain text and wrong for a person looking at a chat bubble
     * that they cannot click. Run after the markdown link pass so an href is not linked twice.
     */
    .replace(
      /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
      '$1<a href="$2" class="text-fd-primary underline underline-offset-4">$2</a>',
    )
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Bubble({ message, lang }: { message: Message; lang: 'en' | 'vi' }) {
  const mine = message.role === 'you';

  return (
    <div className={`pulse-message-in flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          mine
            ? 'bg-fd-primary max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white'
            : 'bg-fd-card border-fd-border max-w-[92%] rounded-2xl rounded-bl-md border px-4 py-3 text-sm leading-relaxed'
        }
      >
        <Rendered text={message.text} streaming={message.streaming} />
        {!message.streaming && message.code && (
          <pre className="bg-fd-muted mt-3 overflow-x-auto rounded-lg p-3 text-[0.8rem] leading-[1.8]">
            <code>{message.code.source}</code>
          </pre>
        )}
        {message.streaming && (
          <span className="pulse-caret bg-fd-primary ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px]" />
        )}
        {!message.streaming && message.sources.length > 0 && (
          <div className="border-fd-border mt-3 border-t pt-3">
            {message.sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                className="text-fd-muted-foreground hover:text-fd-accent-foreground flex items-baseline gap-2 text-xs"
              >
                <span className="shrink-0">{lang === 'vi' ? 'Nguồn' : 'Source'}</span>
                <span className="underline underline-offset-4">
                  {s.title}
                  {s.heading && s.heading !== s.title ? ` · ${s.heading}` : ''}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Typing({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="pulse-message-in bg-fd-card border-fd-border flex w-fit items-center gap-[5px] rounded-2xl rounded-bl-md border px-4 py-3.5"
    >
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((d) => (
        <span
          key={d}
          aria-hidden="true"
          className="pulse-typing bg-fd-primary size-[7px] rounded-full"
          style={{ ['--d' as string]: `${d * 160}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * The assistant, as a panel over the documentation.
 *
 * It starts closed and starts nothing: the worker and the model load on the first open, so a
 * reader who never asks pays nothing. If the model cannot load the panel says so plainly and
 * points at the pages, because the answer was always on a page anyway.
 */
export function AssistantPanel({ lang }: { lang: 'en' | 'vi' }) {
  const t = COPY[lang];
  // Read straight from the store, so a navigation reopens it without a corrective render.
  const open = useSyncExternalStore(subscribeOpen, getOpen, getOpenOnServer);
  const setOpen = writeOpen;
  const [draft, setDraft] = useState('');
  const { status, progress, messages, pending, ask, reset } = useAssistant(lang);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  /**
   * Open by itself on a first visit, once, and never on a phone.
   *
   * The point is that a newcomer sees the assistant exists without having to find a button. It is
   * remembered in `localStorage` so it does not reintroduce itself to a returning reader, and it
   * is skipped below the `sm` breakpoint because there the panel is a full-height sheet: opening
   * that unasked would cover the page a reader came to read, which is the opposite of leaving them
   * free to surf.
   *
   * Storage is wrapped because a private window or blocked site data throws on access, and an
   * assistant that crashes the page it sits on is worse than one that greets you twice.
   */
  /*
   * Introduce the assistant once, on a first visit, and never on a phone.
   *
   * A newcomer should see it exists without hunting for a button. It is remembered in
   * `localStorage` so it does not reintroduce itself to a returning reader, and it is skipped
   * below `sm`, where the panel is a full-height sheet: opening that unasked would cover the page
   * someone came to read.
   *
   * Storage is wrapped because a private window or blocked site data throws on access, and an
   * assistant that takes down the page it sits on is worse than one that greets you twice.
   */
  useEffect(() => {
    if (getOpen()) return;

    let seen = true;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      seen = true;
    }
    if (seen) return;

    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* nothing to do: it just greets again next time */
    }

    if (!window.matchMedia('(min-width: 640px)').matches) return;

    const t = window.setTimeout(() => writeOpen(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open && status !== 'failed') input.current?.focus();
  }, [open, status]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') writeOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = () => {
    ask(draft);
    setDraft('');
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.open}
        className="bg-fd-primary fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform duration-150 hover:scale-[1.03] sm:right-5 sm:bottom-5"
      >
        <Sparkles className="size-4 shrink-0" />
        <span className="hidden sm:inline">{t.open}</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label={t.title}
      className="pulse-panel-in bg-fd-background border-fd-border fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden border shadow-2xl sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[min(620px,calc(100dvh-2rem))] sm:w-[min(440px,calc(100vw-2rem))] sm:rounded-2xl"
    >
      <header className="border-fd-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Bot className="text-fd-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t.title}</p>
            <p className="text-fd-muted-foreground text-xs">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearMessages();
                reset();
              }}
              aria-label={t.restart}
              title={t.restart}
              className="text-fd-muted-foreground hover:text-fd-accent-foreground p-1"
            >
              <RotateCcw className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.close}
            className="text-fd-muted-foreground hover:text-fd-accent-foreground -mr-1 p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {status === 'loading' && messages.length === 0 && (
          <div className="text-fd-muted-foreground space-y-2 text-xs">
            <p>
              {t.loading}
              {progress > 0 ? ` ${Math.round(progress * 100)}%` : '…'}
            </p>
            <div className="bg-fd-muted h-1 overflow-hidden rounded-full">
              <div
                className="bg-fd-primary h-full rounded-full transition-[width] duration-200"
                style={{ width: `${Math.max(4, progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {status === 'failed' && <p className="text-fd-muted-foreground text-sm">{t.failed}</p>}

        {status !== 'failed' && messages.length === 0 && (
          <div className="space-y-2">
            {t.suggestions.map((q, i) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="pulse-message-in border-fd-border hover:bg-fd-accent block w-full rounded-xl border px-3 py-2 text-left text-sm"
                style={{ ['--delay' as string]: `${i * 60}ms` }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => (
          <Bubble key={m.id} message={m} lang={lang} />
        ))}

        {pending && <Typing label={t.thinking} />}
      </div>

      <div className="border-fd-border border-t p-3">
        <div className="border-fd-border focus-within:border-fd-primary flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors">
          <textarea
            ref={input}
            rows={1}
            value={draft}
            disabled={status === 'failed'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t.placeholder}
            className="max-h-28 flex-1 resize-none bg-transparent text-sm outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={submit}
            disabled={status === 'failed' || draft.trim().length === 0}
            aria-label={t.send}
            className="bg-fd-primary shrink-0 rounded-lg p-1.5 text-white disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
