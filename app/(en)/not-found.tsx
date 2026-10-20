import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export const metadata = {
  title: 'Page not found',
  // A 404 that gets indexed competes with the pages that do exist.
  robots: { index: false, follow: true },
};

/**
 * The 404, which GitHub Pages serves from the exported 404.html.
 *
 * Without this file an unknown URL falls through to GitHub's own "There isn't a GitHub Pages
 * site here" page, which carries no branding, no navigation and no way back into the docs. Old
 * links in blog posts and Stack Overflow answers land here, so it offers the two things those
 * readers want: search, and the section index.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-fd-muted-foreground font-mono text-sm">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        That page is not here
      </h1>
      <p className="text-fd-muted-foreground mt-3 max-w-md">
        The documentation moved around when the API reference was versioned. Search for what you
        were reading, or start from the index.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="bg-fd-primary text-fd-primary-foreground inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="size-4" /> Documentation
        </Link>
        <Link
          href="/api/v1"
          className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Search className="size-4" /> API reference
        </Link>
      </div>
    </main>
  );
}
