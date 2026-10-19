import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'PULSE Developers';

/** Where this site is served from. Canonical URLs, the sitemap and JSON-LD all build on it. */
export const siteOrigin = 'https://developer.thepulseapi.com';
export const companyName = 'PULSE';
/**
 * The documentation is the site, so it is served from the root.
 *
 * It lived under /docs until 2026-10-19. A developer portal whose every page sat one segment
 * deeper than it needed to was spending that segment on a word every page on the site already
 * implies.
 */
export const docsRoute = '/';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

/** The marketing site. Linked explicitly in English: the site defaults to Vietnamese. */
export const siteUrl = 'https://thepulseapi.com/en';
export const dashboardUrl = 'https://app.thepulseapi.com';
export const apiBaseUrl = 'https://api.thepulseapi.com/api/v1';
export const cdnSdkUrl = 'https://cdn.thepulseapi.com/sdk/v0/pulse.iife.js';
export const npmPackage = '@thepulseapi/sdk';

export const gitConfig = {
  user: 'mypulseapi',
  repo: 'handbook',
  branch: 'main',
};

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
