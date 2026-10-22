import { markdownParams, renderMarkdown } from '@/lib/markdown-route';

export const revalidate = false;

/** English, at the root: see `lib/markdown-route.ts` for why the two languages are two routes. */
export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>) {
  const { slug } = await params;
  return renderMarkdown('en', slug);
}

export function generateStaticParams() {
  return markdownParams('en');
}
