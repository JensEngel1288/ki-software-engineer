# GitHub workflows

The workflows use `openai/codex-action@v1` with the existing `gpt-5.6-luna` model.
Prompts live in [prompts/](prompts/) and use repository `AGENTS.md` guidance.
Read-only agents receive issue/PR data captured before execution; separate jobs
own GitHub writes. There are no custom permission-profile files or slash-command
dependencies.

| Workflow                                                       | Trigger                                                                        | Result                                                                                                                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [build.yml](workflows/build.yml)                               | Push to `main`, pull requests, or manual run                                   | Production build and the six application Chromium suites; default-branch runs deploy the verified Pages artifact.                                                                                            |
| [issue-analysis.yml](workflows/issue-analysis.yml)             | Issue opened/edited or human issue comment                                     | A read-only analysis with seven sections; updates its existing bot comment on reruns. PR comments and bot events are excluded.                                                                               |
| [OpenAI-code-review.yml](workflows/OpenAI-code-review.yml)     | Same-repository PR opened/updated/reopened/marked ready                        | Reviews the exact head and diff, then publishes feedback if the head is still current. Drafts, forks, and bots are excluded.                                                                                 |
| [issue-implementation.yml](workflows/issue-implementation.yml) | Human applies `ready-for-implementation`                                       | Implements the issue, checks build/tests, and publishes a draft PR if there are verified changes. Records the implementation result on the issue.                                                            |
| [auto-fix.yml](workflows/auto-fix.yml)                         | Failed `Deploy to GitHub Pages` push run from this repository's default branch | Reads failed logs, attempts a source fix, checks it, and publishes a draft PR. Failures or no publishable change produce a deduplicated attention issue.                                                     |
| [publish-changes.yml](workflows/publish-changes.yml)           | Reusable call from implementation/auto-fix                                     | Applies the checked patch on a new branch, commits, pushes, and creates a draft PR. Existing drafts are reused; stale bases, unexpected branch names, and workflow/agent configuration changes are rejected. |

## Repository setup

- Add `OPENAI_API_KEY` as an Actions repository secret. The API project must have
  access to the selected model. No second provider key is used.
- Under **Settings → Actions → General → Workflow permissions**, allow GitHub
  Actions to create pull requests. Organisation policies may also restrict this.
  Individual jobs declare the token permissions they need and use `GITHUB_TOKEN`;
  the Pages configuration step below uses a separate token.
- Save the value of your personal token (for example, the token labelled
  `github-actions-issue-analysis`) under **Settings → Secrets and variables →
  Actions → New repository secret** as `PAGES_SETUP_TOKEN`. Creating a personal
  token does not automatically create an Actions secret. A fine-grained PAT needs
  access to this repository and **Pages: Read and write** permission; a classic
  PAT needs the `repo` scope. An Issues-only token cannot enable Pages.
- The default-branch Configure Pages step uses `PAGES_SETUP_TOKEN` and
  `enablement: true` to enable Pages automatically if needed. A missing secret
  fails with a specific setup message. Pull requests and other branches skip this
  step and its token check. Pages must be available for the repository's plan and
  organisation policy. Under **Settings → Pages**, the deployment source should
  be **GitHub Actions**. The configure step reads the site's base path.
  After verification, [prepare-pages.cjs](scripts/prepare-pages.cjs)
  applies it to the generated index and creates an identical `404.html` fallback
  for direct links to client-side book routes. Every validation build still uses
  the unchanged `npm run build` command.
- The repository default branch is currently `main`, matching the push filter in
  `build.yml`. Update the filter if the default branch is renamed. Issue and
  `workflow_run` workflows must be present on the default branch to receive events.
- Codex keeps its default restriction to triggering users with repository write
  access. Public issue creation does not grant permission to run a model job.
- Review generated drafts before marking them ready or merging. Events created
  using `GITHUB_TOKEN` generally do not start another workflow run. Human
  `ready_for_review` events are included in the build/review triggers; fully
  unattended chains would require a separately configured GitHub App or token.

## Verification and boundaries

CI uses Node.js 24 from [`.node-version`](../.node-version), `npm ci --include=dev`, `npm run build`, and the application Playwright
suites for details, list, library, errors, theme, and Universe. Chromium and its
system dependencies are installed before execution. External `playwright.dev`
demo tests are outside this application check. Review/analysis jobs do not claim
to have run application tests merely because they inspected source.

Build, auto-fix, and issue implementation use the same build/browser commands and
run the [Pages preparation tests](scripts/prepare-pages.test.cjs). Each project
setup reads the same Node version file. The code-changing jobs restore that
version after Codex, which installs its own Node runtime internally, before
reinstalling dependencies and validating the final code. Development dependencies
are explicitly included so Angular CLI, TypeScript, and Playwright remain available
even when the surrounding environment prefers production dependencies.

Chromium system dependencies are installed before Codex drops sudo privileges.
After final dependency installation, `npx playwright install chromium` refreshes
the browser binary to match the lockfile without requiring sudo.

`CI` is set for all validation jobs. `GH_TOKEN` is provided only to the steps
running `gh`; GitHub script steps use their action-provided token. Context/log
file paths are explicitly supplied to their producing and consuming steps.
`OPENAI_API_KEY` is checked before every model invocation. `PAGES_SETUP_TOKEN`
is checked before Pages configuration and supplied only to that action; the
deployment job and issue/PR workflows continue using their automatic tokens.
`PAGES_BASE_PATH` is
supplied only to artifact preparation from Configure Pages; an empty value is
valid for a root/custom-domain site, while a missing value is rejected. These
checks validate configuration wiring; local checks cannot prove that a repository
secret has been configured in GitHub.

Read-only Codex jobs use `sandbox: read-only`; code-changing jobs use
`sandbox: workspace-write`, followed by independent lockfile/build/browser checks.
All model jobs retain `safety-strategy: drop-sudo`. Only draft-PR publication gets
repository content-write access, and it executes no patched project scripts.
Feedback and notification jobs receive only the issue/PR permissions they need.

Implementation and auto-fix prompts leave Git history alone. Their validated
working-tree changes are packaged as a patch. Publication checks the same base
commit, rejects `.github`, agent configuration, and `AGENTS.md` changes, and never
force-pushes an existing branch. A partial publication can resume only when the
remote branch contains exactly the same checked tree and base commit. It does not
merge, close the source issue, or push
directly to the default branch. If the base advanced, rerun the originating workflow
so the new base is checked rather than publishing an unverified merge.

The Pages deployment hosts the frontend only. The existing book API remains a
separate service; deploying this artifact does not provision a backend or change
the currently configured API URL.

For workflow edits, run `actionlint` and
`npx prettier --check .github/workflows .github/prompts .github/README.md`.
Validate action inputs against the action's actual metadata when a linter's
embedded metadata is older. No live API calls or GitHub mutations are necessary
for local syntax and mocked behavior checks.

Configuration references: [Codex action](https://learn.chatgpt.com/docs/github-action),
[action inputs](https://github.com/openai/codex-action/blob/v1/action.yml),
[Pages setup token](https://github.com/actions/configure-pages/blob/v5/action.yml),
[Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
and [workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run).
