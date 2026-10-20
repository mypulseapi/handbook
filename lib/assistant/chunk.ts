/**
 * Break a documentation page into the units an answer is built from.
 *
 * **Every page, every heading.** The requirement is that any question the documentation answers
 * on paper can be answered in the chat, so the corpus is the whole `content/docs` tree rather
 * than a hand-picked set of topics. A page nobody chunked is a question nobody can ask.
 *
 * Chunks are heading-scoped rather than fixed-width. A fixed window cuts mid-sentence and splits
 * a table from the sentence that explains it; a heading is the author's own statement about where
 * one idea ends. It also gives every chunk a real anchor to link to, so an answer can send a
 * reader to the exact section instead of the top of a long page.
 *
 * Pure and dependency-free so the build script and the tests use the same function. If the
 * browser ever needs to chunk, it can call this too.
 */

export interface Chunk {
  /** Page URL, locale included: `/quickstart` or `/vi/quickstart`. */
  url: string;
  /** Anchor for the heading this chunk covers, empty for the page's opening text. */
  anchor: string;
  pageTitle: string;
  /** The heading text, or the page title for the opening chunk. */
  heading: string;
  /** Prose only, MDX stripped and code removed. What gets embedded and what gets read aloud. */
  text: string;
  /** The first code sample in the section, kept whole so it can be shown as code. */
  code?: { lang: string; source: string };
  lang: string;
}

/** Strip the frontmatter block and return it parsed, shallowly. */
export function splitFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of (match[1] ?? '').split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) meta[key] = value;
  }
  return { meta, body: raw.slice(match[0].length) };
}

/**
 * Pull the fenced code out of a section before anything touches the prose.
 *
 * Returns the prose with the fences removed and the first sample kept whole. They have to be
 * separated because the two want opposite treatment: prose wants its punctuation stripped, and
 * code wants every character of it.
 */
export function splitCode(mdx: string): { prose: string; code?: { lang: string; source: string } } {
  let first: { lang: string; source: string } | undefined;

  const prose = mdx.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_m, info: string, body: string) => {
    if (!first) {
      // The info string is ```ts title="pulse.ts"; the language is the first word of it.
      first = { lang: (info.trim().split(/\s+/)[0] ?? '').toLowerCase(), source: body.trimEnd() };
    }
    return ' ';
  });

  return { prose, code: first };
}

/**
 * MDX to plain prose.
 *
 * **Underscores and slashes survive.** An earlier version stripped `_` along with the other
 * markdown punctuation, which turned `pk_live_...` into `pk live ...` and `category_view` into
 * `category view`. In a developer documentation corpus that is destructive twice over: it makes
 * the text wrong to show a reader, and it splits identifiers into words that embed as something
 * else entirely.
 *
 * JSX tags go but their children stay: `<Callout title="x">body</Callout>` keeps both, since the
 * title and the body are prose an author wrote for a reader.
 */
