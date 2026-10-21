<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## handbook, and the rules it inherits

This is the docs site at `developer.thepulseapi.com`. Fumadocs, static export,
deployed from `main` by GitHub Pages.

**It is governed by ODIN**, which lives in the rainbow monorepo, not here:
`../rainbow/ODIN/` when the three repositories are cloned as siblings, which is
the layout `ODIN/engineering/SITES.md` describes. Read `SITES.md` first. It is
the authority for everything below and for what is not listed here.

Only the rules an agent gets wrong by default are repeated here:

- **GitHub, so `gh`.** Not `glab`. ODIN's git guide is written about rainbow,
  which is on GitLab, and following it here targets the wrong host.
- **Squash into `develop`. Merge commit into `main`.** Each is refused the other
  way by a branch ruleset, and the error reads like a repository setting rather
  than a branch rule. There is no staging branch.
- **A push to `main` deploys.** It is not an integration branch. Branch from
  `develop`.
- **No agent attribution in a commit body.** Pull request descriptions carry the
  Claude Code line; commits do not.
- **Commit and push only when the developer says so.**
- Work is tracked in `ODIN/process/NLR-TASKS.md` under Track B, in the same
  register as the rest of the repository. Not in a list kept here.

The Ask Pulse assistant in `lib/assistant/` is a copy of peacock's, tracked as
B21. Four of its five files are byte for byte identical and `worker.ts` has
already drifted, so a change to one belongs in both until it is published as a
package. `SITES.md` section 3 has the measurement.
