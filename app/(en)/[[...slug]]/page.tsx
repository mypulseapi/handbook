import { docMetadata, docParams, renderDocPage } from '@/lib/doc-route';
import type { Metadata } from 'next';

/** English, at the site root. Vietnamese lives under `app/vi`. See `lib/i18n.ts`. */
export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const { slug } = await props.params;
  return renderDocPage('en', slug);
}

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;
  return docMetadata('en', slug);
}

export function generateStaticParams() {
  return docParams('en');
}
