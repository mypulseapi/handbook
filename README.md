# PULSE developer handbook

The developer documentation for [`@thepulseapi/sdk`](https://www.npmjs.com/package/@thepulseapi/sdk)
and the PULSE Decision API.

Built with [Fumadocs](https://fumadocs.dev) on Next.js, exported as a static site and served by
GitHub Pages.

## Local

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm build   # static export to ./out
```

## Writing

Content is MDX under `content/docs`. The sidebar comes from `meta.json` files beside the pages.

Install commands are written once and rendered for all four package managers:

```mdx
<InstallTabs pkg="@thepulseapi/sdk" />
```

`icon:` in a page's frontmatter is a [lucide](https://lucide.dev) icon name. An unknown name
fails the build rather than rendering a blank square.

## Two things that will bite you

**The build uses webpack, not Turbopack.** `next build --webpack` is deliberate: Turbopack's CSS
parser rejects the `::highlight()` selector that fumadocs-ui uses for search highlighting.

**Do not pass an array to `mdxOptions.remarkPlugins`.** It replaces fumadocs' defaults rather than
extending them, which silently removes the structured-data extractor and breaks search with
"Cannot find structured data from page".

## Deployment

Work lands on `develop` first. Merging **`develop` into `main`** is the release: that is what
runs `.github/workflows/nextjs.yml` and publishes to **`developer.thepulseapi.com`**. A push to
`develop` deploys nothing, which is the point. See [CONTRIBUTING.md](./CONTRIBUTING.md).

Written as code rather than a link on purpose: the link check runs on every PR, and a URL that
only becomes valid after the first deploy would fail it. Make it a link once the site is live.

`public/CNAME` is what claims that domain on each deploy. GitHub Actions deployments do not
remember a custom domain set only in the repository settings, so removing that file would send
the site back to `mypulseapi.github.io/handbook` on the next push.

The workflow was adapted from GitHub's Next.js starter, which detects only yarn and npm and falls
back to `npm ci`. This repo uses pnpm, so pnpm is installed explicitly before `setup-node`,
because `cache: pnpm` resolves the store path by running pnpm.
