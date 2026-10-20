import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { PropsTable } from './props-table';
import { Banner } from 'fumadocs-ui/components/banner';
import { InstallTabs, RunTabs } from './install-tabs';
import { DocsChangelog } from './docs-changelog';
import { Ext, Url } from './links';
import { Activity, Atom, BellRing, Blocks, Bot, Braces, Brain, Boxes, ClipboardCheck, Code, Feather, GitCompare, Hash, KeyRound, Layers, Leaf, LifeBuoy, Rocket, Scale, SearchX, Server, Shield, ShieldCheck, Timer, Zap } from 'lucide-react';
import type { MDXComponents } from 'mdx/types';

/**
 * `Tab`/`Tabs` are required, not decorative: `remarkInstall` compiles a ```package-install
 * block into them, so without these registered the npm/pnpm/yarn/bun widget renders nothing.
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    Callout,
    Card,
    Cards,
    Step,
    Steps,
    Accordion,
    Accordions,
    PropsTable,
    Banner,
    InstallTabs,
    RunTabs,
    DocsChangelog,
    // Cross-property links, read from the environment rather than written out. See ./links.tsx.
    Ext,
    Url,
    // Icons used inline in MDX. Registered by name so a typo fails the build.
    Activity,
    Atom,
    Bot,
    Code,
    KeyRound,
    Layers,
    LifeBuoy,
    Scale,
    Boxes,
    BellRing,
    Blocks,
    Braces,
    Brain,
    ClipboardCheck,
    Feather,
    GitCompare,
    Hash,
    Leaf,
    Rocket,
    SearchX,
    Server,
    Shield,
    ShieldCheck,
    Timer,
    Zap,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
