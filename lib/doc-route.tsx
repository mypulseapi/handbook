import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/notebook/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { appName, getPageImageUrl, getPageMarkdownUrl, gitConfig } from '@/lib/shared';
import { docPageLd, jsonLdProps } from '@/lib/structured-data';
import { i18n, type Language } from '@/lib/i18n';
import { PageHistory } from '@/components/page-history';

/**
 * One document page, rendered for a given language.
 *
 * Shared by the English routes at `/` and the Vietnamese ones at `/vi`, which exist as two
 * route trees rather than one `[lang]` segment. The reason is in `lib/i18n.ts`: this is a static
 * export, so Fumadocs' middleware-based locale hiding is unavailable, and two trees is what
 * keeps `/quickstart` at `/quickstart` instead of moving every English URL to `/en/quickstart`.
 */
export async function renderDocPage(lang: Language, slug: string[] | undefined) {
  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl({ slugs: page.slugs, locale: lang }).url;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <script
        {...jsonLdProps(
          docPageLd({
            title: page.data.title,
            description: page.data.description,
            url: page.url,
            tree: source.getPageTree(lang),
            lang,
          }),
        )}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
        <PageHistory contentPath={page.path} lang={lang} />
      </DocsBody>
    </DocsPage>
  );
}

/**
 * Metadata for one page, including the hreflang pair.
 *
 * `alternates.languages` is what tells a search engine that `/quickstart` and `/vi/quickstart`
 * are the same document in two languages rather than duplicates competing with each other.
 * `x-default` points at English because that is the default language.
 */
export async function docMetadata(lang: Language, slug: string[] | undefined): Promise<Metadata> {
  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const image = getPageImageUrl({ slugs: page.slugs, locale: lang }).url;
  const enUrl = source.getPage(slug, 'en')?.url ?? page.url;
  const viUrl = source.getPage(slug, 'vi')?.url ?? `/vi${enUrl === '/' ? '' : enUrl}`;

  return {
    title: page.data.title,
    description: page.data.description,
    // Without this every page claims the site root as its canonical and only the home page is
    // indexed. It is relative on purpose: metadataBase in the root layout makes it absolute.
    alternates: {
      canonical: page.url,
      languages: { en: enUrl, vi: viUrl, 'x-default': enUrl },
    },
    openGraph: {
      // Next replaces this object wholesale rather than merging it into the root layout's, so
      // siteName and locale have to be repeated or they are dropped from every page but the home.
      type: 'article',
      siteName: appName,
      locale: lang === 'vi' ? 'vi_VN' : 'en_US',
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.data.title,
      description: page.data.description,
      images: image,
    },
  };
}

/** Static params for one language. English pages keep their bare slugs. */
export function docParams(lang: Language) {
  const prefix = lang === i18n.defaultLanguage ? [] : [lang];
  return source.getPages(lang).map((page) => ({ slug: [...prefix, ...page.slugs] }));
}
