import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteOrigin } from '@/lib/shared';

/**
 * Every page, once, at its canonical URL.
 *
 * `lastModified` is left out deliberately. The only date available at build time is the build
 * itself, which would mark all twenty pages as changed on every deploy; a sitemap that says
 * everything changed is one a crawler learns to ignore.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteOrigin}/`, changeFrequency: 'weekly', priority: 1 },
    ...source.getPages().map((page) => ({
      url: `${siteOrigin}${page.url}`,
      changeFrequency: 'weekly' as const,
      // The entry points people land on from search rank above the pages they reach from there.
      priority: ['/docs', '/docs/quickstart'].includes(page.url) ? 0.9 : 0.7,
    })),
  ];
}
