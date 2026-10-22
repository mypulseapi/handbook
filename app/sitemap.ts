import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteOrigin } from '@/lib/shared';
import { i18n } from '@/lib/i18n';
import { lastModified } from '@/lib/doc-history';

/**
 * Every page, in every language, once, at its canonical URL.
 *
 * Each entry carries the `alternates.languages` map so a crawler can see the English and
 * Vietnamese copies are the same document rather than two pages competing for one ranking. That
 * is the same relationship the `hreflang` tags assert in the head; stating it in both places is
 * what Google asks for.
 *
 * `lastModified` is a REAL date, read per file from git, not the build time. That distinction is
 * the whole point: `reference/seo_and_aeo_engineering_standard.md` says a `lastmod` "must be a
 * real modification date or be omitted entirely", because one that updates on every deploy is
 * ignored by Google once it has been caught lying twice. This repository is one `.mdx` per page,
 * so `lastModified()` can ask git when that file last changed, which is the same source the
 * footer already shows a reader. A page whose date cannot be read is emitted without one rather
 * than with a guess.
 *
 * `x-default` is listed alongside `en` and `vi`. It tells a crawler which copy to serve someone
 * whose language matches neither, and without it that choice is Google's rather than ours.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const alternatesFor = (slugs: string[]) => {
    const tail = slugs.length > 0 ? `/${slugs.join('/')}` : '';
    const forLang = (lang: string) =>
      lang === i18n.defaultLanguage ? `${siteOrigin}${tail || '/'}` : `${siteOrigin}/${lang}${tail}`;
    return {
      ...Object.fromEntries(i18n.languages.map((lang) => [lang, forLang(lang)])),
      // Whoever matches neither language gets the default one, by our choice rather than Google's.
      'x-default': forLang(i18n.defaultLanguage),
    };
  };

  return i18n.languages.flatMap((lang) =>
    source.getPages(lang).map((page) => ({
      url: `${siteOrigin}${page.url}`,
      // Real, from git. Undefined when the file has no history yet, which Next omits.
      lastModified: lastModified(page.path) ?? undefined,
      changeFrequency: 'weekly' as const,
      // The entry points people land on from search rank above the pages they reach from there.
      priority: page.slugs.length === 0 ? 1 : page.slugs[0] === 'quickstart' ? 0.9 : 0.7,
      alternates: { languages: alternatesFor(page.slugs) },
    })),
  );
}
