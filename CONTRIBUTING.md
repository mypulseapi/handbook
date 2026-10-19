# Contributing to the handbook

Anyone can suggest a change. Nobody, maintainers included, pushes to `develop` or `main` directly: every change is a pull request that a maintainer reviews.

## Ways to contribute

- **Report a problem.** Use one of the [issue forms](https://github.com/mypulseapi/handbook/issues/new/choose): something wrong or out of date, a missing topic, or a problem with the site itself.
- **Ask a question.** Use [Discussions](https://github.com/mypulseapi/handbook/discussions), not issues.
- **Fix it yourself.** Small fixes (typos, broken links, outdated facts) don't need an issue first. Larger changes or new pages should start with an issue, so the scope is agreed before you write.

## Branches

Two long-lived branches, and work only ever flows one way between them.

| Branch | What it is |
| --- | --- |
| `develop` | The integration branch. Every change lands here first |
| `main` | The release branch. Merging `develop` into it **deploys the site** |

Both are protected and both require a review from
[@mypulseapi/handbook-maintainers](https://github.com/orgs/mypulseapi/teams/handbook-maintainers).

## Making a change

1. Create a branch **from `develop`** (`fix/typo-onboarding`, `topic/release-process`).
2. Make the change. Keep a pull request to one topic.
3. Open a pull request **against `develop`** and fill in the template. Link the issue it resolves (`Closes #12`).
4. The checks run on your pull request: Markdown lint and a link check. A maintainer approves the first run for new contributors.
5. A maintainer reviews it. Address the comments by pushing to the same branch; resolved threads are required before merging.
6. A maintainer squash-merges it. Your branch is deleted automatically.

## Releasing

Publishing is a separate, deliberate step, so that merging a typo fix does not deploy on its own.

1. A maintainer opens a pull request from **`develop` into `main`**. That pull request *is* the release. It is merged with a merge commit, not squashed, so the two branches stay in sync. A pull request into `main` from any other branch fails the **Source branch** check.
2. Once it is reviewed and merged, `.github/workflows/nextjs.yml` builds the site and publishes it to `developer.thepulseapi.com`.

Nothing else deploys. A push to `develop` changes no live page.

> **An author cannot approve their own pull request**, and `CODEOWNERS` requires a maintainer
> review on every file. With two maintainers that means each one's work is reviewed by the other.
> Administrator privileges do not bypass this: the ruleset lists no bypass actors, so
> `gh pr merge --admin` fails with "Waiting on code owner review".

## Writing style

- Plain English, short sentences, active voice.
- One idea per paragraph. Prefer a table or a list over a long paragraph.
- Link to the source of a fact instead of copying it.
- No secrets, credentials, internal hostnames or personal data. Anything in this repository is public.

## Roles

| Role | Can | How you get there |
| --- | --- | --- |
| Anyone | Read, open issues, open pull requests from a fork | Nothing needed |
| Contributor | The same, with your name on the contributors list | One merged pull request |
| Triager | Label, assign, close and reopen issues and pull requests | Invited by a maintainer after about three good pull requests or sustained help with issues |
| Maintainer | Review and merge pull requests, manage labels and releases | Invited by the existing maintainers after a period of reliable triage and review |

Invitations are made by the maintainers (@mypulseapi/handbook-maintainers). If you'd like to help more, say so in an issue or a discussion.

## Labels

| Label | Meaning |
| --- | --- |
| `needs-triage` | New, not looked at yet |
| `content-fix` | Something on a page is wrong or out of date |
| `new-topic` | A page or section to add |
| `site-bug` | The website itself is broken |
| `good first issue` | Small and well defined, good for a first contribution |
| `help wanted` | Maintainers would welcome a pull request |
| `duplicate`, `wontfix` | Closed without a change |

## Code of conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
