# Contributing to the handbook

Anyone can suggest a change. Nobody, maintainers included, pushes to `main` directly: every change is a pull request that a maintainer reviews.

## Ways to contribute

- **Report a problem.** Use one of the [issue forms](https://github.com/mypulseapi/handbook/issues/new/choose): something wrong or out of date, a missing topic, or a problem with the site itself.
- **Ask a question.** Use [Discussions](https://github.com/mypulseapi/handbook/discussions), not issues.
- **Fix it yourself.** Small fixes (typos, broken links, outdated facts) don't need an issue first. Larger changes or new pages should start with an issue, so the scope is agreed before you write.

## Making a change

1. Fork the repository and create a branch from `main` (`fix/typo-onboarding`, `topic/release-process`).
2. Make the change. Keep a pull request to one topic.
3. Open a pull request against `main` and fill in the template. Link the issue it resolves (`Closes #12`).
4. The checks run on your pull request: Markdown lint and a link check. A maintainer approves the first run for new contributors.
5. A maintainer reviews it. Address the comments by pushing to the same branch; resolved threads are required before merging.
6. A maintainer squash-merges it. Your branch is deleted automatically.

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

<!-- ruleset verification, do not merge -->

#Bad heading

[broken](https://github.com/mypulseapi/handbook/this-does-not-exist-404)
