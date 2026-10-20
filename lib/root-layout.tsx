import { Geist, Geist_Mono } from 'next/font/google';
import { Provider } from '@/components/provider';
import type { ReactNode } from 'react';
import type { Language } from '@/lib/i18n';

/*
 * Geist and Geist Mono, which replaced Inter in the brand guideline on 19 Oct 2026.
 *
 * `vietnamese` is in the subsets because this site now serves a `vi` locale and the guideline
 * chose this pairing partly for its Vietnamese coverage. The browser only fetches that
 * unicode-range when it meets a Vietnamese glyph.
 *
 * Both are exposed as CSS variables rather than a className, so `global.css` can point the
 * Fumadocs font tokens at them. Geist Mono is for data and code only, never for prose.
 */
const geist = Geist({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-geist-mono',
  display: 'swap',
});

/**
 * The document shell, one per language tree.
 *
 * There are two root layouts rather than one because `<html lang>` can only be set in a root
 * layout, and it has to say `vi` on Vietnamese pages: the SEO standard section 8 gates on
 * `<html lang>`, `og:locale` and `inLanguage` agreeing with each other. Next allows one root
 * layout per route group, which is what `app/(en)` and `app/(vi)` are for.
 */
export function RootShell({ lang, children }: { lang: Language; children: ReactNode }) {
  return (
    <html
      lang={lang}
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <Provider lang={lang}>{children}</Provider>
      </body>
    </html>
  );
}
