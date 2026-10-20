import {
  apiBaseUrl,
  cdnSdkUrl,
  dashboardApiKeyUrl,
  dashboardSignUpUrl,
  dashboardUrl,
  demoUrl,
  siteOrigin,
  siteUrl,
} from '@/lib/shared';

/**
 * Links to our other properties, for MDX.
 *
 * Markdown link syntax takes a literal, so every cross-property URL in the documentation was a
 * copy of a domain: a hundred-odd of them, which is a hundred edits the day one of those domains
 * moves, and a hundred chances to miss one. These components read the same env-driven values as
 * the rest of the app, so a domain change is an environment change.
 *
 * `to` is a key rather than a URL on purpose: a typo fails the TypeScript build instead of
 * shipping a dead link, which is the failure mode of a hardcoded href nobody clicks again.
 */
const TARGETS = {
  /** The marketing site, in English. */
  site: siteUrl,
  /** The marketing site's bare origin, for when the locale should not be forced. */
  siteRoot: siteOrigin,
  /** This handbook. */
  docs: siteOrigin,
  /** The merchant dashboard. */
  dashboard: dashboardUrl,
  /** The screen that issues an API key. */
  apiKey: dashboardApiKeyUrl,
  /** Where a reader creates an account. */
  signUp: dashboardSignUpUrl,
  /** The versioned API root. */
  api: apiBaseUrl,
  /** The browser SDK on the CDN. */
  sdk: cdnSdkUrl,
  /** The demo storefront. */
  demo: demoUrl,
} as const;

export type LinkTarget = keyof typeof TARGETS;

/** A link to one of our properties: `<Ext to="apiKey">the dashboard</Ext>`. */
export function Ext({
  to,
  children,
}: {
  to: LinkTarget;
  children?: React.ReactNode;
}) {
  const href = TARGETS[to];
  return (
    <a href={href} rel="noreferrer">
      {children ?? href}
    </a>
  );
}

/**
 * The URL itself, as code: `<Url to="api" />`.
 *
 * For the places a reader needs to see and copy the address rather than follow it -- a base URL
 * in prose, a host in a configuration note.
 */
export function Url({ to, suffix = '' }: { to: LinkTarget; suffix?: string }) {
  return <code>{`${TARGETS[to]}${suffix}`}</code>;
}
