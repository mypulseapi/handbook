'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { type ReactNode } from 'react';
import { provider } from '@/lib/i18n-ui';
import type { Language } from '@/lib/i18n';

export function Provider({ lang, children }: { lang: Language; children: ReactNode }) {
  return (
    <RootProvider search={{ SearchDialog }} i18n={provider(lang)}>
      {children}
    </RootProvider>
  );
}
