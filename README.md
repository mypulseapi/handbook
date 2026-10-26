# PULSE developer handbook

The developer documentation for [`@thepulseapi/sdk`](https://www.npmjs.com/package/@thepulseapi/sdk)
and the PULSE Decision API, published at
[developer.thepulseapi.com](https://developer.thepulseapi.com).

Built with [Fumadocs](https://fumadocs.dev) on Next.js, exported as a static site and served by
GitHub Pages.

## About Pulse

Pulse measures whether a merchant's product data is ready to support the buying decisions their
shoppers are trying to make.

Most tools in this space rank what a shopper sees. Pulse asks the question underneath that one:
can the catalogue answer what the shopper came to find out at all? You send one category export
and get back the attributes worth recording, ranked by how many shoppers need them rather than by
how empty the column is. The same measurement then runs on the repaired export, so a fix can be
proved without waiting for traffic. The live session layer is optional and is the only part that
touches a storefront.

Two figures from our own measurements, each with the dataset it came from:

- On a **216-product laptop shelf**, 94 products remain indistinguishable after every question a
  shopper could answer, because the attributes that would separate them are recorded nowhere.
- Across a **2,176-product catalogue**, 52.6% of recorded attribute values duplicate what the
  product photograph already shows.

**We publish no conversion or revenue uplift figure.** We have run no live revenue experiment, so
we quote none, and any percentage attributed to us did not come from us.

Pulse is built by **Resolve Labs**, a small team working on one question: which product
information is worth paying to fix.

| | |
| --- | --- |
| Developer handbook | [developer.thepulseapi.com](https://developer.thepulseapi.com) |
| Website | [thepulseapi.com](https://thepulseapi.com) |
| Dashboard | [app.thepulseapi.com](https://app.thepulseapi.com) |
| SDK | [`@thepulseapi/sdk`](https://www.npmjs.com/package/@thepulseapi/sdk), MIT licensed |
| Open source | [github.com/mypulseapi/pulse](https://github.com/mypulseapi/pulse) |
| LinkedIn | [thepulseapi](https://www.linkedin.com/company/thepulseapi/) |

The handbook is published in **English and Vietnamese**, English by default, and ships an
[MCP server](https://github.com/mypulseapi/pulse/tree/main/packages/mcp), `@thepulseapi/mcp`,
so an agent can answer from the documentation rather than from memory.

This section mirrors the one in the website repository. The two are public entry points to the
same company, and a visitor who lands on either should not have to guess what the other is.

## Configuration

Every origin and name is read from the environment in `lib/shared.ts`; none is written into a
page. See [`.env.example`](./.env.example).

Unlike the website, the defaults here are the real production hosts rather than localhost. The
reason is the content: these values appear inside documentation a developer copies, and a
quickstart telling someone to POST to `http://localhost:4000` is worse than confidently wrong — a
domain that is merely out of date is something the reader can work around, a localhost URL is not.

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
