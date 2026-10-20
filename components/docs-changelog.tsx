import { recentDocCommits } from '@/lib/doc-history';
import { gitConfig } from '@/lib/shared';

/**
 * Every recent change to the documentation, read from git at build time.
 *
 * Generated rather than written, because a hand-kept changelog is wrong the first time somebody
 * forgets to add a line, and a reader has no way to tell a complete one from a neglected one.
 *
 * Empty in a shallow checkout, which renders a short note instead of an empty table. The deploy
 * workflow checks out with `fetch-depth: 0` so the published site always has the real list.
 */
export function DocsChangelog({ limit = 40, lang = 'en' }: { limit?: number; lang?: string }) {
  const commits = recentDocCommits(limit);
  const vi = lang === 'vi';

  if (commits.length === 0) {
    return (
      <p className="text-fd-muted-foreground text-sm">
        {vi
          ? 'Không đọc được lịch sử git ở bản dựng này.'
          : 'No git history was available to this build.'}
      </p>
    );
  }

  const fmt = new Intl.DateTimeFormat(vi ? 'vi-VN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="not-prose divide-fd-border divide-y border-y">
      {commits.map((c) => (
        <div key={c.sha} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4">
          <time
            dateTime={c.date}
            className="text-fd-muted-foreground w-32 shrink-0 font-mono text-xs tabular-nums"
          >
            {fmt.format(new Date(c.date))}
          </time>
          <span className="flex-1 text-sm">{c.subject}</span>
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}/commit/${c.sha}`}
            rel="noreferrer noopener"
            target="_blank"
            className="text-fd-muted-foreground hover:text-fd-accent-foreground shrink-0 font-mono text-xs underline underline-offset-4"
          >
            {c.shortSha}
          </a>
        </div>
      ))}
    </div>
  );
}
