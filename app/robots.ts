import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/shared';

/**
 * Crawl the pages, skip the machine-readable copies of them.
 *
 * `/llms.mdx/` serves the same prose as Markdown for language models and `/api/search` serves
 * the search index. Both duplicate content that already exists at a real URL, which is the shape
 * that costs a site its canonical ranking. `/docs/` is the old address of every page on this
 * site, kept as redirect stubs so published links keep working; they are noindex already, and
 * this keeps crawl budget off them too.
 *
 * The disallow is `/api/search` and not `/api/`. Since the documentation moved to the root the
 * API reference lives at `/api/v1`, and the broader rule would have hidden the most valuable
 * section on the site from every crawler.
 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/search', '/llms.mdx/', '/docs/'] }],
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin,
  };
}
