---
name: tdd-green
description: Implement the smallest production change that satisfies failing tests and agreed requirements, then verify the tests and regressions pass. Use for the Green phase after tdd-red, developer-red, or an equivalent failing-test handoff. Preserve tests unless a demonstrated test error needs correction; installing this skill does not start implementation.
---

# TDD Green phase

Turn the selected Red tests into passing behavior with minimal production changes. Preserve their accepted expectations
and verify the result through actual test runs. This phase implements the feature; broader refactoring is a later step.

## Recover the contract and Red evidence

Read the caller's failing test paths, run commands, failure output, story, acceptance criteria, and constraints. Accept a
handoff from [tdd-red](../tdd-red/SKILL.md), a workflow called `developer-red`, or tests supplied directly by the user.
A particular producer name or GitHub issue number is not required.

Read applicable `AGENTS.md` guidance and inspect the working tree before editing. Preserve unrelated changes and record
the starting contents or hashes of the supplied tests, fixtures, snapshots, and runner configuration, including untracked
files. A Git diff alone does not capture untracked tests.

If the selected task or original requirements are unclear, use [recover-context](../recover-context/SKILL.md). Reuse
`.cursor/context/current-requirement.md` only when its task identity and status match the request. Do not reopen the
completed BookMonkey story just because its brief is present. Use the user's latest amendments over older handoffs.
When the user explicitly supplies tests as the contract, recover their intended behavior without requiring a separate
interview. Ask about a material conflict only when the available sources cannot resolve it.

## Read expectations and reproduce failures

Inspect each failing test's setup, action, assertions, fixtures, mocks, and hooks rather than relying only on its title
or failure message. Extract the expected result, observed result, and relevant Given/When/Then scenario. Retain stable
requirement IDs and map each failure to the production component, service, or function responsible for the behavior.
Distinguish asserted outcomes from incidental fixture values and implementation-specific assumptions.

Run the supplied failing cases using the repository's actual runner and confirm that the intended tests were discovered.
Separate missing behavior from test-owned mistakes, existing unrelated failures, and environment problems. A missing
production export required by an agreed interface may need implementation; an incorrect import path or unavailable
runner does not establish a feature failure.

For this repository's Jasmine/Playwright setup, consult the [test patterns](../tdd-red/references/test-patterns.md) when
needed and recheck package scripts and configuration. The unit-test scaffold may lack its runner dependencies. Do not
claim unit verification from the existence of `npm test`, or treat browser startup/network failures as application bugs.
Resolve prerequisites within the authorized scope and continue independent work when possible; report checks that
remain unverified. Do not silently introduce another runner or change the persistence/API contract to bypass a failure.

If the cases already pass, verify their relevant regression scope and report that no production change was needed.
Do not manufacture a failure or add unnecessary code to produce a Red-to-Green narrative.

## Implement the smallest coherent change

Change the production code needed to satisfy the mapped expectations and agreed scenarios. Reuse existing architecture,
dependencies, types, lifecycle, error handling, and styling conventions. Keep the change small enough to explain through
the failing cases, while implementing the actual rule for valid inputs rather than hardcoding fixture values.

Keep production behavior independent of the test runner and test data. Do not mock the feature inside production,
suppress failures, weaken validation, or replace a real interaction with a test-only shortcut. Preserve accepted behavior
outside the selected change. Defer unrelated cleanup, abstractions, dependency changes, and speculative capabilities.

For browser-local collection changes, reuse the shared library state rather than creating a separate board/status store.
Add storage fields compatibly with existing saved data, and resolve locally created IDs before requesting API records.
Keep the full collection projection ahead of pagination so local edits and created books participate in matching.

Rerun the focused cases after a meaningful change. Use remaining failures to refine the implementation, not to gradually
relax the expected outcome. Continue until the selected cases pass or a specific unresolved requirement or prerequisite
prevents verification.

## Correct tests only when they are demonstrably wrong

Preserve tests, fixtures, snapshots, and their effective discovery by default. A failing test is not evidence that the
test is wrong. A correction needs a concrete reason: an expectation contradicts an agreed criterion, setup cannot produce
the stated Given condition, an import targets the wrong existing module, or an assertion/locator measures the wrong
outcome. Use the requirements and actual contract as evidence, not the convenience of the current implementation.

When such an error is clear, make the smallest test-owned correction and record the original assertion/setup, the
correction, and its supporting requirement or verified fact. Keep the intended acceptance outcome covered. When feasible,
run the corrected test before changing production to show it still detects the missing behavior. Existing authorization
to implement includes routine, evidenced test corrections; ask only when deciding what is correct requires a user choice.

Do not delete assertions, update snapshots to match a bug, reduce case counts, add `only`/`skip`/`pending`/`xit`, mark
Playwright tests as expected failures, or narrow runner filters to obtain a passing result. Do not change timeouts,
retries, mocks, or fixtures merely to conceal a deterministic failure. If requirements changed, record the explicit
amendment before updating the affected expectations.

## Verify Green and regressions

Once the focused cases pass, run the relevant complete application unit/UI suites and required repository checks,
including the production build/type checks for application changes and formatting for touched files. Verify affected
existing behavior as well as the supplied Red cases. Follow repository guidance on application suites versus unrelated
external demo specs, and state any excluded suites or browser projects explicitly.

Check discovery, case counts, exit status, and results; a successful command with no tests, skipped mapped cases, or
expected failures does not prove Green. Compare test assets and configuration with their starting state. Explain every
change to them using the test-error rule above, and ensure production still satisfies the original acceptance outcomes.

Fix regressions introduced by the implementation and rerun affected checks. Keep pre-existing failures distinct, but do
not conceal them or claim that all tests pass while required checks remain failed or unverified. After the required
checks pass, stop repeating them unless another change or unresolved concern justifies a rerun.

## Record results and hand off

Return a concise account of the production behavior changed, requirement IDs served, and exact validation commands and
results. Include the tests observed failing before implementation and passing afterward, case counts and suite scope,
any evidenced test corrections, and remaining failures or verification limits.

When a matching canonical brief exists and writes are permitted, refresh its implementation/test-phase evidence without
rewriting agreed requirements or erasing Red history. Mark **verified Green** only when the mapped tests and required
regression checks actually pass. Record partial or unverified results accurately. Mark the feature completed only when
all in-scope acceptance criteria are satisfied and no required work remains; otherwise identify the next step.

For an already authorized Refactor step, hand the selected files, accepted behavior, and passing commands/results to
[angular-refactor](../angular-refactor/SKILL.md). It applies the project's Angular and SOLID conventions while preserving
the verified contract. Completing Green alone does not start a broader cleanup.

When the caller requests delivery verification and issue completion, pass the requirement source, final implementation,
and verification evidence to [finalise-requirements](../finalise-requirements/SKILL.md). It reconciles the original
criteria and records the authorised delivery/issue outcome; passing tests alone do not prove every criterion is met.

Hand the verified change back to the caller for review or an already authorized next phase. Update architecture guidance
when the implementation changes documented behavior or structure. Do not start an unrelated refactoring, commit, or
publish without authorization. Installing this skill creates only this workflow; it must not modify product code, tests,
or the current requirement brief, or run an old feature's Green phase.
