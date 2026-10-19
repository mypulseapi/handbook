import { llms, loader } from 'fumadocs-core/source';
import { createElement } from 'react';
import { icons } from 'lucide-react';
import { docsRoute } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [],
  /*
   * `icon: Rocket` in a page's frontmatter resolves to the lucide icon of that name. An unknown
   * name throws at build rather than rendering a blank square, so a typo fails the build instead
   * of shipping a hole in the sidebar.
   */
  icon(name) {
    if (!name) return;
    if (!(name in icons)) throw new Error(`Unknown lucide icon in frontmatter: ${name}`);
    return createElement(icons[name as keyof typeof icons]);
  },
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
