import { docsLlms, source } from '@/lib/source';
import { getPageMarkdownUrl } from '@/lib/shared';
import type { Language } from '@/lib/i18n';
import { notFound } from 'next/navigation';

/**
 * The Markdown behind "Copy Markdown" and "View as Markdown", for one language.
 *
 * Shared by the English route at `/llms.mdx/docs` and the Vietnamese one at `/vi/llms.mdx/docs`,
 * the same split the document pages use and for the same reason: this is a static export, so the
 * locale cannot be hidden by middleware and English keeps its existing URLs by living at the root.
 *
 * Before this existed the route was English-only and the buttons pointed at a locale-prefixed URL
 * that no route served, so every page on the site offered two actions that 404ed.
 */
export async function renderMarkdown(lang: Language, slug: string[] | undefined) {
  // The last segment is the "content.md" the URL builder appends, not part of the page's slug.
  const page = source.getPage(slug?.slice(0, -1), lang);
  if (!page) notFound();

  return new Response(await docsLlms.page(page), {
    headers: { 'Content-Type': 'text/markdown' },
  });
}

/** Every page in `lang`, as the `[[...slug]]` segments its Markdown route is generated for. */
export function markdownParams(lang: Language) {
  return source.getPages(lang).map((page) => ({
    slug: getPageMarkdownUrl({ slugs: page.slugs }).segments,
  }));
}
