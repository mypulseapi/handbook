import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { sidebarSlots } from '@/components/docs-sidebar';
import type { Language } from '@/lib/i18n';
import type { ReactNode } from 'react';

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
 *
 * `{...baseOptions()}` has to spread FIRST. It carries its own `nav`, so spreading it last
 * overwrote `mode: 'top'` with the bare nav and dropped the layout silently back to `auto`,
 * where the wordmark lives in the sidebar column and disappears the moment the sidebar is
 * collapsed. The header looked right enough that it went unnoticed through two releases.
 *
 * `lang` is a prop rather than a route param because the English tree sits in a route group,
 * which has no params of its own to read.
 */
export function DocsShell({ lang, children }: { lang: Language; children: ReactNode }) {
  const options = baseOptions(lang);

  return (
    <DocsLayout
      {...options}
      tree={source.getPageTree(lang)}
      nav={{ ...options.nav, mode: 'top' }}
      sidebar={{ collapsible: true }}
      slots={{ sidebar: sidebarSlots }}
    >
      {children}
    </DocsLayout>
  );
}
