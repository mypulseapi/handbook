import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  /*
   * A static export has no server, so there is nothing to run Next's image optimizer. Without
   * this, <Image> emits /_next/image?url=... and every logo 404s on GitHub Pages while building
   * perfectly well locally. The Pages workflow's configure-pages step injects the same setting,
   * but relying on that means the local build and the deployed one differ, and the difference
   * only shows up in production.
   */
  images: { unoptimized: true },
};

export default withMDX(config);
