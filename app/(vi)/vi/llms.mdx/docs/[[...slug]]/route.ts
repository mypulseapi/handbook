import { markdownParams, renderMarkdown } from '@/lib/markdown-route';

export const revalidate = false;

/** Vietnamese, under `/vi`. The `vi` segment is part of the route path, so the slug is locale-free. */
export async function GET(
  _req: Request,
  { params }: RouteContext<'/vi/llms.mdx/docs/[[...slug]]'>,
) {
  const { slug } = await params;
  return renderMarkdown('vi', slug);
}

export function generateStaticParams() {
  return markdownParams('vi');
}
