import Link from 'next/link';
import type { Metadata } from 'next';
import { source } from '@/lib/source';

/**
 * Where /docs/* used to be.
 *
 * The documentation moved to the site root on 2026-10-19, which changed every URL on the site.
 * A handful were already in the wild by then: the npm README, the SDK package page, links in
 * transactional email. They have to keep resolving.
 *
 * A static export has no server, so `redirects` in next.config does nothing and there is no 308
 * to issue. A zero delay meta refresh is what is left, and search engines treat it as a
 * permanent redirect. Each stub is noindex and carries a canonical to its new home, so the two
 * URLs never compete for the same ranking.
 *
 * These are generated from the page tree rather than hand written, so a page added tomorrow gets
 * its legacy URL for free and no list goes stale. Delete this route once the old links are gone
 * from anywhere that matters.
 */
function destination(slug: string[] | undefined) {
  return `/${(slug ?? []).join('/')}`;
}

export default async function LegacyDocsRedirect(props: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await props.params;
  const url = destination(slug);

  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${url}`} />
      <main className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-fd-muted-foreground text-sm">
          This page moved to{' '}
          <Link href={url} className="text-fd-foreground underline underline-offset-4">
            {url}
          </Link>
          .
        </p>
      </main>
    </>
  );
}

export async function generateStaticParams() {
  // The bare /docs redirect to the root, plus one stub per page at its old address.
  return [{ slug: [] }, ...source.generateParams()];
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;

  return {
    title: 'Moved',
    alternates: { canonical: destination(slug) },
    robots: { index: false, follow: true },
  };
}
