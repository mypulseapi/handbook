import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

/**
 * One command, four package managers, each with its own copy button.
 *
 * Written as a component rather than four fenced blocks per page for one reason: the four
 * commands for a given package only differ by a prefix, and typing them out per page is how
 * three of them end up stale while the fourth is right. Pass the package, get all four.
 *
 * `groupId` keeps the chosen tab in sync across every instance on the page and remembers it,
 * so a pnpm user does not reselect pnpm on every snippet.
 */
const MANAGERS = [
  { name: 'pnpm', add: 'pnpm add', run: 'pnpm dlx' },
  { name: 'npm', add: 'npm install', run: 'npx' },
  { name: 'yarn', add: 'yarn add', run: 'yarn dlx' },
  { name: 'bun', add: 'bun add', run: 'bunx' },
] as const;

export function InstallTabs({
  pkg,
  dev = false,
}: {
  /** Package name, or several separated by spaces. */
  pkg: string;
  dev?: boolean;
}) {
  return (
    <Tabs groupId="package-manager" persist items={MANAGERS.map((m) => m.name)}>
      {MANAGERS.map((m) => {
        const flag = dev ? (m.name === 'npm' ? ' --save-dev' : ' -D') : '';
        return (
          <Tab key={m.name} value={m.name}>
            <DynamicCodeBlock lang="bash" code={`${m.add} ${pkg}${flag}`} />
          </Tab>
        );
      })}
    </Tabs>
  );
}

/** The same, for one-off commands run without installing. */
export function RunTabs({ command }: { command: string }) {
  return (
    <Tabs groupId="package-manager" persist items={MANAGERS.map((m) => m.name)}>
      {MANAGERS.map((m) => (
        <Tab key={m.name} value={m.name}>
          <DynamicCodeBlock lang="bash" code={`${m.run} ${command}`} />
        </Tab>
      ))}
    </Tabs>
  );
}
