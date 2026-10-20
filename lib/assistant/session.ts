import type { Message } from '@/components/assistant/use-assistant';

/**
 * The conversation, kept across navigation and across closing the panel.
 *
 * **This is the bug it exists to fix.** The panel is mounted by the layout, and a Next navigation
 * remounts it, so every click on a sidebar link threw the conversation away. A reader who asked
 * three questions and then opened the page they were pointed at came back to an empty box, which
 * makes the assistant feel like a toy rather than somewhere to work.
 *
 * `sessionStorage` rather than `localStorage`, deliberately. A conversation belongs to the tab
 * and to the sitting: surviving a navigation is the point, surviving a reboot a week later is
 * not, and a transcript that outlives the question it was about is clutter at best. It is also
 * the storage a reader expects to be cleaned up when they close the tab.
 *
 * Every access is wrapped. A private window, blocked site data or a full quota throws on read or
 * write, and an assistant that takes the page down with it is worse than one that forgets.
 */

const KEY = 'pulse-assistant-session-v1';
const OPEN_KEY = 'pulse-assistant-open';

/** Cap it so a long sitting cannot grow past the quota and start throwing on every write. */
const MAX_MESSAGES = 60;

export function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // A message that was mid-reveal when the page changed is restored finished rather than
    // frozen with a caret that never advances.
    return parsed
      .filter((m): m is Message => typeof m === 'object' && m !== null && 'role' in m)
      .map((m) => ({ ...m, text: m.full ?? m.text, streaming: false }));
  } catch {
    return [];
  }
}

export function saveMessages(messages: Message[]): void {
  try {
    const trimmed = messages
      .slice(-MAX_MESSAGES)
      .map((m) => ({ ...m, text: m.full, streaming: false }));
    sessionStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* over quota or blocked: the conversation stays in memory for this page */
  }
}

export function clearMessages(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/**
 * Whether the panel is open, as an external store.
 *
 * `useSyncExternalStore` rather than state restored in an effect. Storage is genuinely an
 * external system and this is the API React provides for reading one: the alternative sets state
 * inside a mount effect, which renders the closed panel first and then corrects it, and which
 * the linter is right to flag.
 *
 * `getServerSnapshot` returns false because the server has no session, so the first paint is
 * always the closed state and the client takes over from there without a hydration mismatch.
 */
const listeners = new Set<() => void>();

export function subscribeOpen(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getOpen(): boolean {
  try {
    return sessionStorage.getItem(OPEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function getOpenOnServer(): boolean {
  return false;
}

export function setOpen(open: boolean): void {
  try {
    sessionStorage.setItem(OPEN_KEY, open ? '1' : '0');
  } catch {
    /* nothing to do: the panel still opens, it just will not survive a navigation */
  }
  for (const cb of listeners) cb();
}
