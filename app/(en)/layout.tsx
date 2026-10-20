import '../global.css';
import { RootShell } from '@/lib/root-layout';
import { DocsShell } from '@/components/docs-shell';
import { rootMetadata } from '@/lib/root-metadata';
import type { Metadata } from 'next';

/** English, at the site root. See `lib/i18n.ts` for why there are two trees. */
export const metadata: Metadata = rootMetadata;

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <RootShell lang="en">
      <DocsShell lang="en">{children}</DocsShell>
    </RootShell>
  );
}
