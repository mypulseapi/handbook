import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteOrigin } from '@/lib/shared';
import { i18n } from '@/lib/i18n';

/**
 * Every page, in every language, once, at its canonical URL.
 *
 * Each entry carries the `alternates.languages` map so a crawler can see the English and
 * Vietnamese copies are the same document rather than two pages competing for one ranking. That
 * is the same relationship the `hreflang` tags assert in the head; stating it in both places is
 * what Google asks for.
 *
 * `lastModified` is left out deliberately. The only date available at build time is the build
 * itself, which would mark every page as changed on every deploy; a sitemap that says everything
 * changed is one a crawler learns to ignore.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const alternatesFor = (slugs: string[]) => {
    const tail = slugs.length > 0 ? `/${slugs.join('/')}` : '';
    return Object.fromEntries(
      i18n.languages.map((lang) => [
        lang,
        lang === i18n.defaultLanguage
          ? `${siteOrigin}${tail || '/'}`
          : `${siteOrigin}/${lang}${tail}`,
      ]),
    );
  };

  return i18n.languages.flatMap((lang) =>
    source.getPages(lang).map((page) => ({
      url: `${siteOrigin}${page.url}`,
      changeFrequency: 'weekly' as const,
      // The entry points people land on from search rank above the pages they reach from there.
      priority: page.slugs.length === 0 ? 1 : page.slugs[0] === 'quickstart' ? 0.9 : 0.7,
      alternates: { languages: alternatesFor(page.slugs) },
    })),
  );
}
