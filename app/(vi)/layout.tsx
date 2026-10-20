import '../global.css';
import { RootShell } from '@/lib/root-layout';
import { rootMetadata } from '@/lib/root-metadata';
import type { Metadata } from 'next';

/** Vietnamese. The `/vi` segment lives one level down so this group owns only its own shell. */
export const metadata: Metadata = {
  ...rootMetadata,
  openGraph: { ...rootMetadata.openGraph, locale: 'vi_VN' },
};

export default function Layout({ children }: LayoutProps<'/vi'>) {
  return <RootShell lang="vi">{children}</RootShell>;
}
