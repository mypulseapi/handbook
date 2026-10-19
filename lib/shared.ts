import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'PULSE Developers';
export const docsRoute = '/docs';
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
