import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { Globe, LayoutDashboard, Package } from 'lucide-react';
import { appName, dashboardUrl, gitConfig, linkedinUrl, npmPackage, siteUrl } from './shared';
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
/**
 * The LinkedIn mark, inline.
 *
 * lucide-react dropped its brand icons, and a whole icon package for one glyph is not a trade
 * worth making. `currentColor` so it follows the theme like every other icon in this row.
 */
function LinkedinMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

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
      {
        /*
         * LinkedIn, as an icon for the same reason the website link is one: a fourth word in this
         * row would crowd it, and the mark is recognisable without a label.
         *
         * The handbook claimed no profiles at all before this, while the marketing site claimed
         * two, so a crawler reading both saw one organisation disagree with itself.
         */
        type: 'icon',
        label: 'LinkedIn',
        icon: <LinkedinMark />,
        text: 'LinkedIn',
        url: linkedinUrl,
        external: true,
      },
    ],
  };
}
