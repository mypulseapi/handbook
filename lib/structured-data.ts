import type { Root } from 'fumadocs-core/page-tree';
import { firstUrl, folderPath } from './page-tree';
import { appName, companyName, docsRoute, npmPackage, siteOrigin, siteUrl } from './shared';

/**
 * Schema.org descriptions of what this site is, for the crawlers that read them.
 *
 * Search engines will index the pages either way. What this buys is the part they cannot infer:
 * that developer.thepulseapi.com and thepulseapi.com are one organisation, which page sits
 * inside which section, and that a page is technical documentation rather than a blog post.
 * Breadcrumb markup is the one with a visible payoff, since it replaces the bare URL under a
 * result with the section path.
 */

/** Rendered into a page as a plain script tag. Next does not treat it as a client script. */
export function jsonLdProps(data: object) {
  return {
    type: 'application/ld+json',
    // The data is ours, built from the page tree, and JSON.stringify escapes what matters.
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  } as const;
}

const organization = {
  '@type': 'Organization',
  '@id': `${siteOrigin}/#organization`,
  name: companyName,
  url: siteUrl,
  logo: `${siteOrigin}/pulse-logo.png`,
};

export function siteLd(description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        url: siteOrigin,
        name: appName,
        description,
        publisher: { '@id': `${siteOrigin}/#organization` },
        inLanguage: 'en',
      },
      {
        '@type': 'SoftwareApplication',
        name: npmPackage,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        license: 'https://opensource.org/licenses/MIT',
        url: `https://www.npmjs.com/package/${npmPackage}`,
      },
    ],
  };
}

export function docPageLd({
  title,
  description,
  url,
  tree,
}: {
  title: string;
  description?: string;
  url: string;
  tree: Root;
}) {
  // Section folders are only worth naming when they lead somewhere, so each resolves to its
  // first page. docsRoute is skipped on the index itself, which would otherwise be its own
  // parent.
  // A folder whose first page is this page would list the page twice, once under the folder's
  // name, so it is dropped rather than repeated.
  const sections = (folderPath(tree, url) ?? []).flatMap((folder) => {
    const href = firstUrl(folder);
    const named = typeof folder.name === 'string' ? folder.name : undefined;
    return href && named && href !== url ? [{ name: named, url: href }] : [];
  });

  const trail = [
    ...(url === docsRoute ? [] : [{ name: 'Documentation', url: docsRoute }]),
    ...sections,
    { name: title, url },
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: title,
        description,
        url: `${siteOrigin}${url}`,
        inLanguage: 'en',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        publisher: { '@id': `${siteOrigin}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${siteOrigin}${item.url}`,
        })),
      },
    ],
  };
}
