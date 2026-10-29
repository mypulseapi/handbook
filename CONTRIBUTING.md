# Contributing to the handbook

Anyone can suggest a change. Nobody, maintainers included, pushes to `develop` or `main` directly: every change is a pull request.

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

Both are protected: changes arrive only through a pull request, and neither can be force-pushed or deleted.
A pull request into `develop` needs the checks to pass and one approval from
[@mypulseapi/handbook-maintainers](https://github.com/orgs/mypulseapi/teams/handbook-maintainers),
who may merge their own pull requests without waiting for a second reviewer.

## Making a change

1. Create a branch **from `develop`** (`fix/typo-onboarding`, `topic/release-process`). `develop` is the default branch, so a fork and a new pull request start from it.
2. Make the change. Keep a pull request to one topic.
3. Open a pull request **against `develop`** and fill in the template, including the box that agrees to the [PULSE Contributor License Agreement](https://github.com/mypulseapi/open-pulse/blob/main/CLA.md); maintainers of the repository can skip it. Link the issue it resolves (`Closes #12`).
4. The checks run on your pull request: Markdown lint, a link check, the search index and the CLA box. For pull requests from forks, a maintainer approves the run first.
5. A maintainer reviews it; a pull request into `develop` needs one approval. Address any comments by pushing to the same branch; resolved threads are required before merging.
6. A maintainer squash-merges it. Your branch is deleted automatically.

## Releasing

Publishing is a separate, deliberate step, so that merging a typo fix does not deploy on its own.

1. A maintainer opens a pull request from **`develop` into `main`**. That pull request *is* the release. It is merged with a merge commit, not squashed, so the two branches stay in sync. A pull request into `main` from any other branch fails the **Source branch** check.
2. The pull request builds the site (**Build site**). If the build and every other required check pass, the workflow merges it and publishes the site to `developer.thepulseapi.com`. If anything fails, it comments on the pull request and stops: nothing is merged or deployed.

Nothing else deploys. A push to `develop` changes no live page.

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
