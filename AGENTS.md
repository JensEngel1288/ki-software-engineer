# Repository guidance

## Scope and context

This file applies throughout the repository. Read [src/AGENTS.md](src/AGENTS.md) for source changes and
[src/app/books/AGENTS.md](src/app/books/AGENTS.md) for changes in the books feature. Nested guidance applies to its
directory and descendants and takes precedence over broader guidance when they differ; see the
[official OpenAI documentation](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

BookMonkey is a browser-rendered Angular application for browsing, searching, organizing, and editing books, with
browser-local personal lists/edits and light/dark mode.
Read [ARCHITECTURE.md](ARCHITECTURE.md) for responsibilities, data flow, dependency usage, and known limitations.
Check the source and configuration when implementing changes; update the architecture document when behavior or
structure changes.

## Working conventions

- Inspect the working tree before editing and preserve changes unrelated to the task.
- Keep changes focused and follow the existing implementation patterns. Prefer existing dependencies and avoid incidental
  framework migrations or new architectural layers.
- Use npm and the existing `package-lock.json`. Keep dependency changes intentional and update the lockfile with npm when
  changing dependencies.
- Keep these instruction files concise and scoped; keep detailed architectural descriptions in `ARCHITECTURE.md`.

## Requirement context

Before tests, implementation, or refactoring, connect the next step to the active requirement and its acceptance criteria.
For a rough feature idea that needs structured requirements, use
[interview-requirements](.cursor/skills/interview-requirements/SKILL.md): ask one focused question at a time and produce a
user story, Given/When/Then criteria, scope, constraints, and technical notes. Keep draft proposals distinct from agreed
requirements and preserve the resulting brief for subsequent work.

For an authorized test-first phase after requirements are agreed, use [tdd-red](.cursor/skills/tdd-red/SKILL.md) to map
every Given/When/Then scenario to unit/UI tests, verify failures caused by missing behavior, and hand off the evidence
before production implementation. Distinguish unavailable test infrastructure from a verified Red result.

For the authorized implementation phase after Red, use [tdd-green](.cursor/skills/tdd-green/SKILL.md) to satisfy the
failing tests with minimal production changes, preserve tests except for evidenced errors, and verify the relevant
application suites and required checks before reporting Green.

For an authorized Angular cleanup after Green, use [angular-refactor](.cursor/skills/angular-refactor/SKILL.md) to improve
component boundaries, abstraction levels, and reactive composition while preserving accepted behavior and passing tests.

For delivery verification after implementation, use
[finalise-requirements](.cursor/skills/finalise-requirements/SKILL.md) to reconcile every acceptance scenario, verify
tests/build, and record completion evidence. Update or close the matching GitHub issue when authorised; distinguish
verified implementation, delivery state, and remote actions actually completed.

For previously defined work, when an agent or skill asks what to implement, lacks the issue context, or has stale context
after a handoff/reset, use
[recover-context](.cursor/skills/recover-context/SKILL.md). Reuse its source-backed brief while valid; a GitHub issue number
is not required for a clear user request. Keep later corrections and completed work reflected in the recovered context.

## Development commands

Run commands from the repository root. See [README.md](README.md) for setup.

| Command                                              | Purpose                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `npm install`                                        | Install frontend dependencies.                                   |
| `npm start`                                          | Start the Angular development server at `http://localhost:4200`. |
| `npx bookmonkey-api`                                 | Start the separate book API at `http://localhost:4730`.          |
| `npm run build`                                      | Run the production build and strict Angular template checks.     |
| `npx playwright test <spec-file> --project=chromium` | Run a selected browser test suite.                               |
| `npx prettier --check <changed-files>`               | Check formatting of touched files; use `--write` to format them. |

## Validation

- Run the production build for application or build configuration changes and the relevant browser tests for affected
  behavior. For documentation-only changes, check formatting, links, and consistency with the source.
- Playwright starts or reuses the frontend server. Install the matching browser with `npx playwright install chromium` if
  needed; keep machine-specific executable paths out of committed configuration.
- The book details, book list, library/editing, Universe, error handling, and theme specs in `tests/` cover application behavior with shared mocked
  book/cover fixtures. `tests/example.spec.ts` visits `playwright.dev`, and
  `tests-examples/` is outside the configured test directory; those examples do not establish BookMonkey coverage.
- `npm test` points to a Karma scaffold with no source specs or directly declared Karma/Jasmine dependencies. Account for
  this limitation when choosing checks; there is no lint script.
- Report what changed, which checks actually ran, and any verification limits.
