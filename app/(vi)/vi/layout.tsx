import { DocsShell } from '@/components/docs-shell';

export default function Layout({ children }: LayoutProps<'/vi'>) {
  return <DocsShell lang="vi">{children}</DocsShell>;
}
