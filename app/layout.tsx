import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';
import type { Metadata } from 'next';
import { appName, siteOrigin } from '@/lib/shared';

const description =
  'Build with the PULSE Decision API: real-time persona inference for e-commerce. SDK, framework guides and the full HTTP reference.';

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
export const metadata: Metadata = {
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

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
