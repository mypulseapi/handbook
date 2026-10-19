'use client';

import { useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'fumadocs-core/link';
import type * as PageTree from 'fumadocs-core/page-tree';
import { useTreeContext } from 'fumadocs-ui/contexts/tree';
import type { DocsSlots } from 'fumadocs-ui/layouts/notebook';
import {
  Sidebar,
  SidebarCollapseTrigger,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  type SidebarProps,
} from 'fumadocs-ui/layouts/notebook/slots/sidebar';
import { cn } from '@/lib/cn';
import { firstUrl } from '@/lib/page-tree';

/**
 * A rail of section icons, shown while the sidebar is collapsed.
 *
 * Collapsing used to leave nothing behind but a four-pixel hover strip at the edge of the
 * window, so the only way back to another section was to remember the strip was there. The rail
 * keeps every top-level section one click away and costs 3.5rem of the width collapsing just
 * won back.
 *
 * It is driven by the page tree rather than a hand-written list, so adding a folder to
 * `content/docs/meta.json` puts it in the rail with no second edit.
 */

interface RailItem {
  url: string;
  name: ReactNode;
  icon: ReactNode;
  /** The path that counts as "inside this section", for the active state. */
  prefix: string;
}

function railItems(root: PageTree.Root | PageTree.Folder): RailItem[] {
  const items: RailItem[] = [];

  for (const node of root.children) {
    if (node.type === 'separator') continue;

    const url = firstUrl(node);
    const icon = node.type === 'folder' ? (node.icon ?? node.index?.icon) : node.icon;
    // An item with no icon has nothing to show in a rail of icons, so it is left out rather
    // than drawn as a gap.
    if (!url || !icon) continue;

    items.push({
      url,
      name: node.name,
      icon,
      // Every section sits one level under /docs, so the first two segments name one.
      prefix:
        node.type === 'folder'
          ? `/${url.split('/').filter(Boolean).slice(0, 2).join('/')}`
          : url,
    });
  }

  return items;
}

function SectionRail() {
  const { collapsed } = useSidebar();
  const { root } = useTreeContext();
  const pathname = usePathname();
  const items = useMemo(() => railItems(root), [root]);

  if (!collapsed) return null;

  return (
    <div className="sticky top-(--fd-docs-row-2) z-10 flex h-[calc(var(--fd-docs-height)-var(--fd-docs-row-2))] flex-col items-end [grid-area:sidebar] max-md:hidden">
      <nav
        aria-label="Documentation sections"
        className="flex h-full w-14 flex-col items-center gap-1 border-e py-3"
      >
        {items.map((item) => {
          const active = pathname === item.prefix || pathname.startsWith(`${item.prefix}/`);

          return (
            <Link
              key={item.url}
              href={item.url}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex size-9 items-center justify-center rounded-lg transition-colors [&_svg]:size-4.5',
                active
                  ? 'bg-fd-primary/10 text-fd-primary'
                  : 'text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80',
              )}
            >
              {item.icon}
              {/*
                A label on hover, because an icon on its own is a guess. Rendered here rather
                than with the title attribute so it appears at once and can be styled; the span
                is the accessible name, which is why it is not aria-hidden.
              */}
              <span className="pointer-events-none absolute start-full z-20 ms-2 hidden whitespace-nowrap rounded-md border bg-fd-popover px-2 py-1 text-xs text-fd-popover-foreground shadow-md group-hover:block group-focus-visible:block">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarRoot(props: SidebarProps) {
  return (
    <>
      <Sidebar {...props} />
      <SectionRail />
    </>
  );
}

export const sidebarSlots: DocsSlots['sidebar'] = {
  provider: SidebarProvider,
  root: SidebarRoot,
  trigger: SidebarTrigger,
  collapseTrigger: SidebarCollapseTrigger,
  useSidebar,
};
