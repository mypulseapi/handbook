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
  /** Plain text, MDX stripped. What gets embedded and what gets shown. */
  text: string;
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
 * MDX to plain text.
 *
 * Code fences are kept, because a reader asking "how do I call the audit endpoint" wants the
 * snippet and a chunk that dropped it would retrieve well and answer badly. JSX tags are removed
 * but their children are not: `<Callout title="x">body</Callout>` keeps `body`, since that is
 * prose the author wrote for a reader.
 */
export function toPlainText(mdx: string): string {
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
      // markdown links keep their label, drop the target
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_`>|]/g, ' ')
      .replace(/^[-=]{3,}$/gm, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
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
  const lead = toPlainText(parts[0] ?? '');
  const description = meta.description ?? '';

  const leadText = [description, lead].filter((s) => s.length > 0).join('\n\n');
  if (leadText.length >= MIN_CHARS) {
    for (const text of pack(leadText)) {
      chunks.push({ url: opts.url, anchor: '', pageTitle, heading: pageTitle, text, lang: opts.lang });
    }
  }

  // Collect the sections first, with their depth, so a thin one can look at what follows it.
  const sections: { depth: number; heading: string; body: string }[] = [];
  for (let i = 1; i < parts.length; i += 3) {
    const heading = (parts[i + 1] ?? '').trim();
    if (heading.length === 0) continue;
    sections.push({
      depth: (parts[i] ?? '##').length,
      heading,
      body: toPlainText(parts[i + 2] ?? ''),
    });
  }

  sections.forEach((section, i) => {
    let body = section.body;

    if (body.length < THIN_BODY) {
      // Take the subsections underneath it, in order, until there is enough to answer with or the
      // next sibling at the same depth begins.
      for (let j = i + 1; j < sections.length; j += 1) {
        const next = sections[j]!;
        if (next.depth <= section.depth) break;
        body = `${body}\n\n${next.heading}. ${next.body}`.trim();
        if (body.length >= MAX_CHARS) break;
      }
    }

    if (body.length < MIN_CHARS) return;
    for (const text of pack(body)) {
      chunks.push({
        url: opts.url,
        anchor: slugify(section.heading),
        pageTitle,
        heading: section.heading,
        text,
        lang: opts.lang,
      });
    }
  });

  return chunks;
}

/** What actually goes through the embedder: the page and heading give the body its context. */
export function embedText(chunk: Chunk): string {
  return `${chunk.pageTitle} — ${chunk.heading}\n${chunk.text}`;
}
