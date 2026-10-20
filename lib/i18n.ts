import type { I18nConfig } from 'fumadocs-core/i18n';

/**
 * English and Vietnamese, English default.
 *
 * `hideLocale: 'default-locale'` keeps every English URL exactly where it is: `/quickstart`
 * stays `/quickstart` and Vietnamese lives at `/vi/quickstart`. That matters because this site
 * is live and linked from the marketing site header, the npm README and the SDK docs, and
 * `PUBLISHING.md` is explicit that published links keep working.
 *
 * Fumadocs implements that hiding with `NextResponse.rewrite` in middleware. **This site is a
 * static export, so there is no middleware**, and the routing is done by generating both URL
 * shapes at build time instead. See `app/(docs)/[[...slug]]/page.tsx`.
 *
 * `fallbackLanguage` is the reason this can ship before every page is translated: a page with no
 * `.vi.mdx` serves its English body under the Vietnamese chrome rather than 404ing.
 */
export const i18n = {
  languages: ['en', 'vi'],
  defaultLanguage: 'en',
  hideLocale: 'default-locale',
  fallbackLanguage: 'en',
  parser: 'dot',
} as const satisfies I18nConfig;

export type Language = (typeof i18n)['languages'][number];

export const localeNames: Record<Language, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};
