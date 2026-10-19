import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { sidebarSlots } from '@/components/docs-sidebar';

/**
 * The notebook layout, not the default `docs` one.
 *
 * Both render three columns (sidebar, content, table of contents). The difference is the header:
 * `docs` puts the title and search inside the sidebar, `notebook` with `nav.mode: 'top'` gives a
 * full-width bar across all three columns, which is the shape the Vue and VitePress docs use and
 * the one the dev asked for. It also keeps the logo visible when the sidebar is collapsed.
 *
 * The sidebar slot is overridden to add an icon rail beside the collapsed sidebar. See
 * `components/docs-sidebar.tsx`.
 */
export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{ ...baseOptions().nav, mode: 'top' }}
      sidebar={{ collapsible: true }}
      slots={{ sidebar: sidebarSlots }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
