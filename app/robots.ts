import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/shared';

/**
 * Crawl the pages, skip the machine-readable copies of them.
 *
 * `/llms.mdx/` serves the same prose as Markdown for language models and `/api/` serves the
 * search index. Both duplicate content that already exists at a real URL, which is the shape
 * that costs a site its canonical ranking.
 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/llms.mdx/'] }],
    sitemap: `${siteOrigin}/sitemap.xml`,
    host: siteOrigin,
  };
}
