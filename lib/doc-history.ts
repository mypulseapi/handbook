import { execFileSync } from 'node:child_process';
import { gitConfig } from './shared';

/**
 * When a documentation page last changed, from git.
 *
 * The history is the record. Nothing here is hand maintained, because a hand-maintained "last
 * updated" is wrong the first time someone forgets it, and a reader cannot tell a stale date from
 * a fresh one.
 *
 * Read at build time, so it costs nothing at runtime and nothing ships to the browser but the
 * date itself. It needs real git history: the deploy workflow checks out with `fetch-depth: 0`
 * for exactly this, and without it every page would report the deploy commit's date.
 *
 * Returns `null` rather than guessing when git is unavailable or the file is untracked, and the
 * footer then renders nothing. A missing date is honest; `new Date()` would be a lie that looks
 * like a fact.
 */
const cache = new Map<string, string | null>();

export function lastModified(contentPath: string): string | null {
  const file = `content/docs/${contentPath}`;
  const hit = cache.get(file);
  if (hit !== undefined) return hit;

  let iso: string | null = null;
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    iso = out.length > 0 ? out : null;
  } catch {
    iso = null;
  }

  cache.set(file, iso);
  return iso;
}

/** The page's own commit history on GitHub, which is the full record behind that one date. */
export function historyUrl(contentPath: string): string {
  const { user, repo, branch } = gitConfig;
  return `https://github.com/${user}/${repo}/commits/${branch}/content/docs/${contentPath}`;
}

export interface DocCommit {
  sha: string;
  shortSha: string;
  date: string;
  subject: string;
}

/**
 * Recent commits that touched the documentation, for the changelog page.
 *
 * Only `content/docs` is followed, so a styling change or a dependency bump does not appear as a
 * documentation change. Merge commits are excluded because the squash-merge flow means the real
 * subject is on the commit itself, and listing both says the same thing twice.
 */
export function recentDocCommits(limit = 40): DocCommit[] {
  try {
    const out = execFileSync(
      'git',
      [
        'log',
        `-${limit}`,
        '--no-merges',
        '--format=%H%x1f%cI%x1f%s',
        '--',
        'content/docs',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();

    if (out.length === 0) return [];

    return out.split('\n').map((line) => {
      const [sha = '', date = '', subject = ''] = line.split('\u001f');
      return { sha, shortSha: sha.slice(0, 7), date, subject };
    });
  } catch {
    return [];
  }
}
