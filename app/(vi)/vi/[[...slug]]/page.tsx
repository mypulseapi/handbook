import { docMetadata, renderDocPage } from '@/lib/doc-route';
import { source } from '@/lib/source';
import type { Metadata } from 'next';

/**
 * Vietnamese, under `/vi`.
 *
 * A separate tree rather than a `[lang]` segment so English keeps its existing URLs. The slug
 * here is already locale-free, because the `vi` segment is part of the route path.
 */
export default async function Page(props: PageProps<'/vi/[[...slug]]'>) {
  const { slug } = await props.params;
  return renderDocPage('vi', slug);
}

export async function generateMetadata(props: PageProps<'/vi/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;
  return docMetadata('vi', slug);
}

export function generateStaticParams() {
  return source.getPages('vi').map((page) => ({ slug: page.slugs }));
}
