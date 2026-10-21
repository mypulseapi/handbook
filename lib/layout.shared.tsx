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
         * The link to the marketing site, as a blue glyph.
         *
         * It has been three things now: the bare hostname `thepulseapi.com`, which read as a
         * fourth piece of jargon beside `npm` and `Dashboard`; the word `Website` in a chip; and
         * a full-colour shopfront illustration. The illustration lost: seventeen paths of navy,
         * red and amber collapse into a muddy dot at the 20px the header gives it, and its fixed
         * hex fills ignored the theme that everything around them follows.
         *
         * `type: 'icon'` rather than a label, which is what the GitHub button beside it uses, so
         * the three of them read as one row of controls. It carries `label` as the `aria-label`,
         * so dropping the visible word costs nothing to a screen reader.
         *
         * `text-fd-primary` is Pulse Blue, and it is a token rather than a hex so the dark theme
         * gets its lighter blue instead of a #2552FF that goes muddy on a dark surface.
         */
        type: 'icon',
        label: lang === 'vi' ? 'Trang chủ' : 'Website',
        icon: <Globe className="text-fd-primary" />,
        text: lang === 'vi' ? 'Trang chủ' : 'Website',
        // The marketing site is locale-prefixed, so send a Vietnamese reader to the Vietnamese one.
        url: lang === 'vi' ? siteUrl.replace(/\/en$/, '/vi') : siteUrl,
        external: true,
      },
    ],
  };
}
