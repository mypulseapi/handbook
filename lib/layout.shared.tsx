import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpen, LayoutDashboard, Globe } from 'lucide-react';
import { appName, dashboardUrl, gitConfig, siteUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <span
            aria-hidden
            className="bg-fd-primary inline-block size-2.5 rounded-full"
          />
          {appName}
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      { icon: <BookOpen />, text: 'Docs', url: '/docs', active: 'nested-url' },
      { icon: <LayoutDashboard />, text: 'Dashboard', url: dashboardUrl, external: true },
      { icon: <Globe />, text: 'thepulseapi.com', url: siteUrl, external: true },
    ],
  };
}
