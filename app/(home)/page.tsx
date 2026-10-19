import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  Brain,
  Eye,
  Feather,
  KeyRound,
  Rocket,
  SearchX,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { apiBaseUrl, npmPackage, siteUrl } from '@/lib/shared';

/**
 * The landing page is a router, not a pitch.
 *
 * Whoever lands here arrived from an npm page or a search result and wants one of four things:
 * to install it, to understand it, to call it, or to find the endpoint they are already
 * debugging. The commercial argument lives on thepulseapi.com and is linked once, at the bottom.
 */

const PRIMARY = [
  {
    href: '/docs/quickstart',
    icon: Rocket,
    title: 'Quick start',
    body: 'Keys, install, first ranked response. About ten lines.',
  },
  {
    href: '/docs/concepts/how-it-works',
    icon: Brain,
    title: 'How inference works',
    body: 'Signals in, personas out, your catalogue ranked against them.',
  },
  {
    href: '/docs/frameworks',
    icon: Boxes,
    title: 'Framework guides',
    body: 'React, Next, Vue, Angular, Astro, Alpine, Laravel.',
  },
  {
    href: '/docs/api',
    icon: Terminal,
    title: 'API reference',
    body: 'Every endpoint a publishable key can call.',
  },
];

const FACTS = [
  { icon: Feather, label: '3.2 KB gzipped', body: 'Script-tag build. Zero runtime dependencies.' },
  { icon: SearchX, label: 'No identity needed', body: 'Ranks a first-time anonymous visitor.' },
  { icon: ShieldCheck, label: 'MIT licensed', body: 'Read every line before you ship it.' },
];

const SHORTCUTS = [
  { href: '/docs/api', icon: KeyRound, label: 'Authentication' },
  { href: '/docs/api/errors', icon: Terminal, label: 'Error codes' },
  { href: '/docs/api/exposure', icon: Eye, label: 'Exposure tracking' },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-5xl">
        <p className="text-fd-muted-foreground mb-3 font-mono text-sm">{npmPackage}</p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Build with the PULSE Decision API
        </h1>
        <p className="text-fd-muted-foreground max-w-2xl text-lg">
          Send what a shopper does. Get your catalogue ranked against who they are turning out to
          be, with a score breakdown explaining every result. No login to warm up, no history to
          accumulate.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/docs/quickstart"
            className="bg-fd-primary text-fd-primary-foreground inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/api"
            className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
          >
            API reference
          </Link>
        </div>

        <div className="bg-fd-card border-fd-border text-fd-muted-foreground mt-8 overflow-x-auto rounded-lg border p-4 font-mono text-sm">
          <span className="select-none">$ </span>
          <span className="text-fd-foreground">curl -X POST &quot;{apiBaseUrl}/session&quot;</span>
          <br />
          <span className="pl-4">-H &quot;x-api-key: pk_live_...&quot;</span>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {PRIMARY.map(({ href, icon: Icon, title, body }) => (
            <Link
              key={href}
              href={href}
              className="group border-fd-border hover:bg-fd-accent/50 rounded-xl border p-5 transition-colors"
            >
              <Icon className="text-fd-primary mb-3 size-5" />
              <h2 className="mb-1 flex items-center gap-1.5 font-semibold">
                {title}
                <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
              </h2>
              <p className="text-fd-muted-foreground text-sm">{body}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FACTS.map(({ icon: Icon, label, body }) => (
            <div key={label} className="border-fd-border rounded-xl border p-5">
              <Icon className="text-fd-primary mb-3 size-5" />
              <p className="font-semibold">{label}</p>
              <p className="text-fd-muted-foreground text-sm">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {SHORTCUTS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="border-fd-border text-fd-muted-foreground hover:text-fd-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors"
            >
              <Icon className="size-3.5" /> {label}
            </Link>
          ))}
        </div>

        <p className="text-fd-muted-foreground mt-14 text-sm">
          Not a developer?{' '}
          <a href={siteUrl} className="text-fd-foreground underline underline-offset-4">
            See what PULSE does
          </a>
          .
        </p>
      </div>
    </main>
  );
}
