import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { LayoutDashboard, Package } from 'lucide-react';
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
         * The shopfront mark, not a word and not a hostname.
         *
         * It read `thepulseapi.com` first, which is a fourth piece of jargon beside `npm` and
         * `Dashboard` and tells a reader nothing about what they get by clicking it. Then it
         * read `Website` in a chip. Now it is the mark itself, which is what the marketing
         * site is actually selling: a shop.
         *
         * No chip ring around it. The ring existed to make a bare word read as a control, and
         * this mark is already a filled disc: a `rounded-full` border around a circle reads as
         * a halo, not a button. Hover dims it instead, which is the same affordance with one
         * fewer element.
         *
         * 24px, not the 18px the lucide glyphs beside it use. Rendered at 18 the awning
         * stripes collapse into a single red band and the shelf is a smear; at 24 the scallops
         * and the counter survive. Checked by rasterising the file at both sizes, not guessed.
         *
         * `alt` carries the whole accessible name now that no text does, so it is translated
         * rather than decorative. A picture with an empty alt here would leave the link
         * unnamed, which is the one thing worse than a hostname.
         *
         * The art itself is fixed-colour: 17 paths of navy, red and yellow that do not respond
         * to the theme the way a lucide glyph did. That is the trade for using this particular
         * mark, and it is deliberate, not an oversight.
         */
        text: (
          <Image
            src="/online-shop.svg"
            alt={lang === 'vi' ? 'Trang chủ' : 'Website'}
            title={lang === 'vi' ? 'Trang chủ' : 'Website'}
            width={460}
            height={460}
            className="size-6 transition-opacity hover:opacity-75"
          />
        ),
        // The marketing site is locale-prefixed, so send a Vietnamese reader to the Vietnamese one.
        url: lang === 'vi' ? siteUrl.replace(/\/en$/, '/vi') : siteUrl,
        external: true,
      },
    ],
  };
}
