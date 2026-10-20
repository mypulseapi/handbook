import type { Metadata } from 'next';
import { appName, siteOrigin } from '@/lib/shared';

const description =
  'Measure whether your product data can answer what shoppers ask. Send one catalogue export, get ranked repairs back, then verify the fix. SDK, guides and the full HTTP reference.';

/*
 * The defaults every page inherits.
 *
 * metadataBase is load-bearing twice over: the OG image routes resolve against it, and so does
 * every relative canonical set further down the tree. Without it Next falls back to
 * localhost:3000 and both go out wrong, which is only noticed after someone shares a link.
 *
 * The title template ends in the site name rather than starting with it, so a result in a
 * search listing leads with the page and a browser tab truncating at thirty characters still
 * shows what the tab is.
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: `${appName}: PULSE Decision API documentation`, template: `%s | ${appName}` },
  description,
  applicationName: appName,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: appName,
    url: siteOrigin,
    locale: 'en_US',
    title: `${appName}: PULSE Decision API documentation`,
    description,
  },
  twitter: { card: 'summary_large_image', title: appName, description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

/*
 * Geist and Geist Mono, which replaced Inter in the brand guideline on 19 Oct 2026.
 *
 * `vietnamese` is in the subsets because the marketing site has a `vi` locale coming and the
 * guideline chose this pairing partly for its Vietnamese coverage. Loading it here costs one
 * extra unicode-range the browser only fetches when it meets a Vietnamese glyph.
 *
 * Both are exposed as CSS variables rather than a className, so `global.css` can point the
 * Fumadocs font tokens at them. Geist Mono is for data and code only, never for prose.
 */
