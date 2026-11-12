# GitHub workflow repairs and OpenAI migration

Task status: completed
Definition status: direct user request
Implementation status: corrected and verified locally

## Source and scope

The user requested: “fix alle dateien in workflows und ändere die stellen mit claude zu OpenAI”.

This selects all files in .github/workflows for functional repair and migration to
the existing OpenAI Codex action/model. The previous completed application task
is preserved in [the Universe brief](bookmonkey-universe-completed.md).
No commit, push, live workflow dispatch, issue update, or PR publication was
requested as part of this local repair.

## Requirements and evidence

| ID  | Outcome                                | Implementation and verification                                                                                                                                                                                                                                    |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W1  | Replace legacy provider references     | All workflow names, actions, credentials, prompts, and guidance use OpenAI/Codex and AGENTS.md. The selected gpt-5.6-luna model is preserved.                                                                                                                      |
| W2  | Valid workflow structure and inputs    | Six workflows pass actionlint 1.7.12, including triggers, contexts, action inputs, permissions, reusable calls, and outputs. Custom profile fragments and undefined slash commands are removed.                                                                    |
| W3  | Working build/test/Pages configuration | The former name-only file now installs dependencies, builds with the Pages base path, checks the six application Chromium suites, uploads the browser artifact and SPA fallback, and deploys only the default branch after successful checks.                      |
| W4  | Structured issue analysis              | Explicit prompt preserves the seven requested sections. Issue/comments are captured as JSON and read-only analysis is published by a separate job, updating the existing bot comment. Script behavior is verified with mocked API responses.                       |
| W5  | PR review against real code            | Reads the exact head and diff, uses AGENTS.md, skips forks/drafts/bots, and checks the current head before publishing. Local tests verify stale-head rejection and comment ownership.                                                                              |
| W6  | Label-driven issue implementation      | ready-for-implementation starts code preparation and independent checks. Verified patches become draft PRs on new branches through a shared publication workflow. Bot proposals are not treated as accepted requirements automatically.                            |
| W7  | Functional auto-fix and notifications  | Reads logs from failed same-repository default-branch push runs, attempts a source fix, verifies it, and publishes a draft. Separate issue-write notification handles failure/no patch. Tests cover event guards, deduplication, and safe local patch publication. |

## Changed files

- .github/workflows/build.yml
- .github/workflows/issue-analysis.yml
- .github/workflows/OpenAI-code-review.yml
- .github/workflows/issue-implementation.yml
- .github/workflows/auto-fix.yml
- .github/workflows/publish-changes.yml (shared draft-PR publication)
- Four prompt files under .github/prompts/
- [.github/README.md](../../.github/README.md), architecture, and repository guidance

## Verification — 2026-11-12

- actionlint 1.7.12 passed all six workflows. Its official Windows release was
  downloaded to ignored tmp/workflow-tools and SHA-256 checked against release checksums.
  Command: tmp/workflow-tools/actionlint/actionlint.exe -shellcheck= -pyflakes=
- All 23 local behavior checks passed with node --test tmp/check-workflows.cjs.
  They parse embedded JavaScript/Bash, exercise comment create/update ownership,
  stale PR heads, trigger filters, attention-report deduplication, and the reusable
  publication shell against temporary local Git repositories with a fake gh function.
  No real GitHub mutation occurs in these checks.
  Matching branch-only publications can be resumed without another commit; differing
  existing branch contents are preserved and rejected instead of overwritten.
- npm.cmd run build -- --base-href=/ki-software-engineer/ passed on Windows.
  The equivalent Linux workflow command uses npm run build with the configured Pages
  base path. The output is dist/angular-workshop-modern/browser.
- All 41 existing application Chromium tests passed through the temporary local
  Playwright runner configuration. There were no failed, skipped, or flaky cases.
  This local override selects the installed browser; Linux CI installs its matching
  Chromium and system dependencies. Firefox/WebKit and the unconfigured unit runner
  were not run.
- Application source, package manifests, and dependency lockfile were not changed.
  Formatting, whitespace, and local documentation links were checked.

## Delivery boundary and limits

The local workflow configuration and documentation are ready for review. GitHub
execution, model availability for the user's API project, Pages deployment, and
real comment/PR publication have not been executed or claimed.

Repository setup is documented in [.github/README.md](../../.github/README.md):
OPENAI_API_KEY, Pages source set to GitHub Actions, and permission for Actions to
create PRs. Existing model action trust checks require a triggering user with
repository write access. Generated drafts need human review; no automatic merge
or issue closure was introduced. GITHUB_TOKEN event-chain limits are documented.
Frontend hosting does not provision the separate book API.

## Follow-up: build and environment parity

The user additionally requested matching build commands, missing environment-variable
checks, matching Node.js versions, and complete dependency installation.

- **W8:** CI, auto-fix, and issue implementation now use exactly `npm run build`.
  Pages-specific base/fallback preparation runs afterward through a dedicated helper.
- **W9:** Required context/log paths, CI, tokens, API-key checks, and the Pages base
  path are wired at their correct scopes. A missing Pages value fails clearly;
  an empty root-site value is valid. GitHub secret presence is not locally verified.
- **W10:** All project setups read Node.js 24 from `.node-version`. Code-changing
  jobs restore it after the Codex action before independent checks. The installed
  Angular engines support this version; local verification used Node v24.22.1.
- **W11:** All dependency installs use `npm ci --include=dev`. OS/browser dependencies
  are installed before Codex; matching Chromium binaries are refreshed after final
  dependency verification without requiring sudo.

Follow-up verification on 2026-11-12:

- `npm.cmd ls --all --json`: zero dependency problems; all 29 top-level packages
  and their dependency trees resolve. No package manifest/lockfile changes or
  dependency reinstall were needed locally.
- `npm.cmd run build`: passed using the exact shared build command.
- `node --test .github/scripts/prepare-pages.test.cjs`: all 8 cases passed,
  covering project/root paths, quoting, repeated preparation, and missing/invalid input.
- `node --test tmp/check-workflows.cjs`: all 27 local workflow checks passed,
  including build/browser command parity, Node setup/restoration, dependency order,
  required environment wiring, and the previous publication/notification behavior.
- Actual generated index/404 files were prepared and checked for the Pages path.
- `actionlint`, formatting, whitespace, and local link checks passed. Existing
  application source was unchanged; the preceding 41 application checks remain
  recorded above. No live GitHub workflow or paid model call was started.
