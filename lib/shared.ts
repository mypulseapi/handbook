import { createGetUrl } from 'fumadocs-core/source';
import { i18n } from './i18n';

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
export const dashboardApiKeyUrl = `${dashboardUrl}${process.env.NEXT_PUBLIC_APP_API_KEY_PATH || '/integration/api-keys'}`;

/** Where a merchant chooses and pays for a subscription, inside the dashboard. */
export const dashboardBillingUrl = `${dashboardUrl}${process.env.NEXT_PUBLIC_APP_BILLING_PATH || '/settings/billing'}`;

/**
 * Where a merchant creates an account. Sign-up lives on the marketing site, not the dashboard: the
 * dashboard sends signed-out visitors there (`penguin/src/lib/store-urls.ts`).
 */
export const dashboardSignUpUrl = `${siteUrl}${process.env.NEXT_PUBLIC_SITE_SIGNUP_PATH || '/signup'}`;

/** The plans a merchant can subscribe to, on the marketing site. */
export const pricingUrl = `${siteUrl}${process.env.NEXT_PUBLIC_SITE_PRICING_PATH || '/pricing'}`;

/** The marketing site's Vietnamese tree, for links from the Vietnamese pages. */
export const siteViUrl = `${siteOriginUrl}${process.env.NEXT_PUBLIC_SITE_VI_LOCALE_PATH || '/vi'}`;
export const signUpViUrl = `${siteViUrl}${process.env.NEXT_PUBLIC_SITE_SIGNUP_PATH || '/signup'}`;
export const pricingViUrl = `${siteViUrl}${process.env.NEXT_PUBLIC_SITE_PRICING_PATH || '/pricing'}`;

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

/**
 * The company's profiles off this site.
 *
 * `githubOrg` is the organisation, which is not the same thing as `gitConfig`: that one names the
 * repository this handbook lives in, for the "edit this page" and history links. LinkedIn was
 * absent entirely, so the Organization schema here claimed no profiles at all while the marketing
 * site claimed two.
 */
export const githubOrgUrl = env(
  process.env.NEXT_PUBLIC_GITHUB_URL,
  'https://github.com/mypulseapi',
);
export const linkedinUrl = env(
  process.env.NEXT_PUBLIC_LINKEDIN_URL,
  'https://www.linkedin.com/company/thepulseapi/',
);

export const gitConfig = {
  user: process.env.NEXT_PUBLIC_GIT_USER || 'mypulseapi',
  repo: process.env.NEXT_PUBLIC_GIT_REPO || 'handbook',
  branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'main',
};

/**
 * The URL the "Copy Markdown" and "View as Markdown" buttons point at.
 *
 * **This was a 404 on every page.** `createGetUrl` prefixes whatever locale it is handed, so the
 * buttons built `/en/llms.mdx/docs/<slug>/content.md` while the route serving that Markdown lives
 * at `/llms.mdx/docs/<slug>/content.md`. English is the DEFAULT locale here and
 * `i18n.hideLocale: 'default-locale'` keeps it out of every other URL on the site, so it has to
 * stay out of this one too. Vietnamese keeps its prefix and has its own route, matching how the
 * document pages themselves are split into two trees.
 */
const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];
  const locale = page.locale === i18n.defaultLanguage ? undefined : page.locale;

  return { segments, url: getContentUrl(segments, locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
