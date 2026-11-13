# Angular application modernization

Task status: completed
Definition status: direct user request
Implementation status: modernized and verified locally

## Source and scope

The user requested getting the best practices from the Angular CLI and modernizing
all of the Angular app. The preceding workflow task is preserved in
[the completed workflow brief](github-workflow-repairs-completed.md).

Guidance was retrieved by calling the installed @angular/cli 20.2.0 MCP server's
`get_best_practices` tool over stdio. Its output is saved locally in ignored
`tmp/angular-cli-best-practices.md`.

## Requirements and constraints

- M1: Apply the CLI guide to the production Angular app: standalone defaults,
  signal component contracts/local derived state, OnPush change detection,
  lazy-loaded routes, typed reactive forms, and inject-based dependencies.
- M2: Preserve existing book search/debounce, filters/sorting, saved/status/recent
  lists, local edits and validation, routes/retries/errors, cover fallbacks,
  theme preferences, and accessible/responsive Universe interactions.
- M3: Retain Angular 20 and current dependencies, HTTP/storage contracts, and the
  existing acceptance tests. Keep RxJS where it owns asynchronous request timing.
  The intentionally flawed, unrouted code-review exercises are outside app cleanup.
- M4: Verify the production build and all six application Chromium suites, check
  changed-file formatting, and update architecture/conventions to match the code.

## Baseline

On 2026-11-12, before source changes: production build passed (445.74 kB initial
bundle) and all 41 application Chromium cases passed with no skips. The local
runner override selects the installed browser. Firefox/WebKit and the incomplete
Karma scaffold were not run. No application test assertions were changed.

## Implementation and verification

- M1: All 12 production components use OnPush; component contracts use signal
  inputs/outputs. Local derived/resettable state uses computed/linkedSignal.
  Three routes use lazy loadComponent imports. Editor/filters use typed reactive
  forms, and the remaining constructor-injected service uses inject().
- M2: All 41 existing acceptance cases still pass. One additional Universe case
  covers broken-to-valid cover recovery, retained selection, camera reset, and
  fallback selection after filtering. Existing assertions were preserved.
- M3: Angular/package manifests/lockfile, API/storage formats, and the deliberate
  review fixtures were unchanged. RxJS still owns request cancellation/query timing.
- M4: Final npm.cmd run build passed, with the initial bundle reduced from
  445.74 kB to 307.44 kB. The unused legacy animation provider was removed.
  Architecture, scoped source guidance, and refactoring findings were updated.

Final browser command on 2026-11-12:

```sh
node node_modules/@playwright/test/cli.js test tests/book-details.spec.ts tests/book-list.spec.ts tests/error-handling.spec.ts tests/theme.spec.ts tests/library.spec.ts tests/universe.spec.ts --config=tmp/playwright.universe.config.ts --project=chromium --workers=1
```

Result: 42 passed, no failures, skipped cases, or retries. The temporary config
selects the installed Chromium; machine-specific paths remain outside committed
configuration. The screenshot reporter printed the same fixture@72 diagnostic
seen in the baseline; test exit status and structured results indicate success.
Firefox/WebKit and the incomplete Karma scaffold were not run. No commit, remote
publication, paid model call, or GitHub workflow execution was performed.
