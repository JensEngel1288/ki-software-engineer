# Upgrade workspace Angular CLI to 21

Task status: completed — verified workspace CLI 21 upgrade
Source: user request on 2026-11-13: update angular cli to 21.
Previous task: [completed 3D Universe](universe-3d-completed.md).

Upgrade the project's local CLI from 20.2.0 to the latest stable 21.x patch.
The official builder requires Angular 21 peers, so align framework/compiler/build,
Material/CDK, and affected NgRx/toolkit dependencies through their migrations.
Existing Node 24, TypeScript 5.9, RxJS 7.8, and application behavior are retained
where compatible. This does not authorize a new unit-test framework, zoneless
conversion, application redesign, global CLI install, commit, or publication.

## Acceptance

- U21.1: Given the workspace, when its local CLI reports its version, then the
  resolved CLI is major 21 and npm scripts use that CLI.
- U21.2: Given the upgraded dependencies, when npm checks the installed tree,
  then framework/builder/compiler and required peers are compatible without
  force/legacy-peer-deps overrides. The npm lockfile matches the manifest.
- U21.3: Given the upgraded toolchain, when production and custom MCP builds run,
  then both compile successfully with strict checks and existing budgets.
- U21.4: Given the upgraded development server, when the existing application
  suites run, then all 57 Chromium cases pass without weakened tests or stale
  Angular 20 server reuse. Preserve book data/storage, 3D controls, and Zone.js.
- U21.5: Given editor/tool documentation, then the Angular CLI MCP configuration
  resolves major 21 and technical guidance reflects the installed versions.

## Method and baseline

Use [Angular's ng update guidance](https://angular.dev/cli/update) and npm peer
metadata. Node 24.22.1 / TypeScript 5.9.2 meet Angular 21's
[compatibility requirements](https://angular.dev/reference/versions).
The initial tree is clean. CLI/build/CDK are 20.2.0 and framework/compiler 20.2.1.
This migration uses existing behavior tests and actual version/dependency/build
checks; do not add tests that merely mirror a package version declaration.
No GitHub issue was supplied.

## Implementation and migration evidence

Baseline: production build passed (321.55 kB initial); all 57 application Chromium
cases passed (53.6 seconds). The old verified workspace dev-server process was
stopped before installation, preventing stale-server reuse and Windows file locks.

The official update selected CLI/build/SSR 21.2.30, framework/compiler 21.2.26,
Material/CDK 21.2.14, NgRx signals 21.1.1, and toolkit 21.0.1. CLI, core, CDK,
Material, and NgRx required migrations all completed, reporting no source changes.
The existing application-builder/control-flow setup already satisfies the relevant
migrations. No optional redesign or forced peer overrides were used.

Only package manifests/lockfile, CLI MCP config, and project/context documentation
changed. Source application code, tests, test configuration, compiler/build config,
Zone.js setup, and unrelated workshop dependencies were preserved. The editor's
CLI MCP command now requests `@angular/cli@21`. Global CLI installation was outside
this workspace request.

## Acceptance reconciliation

| Criterion | Evidence                                                                                                                                       | Result   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| U21.1     | `npm run ng -- version`: CLI 21.2.30, Angular 21.2.26, npm 11.21.1, Node 24.22.1                                                               | Verified |
| U21.2     | `npm ls --all --json` exits 0 with no problems; manifest/lock root dependency maps match exactly                                               | Verified |
| U21.3     | Production build and `build.angular-mcp` pass; unchanged budgets, initial bundle 332.36 kB                                                     | Verified |
| U21.4     | New Angular 21 server; all 57 Chromium cases pass; live browser confirms `ng-version` 21.x and 250 API books                                   | Verified |
| U21.5     | CLI MCP pinned to major 21; existing custom MCP handshake, discovery, isolated generation, Windows paths, validation/errors pass; docs updated | Verified |

## Commands and final verification

```powershell
# Official migrations; allow-dirty permits only this task's checkpoint changes
node node_modules/@angular/cli/bin/ng.js update @angular/cli@21 @angular/core@21 @angular/material@21 @ngrx/signals@21 @angular-architects/ngrx-toolkit@21 --allow-dirty

npm run ng -- version
npm ls --all --json
npm run build
npm run build.angular-mcp
node tmp/check-angular-mcp.cjs

# Restarted with the upgraded local CLI
npm start

# Baseline and final complete application scope
node node_modules/@playwright/test/cli.js test tests/book-details.spec.ts tests/book-list.spec.ts tests/error-handling.spec.ts tests/theme.spec.ts tests/library.spec.ts tests/universe.spec.ts --config=tmp/playwright.universe.config.ts --project=chromium --workers=1

# Separate live API check, including root ng-version 21.x
node tmp/check-live-catalogue.cjs
```

Final browser result: 57 discovered/passed, zero failed/skipped/flaky, exit 0,
structured report errors empty (50.3 seconds). Baseline/final case counts and
assertions are unchanged. The production build has no budget warnings. MCP
compilation and real component-generation checks pass. The new development server
is left running at http://localhost:4200 with the separate local API available.

The complete npm tree and matching lockfile are recorded in ignored
`tmp/angular21-dependencies.json`; baseline/final structured browser reports are
`tmp/angular21-baseline-results.json` and `tmp/angular21-final-results.json`.
The temporary runner selects an installed Chromium binary; committed Playwright
configuration contains no machine-specific executable path.

Verification limits: Firefox/WebKit and the incomplete Karma/Jasmine scaffold
were not run. Application suites mock API/cover responses; the separate live
browser check verified 250 real books and ten visible cards without API failures.
The pre-existing Playwright console diagnostic `step id not found: fixture@72`
occurred in both baseline/final; structured errors are empty and all cases pass.

Delivery is verified local working-tree changes. No GitHub issue, commit, push,
PR, or deployment was requested. Final documentation checks cover changed-file
Prettier, relative links, and `git diff --check`.