export function toPlainText(mdx: string, origin = 'https://developer.thepulseapi.com'): string {
  return (
    mdx
      // import/export lines are machinery, never prose
      .replace(/^\s*(import|export)\s.+$/gm, '')
      // self-closing JSX carries no reader-facing text
      .replace(/<[A-Z][\w.]*\b[^>]*\/>/g, ' ')
      // keep the attribute text of a component that titles itself
      .replace(/<([A-Z][\w.]*)\b([^>]*)>/g, (_m, _tag, attrs: string) => {
        const title = /title=["']([^"']+)["']/.exec(attrs);
        return title ? `${title[1]}. ` : ' ';
      })
      .replace(/<\/[A-Z][\w.]*>/g, ' ')
      /*
       * **Links keep their target.** They used to collapse to the label, which is how the
       * assistant came to say "sign in to the dashboard" with no address: the page said
       * `[dashboard](https://app.thepulseapi.com)` and the chunk kept only the word. A reader
       * being told to go somewhere needs to be told where, and an agent reading the same chunk
       * needs it more.
       *
       * A relative target is made absolute, because a chunk is read far away from the page it
       * came from and `/quickstart` means nothing in a chat bubble.
       */
      .replace(/\[([^\]]+)\]\(([^)]*)\)/g, (_m, label: string, href: string) => {
        const target = href.trim();
        if (target.length === 0 || target.startsWith('#')) return label;
        const absolute = target.startsWith('http') ? target : `${origin}${target}`;
        return label.trim() === absolute ? label : `${label} (${absolute})`;
      })
      // inline code keeps its content, loses only the ticks
      .replace(/`([^`]+)`/g, '$1')
      // table pipes and emphasis go; underscore and slash are left alone on purpose
      .replace(/[*>|]/g, ' ')
      .replace(/^[-=:]{3,}$/gm, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      // Stripping a tag leaves the space it occupied in front of the punctuation that followed
      // it, so "API keys ." and "the dashboard ," read as typos rather than as markup.
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/^[ \t]+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/** GitHub-style anchor, matching what Fumadocs generates for a heading. */
export function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

const MIN_CHARS = 40;

/*
 * Below this, a section is a lead-in rather than an answer, and it absorbs its subsections.
 *
 * Found by the assistant answering "what does the audit measure" with "Three cases, and we would
 * rather you heard them from us." That is the sentence introducing three `<Step>` blocks whose
 * bodies become their own chunks: the heading scored well, the body said nothing, and the reader
 * got a fragment.
 *
 * Dropping thin parents was tried first and measured worse, because on some pages the thin
 * section is the only route to that page. Absorbing the children keeps the parent answerable and
 * gives it something to say. The children stay indexed too, so a precise question still reaches
 * the precise subsection.
 */
const THIN_BODY = 160;
const MAX_CHARS = 1200;

/** Split an over-long section on paragraph boundaries rather than mid-sentence. */
function pack(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];
  const out: string[] = [];
  let current = '';
  for (const para of text.split(/\n{2,}/)) {
    if (current.length > 0 && current.length + para.length > MAX_CHARS) {
      out.push(current.trim());
      current = '';
    }
    current += (current.length > 0 ? '\n\n' : '') + para;
  }
  if (current.trim().length > 0) out.push(current.trim());
  return out;
}

/**
 * One page to its chunks.
 *
 * The opening text before the first heading becomes a chunk of its own titled with the page, so a
 * page whose answer lives in its lede is still reachable. Sections shorter than `MIN_CHARS` are
 * folded into nothing rather than embedded: a bare heading with no body is noise in a vector
 * index and will match everything weakly.
 */
export function chunkPage(opts: {
  raw: string;
  url: string;
  lang: string;
}): Chunk[] {
  const { meta, body } = splitFrontmatter(opts.raw);
  const pageTitle = meta.title ?? opts.url;
  const chunks: Chunk[] = [];

  // Headings at any depth, so an h3 under an h2 is its own answerable unit.
  const parts = body.split(/^(#{2,4})\s+(.+)$/gm);
  const leadSplit = splitCode(parts[0] ?? '');
  const lead = toPlainText(leadSplit.prose);
  const description = meta.description ?? '';

  const leadText = [description, lead].filter((s) => s.length > 0).join('\n\n');
  if (leadText.length >= MIN_CHARS) {
    pack(leadText).forEach((text, i) => {
      chunks.push({
        url: opts.url,
        anchor: '',
        pageTitle,
        heading: pageTitle,
        text,
        code: i === 0 ? leadSplit.code : undefined,
        lang: opts.lang,
      });
    });
  }

  // Collect the sections first, with their depth, so a thin one can look at what follows it.
  const sections: {
    depth: number;
    heading: string;
    body: string;
    code?: { lang: string; source: string };
  }[] = [];
  for (let i = 1; i < parts.length; i += 3) {
    const heading = (parts[i + 1] ?? '').trim();
    if (heading.length === 0) continue;
    const split = splitCode(parts[i + 2] ?? '');
    sections.push({
      depth: (parts[i] ?? '##').length,
      heading,
      body: toPlainText(split.prose),
      code: split.code,
    });
  }

  sections.forEach((section, i) => {
    let body = section.body;
    let code = section.code;

    if (body.length < THIN_BODY) {
      // Take the subsections underneath it, in order, until there is enough to answer with or the
      // next sibling at the same depth begins.
      for (let j = i + 1; j < sections.length; j += 1) {
        const next = sections[j]!;
        if (next.depth <= section.depth) break;
        body = `${body}\n\n${next.heading}. ${next.body}`.trim();
        code ??= next.code;
        if (body.length >= MAX_CHARS) break;
      }
    }

    if (body.length < MIN_CHARS) return;
    pack(body).forEach((text, j) => {
      chunks.push({
        url: opts.url,
        anchor: slugify(section.heading),
        pageTitle,
        heading: section.heading,
        text,
        code: j === 0 ? code : undefined,
        lang: opts.lang,
      });
    });
  });

  return chunks;
}

/** What actually goes through the embedder: the page and heading give the body its context. */
export function embedText(chunk: Chunk): string {
  return `${chunk.pageTitle} — ${chunk.heading}\n${chunk.text}`;
}
