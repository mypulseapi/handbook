import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { Globe, LayoutDashboard, Package } from 'lucide-react';
import { appName, dashboardUrl, gitConfig, npmPackage, siteUrl } from './shared';

/**
 * The wordmark rather than a text title.
 *
 * Two files because the mark is a crimson-to-indigo gradient that disappears on a dark surface.
 * `priority` because it is the only image above the fold on every page, and a late logo is the
 * one layout shift a reader always notices.
 */
function Logo() {
  return (
    <>
      <Image
        src="/pulse-logo.png"
        alt={appName}
        width={1804}
        height={600}
        priority
        className="h-6 w-auto dark:hidden"
      />
      <Image
        src="/pulse-logo-white.png"
        alt={appName}
        width={1804}
        height={600}
        priority
        className="hidden h-6 w-auto dark:block"
      />
    </>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />,
      transparentMode: 'none',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      { icon: <Package />, text: 'npm', url: `https://www.npmjs.com/package/${npmPackage}`, external: true },
      { icon: <LayoutDashboard />, text: 'Dashboard', url: dashboardUrl, external: true },
      { icon: <Globe />, text: 'thepulseapi.com', url: siteUrl, external: true },
    ],
  };
}
