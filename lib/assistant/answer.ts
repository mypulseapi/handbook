import type { Hit } from './retrieve';

/**
 * Turn retrieved sections into the reply a reader sees.
 *
 * **Nothing here is generated.** Every sentence is either a fixed template or text lifted from the
 * page it cites. That is what makes two properties true by construction: the assistant cannot
 * invent an endpoint, a figure or a claim the documentation does not make, and a prompt injection
 * can at worst retrieve the wrong section, which is a bug rather than a breach.
 *
 * The streaming reveal in the UI is a reveal of this text. It is not a model thinking.
 */

export interface Answer {
  /** Markdown, revealed progressively by the UI. */
  body: string;
  /** Shown as a real code block under the prose, never mixed into it. */
  code?: { lang: string; source: string };
  /** The pages the body came from, rendered as cards under the reply. */
  sources: { url: string; title: string; heading: string; anchor: string }[];
  kind: 'answer' | 'unsure';
}

const UI = {
  en: {
    unsure:
      "I could not find that in the documentation. Try naming the thing you are after, for example an endpoint like `/catalog/audit`, a framework, or a concept like sessions.\n\nYou can also [search every page](/) or ask about something from the sidebar.",
    from: 'From',
    more: 'Related pages',
  },
  vi: {
    unsure:
      'Tôi không tìm thấy điều đó trong tài liệu. Hãy thử nêu đúng thứ bạn cần, ví dụ một endpoint như `/catalog/audit`, một framework, hoặc một khái niệm như phiên truy cập.\n\nBạn cũng có thể [tìm trong toàn bộ trang](/vi) hoặc hỏi về một mục trong thanh bên.',
    from: 'Trích từ',
    more: 'Trang liên quan',
  },
} as const;

function strings(lang: string) {
  return lang === 'vi' ? UI.vi : UI.en;
}

/** Trim a section to something readable in a chat bubble without cutting a sentence in half. */
function excerpt(text: string, max = 520): string {
  const clean = text.replace(/\n{2,}/g, '\n\n').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.lastIndexOf('\n\n'));
  return (stop > max * 0.5 ? cut.slice(0, stop + 1) : cut) + '…';
}

export function compose(hits: Hit[], lang: string): Answer {
  const s = strings(lang);
  if (hits.length === 0) return { body: s.unsure, sources: [], kind: 'unsure' };

  const [best, ...rest] = hits;
  const top = best!;
  const href = top.chunk.anchor ? `${top.chunk.url}#${top.chunk.anchor}` : top.chunk.url;

  const parts = [excerpt(top.chunk.text)];

  if (rest.length > 0) {
    parts.push(
      `**${s.more}**\n` +
        rest
          .map((h) => {
            const link = h.chunk.anchor ? `${h.chunk.url}#${h.chunk.anchor}` : h.chunk.url;
            const label =
              h.chunk.heading && h.chunk.heading !== h.chunk.pageTitle
                ? `${h.chunk.pageTitle}: ${h.chunk.heading}`
                : h.chunk.pageTitle;
            return `- [${label}](${link})`;
          })
          .join('\n'),
    );
  }

  return {
    body: parts.join('\n\n'),
    code: top.chunk.code,
    sources: [
      {
        url: href,
        title: top.chunk.pageTitle,
        heading: top.chunk.heading,
        anchor: top.chunk.anchor,
      },
    ],
    kind: 'answer',
  };
}
