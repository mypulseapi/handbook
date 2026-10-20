import { createGetUrl } from 'fumadocs-core/source';

/**
 * Every origin and name this site points at, read from the environment.
 *
 * Nothing below is a secret -- all of it ships in the HTML -- but none of it is a literal either,
 * so moving a domain is an environment change in both repositories rather than a commit in each.
 * `NEXT_PUBLIC_*` values are inlined at build time; a static export has no runtime to read them
 * later, so they must be set wherever `next build` runs.
 *
 * The defaults are the production hosts rather than localhost, which is the opposite of the
 * marketing site's rule. The reason is different content: these values appear inside documentation
 * a developer copies, and a quickstart that tells someone to POST to http://localhost:4000 is
 * worse than wrong, it is confidently wrong. A domain that is merely out of date is recoverable;
 * a localhost URL in published docs is not something the reader can repair.
 */
const env = (value: string | undefined, fallback: string) =>
  (value ?? '').trim() === '' ? fallback : (value as string).trim().replace(/\/+$/, '');

export const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PULSE Developers';

/** Where this site is served from. Canonical URLs, the sitemap and JSON-LD all build on it. */
export const siteOrigin = env(process.env.NEXT_PUBLIC_DOCS_URL, 'https://developer.thepulseapi.com');
export const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'PULSE';
/** The legal entity, which is not the brand. Used in the footer and the Organization node. */
export const legalName = process.env.NEXT_PUBLIC_LEGAL_NAME || 'Resolve Labs';
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

/** The marketing site's origin. */
export const siteOriginUrl = env(process.env.NEXT_PUBLIC_SITE_URL, 'https://thepulseapi.com');

/**
 * The marketing site, linked explicitly in English.
 *
 * That site's bare URL redirects to /vi, because Vietnam is the market it sells into. This
 * handbook is English-first, so sending a reader from an English page to a Vietnamese one is a
 * jolt rather than a service. The locale segment is a variable so the two sites can disagree
 * about their defaults without either hardcoding the other's.
 */
export const siteUrl = `${siteOriginUrl}${process.env.NEXT_PUBLIC_SITE_LOCALE_PATH || '/en'}`;

/** The merchant dashboard: an account, and the API key every request here needs. */
export const dashboardUrl = env(process.env.NEXT_PUBLIC_APP_URL, 'https://app.thepulseapi.com');

/** The screen that issues an API key. A path, so a dashboard route change is a variable change. */
export const dashboardApiKeyUrl = `${dashboardUrl}${process.env.NEXT_PUBLIC_APP_API_KEY_PATH || '/settings/api'}`;

/** Where a reader signs up, linked from the quickstart's first step. */
export const dashboardSignUpUrl = `${dashboardUrl}${process.env.NEXT_PUBLIC_APP_SIGNUP_PATH || '/register'}`;

/** The versioned API root every example posts to. */
export const apiBaseUrl = `${env(process.env.NEXT_PUBLIC_API_URL, 'https://api.thepulseapi.com')}${
  process.env.NEXT_PUBLIC_API_BASE_PATH || '/api/v1'
}`;

/** The browser SDK. Versioned by path, so a release is a variable change rather than an edit. */
export const cdnSdkUrl = `${env(process.env.NEXT_PUBLIC_CDN_URL, 'https://cdn.thepulseapi.com')}${
  process.env.NEXT_PUBLIC_SDK_PATH || '/sdk/v0/pulse.iife.js'
}`;

/** The demo storefront the concepts pages point at. */
export const demoUrl = env(process.env.NEXT_PUBLIC_DEMO_URL, 'https://demo.thepulseapi.com');

export const npmPackage = process.env.NEXT_PUBLIC_NPM_PACKAGE || '@thepulseapi/sdk';

export const gitConfig = {
  user: process.env.NEXT_PUBLIC_GIT_USER || 'mypulseapi',
  repo: process.env.NEXT_PUBLIC_GIT_REPO || 'handbook',
  branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'main',
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
