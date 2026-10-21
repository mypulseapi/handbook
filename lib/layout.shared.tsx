import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { Globe, LayoutDashboard, Package } from 'lucide-react';
import { appName, dashboardUrl, gitConfig, npmPackage, siteUrl } from './shared';
import type { Language } from './i18n';

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

/**
 * `lang` steers three things: where the wordmark links, which locale of the marketing site the
 * header points at, and the label on that link. Everything else is identical between locales.
 */
export function baseOptions(lang: Language = 'en'): BaseLayoutProps {
  const home = lang === 'en' ? '/' : `/${lang}`;

  return {
    nav: {
      title: <Logo />,
      url: home,
      transparentMode: 'none',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      { icon: <Package />, text: 'npm', url: `https://www.npmjs.com/package/${npmPackage}`, external: true },
      { icon: <LayoutDashboard />, text: 'Dashboard', url: dashboardUrl, external: true },
      {
        /*
         * A labelled chip, not a bare hostname.
         *
         * `thepulseapi.com` sat between `npm` and `Dashboard` reading as a fourth piece of
         * jargon, and a hostname does not tell a reader what they get by clicking it.
         *
         * `Website` rather than `Visit Pulse`: it is one word, so it fits the chip at every
         * width, it parallels `Dashboard` next to it (both are places, not instructions), and
         * it does not repeat the brand that the wordmark is already saying two inches to the
         * left.
         *
         * The chip is the label, not the item type. `type: 'button'` exists in Fumadocs' link
         * union but this layout renders it with exactly the same classes as a plain link,
         * checked in the built DOM: all three of npm, Dashboard and this one came out
         * identical. So the outline is drawn here, on the text, with Fumadocs' own tokens so
         * it still follows the theme in both light and dark.
         */
        icon: <Globe />,
        text: (
          <span className="rounded-full border border-fd-border px-2.5 py-1 text-xs font-medium transition-colors group-hover/link:border-fd-primary/40">
            {lang === 'vi' ? 'Trang chủ' : 'Website'}
          </span>
        ),
        // The marketing site is locale-prefixed, so send a Vietnamese reader to the Vietnamese one.
        url: lang === 'vi' ? siteUrl.replace(/\/en$/, '/vi') : siteUrl,
        external: true,
      },
    ],
  };
}
